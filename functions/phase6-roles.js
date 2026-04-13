/**
 * Phase 6 Cloud Functions: Role Progression System
 * Add these to your main functions/index.js or deploy separately
 * Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * AUTO-PROMOTE TO LEAD MARKETER
 * Daily at 1 AM IST
 * Requirements: monthlyEarned >= 50000 AND activeMonths >= 3
 */
exports.autoPromoteToLead = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const snap = await db.collection('users')
        .where('role', '==', 'Marketer')
        .where('monthlyEarned', '>=', 50000)
        .where('activeMonths', '>=', 3)
        .get();

      if (snap.empty) return null;

      const batch = db.batch();
      const promotions = [];

      snap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          role: 'Lead Marketer',
          promotedAt: admin.firestore.FieldValue.serverTimestamp(),
          teamSize: 0,
          directReferrals: 0,
        });
        promotions.push({ uid: doc.id, name: doc.data().name, fcmToken: doc.data().fcmToken });
      });

      await batch.commit();

      for (const p of promotions) {
        try {
          if (p.fcmToken) {
            await admin.messaging().send({
              token: p.fcmToken,
              notification: { title: '🎉 Promotion!', body: `Congratulations ${p.name}! You are now a Lead Marketer!` },
            });
          }
        } catch (e) { /* ignore */ }
      }

      console.log(`Promoted ${promotions.length} users to Lead Marketer`);
      return null;
    } catch (error) {
      console.error('Auto-promotion error:', error);
      return null;
    }
  });

/**
 * DISTRIBUTE TEAM COMMISSIONS
 * Triggered when task submission is approved
 * Level 1: 5% to direct referrer (Lead Marketer)
 * Level 2: 3% to referrer's referrer (Manager/Lead)
 * Max 35% of HVRS margin cap
 */
exports.distributeTeamCommission = functions.firestore
  .document('taskSubmissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status !== 'approved' || oldData.status === 'approved') return null;

    try {
      const workerId = newData.workerId;
      const earnAmount = newData.earnAmount || 0;
      const hvrsMargin = earnAmount * 0.175;
      const maxCap = hvrsMargin * 0.35;

      const workerDoc = await db.collection('users').doc(workerId).get();
      const workerData = workerDoc.data();
      if (!workerData) return null;

      const batch = db.batch();
      const logs = [];
      const directCommission = earnAmount * 0.10;

      // LEVEL 1: Direct referrer (5%)
      let level1Commission = 0;
      if (workerData.referredBy) {
        const referrerDoc = await db.collection('users').doc(workerData.referredBy).get();
        const referrerData = referrerDoc.data();

        if (referrerData && referrerData.role === 'Lead Marketer') {
          level1Commission = earnAmount * 0.05;
          if (directCommission + level1Commission <= maxCap) {
            batch.update(referrerDoc.ref, {
              'wallets.pending': admin.firestore.FieldValue.increment(level1Commission),
              teamEarnings: admin.firestore.FieldValue.increment(earnAmount),
              totalEarned: admin.firestore.FieldValue.increment(level1Commission),
            });

            batch.set(
              db.collection('teams').doc(workerData.referredBy).collection('members').doc(workerId),
              { memberId: workerId, memberName: workerData.name || '', memberRole: workerData.role || '', totalEarnings: admin.firestore.FieldValue.increment(earnAmount), level: 1, isActive: true, lastEarningAt: admin.firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );

            logs.push({ workerId: workerData.referredBy, type: 'team_commission', sourceWorkerId: workerId, amount: level1Commission, percentage: 5, timestamp: admin.firestore.FieldValue.serverTimestamp(), taskId: newData.taskId || '' });
          }
        }
      }

      // LEVEL 2: Referrer's referrer (3%)
      let level2Commission = 0;
      if (workerData.referredBy) {
        const referrerDoc = await db.collection('users').doc(workerData.referredBy).get();
        const referrerData = referrerDoc.data();

        if (referrerData && referrerData.referredBy) {
          const level2Doc = await db.collection('users').doc(referrerData.referredBy).get();
          const level2Data = level2Doc.data();

          if (level2Data && (level2Data.role === 'Manager' || level2Data.role === 'Lead Marketer')) {
            level2Commission = earnAmount * 0.03;
            if (directCommission + level1Commission + level2Commission <= maxCap) {
              batch.update(level2Doc.ref, {
                'wallets.pending': admin.firestore.FieldValue.increment(level2Commission),
                totalEarned: admin.firestore.FieldValue.increment(level2Commission),
              });
              logs.push({ workerId: referrerData.referredBy, type: 'manager_commission', sourceWorkerId: workerId, amount: level2Commission, percentage: 3, timestamp: admin.firestore.FieldValue.serverTimestamp(), taskId: newData.taskId || '' });
            }
          }
        }
      }

      for (const log of logs) {
        batch.set(db.collection('commissionLogs').doc(), log);
      }

      await batch.commit();
      return null;
    } catch (error) {
      console.error('Commission distribution error:', error);
      return null;
    }
  });

/**
 * NON-COMPETE CHECK: Redistribute teams of inactive Leads
 * Weekly on Monday at midnight IST
 * Warning at 20 days, redistribution at 30 days
 */
exports.checkNonCompete = functions.pubsub
  .schedule('0 0 * * 1')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      const leadsSnap = await db.collection('users').where('role', '==', 'Lead Marketer').get();

      const batch = db.batch();
      let redistributed = 0;

      for (const leadDoc of leadsSnap.docs) {
        const leadData = leadDoc.data();
        const lastActive = leadData.lastActiveDate?.toDate ? leadData.lastActiveDate.toDate() : new Date(0);

        if (lastActive < twentyDaysAgo && lastActive >= thirtyDaysAgo && leadData.teamSize > 0) {
          try {
            if (leadData.fcmToken) {
              await admin.messaging().send({ token: leadData.fcmToken, notification: { title: '⚠️ Team Warning', body: 'Your team will be redistributed in 10 days if inactive.' } });
            }
          } catch (e) { /* ignore */ }
        }

        if (lastActive < thirtyDaysAgo && leadData.teamSize > 0) {
          const replacementSnap = await db.collection('users').where('role', '==', 'Lead Marketer').where('venture', '==', leadData.venture).get();
          let newLeadDoc = null;
          for (const d of replacementSnap.docs) {
            if (d.id !== leadDoc.id) {
              const la = d.data().lastActiveDate?.toDate ? d.data().lastActiveDate.toDate() : new Date(0);
              if (la >= thirtyDaysAgo) { newLeadDoc = d; break; }
            }
          }

          if (newLeadDoc) {
            const newLeadId = newLeadDoc.id;
            const teamSnap = await db.collection('teams').doc(leadDoc.id).collection('members').get();
            const moveBatch = db.batch();
            let movedCount = 0;

            teamSnap.docs.forEach((m) => {
              moveBatch.set(db.collection('teams').doc(newLeadId).collection('members').doc(m.id), m.data());
              moveBatch.delete(m.ref);
              if (m.data().level === 1) moveBatch.update(db.collection('users').doc(m.id), { referredBy: newLeadId });
              movedCount++;
            });

            await moveBatch.commit();
            batch.update(leadDoc.ref, { teamSize: 0, teamEarnings: 0, directReferrals: 0 });
            batch.update(newLeadDoc.ref, { teamSize: admin.firestore.FieldValue.increment(movedCount) });
            redistributed++;
          }
        }
      }

      await batch.commit();
      console.log(`Non-compete: ${redistributed} teams redistributed`);
      return null;
    } catch (error) {
      console.error('Non-compete error:', error);
      return null;
    }
  });

/**
 * MONTHLY EARNINGS RESET
 * Reset monthlyEarned on 1st of every month
 */
exports.monthlyEarningsReset = functions.pubsub
  .schedule('0 0 1 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const snap = await db.collection('users').get();
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.update(doc.ref, { monthlyEarned: 0 }));
      await batch.commit();
      console.log(`Reset monthly earnings for ${snap.size} users`);
      return null;
    } catch (error) {
      console.error('Monthly reset error:', error);
      return null;
    }
  });
