/**
 * Phase 8 Cloud Functions: Gamification Engine
 * Add these to your main functions/index.js
 * Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ==================== BADGES DEFINITION ====================
const BADGES = {
  first_task: { name: 'First Sale', condition: (u) => u.totalEarned >= 0 && u.firstTaskDone },
  earn_1000: { name: 'Rs.1K Club', condition: (u) => u.totalEarned >= 1000 },
  earn_10000: { name: 'Rs.10K Club', condition: (u) => u.totalEarned >= 10000 },
  earn_50000: { name: 'Rs.50K Legend', condition: (u) => u.totalEarned >= 50000 },
  earn_100000: { name: 'Rs.1L Champion', condition: (u) => u.totalEarned >= 100000 },
  streak_3: { name: '3-Day Streak', condition: (u) => u.streak >= 3 },
  streak_7: { name: '7-Day Streak', condition: (u) => u.streak >= 7 },
  streak_30: { name: '30-Day Warrior', condition: (u) => u.streak >= 30 },
};

const LEVELS = [
  { name: 'Bronze', min: 0, max: 5000 },
  { name: 'Silver', min: 5000, max: 25000 },
  { name: 'Gold', min: 25000, max: 100000 },
  { name: 'Platinum', min: 100000, max: 500000 },
  { name: 'Legend', min: 500000, max: Infinity },
];

/**
 * DAILY STREAK JOB
 * Cron: Midnight IST (18:30 UTC)
 * Check lastActiveDate, increment or reset streak
 * Award streak bonus every 7 days
 */
exports.dailyStreakJob = functions.pubsub
  .schedule('30 18 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const yesterdayStr = yesterday.toDateString();

      const usersSnap = await db.collection('users').get();
      const batch = db.batch();
      let streakBonuses = 0;

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const lastActive = userData.lastActiveDate?.toDate ? userData.lastActiveDate.toDate() : new Date(0);
        const lastActiveStr = lastActive.toDateString();

        // If last active was yesterday or today, streak continues
        // If last active was before yesterday, streak resets
        const daysSinceActive = Math.floor((now - lastActive) / 86400000);

        if (daysSinceActive > 1) {
          // Streak broken
          batch.update(userDoc.ref, { streak: 0 });
        }
        // If active today, streak stays (already incremented by activity trigger)
      }

      await batch.commit();
      console.log(`Daily streak job completed. Bonuses: ${streakBonuses}`);
      return null;
    } catch (error) {
      console.error('Daily streak error:', error);
      return null;
    }
  });

/**
 * WEEKLY LEADERBOARD AGGREGATION
 * Cron: Every hour
 * Aggregate earnings per venture for current week
 * Sort and assign ranks
 */
exports.weeklyLeaderboardAggregation = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const now = new Date();
      const weekId = `week-${getWeekNumber(now)}`;
      const startOfWeek = getStartOfWeek(now);

      const ventures = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'];

      for (const venture of ventures) {
        // Get all users in this venture
        const usersSnap = await db.collection('users').where('venture', '==', venture).get();

        // Calculate weekly earnings from commission logs
        const entries = [];

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          const uid = userDoc.id;

          // Get commission logs for this week
          const logsSnap = await db.collection('commissionLogs')
            .where('workerId', '==', uid)
            .where('timestamp', '>=', startOfWeek)
            .get();

          let weeklyEarnings = 0;
          logsSnap.docs.forEach((logDoc) => {
            weeklyEarnings += logDoc.data().amount || 0;
          });

          // Also add direct task earnings
          const tasksSnap = await db.collection('taskSubmissions')
            .where('workerId', '==', uid)
            .where('status', '==', 'approved')
            .where('submittedAt', '>=', startOfWeek)
            .get();

          tasksSnap.docs.forEach((taskDoc) => {
            weeklyEarnings += taskDoc.data().earnAmount || 0;
          });

          entries.push({
            uid,
            name: userData.name || 'Anonymous',
            photoURL: userData.photoURL || '',
            earnings: weeklyEarnings,
          });
        }

        // Sort descending
        entries.sort((a, b) => b.earnings - a.earnings);

        // Write to leaderboard
        const batch = db.batch();
        entries.forEach((entry, index) => {
          const docRef = db.collection('leaderboard').doc(venture).collection(weekId).doc('entries').doc(entry.uid);
          batch.set(docRef, { ...entry, rank: index + 1 }, { merge: true });
        });

        await batch.commit();
      }

      console.log('Leaderboard aggregation completed');
      return null;
    } catch (error) {
      console.error('Leaderboard aggregation error:', error);
      return null;
    }
  });

/**
 * BADGE & LEVEL CHECK
 * Triggered on task approval
 * Check conditions and unlock badges
 * Check level progression
 */
exports.badgeAndLevelCheck = functions.firestore
  .document('taskSubmissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status !== 'approved' || oldData.status === 'approved') return null;

    try {
      const workerId = newData.workerId;
      const userDoc = await db.collection('users').doc(workerId).get();
      const userData = userDoc.data();
      if (!userData) return null;

      const batch = db.batch();
      const unlockedBadges = userData.badges || [];
      const newBadges = [];

      // Check each badge condition
      for (const [badgeId, badgeDef] of Object.entries(BADGES)) {
        if (!unlockedBadges.includes(badgeId) && badgeDef.condition(userData)) {
          newBadges.push(badgeId);
        }
      }

      if (newBadges.length > 0) {
        batch.update(userDoc.ref, { badges: [...unlockedBadges, ...newBadges] });

        // Send FCM for each new badge
        if (userData.fcmToken) {
          for (const badgeId of newBadges) {
            await admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: '🏆 Badge Unlocked!',
                body: `You earned: ${BADGES[badgeId].name}`,
              },
            });
          }
        }
      }

      // Check level progression
      const currentLevelIndex = LEVELS.findIndex((l) => l.name === userData.level);
      const newTotal = userData.totalEarned + (newData.earnAmount || 0);

      let newLevelIndex = 0;
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (newTotal >= LEVELS[i].min) {
          newLevelIndex = i;
          break;
        }
      }

      if (newLevelIndex > currentLevelIndex) {
        const newLevel = LEVELS[newLevelIndex].name;
        batch.update(userDoc.ref, { level: newLevel });

        // Send FCM for level up
        if (userData.fcmToken) {
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: '🎉 Level Up!',
              body: `Congratulations! You're now ${newLevel}!`,
            },
          });
        }
      }

      await batch.commit();
      return null;
    } catch (error) {
      console.error('Badge/Level check error:', error);
      return null;
    }
  });

/**
 * STREAK UPDATE ON ACTIVITY
 * Triggered when user completes a task or logs in
 */
exports.updateStreakOnActivity = functions.firestore
  .document('taskSubmissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status !== 'approved' || oldData.status === 'approved') return null;

    try {
      const workerId = newData.workerId;
      const userDoc = await db.collection('users').doc(workerId).get();
      const userData = userDoc.data();
      if (!userData) return null;

      const now = new Date();
      const lastActive = userData.lastActiveDate?.toDate ? userData.lastActiveDate.toDate() : new Date(0);
      const daysDiff = Math.floor((now - lastActive) / 86400000);

      let newStreak = userData.streak || 0;

      if (daysDiff === 0) {
        // Already active today, don't increment
        return null;
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      // Streak bonus every 7 days
      let bonusAmount = 0;
      if (newStreak > 0 && newStreak % 7 === 0) {
        bonusAmount = 50;
      }

      await db.collection('users').doc(workerId).update({
        streak: newStreak,
        lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
        ...(bonusAmount > 0 && { 'wallets.bonus': admin.firestore.FieldValue.increment(bonusAmount) }),
      });

      if (bonusAmount > 0 && userData.fcmToken) {
        await admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: '🔥 Streak Bonus!',
            body: `${newStreak} day streak! Rs.${bonusAmount} added to bonus wallet.`,
          },
        });
      }

      return null;
    } catch (error) {
      console.error('Streak update error:', error);
      return null;
    }
  });

// ==================== HELPER FUNCTIONS ====================
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
