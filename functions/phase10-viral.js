/**
 * Phase 10 Cloud Functions: Viral Layer
 * Live Feed, Team Chat FCM, Username Generation
 * Add these to your main functions/index.js
 * Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * FUNCTION 1: NOTIFY_LIVE_EARNINGS
 * Triggered on transaction creation
 * Creates liveFeed entry and sends FCM (rate limited)
 */
exports.notifyLiveEarnings = functions.firestore
  .document('users/{userId}/transactions/{txId}')
  .onCreate(async (snapshot, context) => {
    const tx = snapshot.data();

    // Only process credit transactions
    if (tx.type !== 'credit') return null;

    try {
      // Get user data (anonymized for public feed)
      const userDoc = await db.collection('users').doc(context.params.userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      const displayName = userData.name ? userData.name.split(' ')[0] : 'Someone';

      // Create live feed entry
      await db.collection('liveFeed').add({
        uid: context.params.userId,
        name: displayName,
        amount: tx.amount,
        source: tx.category || 'task',
        venture: userData.venture || '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Rate limiting: Check last notification time
      const rateDoc = await db.collection('rateLimits').doc('liveFeed_global').get();
      const now = Date.now();
      if (rateDoc.exists) {
        const lastNotif = rateDoc.data().lastNotif?.toMillis ? rateDoc.data().lastNotif.toMillis() : 0;
        if (now - lastNotif < 30000) {
          // Rate limited, skip FCM
          return null;
        }
      }

      // Update rate limit
      await db.collection('rateLimits').doc('liveFeed_global').set({
        lastNotif: admin.firestore.Timestamp.fromMillis(now),
      }, { merge: true });

      // Send FCM to all active users (simplified - in production, use topic messaging)
      // This is a placeholder for the actual FCM implementation
      console.log(`Live feed created: ${displayName} earned Rs.${tx.amount} from ${tx.category}`);
      return null;
    } catch (error) {
      console.error('Live earnings notification error:', error);
      return null;
    }
  });

/**
 * FUNCTION 2: TEAM_CHAT_FCM
 * Triggered on new team chat message
 * Notifies all team members except sender
 */
exports.teamChatFCM = functions.firestore
  .document('teamChats/{leadId}/messages/{msgId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();

    try {
      const leadId = context.params.leadId;
      const senderId = message.senderId;

      // Get all team members
      const membersSnap = await db.collection('teams').doc(leadId).collection('members').get();

      // Send FCM to all members except sender
      const notifications = [];

      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;
        if (memberId === senderId) continue;

        const userDoc = await db.collection('users').doc(memberId).get();
        if (!userDoc.exists) continue;

        const userData = userDoc.data();
        if (!userData.fcmToken) continue;

        notifications.push(
          admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: `💬 New message from ${message.senderName}`,
              body: message.text.substring(0, 100),
            },
            data: {
              type: 'team_message',
              leadId,
              messageId: context.params.msgId,
              url: `/team-chat/${leadId}`,
            },
          }).catch((err) => console.error('FCM error:', err))
        );

        // Increment unread count
        await db.collection('users').doc(memberId).update({
          chatUnread: admin.firestore.FieldValue.increment(1),
        });
      }

      await Promise.allSettled(notifications);
      console.log(`Team chat notifications sent to ${notifications.length} members`);
      return null;
    } catch (error) {
      console.error('Team chat FCM error:', error);
      return null;
    }
  });

/**
 * FUNCTION 3: GENERATE_USERNAME
 * Triggered on user creation
 * Generates unique username and creates public profile
 */
exports.generateUsername = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    const userData = snapshot.data();
    const userId = context.params.userId;

    try {
      // Generate username: firstname + 4 random digits
      const firstname = userData.name ? userData.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
      let username = `${firstname}${Math.floor(1000 + Math.random() * 9000)}`;

      // Check for duplicates and generate unique username
      let attempts = 0;
      while (attempts < 10) {
        const existingProfile = await db.collection('publicProfiles').doc(username).get();
        if (!existingProfile.exists) break;
        username = `${firstname}${Math.floor(1000 + Math.random() * 9000)}`;
        attempts++;
      }

      // Create public profile
      await db.collection('publicProfiles').doc(username).set({
        uid: userId,
        displayName: userData.name || 'Anonymous',
        venture: userData.venture || '',
        role: userData.role || 'Marketer',
        level: userData.level || 'Bronze',
        badges: userData.badges || [],
        totalEarned: 0, // Hidden by default
        streakRecord: userData.streak || 0,
        joinedAt: userData.joinedAt || admin.firestore.FieldValue.serverTimestamp(),
        shopUrl: userData.role === 'Reseller' ? `/shop/${username}` : '',
        showTotalEarnedPublicly: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user with username
      await db.collection('users').doc(userId).update({
        username,
      });

      console.log(`Username generated: ${username} for user ${userId}`);
      return null;
    } catch (error) {
      console.error('Username generation error:', error);
      // Log error for manual review
      await db.collection('aiErrors').add({
        function: 'generateUsername',
        userId,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });

/**
 * FUNCTION 4: PROCESS_FAMILY_TRANSFER
 * Triggered when family transfer is created
 * Creates withdrawal with family_transfer type
 */
exports.processFamilyTransfer = functions.firestore
  .document('familyTransfers/{transferId}')
  .onCreate(async (snapshot, context) => {
    const transfer = snapshot.data();

    try {
      // Create a withdrawal record for admin approval
      await db.collection('withdrawals').add({
        workerId: transfer.senderId,
        workerName: transfer.senderName || '',
        workerPhone: transfer.senderPhone || '',
        amount: transfer.amount,
        upiId: transfer.recipientUpi,
        status: 'pending',
        type: 'family_transfer',
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedAt: null,
        paidAt: null,
        rejectionReason: '',
        razorpayPayoutId: '',
        processedBy: '',
      });

      // Deduct from sender's earned wallet
      await db.collection('users').doc(transfer.senderId).update({
        'wallets.earned': admin.firestore.FieldValue.increment(-transfer.amount),
      });

      console.log(`Family transfer created: Rs.${transfer.amount} to ${transfer.recipientUpi}`);
      return null;
    } catch (error) {
      console.error('Family transfer processing error:', error);
      return null;
    }
  });
