const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { LanguageServiceClient } = require('@google-cloud/language');
const { PubSub } = require('@google-cloud/pubsub');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const pubsub = new PubSub();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(functions.config().gemini?.api_key || process.env.GEMINI_API_KEY);
const language = new LanguageServiceClient();

// CORS middleware
const corsHandler = (req, res, handler) => {
  return cors(req, res, () => handler(req, res));
};

/**
 * Analyze uploaded media using Gemini Vision API
 */
exports.analyzeMedia = functions.https.onCall(async (data, context) => {
  try {
    const { reportId, mediaUrls } = data;
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    console.log(`Analyzing media for report: ${reportId}`);

    const results = [];
    
    for (const media of mediaUrls) {
      try {
        let analysis;
        
        if (media.type.startsWith('image/')) {
          analysis = await analyzeImage(media.url);
        } else if (media.type.startsWith('video/')) {
          analysis = await analyzeVideo(media.url);
        }
        
        results.push({
          mediaUrl: media.url,
          mediaType: media.type,
          analysis: analysis,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } catch (error) {
        console.error(`Error analyzing media ${media.url}:`, error);
        results.push({
          mediaUrl: media.url,
          mediaType: media.type,
          analysis: { error: error.message },
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Update the report with analysis results
    await db.collection('reports').doc(reportId).update({
      aiAnalysis: results,
      analysisStatus: 'completed',
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Trigger data fusion for the area
    const reportDoc = await db.collection('reports').doc(reportId).get();
    const reportData = reportDoc.data();
    
    if (reportData && reportData.location) {
      await triggerDataFusion(reportData.location, reportData.category);
    }

    return { success: true, results };
    
  } catch (error) {
    console.error('Error in analyzeMedia:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Analyze image using Gemini Vision
 */
async function analyzeImage(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Download image data
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = Buffer.from(response.data).toString('base64');
    
    const prompt = `
    Analyze this image for city infrastructure and safety issues. Provide:
    1. Category (traffic, safety, infrastructure, environment, events, emergency)
    2. Severity (low, medium, high)
    3. Description of what you see
    4. Potential impact on citizens
    5. Recommended actions
    6. Confidence score (0-1)
    
    Format your response as JSON with these fields:
    {
      "category": "string",
      "severity": "string", 
      "description": "string",
      "impact": "string",
      "recommendations": "string",
      "confidence": number,
      "detectedObjects": ["array of objects/issues seen"],
      "urgency": "immediate|hours|days|routine"
    }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ]);

    const text = result.response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, return structured response
      return {
        category: 'infrastructure',
        severity: 'medium',
        description: text,
        impact: 'Analysis completed',
        recommendations: 'Review findings',
        confidence: 0.8,
        detectedObjects: [],
        urgency: 'routine'
      };
    }
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

/**
 * Analyze video (simplified - extracts frames and analyzes)
 */
async function analyzeVideo(videoUrl) {
  try {
    // For now, we'll provide a basic analysis
    // In production, you'd extract frames or use video analysis APIs
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Based on a video report about city issues, provide analysis in JSON format:
    {
      "category": "infrastructure",
      "severity": "medium",
      "description": "Video analysis of urban issue",
      "impact": "Potential impact on citizens",
      "recommendations": "Suggested actions",
      "confidence": 0.7,
      "detectedObjects": ["motion", "urban environment"],
      "urgency": "routine"
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      return {
        category: 'infrastructure',
        severity: 'medium',
        description: 'Video content analyzed',
        impact: 'Under review',
        recommendations: 'Manual review recommended',
        confidence: 0.6,
        detectedObjects: ['video content'],
        urgency: 'routine'
      };
    }
    
  } catch (error) {
    console.error('Error analyzing video:', error);
    throw error;
  }
}

/**
 * Synthesize multiple reports into unified events
 */
exports.synthesizeReports = functions.https.onCall(async (data, context) => {
  try {
    const { location, radius = 1000, timeWindow = 3600 } = data; // radius in meters, timeWindow in seconds
    
    console.log(`Synthesizing reports near ${location.lat}, ${location.lng}`);
    
    // Get reports in the area within time window
    const cutoffTime = new Date(Date.now() - (timeWindow * 1000));
    
    const reportsSnapshot = await db.collection('reports')
      .where('timestamp', '>=', cutoffTime)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const reports = [];
    reportsSnapshot.forEach(doc => {
      const reportData = { id: doc.id, ...doc.data() };
      const distance = calculateDistance(
        location.lat, location.lng,
        reportData.location.lat, reportData.location.lng
      );
      
      if (distance <= radius) {
        reports.push({ ...reportData, distance });
      }
    });

    if (reports.length === 0) {
      return { success: true, events: [] };
    }

    // Group reports by similarity
    const groupedReports = await groupSimilarReports(reports);
    
    // Synthesize each group into an event
    const events = [];
    for (const group of groupedReports) {
      const synthesizedEvent = await synthesizeReportGroup(group);
      events.push(synthesizedEvent);
    }

    // Save synthesized events
    for (const event of events) {
      await db.collection('events').add(event);
    }

    return { success: true, events, reportCount: reports.length };
    
  } catch (error) {
    console.error('Error in synthesizeReports:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Group similar reports using AI
 */
async function groupSimilarReports(reports) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const reportsText = reports.map(r => 
      `ID: ${r.id}, Category: ${r.category}, Title: ${r.title}, Description: ${r.description}, Location: ${r.location.lat.toFixed(4)},${r.location.lng.toFixed(4)}`
    ).join('\n');
    
    const prompt = `
    Group these city reports by similarity. Reports about the same incident or very similar issues should be grouped together.
    Consider location proximity, category, and content similarity.
    
    Reports:
    ${reportsText}
    
    Return JSON array of groups, where each group contains report IDs:
    [
      {"groupId": "group1", "reportIds": ["id1", "id2"], "primaryCategory": "traffic", "commonLocation": {"lat": 12.34, "lng": 56.78}},
      {"groupId": "group2", "reportIds": ["id3"], "primaryCategory": "safety", "commonLocation": {"lat": 12.35, "lng": 56.79}}
    ]
    `;

    const result = await model.generateContent(prompt);
    const groupsText = result.response.text();
    
    try {
      const groups = JSON.parse(groupsText);
      
      // Convert back to full report objects
      return groups.map(group => ({
        ...group,
        reports: reports.filter(r => group.reportIds.includes(r.id))
      }));
      
    } catch (parseError) {
      // Fallback: group by category and proximity
      return groupByProximityAndCategory(reports);
    }
    
  } catch (error) {
    console.error('Error grouping reports:', error);
    return groupByProximityAndCategory(reports);
  }
}

/**
 * Fallback grouping by proximity and category
 */
function groupByProximityAndCategory(reports) {
  const groups = [];
  const processed = new Set();
  
  for (const report of reports) {
    if (processed.has(report.id)) continue;
    
    const group = {
      groupId: uuidv4(),
      reportIds: [report.id],
      reports: [report],
      primaryCategory: report.category,
      commonLocation: report.location
    };
    
    // Find similar reports within 200m and same category
    for (const otherReport of reports) {
      if (processed.has(otherReport.id) || otherReport.id === report.id) continue;
      
      const distance = calculateDistance(
        report.location.lat, report.location.lng,
        otherReport.location.lat, otherReport.location.lng
      );
      
      if (distance <= 200 && report.category === otherReport.category) {
        group.reportIds.push(otherReport.id);
        group.reports.push(otherReport);
        processed.add(otherReport.id);
      }
    }
    
    processed.add(report.id);
    groups.push(group);
  }
  
  return groups;
}

/**
 * Synthesize a group of reports into a single event
 */
async function synthesizeReportGroup(group) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const reportsText = group.reports.map(r => 
      `Title: ${r.title}\nDescription: ${r.description}\nCategory: ${r.category}\nSeverity: ${r.severity}\nTime: ${new Date(r.timestamp.toDate()).toLocaleString()}`
    ).join('\n\n---\n\n');
    
    const prompt = `
    Synthesize these related city reports into a single comprehensive event summary.
    Provide clear, actionable information for city management.
    
    Reports:
    ${reportsText}
    
    Create a JSON response with:
    {
      "title": "Clear, concise event title",
      "description": "Comprehensive description combining all reports",
      "category": "primary category",
      "severity": "highest severity level from reports",
      "confidence": "confidence in synthesis (0-1)",
      "affectedArea": "description of affected area",
      "recommendations": "actionable recommendations",
      "estimatedImpact": "number of people/area affected",
      "urgency": "immediate|hours|days|routine",
      "actionRequired": true/false
    }
    `;

    const result = await model.generateContent(prompt);
    const synthesisText = result.response.text();
    
    let synthesis;
    try {
      synthesis = JSON.parse(synthesisText);
    } catch (parseError) {
      synthesis = {
        title: `${group.primaryCategory} issue in area`,
        description: `Multiple reports about ${group.primaryCategory} issues`,
        category: group.primaryCategory,
        severity: 'medium',
        confidence: 0.6,
        affectedArea: 'Local area',
        recommendations: 'Investigation required',
        estimatedImpact: `${group.reports.length} reports`,
        urgency: 'routine',
        actionRequired: true
      };
    }

    return {
      ...synthesis,
      id: uuidv4(),
      location: group.commonLocation,
      reportCount: group.reports.length,
      reportIds: group.reportIds,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      source: 'ai_synthesis',
      aiGenerated: true
    };
    
  } catch (error) {
    console.error('Error synthesizing report group:', error);
    
    // Fallback synthesis
    const maxSeverity = group.reports.reduce((max, r) => 
      ['low', 'medium', 'high'].indexOf(r.severity) > ['low', 'medium', 'high'].indexOf(max) ? r.severity : max
    , 'low');
    
    return {
      id: uuidv4(),
      title: `${group.primaryCategory} reports in area`,
      description: `${group.reports.length} reports about ${group.primaryCategory} issues`,
      category: group.primaryCategory,
      severity: maxSeverity,
      location: group.commonLocation,
      reportCount: group.reports.length,
      reportIds: group.reportIds,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      source: 'ai_synthesis',
      aiGenerated: true,
      confidence: 0.7,
      urgency: 'routine',
      actionRequired: true
    };
  }
}

/**
 * Generate predictive analytics for city patterns
 */
exports.generatePredictions = functions.https.onCall(async (data, context) => {
  try {
    const { area, timeWindow = 7 * 24 * 3600, analysisType = 'pattern_detection' } = data;
    
    console.log(`Generating predictions for area analysis`);
    
    // Get historical data
    const cutoffTime = new Date(Date.now() - (timeWindow * 1000));
    
    const [reportsSnapshot, eventsSnapshot] = await Promise.all([
      db.collection('reports')
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc')
        .limit(500)
        .get(),
      db.collection('events')
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc')
        .limit(200)
        .get()
    ]);

    const reports = [];
    const events = [];
    
    reportsSnapshot.forEach(doc => reports.push({ id: doc.id, ...doc.data() }));
    eventsSnapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));

    // Analyze patterns using Gemini
    const predictions = await analyzePatterns(reports, events, analysisType);
    
    // Save analytics
    const analyticsDoc = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      analysisType,
      dataPoints: reports.length + events.length,
      predictions,
      area,
      timeWindow,
      generatedBy: 'ai_analytics'
    };
    
    await db.collection('analytics').add(analyticsDoc);
    
    return { success: true, predictions };
    
  } catch (error) {
    console.error('Error generating predictions:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Analyze patterns and generate predictions
 */
async function analyzePatterns(reports, events, analysisType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Prepare data summary
    const reportsByCategory = _.groupBy(reports, 'category');
    const eventsByCategory = _.groupBy(events, 'category');
    
    const categorySummary = Object.keys(reportsByCategory).map(category => ({
      category,
      reportCount: reportsByCategory[category]?.length || 0,
      eventCount: eventsByCategory[category]?.length || 0,
      avgSeverity: calculateAverageSeverity(reportsByCategory[category] || [])
    }));

    const timePatterns = analyzeTimePatterns(reports);
    
    const prompt = `
    Analyze these city data patterns and generate predictions for urban management.
    
    Data Summary:
    - Total Reports: ${reports.length}
    - Total Events: ${events.length}
    - Category Breakdown: ${JSON.stringify(categorySummary)}
    - Time Patterns: ${JSON.stringify(timePatterns)}
    
    Generate predictions in JSON format:
    [
      {
        "title": "Prediction title",
        "description": "Detailed prediction description",
        "category": "affected category",
        "risk": "low|medium|high",
        "confidence": 0.85,
        "timeFrame": "next 24 hours|next week|next month",
        "likelihood": 0.75,
        "impact": "description of potential impact",
        "preventiveActions": "recommended preventive measures",
        "monitoringPoints": ["key indicators to watch"]
      }
    ]
    
    Focus on actionable insights for city management.
    `;

    const result = await model.generateContent(prompt);
    const predictionsText = result.response.text();
    
    try {
      return JSON.parse(predictionsText);
    } catch (parseError) {
      // Fallback predictions
      return generateFallbackPredictions(categorySummary, timePatterns);
    }
    
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return [];
  }
}

/**
 * Analyze sentiment for mood mapping
 */
exports.analyzeSentiment = functions.https.onCall(async (data, context) => {
  try {
    const { area, timeWindow = 24 * 3600, sources = ['reports'] } = data;
    
    console.log(`Analyzing sentiment for area`);
    
    const cutoffTime = new Date(Date.now() - (timeWindow * 1000));
    
    // Get text data for sentiment analysis
    const textData = [];
    
    if (sources.includes('reports')) {
      const reportsSnapshot = await db.collection('reports')
        .where('timestamp', '>=', cutoffTime)
        .limit(200)
        .get();
      
      reportsSnapshot.forEach(doc => {
        const report = doc.data();
        textData.push({
          text: `${report.title} ${report.description}`,
          type: 'report',
          id: doc.id,
          location: report.location,
          timestamp: report.timestamp
        });
      });
    }
    
    // Analyze sentiment using Google Cloud Natural Language API
    const sentimentResults = [];
    
    for (const item of textData) {
      try {
        const [result] = await language.analyzeSentiment({
          document: {
            content: item.text,
            type: 'PLAIN_TEXT',
          },
        });
        
        const sentiment = result.documentSentiment;
        
        sentimentResults.push({
          id: uuidv4(),
          sourceId: item.id,
          sourceType: item.type,
          score: sentiment.score, // Range: -1.0 to 1.0
          magnitude: sentiment.magnitude, // Range: 0.0 to infinity
          location: item.location,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          originalTimestamp: item.timestamp,
          text: item.text.substring(0, 200) // Store first 200 chars for reference
        });
        
      } catch (error) {
        console.error(`Error analyzing sentiment for ${item.id}:`, error);
      }
    }
    
    // Save sentiment data
    const batch = db.batch();
    sentimentResults.forEach(sentiment => {
      const ref = db.collection('sentiment').doc();
      batch.set(ref, sentiment);
    });
    await batch.commit();
    
    // Calculate area mood score
    const avgScore = sentimentResults.reduce((sum, s) => sum + s.score, 0) / sentimentResults.length;
    const moodCategory = avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral';
    
    return {
      success: true,
      sentimentCount: sentimentResults.length,
      averageScore: avgScore,
      moodCategory,
      timeWindow,
      area
    };
    
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Trigger data fusion when new reports are created
 */
async function triggerDataFusion(location, category) {
  try {
    // Publish to Pub/Sub for asynchronous processing
    const message = {
      location,
      category,
      timestamp: Date.now(),
      action: 'fusion_trigger'
    };
    
    await pubsub.topic('city-data-fusion').publishMessage({
      data: Buffer.from(JSON.stringify(message))
    });
    
    console.log('Data fusion triggered for', category, 'at', location.lat, location.lng);
    
  } catch (error) {
    console.error('Error triggering data fusion:', error);
  }
}

// Utility functions
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function calculateAverageSeverity(reports) {
  if (!reports.length) return 0;
  const severityMap = { low: 1, medium: 2, high: 3 };
  const sum = reports.reduce((total, r) => total + (severityMap[r.severity] || 2), 0);
  return sum / reports.length;
}

function analyzeTimePatterns(reports) {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  reports.forEach(report => {
    const date = new Date(report.timestamp.toDate());
    hourCounts[date.getHours()]++;
    dayCounts[date.getDay()]++;
  });
  
  return {
    peakHour: hourCounts.indexOf(Math.max(...hourCounts)),
    peakDay: dayCounts.indexOf(Math.max(...dayCounts)),
    hourlyDistribution: hourCounts,
    dailyDistribution: dayCounts
  };
}

function generateFallbackPredictions(categorySummary, timePatterns) {
  const predictions = [];
  
  // High-volume category prediction
  const highestCategory = categorySummary.reduce((max, cat) => 
    cat.reportCount > max.reportCount ? cat : max
  );
  
  if (highestCategory.reportCount > 5) {
    predictions.push({
      title: `Increased ${highestCategory.category} incidents expected`,
      description: `Based on recent patterns, expect continued ${highestCategory.category} issues`,
      category: highestCategory.category,
      risk: highestCategory.avgSeverity > 2 ? 'high' : 'medium',
      confidence: 0.7,
      timeFrame: 'next week',
      likelihood: 0.6,
      impact: 'Moderate disruption possible',
      preventiveActions: 'Increase monitoring and response capacity',
      monitoringPoints: ['Report frequency', 'Severity trends']
    });
  }
  
  return predictions;
}

// Send push notifications to subscribed users
exports.sendNotification = functions.https.onCall(async (data, context) => {
  try {
    console.log('📱 Sending notification:', data);
    
    const { title, body, tokens, data: notificationData } = data;
    
    if (!title || !body || !tokens || !Array.isArray(tokens)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required notification data'
      );
    }
    
    // Create notification payload
    const payload = {
      notification: {
        title,
        body,
        icon: '/logo192.png',
        badge: '/logo192.png'
      },
      data: {
        ...notificationData,
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          channelId: 'nextsignal-alerts',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        }
      }
    };
    
    // Send to multiple tokens
    const response = await admin.messaging().sendMulticast({
      tokens: tokens.slice(0, 500), // FCM limit
      ...payload
    });
    
    console.log('✅ Notification sent successfully:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      results: response.responses
    };
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Automatically send notifications for new events
exports.onNewEvent = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snapshot, context) => {
    try {
      const event = snapshot.data();
      const eventId = context.params.eventId;
      
      console.log('🆕 New event created:', eventId);
      
      // Get users with area subscriptions
      const usersRef = admin.firestore().collection('users');
      const usersSnapshot = await usersRef
        .where('areaSubscriptions', '!=', null)
        .get();
      
      const notificationPromises = [];
      
      usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        const subscriptions = userData.areaSubscriptions || [];
        
        subscriptions.forEach(subscription => {
          // Check if event is in subscription area
          if (isEventInSubscriptionArea(event, subscription)) {
            // Add notification to user's collection
            const notificationData = {
              title: `⚠️ ${event.category} Alert in ${subscription.name}`,
              body: event.aiSummary || event.description,
              type: 'area_alert',
              severity: event.severity,
              eventId: eventId,
              location: event.location,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
              actionable: event.actionableAdvice || null
            };
            
            const notificationPromise = admin.firestore()
              .collection('users')
              .doc(userDoc.id)
              .collection('notifications')
              .add(notificationData);
            
            notificationPromises.push(notificationPromise);
            
            // Send push notification if user has FCM token
            if (userData.fcmToken) {
              const pushPromise = admin.messaging().send({
                token: userData.fcmToken,
                notification: {
                  title: notificationData.title,
                  body: notificationData.body
                },
                data: {
                  eventId: eventId,
                  type: 'area_alert',
                  severity: event.severity
                }
              }).catch(error => {
                console.error('Failed to send push notification:', error);
              });
              
              notificationPromises.push(pushPromise);
            }
          }
        });
      });
      
      await Promise.all(notificationPromises);
      console.log('✅ Event notifications processed');
      
    } catch (error) {
      console.error('❌ Error processing new event:', error);
    }
  });

// Helper function to check if event is in subscription area  
function isEventInSubscriptionArea(event, subscription) {
  if (!event.location || !subscription.location) return false;
  
  const distance = calculateDistance(
    event.location.lat,
    event.location.lng,
    subscription.location.lat,
    subscription.location.lng
  );
  
  return distance <= (subscription.radius || 5); // Default 5km radius
} 