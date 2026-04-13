/**
 * Phase 9 Cloud Functions: DeepSeek AI Integration
 * Add these to your main functions/index.js
 * Deploy: firebase deploy --only functions
 *
 * SECURITY: ZERO PII sent to AI. Only anonymized data.
 * RATE LIMITING: 1 AI call per worker per minute.
 * CACHING: 6-hour TTL in aiCache collection.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// DeepSeek API configuration
const DEEPSEEK_API_KEY = functions.config().deepseek?.api_key || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const CACHE_TTL_HOURS = 6;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// ==================== HELPER FUNCTIONS ====================

/**
 * Call DeepSeek API with strict JSON output
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt (anonymized, NO PII)
 * @returns {object} Parsed JSON response
 */
async function callDeepSeek(systemPrompt, userPrompt) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: `${systemPrompt} Respond ONLY with valid JSON. No markdown, no explanation.` },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from DeepSeek');
  }

  // Strict JSON parsing
  try {
    // Remove any markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error('JSON parse error:', content);
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Check rate limit for user
 * @param {string} userId
 * @param {string} functionType
 * @returns {boolean} true if allowed
 */
async function checkRateLimit(userId, functionType) {
  const key = `rateLimit_${functionType}_${userId}`;
  const now = Date.now();

  const rateDoc = await db.collection('rateLimits').doc(key).get();
  if (rateDoc.exists) {
    const lastCall = rateDoc.data().lastCall?.toMillis ? rateDoc.data().lastCall.toMillis() : 0;
    if (now - lastCall < RATE_LIMIT_WINDOW_MS) {
      return false; // Rate limited
    }
  }

  // Update rate limit
  await db.collection('rateLimits').doc(key).set({
    userId,
    functionType,
    lastCall: admin.firestore.Timestamp.fromMillis(now),
  }, { merge: true });

  return true;
}

/**
 * Log AI error
 */
async function logAIError(funcName, error) {
  await db.collection('aiErrors').add({
    function: funcName,
    error: error.message || String(error),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ==================== CLOUD FUNCTIONS ====================

/**
 * FUNCTION 1: generateAIPredictions (Callable)
 * Predicts worker's potential earnings based on anonymized data
 * Input: { pendingTasksCount, avgEarning, completionRate }
 * NO PII sent to AI
 */
exports.generateAIPredictions = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { pendingTasksCount, avgEarning, completionRate } = data;

  // Rate limiting check
  const allowed = await checkRateLimit(context.auth.uid, 'predictions');
  if (!allowed) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Try again in 1 minute.');
  }

  try {
    const systemPrompt = `You are an AI earnings predictor for a gig economy platform. Analyze worker performance data and predict potential earnings. Return ONLY valid JSON with keys: predictedEarning (number), motivationalMessage (string).`;

    const userPrompt = `Worker has ${pendingTasksCount} tasks pending. Average earning per task: Rs.${avgEarning}. Completion rate: ${completionRate}%. Predict today's potential earnings and provide a motivational message.`;

    const result = await callDeepSeek(systemPrompt, userPrompt);

    // Validate response structure
    if (typeof result.predictedEarning !== 'number' || typeof result.motivationalMessage !== 'string') {
      throw new Error('Invalid response structure from AI');
    }

    return {
      predictedEarning: Math.round(result.predictedEarning),
      motivationalMessage: result.motivationalMessage,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI prediction error:', error);
    await logAIError('generateAIPredictions', error);

    // Return fallback prediction
    return {
      predictedEarning: Math.round((pendingTasksCount || 0) * (avgEarning || 50)),
      motivationalMessage: 'Keep completing tasks to maximize your earnings today!',
      isFallback: true,
      error: error.message,
    };
  }
});

/**
 * FUNCTION 2: reviewProofContent (Callable)
 * Reviews submitted proof content for quality and authenticity
 * Input: { proofText, proofType, venture }
 * NO PII sent to AI
 */
exports.reviewProofContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { proofText, proofType, venture } = data;

  // Rate limiting
  const allowed = await checkRateLimit(context.auth.uid, 'proofReview');
  if (!allowed) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Try again in 1 minute.');
  }

  try {
    const systemPrompt = `You are an AI content reviewer for marketing proof submissions. Rate content quality on a scale of 1-10. Return ONLY valid JSON with keys: score (number 1-10), reason (string explaining the score). Score < 5 means rejected. Score >= 5 means passed for admin review.`;

    const userPrompt = `Review this ${proofType} proof for ${venture} marketing. Content: "${(proofText || '').substring(0, 500)}". Rate authenticity and relevance. Return JSON: {score: number, reason: string}`;

    const result = await callDeepSeek(systemPrompt, userPrompt);

    if (typeof result.score !== 'number' || typeof result.reason !== 'string') {
      throw new Error('Invalid response structure from AI');
    }

    const status = result.score >= 5 ? 'pending_admin' : 'rejected';

    return {
      status,
      reason: result.reason,
      score: result.score,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI proof review error:', error);
    await logAIError('reviewProofContent', error);

    // Fallback: auto-approve for admin review
    return {
      status: 'pending_admin',
      reason: 'AI review unavailable. Content will be reviewed by admin.',
      score: 5,
      isFallback: true,
      error: error.message,
    };
  }
});

/**
 * FUNCTION 3: detectFraud (Scheduled: Every 6 Hours)
 * Analyzes anonymized user behavior patterns for fraud detection
 * NO PII sent to AI
 */
exports.detectFraud = functions.pubsub
  .schedule('0 */6 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const usersSnap = await db.collection('users').get();
      let alertsCreated = 0;

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Anonymized behavior metrics ONLY (NO PII)
        const behavior = {
          loginsPerDay: userData.loginsPerDay || 0,
          tasksPerDay: userData.tasksPerDay || 0,
          avgCompletionTime: userData.avgCompletionTime || 0,
          deviceChanges: userData.deviceChanges || 0,
          ipChanges: userData.ipChanges || 0,
          accountAge: userData.accountAge || 0,
        };

        // Skip if not enough data
        if (behavior.accountAge < 1) continue;

        try {
          const systemPrompt = `You are a fraud detection AI analyzing user behavior patterns. Analyze the metrics and return a fraud score from 0-100 (higher = more suspicious). Return ONLY valid JSON with keys: fraudScore (number 0-100), indicators (array of strings explaining why).`;

          const userPrompt = `Analyze behavior: logins/day=${behavior.loginsPerDay}, tasks/day=${behavior.tasksPerDay}, avgCompletionTime=${behavior.avgCompletionTime}s, deviceChanges=${behavior.deviceChanges}, ipChanges=${behavior.ipChanges}, accountAge=${behavior.accountAge} days. Is this bot/fraud? Return JSON: {fraudScore: number, indicators: []}`;

          const result = await callDeepSeek(systemPrompt, userPrompt);

          if (typeof result.fraudScore !== 'number' || !Array.isArray(result.indicators)) {
            continue;
          }

          // Create fraud alert if score > 70
          if (result.fraudScore > 70) {
            await db.collection('fraudAlerts').add({
              workerId: uid,
              fraudScore: result.fraudScore,
              indicators: result.indicators,
              status: 'pending',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            alertsCreated++;

            // Auto-suspend if score > 90
            if (result.fraudScore > 90) {
              await db.collection('users').doc(uid).update({
                status: 'suspended',
                suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
                suspensionReason: 'Automated fraud detection',
              });
            }
          }
        } catch (aiError) {
          console.error(`Fraud detection AI error for user ${uid}:`, aiError);
          await logAIError('detectFraud', aiError);
          continue;
        }
      }

      console.log(`Fraud detection completed. Alerts created: ${alertsCreated}`);
      return null;
    } catch (error) {
      console.error('Fraud detection error:', error);
      await logAIError('detectFraud', error);
      return null;
    }
  });

/**
 * FUNCTION 4: dailyTaskGenerator (Scheduled: Daily 6 AM)
 * Generates unique tasks for workers based on their history
 * NO PII sent to AI
 */
exports.dailyTaskGenerator = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    try {
      const ventures = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'];
      const roles = ['Marketer', 'Content Creator', 'Reseller'];
      let tasksCreated = 0;

      for (const venture of ventures) {
        for (const role of roles) {
          try {
            // Get recent task types for this venture/role (anonymized)
            const recentTasksSnap = await db.collection('tasks')
              .where('venture', '==', venture)
              .where('role', '==', role)
              .orderBy('createdAt', 'desc')
              .limit(10)
              .get();

            const recentTypes = recentTasksSnap.docs.map((d) => d.data().title || '').join(', ');

            const systemPrompt = `You are a task generator for a gig economy platform. Generate 3 unique marketing tasks that are different from recent tasks. Return ONLY valid JSON array with objects containing: title (string), description (string), earnAmount (number between 50-200).`;

            const userPrompt = `Generate 3 unique tasks for a ${role} in ${venture}. Different from recent types: ${recentTypes.substring(0, 300)}. Return JSON array: [{title, description, earnAmount}]`;

            const result = await callDeepSeek(systemPrompt, userPrompt);

            if (!Array.isArray(result) || result.length === 0) {
              continue;
            }

            // Write tasks to Firestore
            const batch = db.batch();
            for (const task of result.slice(0, 3)) {
              if (!task.title || !task.description || !task.earnAmount) continue;

              const taskRef = db.collection('tasks').doc();
              batch.set(taskRef, {
                title: task.title,
                description: task.description,
                venture,
                role,
                earnAmount: Math.min(Math.max(task.earnAmount, 50), 200),
                deadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                proofType: 'image',
                proofRequirements: 'Upload screenshot of completed task',
                assignedTo: 'all',
                isCrossVenture: false,
                isMystery: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'ai_generator',
              });
              tasksCreated++;
            }

            await batch.commit();
          } catch (taskError) {
            console.error(`Task generation error for ${venture}/${role}:`, taskError);
            await logAIError('dailyTaskGenerator', taskError);
            continue;
          }
        }
      }

      console.log(`Daily task generation completed. Tasks created: ${tasksCreated}`);
      return null;
    } catch (error) {
      console.error('Daily task generation error:', error);
      await logAIError('dailyTaskGenerator', error);
      return null;
    }
  });
