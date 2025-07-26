import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DemoDataContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const {
    reports,
    events,
    analytics,
    sentiment,
    loading,
    triggerPredictiveAnalysis
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    reportTrends: [],
    categoryBreakdown: [],
    severityDistribution: [],
    locationHotspots: [],
    sentimentTrends: [],
    predictions: []
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'trends', name: 'Trends', icon: '📈' },
    { id: 'sentiment', name: 'Mood Map', icon: '😊' },
    { id: 'predictions', name: 'Predictions', icon: '🔮' }
  ];

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  // Process data for charts
  useEffect(() => {
    const processData = () => {
      const now = new Date();
      const timeMs = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      
      const cutoffTime = new Date(now.getTime() - timeMs[timeRange]);

      // Filter data by time range
      const filteredReports = reports.filter(report => {
        const reportTime = new Date(report.timestamp?.toDate?.() || report.timestamp);
        return reportTime >= cutoffTime;
      });

      const filteredSentiment = sentiment.filter(s => {
        const sentimentTime = new Date(s.timestamp?.toDate?.() || s.timestamp);
        return sentimentTime >= cutoffTime;
      });

      // Report trends over time
      const reportTrends = generateTimeSeriesData(filteredReports, timeRange);
      
      // Category breakdown
      const categoryBreakdown = generateCategoryBreakdown(filteredReports);
      
      // Severity distribution
      const severityDistribution = generateSeverityDistribution(filteredReports);
      
      // Location hotspots (simplified)
      const locationHotspots = generateLocationHotspots(filteredReports);
      
      // Sentiment trends
      const sentimentTrends = generateSentimentTrends(filteredSentiment, timeRange);

      setAnalyticsData({
        reportTrends,
        categoryBreakdown,
        severityDistribution,
        locationHotspots,
        sentimentTrends,
        predictions: analytics?.predictions || []
      });
    };

    if (reports.length || events.length || sentiment.length) {
      processData();
    }
  }, [reports, events, sentiment, timeRange, analytics]);

  const generateTimeSeriesData = (data, range) => {
    const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const interval = range === '24h' ? 'hour' : 'day';
    
    const series = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now);
      if (interval === 'hour') {
        time.setHours(time.getHours() - i);
      } else {
        time.setDate(time.getDate() - i);
      }
      
      const count = data.filter(item => {
        const itemTime = new Date(item.timestamp?.toDate?.() || item.timestamp);
        if (interval === 'hour') {
          return itemTime.getHours() === time.getHours() && 
                 itemTime.getDate() === time.getDate();
        } else {
          return itemTime.getDate() === time.getDate() && 
                 itemTime.getMonth() === time.getMonth();
        }
      }).length;
      
      series.push({
        time: interval === 'hour' ? 
          time.toLocaleTimeString('en-US', { hour: '2-digit' }) :
          time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reports: count,
        events: Math.floor(count * 0.3) // Rough estimation
      });
    }
    
    return series;
  };

  const generateCategoryBreakdown = (data) => {
    const categories = {};
    data.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    return Object.entries(categories).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
      percentage: Math.round((count / data.length) * 100)
    }));
  };

  const generateSeverityDistribution = (data) => {
    const severities = { low: 0, medium: 0, high: 0 };
    data.forEach(item => {
      severities[item.severity] = (severities[item.severity] || 0) + 1;
    });
    
    return [
      { name: 'Low', value: severities.low, color: '#10B981' },
      { name: 'Medium', value: severities.medium, color: '#F59E0B' },
      { name: 'High', value: severities.high, color: '#EF4444' }
    ];
  };

  const generateLocationHotspots = (data) => {
    // Simplified location grouping
    const locations = {};
    data.forEach(item => {
      const key = `${Math.floor(item.location.lat * 100)},${Math.floor(item.location.lng * 100)}`;
      locations[key] = (locations[key] || 0) + 1;
    });
    
    return Object.entries(locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count], index) => ({
        area: `Area ${index + 1}`,
        reports: count
      }));
  };

  const generateSentimentTrends = (data, range) => {
    if (!data.length) return [];
    
    const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const interval = range === '24h' ? 'hour' : 'day';
    
    const series = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now);
      if (interval === 'hour') {
        time.setHours(time.getHours() - i);
      } else {
        time.setDate(time.getDate() - i);
      }
      
      const periodData = data.filter(item => {
        const itemTime = new Date(item.timestamp?.toDate?.() || item.timestamp);
        if (interval === 'hour') {
          return itemTime.getHours() === time.getHours() && 
                 itemTime.getDate() === time.getDate();
        } else {
          return itemTime.getDate() === time.getDate() && 
                 itemTime.getMonth() === time.getMonth();
        }
      });
      
      const avgSentiment = periodData.length > 0 
        ? periodData.reduce((sum, item) => sum + (item.score || 0), 0) / periodData.length
        : 0;
      
      series.push({
        time: interval === 'hour' ? 
          time.toLocaleTimeString('en-US', { hour: '2-digit' }) :
          time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sentiment: Math.round(avgSentiment * 100) / 100
      });
    }
    
    return series;
  };

  const handlePredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const center = { lat: 12.9716, lng: 77.5946 }; // Default center
      await triggerPredictiveAnalysis(center);
    } catch (error) {
      console.error('Error triggering predictive analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container">
        <div className="h-[calc(100vh-2rem)] flex flex-col">
          
          {/* Modern Header */}
          <div className="dashboard-header">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="dashboard-title">City Intelligence Analytics</h1>
                <p className="text-gray-600 text-lg">Real-time insights and predictive analysis for urban management</p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="modern-btn btn-toggle"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handlePredictiveAnalysis}
                  disabled={isAnalyzing}
                  className={`modern-btn ${isAnalyzing ? 'btn-toggle' : 'btn-primary'} flex items-center space-x-2`}
                >
                  {isAnalyzing ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <span className="material-icons">auto_awesome</span>
                  )}
                  <span>Analyze</span>
                </button>
              </div>
            </div>

            {/* Modern Tabs */}
            <div className="layer-toggle">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`modern-btn flex items-center space-x-2 ${
                    activeTab === tab.id ? 'btn-toggle active' : 'btn-toggle'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex gap-6 pb-4">
            
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="stats-card reports">
                      <div className="stat-icon">📋</div>
                      <div className="stat-value">{reports.length}</div>
                      <div className="stat-label">Total Reports</div>
                      <div className="mt-2 text-sm text-green-600 font-medium">↑ 12% from last week</div>
                    </div>
                    
                    <div className="stats-card events">
                      <div className="stat-icon">🚨</div>
                      <div className="stat-value">{events.filter(e => e.isActive).length}</div>
                      <div className="stat-label">Active Events</div>
                      <div className="mt-2 text-sm text-red-600 font-medium">↓ 5% from last week</div>
                    </div>
                    
                    <div className="stats-card predictions">
                      <div className="stat-icon">⏱️</div>
                      <div className="stat-value">2.4h</div>
                      <div className="stat-label">Avg Response Time</div>
                      <div className="mt-2 text-sm text-green-600 font-medium">↓ 8% from last week</div>
                    </div>
                    
                    <div className="stats-card sentiment">
                      <div className="stat-icon">😊</div>
                      <div className="stat-value">7.2/10</div>
                      <div className="stat-label">City Sentiment</div>
                      <div className="mt-2 text-sm text-green-600 font-medium">↑ 3% from last week</div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Report Trends */}
                    <div className="modern-card">
                      <div className="flex items-center space-x-2 mb-6">
                        <span className="material-icons text-blue-600">trending_up</span>
                        <h3 className="text-xl font-semibold text-gray-800">Report Trends</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.reportTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="events" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category Breakdown */}
                    <div className="modern-card">
                      <div className="flex items-center space-x-2 mb-6">
                        <span className="material-icons text-green-600">pie_chart</span>
                        <h3 className="text-xl font-semibold text-gray-800">Category Breakdown</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            label={({ category, percentage }) => `${category} (${percentage}%)`}
                          >
                            {analyticsData.categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  {/* Severity Distribution */}
                  <div className="modern-card">
                    <div className="flex items-center space-x-2 mb-6">
                      <span className="material-icons text-orange-600">bar_chart</span>
                      <h3 className="text-xl font-semibold text-gray-800">Severity Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.severityDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Location Hotspots */}
                  <div className="modern-card">
                    <div className="flex items-center space-x-2 mb-6">
                      <span className="material-icons text-red-600">location_on</span>
                      <h3 className="text-xl font-semibold text-gray-800">Location Hotspots</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.locationHotspots} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" />
                        <YAxis dataKey="area" type="category" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="reports" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Sentiment Tab */}
              {activeTab === 'sentiment' && (
                <div className="modern-card">
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="material-icons text-purple-600">sentiment_satisfied</span>
                    <h3 className="text-xl font-semibold text-gray-800">Sentiment Trends</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.sentimentTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[-1, 1]} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sentiment" 
                        stroke="#8B5CF6" 
                        fill="#8B5CF6" 
                        fillOpacity={0.3}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Predictions Tab */}
              {activeTab === 'predictions' && (
                <div className="modern-card">
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="material-icons text-indigo-600">psychology</span>
                    <h3 className="text-xl font-semibold text-gray-800">AI Predictions</h3>
                  </div>
                  
                  {analyticsData.predictions.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.predictions.map((prediction, index) => (
                        <div key={index} className="list-item">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 mb-2">{prediction.title}</h4>
                              <p className="text-sm text-gray-600 mb-3">{prediction.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <span className="material-icons text-xs">speed</span>
                                  <span>Confidence: {prediction.confidence}%</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span className="material-icons text-xs">schedule</span>
                                  <span>Time Frame: {prediction.timeFrame}</span>
                                </span>
                              </div>
                            </div>
                            <span className={`severity-badge ml-4 ${
                              prediction.risk === 'high' ? 'severity-high' :
                              prediction.risk === 'medium' ? 'severity-medium' :
                              'severity-low'
                            }`}>
                              {prediction.risk} risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔮</div>
                      <h4 className="text-xl font-semibold text-gray-700 mb-2">No Predictions Available</h4>
                      <p className="text-gray-600">Click "Analyze" to generate AI-powered predictions</p>
                    </div>
                  )}
                </div>
              )}
              
            </div>

            {/* Analyzing State Panel */}
            {isAnalyzing && (
              <div className="w-80 modern-card">
                <div className="text-center py-8">
                  <div className="animate-spin text-6xl mb-4">🔮</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyzing Data</h3>
                  <p className="text-gray-600 text-sm">AI is processing city data to generate insights...</p>
                  <div className="mt-4 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <span className="material-icons text-sm">info</span>
                      <span className="text-xs">This may take a few moments</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 