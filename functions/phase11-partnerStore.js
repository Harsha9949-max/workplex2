/**
 * Phase 11 Cloud Functions: Partner Store Margin Release
 * Add these to your main functions/index.js
 * Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * FUNCTION 1: RELEASE_PARTNER_MARGINS
 * Scheduled Daily at 2 AM IST
 * Checks orders older than 7 days and releases margins to partner wallets
 */
exports.releasePartnerMargins = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Query orders with holding margin status older than 7 days
      const ordersSnap = await db.collection('partnerOrders')
        .where('marginStatus', '==', 'holding')
        .where('createdAt', '<', sevenDaysAgo)
        .get();

      if (ordersSnap.empty) {
        console.log('No margins to release');
        return null;
      }

      const batch = db.batch();
      let totalReleased = 0;
      let ordersProcessed = 0;

      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data();
        const partnerId = order.partnerId;
        const margin = order.totalPartnerMargin || 0;

        if (margin <= 0) continue;

        // Update order margin status
        const orderRef = db.collection('partnerOrders').doc(orderDoc.id);
        batch.update(orderRef, {
          marginStatus: 'released',
          releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Credit partner's pending wallet
        const userRef = db.collection('users').doc(partnerId);
        batch.update(userRef, {
          'wallets.pending': admin.firestore.FieldValue.increment(margin),
          totalEarned: admin.firestore.FieldValue.increment(margin),
        });

        // Create transaction record
        const txRef = userRef.collection('transactions').doc();
        batch.set(txRef, {
          type: 'credit',
          category: 'partner_margin',
          amount: margin,
          wallet: 'pending',
          description: `Partner margin released from order ${order.orderId}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          referenceId: orderDoc.id,
          balanceAfter: 0, // Will be calculated by client
        });

        totalReleased += margin;
        ordersProcessed++;
      }

      await batch.commit();

      // Log the release
      await db.collection('systemLogs').add({
        type: 'partner_margin_release',
        ordersProcessed,
        totalReleased,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Partner margin release completed: ${ordersProcessed} orders, Rs.${totalReleased} released`);
      return null;
    } catch (error) {
      console.error('Partner margin release error:', error);
      await db.collection('aiErrors').add({
        function: 'releasePartnerMargins',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });

/**
 * FUNCTION 2: UPDATE_SHOP_SALES
 * Triggered when order status changes to 'delivered'
 * Updates total sales count on partner shop
 */
exports.updateShopSales = functions.firestore
  .document('partnerOrders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only process when status changes to 'delivered'
    if (newData.status !== 'delivered' || oldData.status === 'delivered') return null;

    try {
      const partnerId = newData.partnerId;
      const amount = newData.totalAmount || 0;

      // Update shop total sales
      await db.collection('partnerShops').doc(partnerId).update({
        totalSales: admin.firestore.FieldValue.increment(amount),
      });

      console.log(`Shop sales updated for partner ${partnerId}: +Rs.${amount}`);
      return null;
    } catch (error) {
      console.error('Shop sales update error:', error);
      return null;
    }
  });

/**
 * FUNCTION 3: NOTIFY_PARTNER_NEW_ORDER
 * Triggered when a new order is created
 * Sends FCM notification to partner
 */
exports.notifyPartnerNewOrder = functions.firestore
  .document('partnerOrders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const order = snapshot.data();

    try {
      const partnerId = order.partnerId;
      const userDoc = await db.collection('users').doc(partnerId).get();

      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      if (!userData.fcmToken) return null;

      await admin.messaging().send({
        token: userData.fcmToken,
        notification: {
          title: '🛍️ New Order Received!',
          body: `Order ${order.orderId} for Rs.${order.totalAmount} from ${order.customerDetails?.name}`,
        },
        data: {
          type: 'new_order',
          orderId: context.params.orderId,
          url: `/partner-dashboard`,
        },
      });

      console.log(`New order notification sent to partner ${partnerId}`);
      return null;
    } catch (error) {
      console.error('Partner notification error:', error);
      return null;
    }
  });

/**
 * FUNCTION 4: SYNC_CATALOG_ON_UPLOAD
 * Triggered when new catalog product is added
 * (Optional) Notifies active partners about new products
 */
exports.syncCatalogOnUpload = functions.firestore
  .document('catalogProducts/{productId}')
  .onCreate(async (snapshot, context) => {
    const product = snapshot.data();

    try {
      // In production, you could notify partners who have this category
      // For now, just log the addition
      console.log(`New catalog product added: ${product.name} (${product.sku})`);
      return null;
    } catch (error) {
      console.error('Catalog sync error:', error);
      return null;
    }
  });
