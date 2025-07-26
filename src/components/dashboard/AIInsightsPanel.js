import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../contexts/DemoDataContext';
import { useAuth } from '../../contexts/DemoAuthContext';

const AIInsightsPanel = ({ location, className = '' }) => {
  const { user } = useAuth();
  const { 
    triggerPredictiveAnalysis, 
    analyzeSentimentForArea 
  } = useData();
  
  const [insights, setInsights] = useState({
    predictions: [],
    sentiment: null,
    alerts: [],
    loading: false
  });

  const [activeTab, setActiveTab] = useState('predictions');

  // Generate alerts based on insights
  const generateAlerts = (predictions, sentimentData) => {
    const alerts = [];
    
    // High-risk predictions
    if (predictions) {
      predictions.filter(p => p.risk === 'high').forEach(prediction => {
        alerts.push({
          type: 'risk',
          level: 'high',
          title: 'High Risk Prediction',
          message: prediction.title,
          action: prediction.preventiveActions
        });
      });
    }
    
    // Negative sentiment alerts
    if (sentimentData && sentimentData.averageScore < -0.3) {
      alerts.push({
        type: 'sentiment',
        level: 'medium',
        title: 'Negative Area Sentiment',
        message: 'Citizens reporting increased concerns in this area',
        action: 'Review recent reports and consider public communication'
      });
    }
    
    return alerts;
  };

  // Generate AI insights
  const generateInsights = useCallback(async () => {
    if (!location || insights.loading) return;
    
    setInsights(prev => ({ ...prev, loading: true }));
    
    try {
      // Trigger predictive analysis
      const predictions = await triggerPredictiveAnalysis(location);
      
      // Analyze area sentiment
      const sentimentData = await analyzeSentimentForArea(location);
      
      setInsights({
        predictions: predictions || [],
        sentiment: sentimentData,
        alerts: generateAlerts(predictions, sentimentData),
        loading: false
      });
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setInsights(prev => ({ ...prev, loading: false }));
    }
  }, [location, insights.loading, triggerPredictiveAnalysis, analyzeSentimentForArea]);

  // Auto-refresh insights
  useEffect(() => {
    if (location && user) {
      generateInsights();
      
      // Refresh every 5 minutes
      const interval = setInterval(generateInsights, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [location, user, generateInsights]);

  const formatSentimentScore = (score) => {
    if (score > 0.1) return { label: 'Positive', color: 'text-green-600', emoji: '😊' };
    if (score < -0.1) return { label: 'Negative', color: 'text-red-600', emoji: '😟' };
    return { label: 'Neutral', color: 'text-gray-600', emoji: '😐' };
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-low';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'predictions', name: 'Predictions', icon: '🔮' },
    { id: 'sentiment', name: 'Mood', icon: '😊' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <span>🤖</span>
          <span>AI Insights</span>
        </h3>
        <button
          onClick={generateInsights}
          disabled={insights.loading}
          className="modern-btn btn-toggle flex items-center space-x-1"
        >
          <span className={`material-icons text-sm ${insights.loading ? 'animate-spin' : ''}`}>
            {insights.loading ? 'refresh' : 'auto_awesome'}
          </span>
          <span className="text-xs">{insights.loading ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>
      
      {/* Modern Tabs */}
      <div className="layer-toggle mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`modern-btn flex items-center space-x-1 ${
              activeTab === tab.id ? 'btn-toggle active' : 'btn-toggle'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-xs">{tab.name}</span>
            {tab.id === 'alerts' && insights.alerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1">
                {insights.alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-3">
            {insights.loading ? (
              <div className="text-center py-8">
                <div className="animate-spin text-3xl mb-2">🔮</div>
                <p className="text-sm text-gray-600">Generating predictions...</p>
              </div>
            ) : insights.predictions.length > 0 ? (
              insights.predictions.map((prediction, index) => (
                <div key={index} className="list-item">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm flex-1">
                      {prediction.title}
                    </h4>
                    <span className={`severity-badge ${getRiskColor(prediction.risk)} ml-2`}>
                      {prediction.risk}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {prediction.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>⏱️ {prediction.timeFrame}</span>
                    <span className={getConfidenceColor(prediction.confidence)}>
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                  
                  {prediction.preventiveActions && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs">
                      <span className="font-medium text-blue-800">Action:</span>
                      <span className="text-blue-700 ml-1">{prediction.preventiveActions}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔮</div>
                <h4 className="text-sm font-medium text-gray-700">No Predictions</h4>
                <p className="text-xs text-gray-500">Click refresh to generate AI predictions</p>
              </div>
            )}
          </div>
        )}

        {/* Sentiment Tab */}
        {activeTab === 'sentiment' && (
          <div className="space-y-4">
            {insights.sentiment ? (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {formatSentimentScore(insights.sentiment.averageScore).emoji}
                  </div>
                  <h4 className={`text-lg font-semibold ${formatSentimentScore(insights.sentiment.averageScore).color}`}>
                    {formatSentimentScore(insights.sentiment.averageScore).label} Mood
                  </h4>
                  <p className="text-sm text-gray-600">
                    Based on {insights.sentiment.sentimentCount} recent reports
                  </p>
                </div>
                
                <div className="list-item">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Sentiment Score</span>
                    <span className="text-sm font-mono">
                      {insights.sentiment.averageScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        insights.sentiment.averageScore >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.abs(insights.sentiment.averageScore) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Negative</span>
                    <span>Neutral</span>
                    <span>Positive</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>💡 <span className="font-medium">Category:</span> {insights.sentiment.moodCategory}</p>
                  <p>⏰ <span className="font-medium">Time window:</span> {Math.round(insights.sentiment.timeWindow / 3600)} hours</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">😊</div>
                <h4 className="text-sm font-medium text-gray-700">No Sentiment Data</h4>
                <p className="text-xs text-gray-500">Click refresh to analyze area mood</p>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {insights.alerts.length > 0 ? (
              insights.alerts.map((alert, index) => (
                <div key={index} className={`list-item border-l-4 ${
                  alert.level === 'high' ? 'border-red-500 bg-red-50' :
                  alert.level === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">
                      {alert.type === 'risk' ? '⚠️' : alert.type === 'sentiment' ? '😟' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-800">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.message}
                      </p>
                      {alert.action && (
                        <p className="text-xs text-gray-700 mt-2 font-medium">
                          🎯 {alert.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <h4 className="text-sm font-medium text-gray-700">No Active Alerts</h4>
                <p className="text-xs text-gray-500">All clear! AI monitoring continues.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel; 