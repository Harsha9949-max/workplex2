/**
 * Phase 10 Cloud Functions: Push Notifications
 * Add these to your main functions/index.js
 * Deploy: firebase deploy --only functions
 *
 * Environment variables required:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Send push notification for new task assignment
 * Triggered when a new task is created for a user
 */
exports.sendTaskNotification = functions.firestore
  .document('tasks/{taskId}')
  .onCreate(async (snapshot, context) => {
    try {
      const task = snapshot.data();
      const assignedTo = task.assignedTo;

      // If assigned to 'all', notify all active users
      // If assigned to specific users, notify them
      let targetUsers = [];

      if (assignedTo === 'all') {
        const usersSnap = await db.collection('users').where('pushEnabled', '==', true).get();
        targetUsers = usersSnap.docs;
      } else if (Array.isArray(assignedTo)) {
        for (const uid of assignedTo) {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists && userDoc.data().pushEnabled) {
            targetUsers.push({ id: uid, ...userDoc.data() });
          }
        }
      }

      // Send notifications
      const notifications = targetUsers.map(async (userDoc) => {
        const userData = typeof userDoc.data === 'function' ? userDoc.data() : userDoc;
        const fcmToken = userData.fcmToken;

        if (!fcmToken) return;

        let subscription;
        try {
          subscription = JSON.parse(fcmToken);
        } catch {
          return;
        }

        // For web push, we need to use the subscription directly
        // In production, you'd use FCM HTTP v1 API
        // This is a simplified example

        try {
          await admin.messaging().send({
            token: userData.fcmTokenDirect || '', // Direct FCM token if available
            notification: {
              title: ` New Task: ${task.title}`,
              body: `Earn Rs.${task.earnAmount} - Complete before deadline!`,
            },
            data: {
              type: 'new_task',
              taskId: context.params.taskId,
              url: `/tasks`,
            },
          });
        } catch (e) {
          // FCM might fail for web push subscriptions
          console.log('FCM send failed for user:', userDoc.id);
        }
      });

      await Promise.allSettled(notifications);
      console.log(`Task notifications sent to ${targetUsers.length} users`);
      return null;
    } catch (error) {
      console.error('Task notification error:', error);
      return null;
    }
  });

/**
 * Send push notification for withdrawal status update
 * Triggered when withdrawal status changes
 */
exports.sendWithdrawalNotification = functions.firestore
  .document('withdrawals/{withdrawalId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only send if status changed
    if (newData.status === oldData.status) return null;

    try {
      const workerId = newData.workerId;
      const userDoc = await db.collection('users').doc(workerId).get();

      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      if (!userData.fcmTokenDirect) return null;

      let title, body;

      switch (newData.status) {
        case 'approved':
          title = '✅ Withdrawal Approved!';
          body = `Your Rs.${newData.amount} withdrawal has been approved. Processing now...`;
          break;
        case 'paid':
          title = '💰 Money Received!';
          body = `Rs.${newData.amount} has been credited to your UPI account!`;
          break;
        case 'rejected':
          title = '❌ Withdrawal Rejected';
          body = `Your withdrawal was rejected: ${newData.rejectionReason || 'No reason provided'}`;
          break;
        default:
          return null;
      }

      await admin.messaging().send({
        token: userData.fcmTokenDirect,
        notification: { title, body },
        data: {
          type: 'withdrawal_update',
          withdrawalId: context.params.withdrawalId,
          status: newData.status,
          url: `/wallet`,
        },
      });

      console.log(`Withdrawal notification sent to ${workerId}`);
      return null;
    } catch (error) {
      console.error('Withdrawal notification error:', error);
      return null;
    }
  });

/**
 * Send urgent team message notification
 * Triggered when an urgent message is posted in team chat
 */
exports.sendUrgentTeamMessage = functions.firestore
  .document('teams/{leadId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();

    // Only send for urgent messages
    if (!message.isUrgent) return null;

    try {
      // Get all team members
      const membersSnap = await db.collection('teams').doc(context.params.leadId).collection('members').get();

      const notifications = membersSnap.docs.map(async (memberDoc) => {
        const memberId = memberDoc.id;
        const memberDocData = await db.collection('users').doc(memberId).get();

        if (!memberDocData.exists) return;

        const memberData = memberDocData.data();
        if (!memberData.fcmTokenDirect) return;

        await admin.messaging().send({
          token: memberData.fcmTokenDirect,
          notification: {
            title: '🚨 Urgent Message from Lead!',
            body: `${message.senderName}: ${message.text.substring(0, 100)}...`,
          },
          data: {
            type: 'urgent_message',
            leadId: context.params.leadId,
            messageId: context.params.messageId,
            url: `/team-chat/${context.params.leadId}`,
          },
        });
      });

      await Promise.allSettled(notifications);
      console.log(`Urgent message notifications sent to ${membersSnap.size} members`);
      return null;
    } catch (error) {
      console.error('Urgent message notification error:', error);
      return null;
    }
  });

/**
 * Send streak bonus notification
 * Triggered when user reaches a streak milestone
 */
exports.sendStreakBonusNotification = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Check if streak just hit a milestone (7, 14, 21, 30)
    const milestones = [7, 14, 21, 30];
    const oldStreak = oldData.streak || 0;
    const newStreak = newData.streak || 0;

    const hitMilestone = milestones.find((m) => newStreak >= m && oldStreak < m);

    if (!hitMilestone) return null;

    try {
      if (!newData.fcmTokenDirect) return null;

      await admin.messaging().send({
        token: newData.fcmTokenDirect,
        notification: {
          title: `🔥 ${hitMilestone}-Day Streak!`,
          body: `Congratulations! You've earned a Rs.50 streak bonus!`,
        },
        data: {
          type: 'streak_bonus',
          streak: newStreak.toString(),
          url: `/home`,
        },
      });

      console.log(`Streak bonus notification sent to ${context.params.userId}`);
      return null;
    } catch (error) {
      console.error('Streak notification error:', error);
      return null;
    }
  });
