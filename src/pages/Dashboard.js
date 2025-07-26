import React, { useState, useEffect, useRef } from 'react';
import { useMap } from '../contexts/DemoMapContext';
import { useData } from '../contexts/DemoDataContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AIInsightsPanel from '../components/dashboard/AIInsightsPanel';

const Dashboard = () => {
  console.log('🏙️ Dashboard: Component loading...');
  
  const {
    isLoaded: mapLoaded,
    loading: mapLoading,
    error: mapError,
    initializeMapInstance,
    addMarkersForData,
    userLocation
  } = useMap();
  
  console.log('🏙️ Dashboard: Map context -', { mapLoaded, mapLoading, mapError });
  
  const {
    reports,
    events,
    analytics,
    sentiment,
    feeds,
    loading: dataLoading,
    error: dataError
  } = useData();

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [activeLayer, setActiveLayer] = useState('events');
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentMarkers, setCurrentMarkers] = useState([]);
  const [realtimeStats, setRealtimeStats] = useState({
    activeEvents: 0,
    recentReports: 0,
    avgSentiment: 0,
    predictedIncidents: 0
  });

  // Initialize map when component mounts
  useEffect(() => {
    if (mapLoaded && mapRef.current && !map) {
      const mapInstance = initializeMapInstance(mapRef.current);
      setMap(mapInstance);
    }
  }, [mapLoaded, initializeMapInstance, map]);

  // Update markers when data or layer changes
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    currentMarkers.forEach(({ marker }) => {
      marker.setMap(null);
    });

    let newMarkers = [];
    
    if (activeLayer === 'events' && events.length > 0) {
      newMarkers = addMarkersForData(events, 'event');
    } else if (activeLayer === 'reports' && reports.length > 0) {
      newMarkers = addMarkersForData(reports, 'report');
    }

    setCurrentMarkers(newMarkers);
  }, [map, activeLayer, events, reports, addMarkersForData, currentMarkers]);

  // Update real-time stats
  useEffect(() => {
    const activeEvents = events.filter(event => event.isActive).length;
    const recentReports = reports.filter(report => {
      const reportTime = new Date(report.timestamp?.toDate?.() || report.timestamp);
      const now = new Date();
      return (now - reportTime) < 3600000; // Last hour
    }).length;

    const avgSentiment = sentiment.length > 0 
      ? sentiment.reduce((sum, s) => sum + (s.score || 0), 0) / sentiment.length 
      : 0;

    const predictedIncidents = analytics?.predictions?.length || 0;

    setRealtimeStats({
      activeEvents,
      recentReports,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      predictedIncidents
    });
  }, [events, reports, sentiment, analytics]);

  // Handle event selection
  const handleEventClick = (event) => {
    console.log('🎯 Dashboard: Event clicked', event);
    if (map && event.location) {
      map.setCenter(event.location);
      map.setZoom(15);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp?.toDate?.() || timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-low';
    }
  };

  if (mapLoading || dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading NextSignal Dashboard..." />
      </div>
    );
  }

  if (mapError || dataError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{mapError || dataError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="modern-btn btn-primary"
          >
            Reload Page
          </button>
        </div>
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
              <div className="flex items-center space-x-6">
                <h1 className="dashboard-title">
                  City Intelligence Dashboard
                </h1>
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <span>Live</span>
                </div>
                {userLocation && (
                  <span className="text-sm text-gray-500">
                    📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Modern Layer Toggle */}
                <div className="layer-toggle">
                  <button
                    onClick={() => setActiveLayer('events')}
                    className={`modern-btn ${
                      activeLayer === 'events' ? 'btn-toggle active' : 'btn-toggle'
                    }`}
                  >
                    Events ({events.length})
                  </button>
                  <button
                    onClick={() => setActiveLayer('reports')}
                    className={`modern-btn ${
                      activeLayer === 'reports' ? 'btn-toggle active' : 'btn-toggle'
                    }`}
                  >
                    Reports ({reports.length})
                  </button>
                </div>
                
                {/* Sidebar Toggle */}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="modern-btn btn-toggle"
                >
                  <span className="material-icons">
                    {showSidebar ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Modern Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="stats-card events">
                <div className="stat-icon">🚨</div>
                <div className="stat-value">{realtimeStats.activeEvents}</div>
                <div className="stat-label">Active Events</div>
              </div>
              
              <div className="stats-card reports">
                <div className="stat-icon">📍</div>
                <div className="stat-value">{realtimeStats.recentReports}</div>
                <div className="stat-label">Recent Reports</div>
              </div>
              
              <div className="stats-card sentiment">
                <div className="stat-icon">😊</div>
                <div className="stat-value">{realtimeStats.avgSentiment}</div>
                <div className="stat-label">Avg Sentiment</div>
              </div>
              
              <div className="stats-card predictions">
                <div className="stat-icon">🔮</div>
                <div className="stat-value">{realtimeStats.predictedIncidents}</div>
                <div className="stat-label">Predictions</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-6 pb-4">
            {/* Modern Map Container */}
            <div className="flex-1 map-container">
              <div ref={mapRef} className="w-full h-full" />
              
              {/* Modern Map Controls */}
              <div className="map-controls">
                <button className="modern-btn btn-toggle">
                  <span className="material-icons">my_location</span>
                </button>
              </div>
            </div>

            {/* Modern Sidebar */}
            {showSidebar && (
              <div className="w-96 sidebar">
                <div className="p-6 space-y-6">
                  
                  {/* AI Insights Panel */}
                  <div className="modern-card">
                    <AIInsightsPanel 
                      location={userLocation || { lat: 12.9716, lng: 77.5946 }} 
                    />
                  </div>
                  
                  {/* Live Events/Reports */}
                  <div className="modern-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {activeLayer === 'events' ? '🔴 Live Events' : '📝 Recent Reports'}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium">
                        {(activeLayer === 'events' ? events : reports).length} total
                      </span>
                    </div>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {(activeLayer === 'events' ? events : reports).slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="list-item"
                          onClick={() => handleEventClick(item)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 flex-1">
                              {item.title}
                            </h4>
                            <span className={`severity-badge ${getSeverityColor(item.severity)} ml-2`}>
                              {item.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">
                              #{item.category}
                            </span>
                            <span className="text-gray-400">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>
                          
                          {activeLayer === 'events' && item.reportCount && (
                            <div className="mt-2 text-xs text-blue-600 font-medium">
                              📊 {item.reportCount} reports synthesized
                            </div>
                          )}
                          
                          {item.aiGenerated && (
                            <div className="mt-2">
                              <span className="ai-badge">
                                🤖 AI Synthesized
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {(activeLayer === 'events' ? events : reports).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">
                            {activeLayer === 'events' ? '🔍' : '📝'}
                          </div>
                          <p className="text-sm">
                            No {activeLayer === 'events' ? 'events' : 'reports'} available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Social Feeds */}
                  {feeds.length > 0 && (
                    <div className="modern-card">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">📡 Live Feeds</h4>
                        <span className="text-xs text-gray-500 font-medium">
                          {feeds.length} sources
                        </span>
                      </div>
                      
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {feeds.slice(0, 5).map((feed) => (
                          <div key={feed.id} className="list-item" style={{ marginBottom: '8px' }}>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {feed.content}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-600 font-medium">
                                {feed.source}
                              </span>
                              <span className="text-gray-400">
                                {formatTimeAgo(feed.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 