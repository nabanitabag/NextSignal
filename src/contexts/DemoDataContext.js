import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  console.log('📊 DemoDataContext: Using demo mode with mock data');
  
  // Mock data for testing UI
  const [reports] = useState([
    {
      id: 'demo1',
      title: 'Traffic Congestion on Main Street',
      description: 'Heavy traffic due to construction work',
      category: 'traffic',
      severity: 'medium',
      location: { lat: 37.7749, lng: -122.4194, address: 'Main Street, San Francisco' },
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      userId: 'demo-user',
      status: 'verified',
      mediaUrls: []
    },
    {
      id: 'demo2', 
      title: 'Street Light Outage',
      description: 'Street lights not working on 5th Avenue',
      category: 'infrastructure',
      severity: 'low',
      location: { lat: 37.7849, lng: -122.4094, address: '5th Avenue, San Francisco' },
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      userId: 'demo-user',
      status: 'pending',
      mediaUrls: []
    }
  ]);

  const [events] = useState([
    {
      id: 'event1',
      title: 'Traffic Disruption Alert',
      description: 'Multiple reports of traffic congestion in downtown area',
      category: 'traffic',
      severity: 'high',
      location: { lat: 37.7749, lng: -122.4194 },
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      aiSummary: 'Heavy traffic congestion reported on Main Street due to ongoing construction. Consider alternative routes via 2nd Street or Highway 101.',
      actionableAdvice: 'Use alternative routes: 2nd Street or Highway 101',
      confidence: 0.85,
      isActive: true,
      reportCount: 3
    }
  ]);

  const [analytics] = useState({
    totalReports: 25,
    activeEvents: 3,
    avgResponseTime: '12 minutes',
    sentimentScore: 0.65,
    topCategories: [
      { category: 'traffic', count: 8 },
      { category: 'infrastructure', count: 6 },
      { category: 'safety', count: 4 }
    ]
  });

  const [sentiment] = useState([
    {
      id: 'sentiment1',
      location: { lat: 37.7749, lng: -122.4194 },
      score: 0.7,
      magnitude: 0.8,
      timestamp: new Date(),
      text: 'Traffic situation improving with new alternative routes'
    }
  ]);

  const [feeds] = useState([
    {
      id: 'feed1',
      title: 'City Traffic Update',
      summary: 'Real-time traffic conditions and incident reports across the city',
      timestamp: new Date(),
      priority: 'high'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      console.log('📊 DemoDataContext: Mock data loaded');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mock functions
  const submitReport = async (reportData, mediaFiles = []) => {
    console.log('📊 Demo: submitReport called', { reportData, mediaFiles });
    return { success: true, id: 'demo-report-' + Date.now() };
  };

  const updateReportStatus = async (reportId, status) => {
    console.log('📊 Demo: updateReportStatus called', { reportId, status });
    return { success: true };
  };

  const getReportsInArea = async (lat, lng, radius) => {
    console.log('📊 Demo: getReportsInArea called', { lat, lng, radius });
    return reports.filter(report => 
      Math.abs(report.location.lat - lat) < 0.01 && 
      Math.abs(report.location.lng - lng) < 0.01
    );
  };

  const getEventsInArea = async (lat, lng, radius) => {
    console.log('📊 Demo: getEventsInArea called', { lat, lng, radius });
    return events.filter(event => 
      Math.abs(event.location.lat - lat) < 0.01 && 
      Math.abs(event.location.lng - lng) < 0.01
    );
  };

  const getCityAnalytics = async () => {
    console.log('📊 Demo: getCityAnalytics called');
    return analytics;
  };

  const triggerPredictiveAnalysis = async () => {
    console.log('📊 Demo: triggerPredictiveAnalysis called');
    return {
      predictions: [
        {
          title: 'Potential Traffic Increase',
          description: 'Based on current patterns, expect 20% increase in traffic during evening rush hour',
          confidence: 0.75,
          timeframe: 'next 2 hours'
        }
      ]
    };
  };

  const analyzeSentimentForArea = async (lat, lng, radius) => {
    console.log('📊 Demo: analyzeSentimentForArea called', { lat, lng, radius });
    return {
      overallSentiment: 0.65,
      sentimentData: sentiment
    };
  };

  const value = {
    reports,
    events,
    analytics,
    sentiment,
    feeds,
    loading,
    error,
    submitReport,
    updateReportStatus,
    getReportsInArea,
    getEventsInArea,
    getCityAnalytics,
    triggerPredictiveAnalysis,
    analyzeSentimentForArea
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 