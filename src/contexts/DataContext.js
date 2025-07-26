import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../config/firebase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State for real-time data
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [sentiment, setSentiment] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cloud Functions
  const analyzeMedia = httpsCallable(functions, 'analyzeMedia');
  const synthesizeReports = httpsCallable(functions, 'synthesizeReports');
  const generatePredictions = httpsCallable(functions, 'generatePredictions');
  const analyzeSentiment = httpsCallable(functions, 'analyzeSentiment');

  // Submit a new report with multimodal data
  const submitReport = useCallback(async (reportData, mediaFiles = []) => {
    try {
      if (!user) throw new Error('User must be authenticated to submit reports');

      setError(null);
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload media files if any
      const mediaUrls = [];
      for (const file of mediaFiles) {
        const storageRef = ref(storage, `reports/${reportId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        mediaUrls.push({
          url: downloadURL,
          type: file.type,
          name: file.name,
          size: file.size
        });
      }

      // Create the report document
      const report = {
        id: reportId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        type: reportData.type,
        category: reportData.category,
        title: reportData.title,
        description: reportData.description,
        location: {
          lat: reportData.location.lat,
          lng: reportData.location.lng,
          address: reportData.location.address,
          geohash: generateGeohash(reportData.location.lat, reportData.location.lng)
        },
        media: mediaUrls,
        severity: reportData.severity || 'medium',
        status: 'pending',
        timestamp: serverTimestamp(),
        metadata: {
          deviceInfo: navigator.userAgent,
          ipAddress: null, // Will be filled by Cloud Function
          source: 'web_app'
        }
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'reports'), report);
      
      // If there's media, trigger AI analysis
      if (mediaUrls.length > 0) {
        try {
          await analyzeMedia({
            reportId: docRef.id,
            mediaUrls: mediaUrls
          });
        } catch (aiError) {
          console.warn('AI analysis failed, but report was saved:', aiError);
        }
      }

      // Trigger report synthesis for the area
      setTimeout(async () => {
        try {
          await synthesizeReports({
            location: report.location,
            radius: 1000, // 1km radius
            timeWindow: 3600 // 1 hour
          });
        } catch (synthError) {
          console.warn('Report synthesis failed:', synthError);
        }
      }, 2000);

      return { id: docRef.id, ...report };
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.message);
      throw error;
    }
  }, [user, analyzeMedia, synthesizeReports]);

  // Get reports in a specific area
  const getReportsInArea = useCallback(async (center, radius = 5000) => {
    try {
      // For simplicity, we'll query all reports and filter by distance
      // In production, you'd use geohash queries for better performance
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const areaReports = [];
      snapshot.forEach(doc => {
        const report = { id: doc.id, ...doc.data() };
        const distance = calculateDistance(
          center.lat, center.lng,
          report.location.lat, report.location.lng
        );
        
        if (distance <= radius) {
          areaReports.push({ ...report, distance });
        }
      });

      return areaReports.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error fetching area reports:', error);
      throw error;
    }
  }, []);

  // Get events in a specific area
  const getEventsInArea = useCallback(async (center, radius = 5000) => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('isActive', '==', true),
        orderBy('severity', 'desc'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const areaEvents = [];
      
      snapshot.forEach(doc => {
        const event = { id: doc.id, ...doc.data() };
        const distance = calculateDistance(
          center.lat, center.lng,
          event.location.lat, event.location.lng
        );
        
        if (distance <= radius) {
          areaEvents.push({ ...event, distance });
        }
      });

      return areaEvents.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error fetching area events:', error);
      throw error;
    }
  }, []);

  // Update report status
  const updateReportStatus = useCallback(async (reportId, status, adminNotes = '') => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        adminNotes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }, []);

  // Get city analytics
  const getCityAnalytics = useCallback(async () => {
    try {
      const analyticsRef = collection(db, 'analytics');
      const q = query(analyticsRef, orderBy('timestamp', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const latestAnalytics = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setAnalytics(latestAnalytics);
        return latestAnalytics;
      }
      return null;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }, []);

  // Trigger predictive analysis
  const triggerPredictiveAnalysis = useCallback(async (area) => {
    try {
      const result = await generatePredictions({
        area: area,
        timeWindow: 7 * 24 * 3600, // 7 days
        analysisType: 'pattern_detection'
      });
      return result.data;
    } catch (error) {
      console.error('Error triggering predictive analysis:', error);
      throw error;
    }
  }, [generatePredictions]);

  // Analyze sentiment for mood map
  const analyzeSentimentForArea = useCallback(async (area) => {
    try {
      const result = await analyzeSentiment({
        area: area,
        timeWindow: 24 * 3600, // 24 hours
        sources: ['reports', 'social_media']
      });
      return result.data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }, [analyzeSentiment]);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribers = [];

    // Listen to recent reports
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubReports = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = [];
      snapshot.forEach(doc => {
        reportsData.push({ id: doc.id, ...doc.data() });
      });
      setReports(reportsData);
    }, (error) => {
      console.error('Error listening to reports:', error);
      setError(error.message);
    });
    unsubscribers.push(unsubReports);

    // Listen to active events
    const eventsQuery = query(
      collection(db, 'events'),
      where('isActive', '==', true),
      orderBy('severity', 'desc'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = [];
      snapshot.forEach(doc => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData);
    }, (error) => {
      console.error('Error listening to events:', error);
      setError(error.message);
    });
    unsubscribers.push(unsubEvents);

    // Listen to sentiment data
    const sentimentQuery = query(
      collection(db, 'sentiment'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const unsubSentiment = onSnapshot(sentimentQuery, (snapshot) => {
      const sentimentData = [];
      snapshot.forEach(doc => {
        sentimentData.push({ id: doc.id, ...doc.data() });
      });
      setSentiment(sentimentData);
    }, (error) => {
      console.error('Error listening to sentiment:', error);
    });
    unsubscribers.push(unsubSentiment);

    // Listen to social media feeds
    const feedsQuery = query(
      collection(db, 'feeds'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    const unsubFeeds = onSnapshot(feedsQuery, (snapshot) => {
      const feedsData = [];
      snapshot.forEach(doc => {
        feedsData.push({ id: doc.id, ...doc.data() });
      });
      setFeeds(feedsData);
    }, (error) => {
      console.error('Error listening to feeds:', error);
    });
    unsubscribers.push(unsubFeeds);

    setLoading(false);

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Utility functions
  const generateGeohash = (lat, lng, precision = 9) => {
    // Simplified geohash implementation
    // In production, use a proper geohash library
    return `${lat.toFixed(6)}_${lng.toFixed(6)}`;
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const value = {
    // Data
    reports,
    events,
    analytics,
    sentiment,
    feeds,
    loading,
    error,
    
    // Actions
    submitReport,
    getReportsInArea,
    getEventsInArea,
    updateReportStatus,
    getCityAnalytics,
    triggerPredictiveAnalysis,
    analyzeSentimentForArea,
    
    // Utilities
    calculateDistance
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 