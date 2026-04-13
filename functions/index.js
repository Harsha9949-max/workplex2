/**
 * Firebase Cloud Functions: WorkPlex
 * Deploy: firebase deploy --only functions
 *
 * Environment variables required:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   ADMIN_FCM_TOKEN
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================
// WITHDRAWAL FUNCTIONS (Phase 4)
// ============================================

const DAILY_WITHDRAWAL_CAP = 50000; // Rs.50,000

exports.processWithdrawal = functions.firestore
  .document('withdrawals/{withdrawalId}')
  .onUpdate(async (change, context) => {
    const withdrawal = change.after.data();
    const previousWithdrawal = change.before.data();

    if (withdrawal.status !== 'approved' || previousWithdrawal.status === 'approved') {
      return null;
    }

    try {
      // Check daily cap
      const today = new Date().toISOString().split('T')[0];
      const dailySnap = await db.collection('withdrawals')
        .where('requestedAt', '>=', new Date(today))
        .get();

      let dailyTotal = 0;
      dailySnap.forEach((doc) => {
        const wd = doc.data();
        if (['paid', 'approved', 'processing'].includes(wd.status)) {
          dailyTotal += wd.amount;
        }
      });

      if (dailyTotal + withdrawal.amount > DAILY_WITHDRAWAL_CAP) {
        await db.collection('withdrawals').doc(context.params.withdrawalId).update({
          status: 'rejected',
          rejectionReason: 'Daily withdrawal limit exceeded. Try again tomorrow.',
        });
        await db.collection('users').doc(withdrawal.workerId).update({
          'wallets.earned': admin.firestore.FieldValue.increment(withdrawal.amount),
        });
        return null;
      }

      // Razorpay Payout
      const keyId = functions.config().razorpay?.key_id || '';
      const keySecret = functions.config().razorpay?.key_secret || '';
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      const response = await fetch('https://api.razorpay.com/v1/payouts', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fund_account: withdrawal.upiId,
          amount: withdrawal.amount * 100,
          mode: 'UPI',
          purpose: 'payout',
          reference_id: `WD-${context.params.withdrawalId}`,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.description);

      await db.collection('withdrawals').doc(context.params.withdrawalId).update({
        status: 'paid',
        razorpayPayoutId: data.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send FCM
      try {
        const userDoc = await db.collection('users').doc(withdrawal.workerId).get();
        const token = userDoc.data()?.fcmToken;
        if (token) {
          await admin.messaging().send({
            token,
            notification: {
              title: 'Withdrawal Successful!',
              body: `Rs.${withdrawal.amount} credited to your UPI.`,
            },
          });
        }
      } catch (e) { console.error('FCM error:', e); }

      return null;
    } catch (error) {
      console.error('Withdrawal error:', error);
      await db.collection('withdrawals').doc(context.params.withdrawalId).update({
        status: 'failed',
        rejectionReason: error.message || 'Payment failed',
      });
      await db.collection('users').doc(withdrawal.workerId).update({
        'wallets.earned': admin.firestore.FieldValue.increment(withdrawal.amount),
      });
      return null;
    }
  });

exports.releasePendingFunds = functions.pubsub.schedule('every 1 hours').onRun(async () => {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const usersSnap = await db.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const wallets = userDoc.data().wallets || {};
    if (wallets.pending > 0) {
      const txSnap = await db.collection('users').doc(userDoc.id).collection('transactions')
        .where('type', '==', 'pending')
        .where('timestamp', '<', fortyEightHoursAgo)
        .get();

      if (!txSnap.empty) {
        await db.collection('users').doc(userDoc.id).update({
          'wallets.pending': admin.firestore.FieldValue.increment(-wallets.pending),
          'wallets.earned': admin.firestore.FieldValue.increment(wallets.pending),
        });
      }
    }
  }
  return null;
});

// ============================================
// COUPON FUNCTIONS (Phase 5)
// ============================================

/**
 * Function 1: Auto-generate coupon on user signup
 * Triggered when a new user document is created
 */
exports.autoGenerateCoupon = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snapshot, context) => {
    const userData = snapshot.data();
    const uid = context.params.uid;

    try {
      const venture = userData.venture || 'BuyRix';
      const prefixes = { BuyRix: 'BX', Vyuma: 'VY', TrendyVerse: 'TV', Growplex: 'GP' };
      const prefix = prefixes[venture] || 'WX';

      // Generate 6 random alphanumeric chars
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const code = `${prefix}-${randomPart}`;

      await db.collection('coupons').doc(uid).set({
        code,
        venture,
        ownerId: uid,
        ownerName: userData.name || '',
        isActive: false,
        activatedAt: null,
        expiresAt: null,
        usageCount: 0,
        totalEarned: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Auto-generated coupon ${code} for user ${uid}`);
      return null;
    } catch (error) {
      console.error('Coupon generation error:', error);
      // Log error for retry
      await db.collection('aiErrors').add({
        type: 'coupon_generation',
        userId: uid,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });

/**
 * Function 2: Expire coupons (Scheduled Daily at 00:00)
 * Queries coupons where isActive == true AND expiresAt <= now
 * Batch updates isActive = false
 */
exports.expireCoupons = functions.pubsub.schedule('0 0 * * *').timeZone('Asia/Kolkata').onRun(async () => {
  try {
    const now = new Date();
    const expiredSnap = await db.collection('coupons')
      .where('isActive', '==', true)
      .where('expiresAt', '<=', now)
      .get();

    if (expiredSnap.empty) {
      console.log('No coupons to expire');
      return null;
    }

    const batch = db.batch();
    expiredSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
    console.log(`Expired ${expiredSnap.size} coupons`);

    // Log
    await db.collection('systemLogs').add({
      type: 'coupon_expiry',
      count: expiredSnap.size,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  } catch (error) {
    console.error('Expire coupons error:', error);
    await db.collection('aiErrors').add({
      type: 'expire_coupons',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  }
});

/**
 * Function 3: Release coupon commissions (Scheduled Daily at 02:00)
 * Queries couponUsages where released == false AND releaseAt <= now
 * For each: credits pending wallet, creates transaction, marks released
 */
exports.releaseCouponCommissions = functions.pubsub.schedule('0 2 * * *').timeZone('Asia/Kolkata').onRun(async () => {
  try {
    const now = new Date();
    const dueSnap = await db.collection('couponUsages')
      .where('released', '==', false)
      .where('releaseAt', '<=', now)
      .get();

    if (dueSnap.empty) {
      console.log('No commissions to release');
      return null;
    }

    let totalReleased = 0;
    const batch = db.batch();

    for (const doc of dueSnap.docs) {
      const usage = doc.data();
      const ownerId = usage.ownerId;
      const commission = usage.commissionAmount;

      // Update couponUsages
      batch.update(doc.ref, { released: true });

      // Credit pending wallet
      const userRef = db.collection('users').doc(ownerId);
      batch.update(userRef, {
        'wallets.pending': admin.firestore.FieldValue.increment(commission),
        totalEarned: admin.firestore.FieldValue.increment(commission),
      });

      // Update coupon totalEarned
      const couponRef = db.collection('coupons').doc(ownerId);
      batch.update(couponRef, {
        totalEarned: admin.firestore.FieldValue.increment(commission),
      });

      // Create transaction record
      const txRef = userRef.collection('transactions').doc();
      batch.set(txRef, {
        type: 'credit',
        category: 'coupon_commission',
        amount: commission,
        wallet: 'pending',
        description: `Commission released: ${usage.couponCode}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        referenceId: doc.id,
        balanceAfter: 0,
      });

      totalReleased += commission;
    }

    await batch.commit();
    console.log(`Released ${dueSnap.size} commissions totaling Rs.${totalReleased}`);

    // Log
    await db.collection('systemLogs').add({
      type: 'commission_release',
      count: dueSnap.size,
      totalAmount: totalReleased,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  } catch (error) {
    console.error('Release commissions error:', error);
    await db.collection('aiErrors').add({
      type: 'release_commissions',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  }
});
"" 
