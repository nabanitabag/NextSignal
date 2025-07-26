import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/DemoAuthContext';
import { useData } from '../../contexts/DemoDataContext';

const NotificationCenter = () => {
  const { user, userProfile } = useAuth();
  const { events } = useData();
  const [notifications, setNotifications] = useState([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to handle both Firestore timestamps and regular Date objects
  const getTimestamp = (timestamp) => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate(); // Firestore Timestamp
    }
    if (timestamp instanceof Date) {
      return timestamp; // Already a Date object
    }
    return new Date(timestamp); // String or number timestamp
  };

  // Initialize demo notifications
  useEffect(() => {
    const initializeDemo = async () => {
      try {
        // Request notification permission for demo
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsPermissionGranted(true);
          console.log('🔔 Demo: Notification permission granted');
        }
        
        // Add some demo notifications
        if (user) {
          const demoNotifications = [
            {
              id: 'demo-notif-1',
              title: '🚦 Traffic Alert',
              body: 'Heavy traffic reported on Main Street',
              timestamp: new Date(Date.now() - 300000), // 5 minutes ago
              read: false,
              type: 'traffic'
            },
            {
              id: 'demo-notif-2', 
              title: '💡 Infrastructure Update',
              body: 'Street light repair completed on 5th Avenue',
              timestamp: new Date(Date.now() - 900000), // 15 minutes ago
              read: true,
              type: 'infrastructure'
            }
          ];
          setNotifications(demoNotifications);
        }
        
      } catch (error) {
        console.error('Error initializing demo notifications:', error);
      }
    };

    if (user) {
      initializeDemo();
    }
  }, [user]);

  // Demo mode - no real-time subscriptions needed

  // Define helper functions first
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isEventInSubscriptionArea = useCallback((event, subscription) => {
    if (!event.location || !subscription.location) return false;
    
    const distance = calculateDistance(
      event.location.lat,
      event.location.lng,
      subscription.location.lat,
      subscription.location.lng
    );
    
    return distance <= (subscription.radius || 5); // Default 5km radius
  }, []);

  const sendIntelligentNotification = useCallback(async (event, subscription) => {
    if (!user?.uid) return;

    try {
      // Create intelligent notification content
      const notificationData = {
        id: `demo-${Date.now()}`,
        title: `⚠️ ${event.category} Alert in ${subscription.name}`,
        body: event.aiSummary || event.description,
        type: 'area_alert',
        severity: event.severity,
        eventId: event.id,
        location: event.location,
        timestamp: new Date(),
        read: false,
        actionable: event.actionableAdvice || null
      };

      // In demo mode, just add to local state
      setNotifications(prev => [notificationData, ...prev]);
      console.log('🔔 Demo: Intelligent notification sent:', notificationData);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [user]);

  // Intelligent notification logic based on user subscriptions
  useEffect(() => {
    if (!userProfile?.areaSubscriptions || !events.length) return;

    const checkForRelevantEvents = () => {
      const recentEvents = events.filter(event => {
        const eventTime = getTimestamp(event.timestamp);
        const timeDiff = Date.now() - eventTime.getTime();
        return timeDiff < 300000; // Last 5 minutes
      });

      recentEvents.forEach(event => {
        userProfile.areaSubscriptions.forEach(subscription => {
          if (isEventInSubscriptionArea(event, subscription)) {
            sendIntelligentNotification(event, subscription);
          }
        });
      });
    };

    checkForRelevantEvents();
  }, [events, userProfile, isEventInSubscriptionArea, sendIntelligentNotification]);

  const markAsRead = async (notificationId) => {
    console.log('🔔 Demo: Marking notification as read:', notificationId);
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = async () => {
    console.log('🔔 Demo: Clearing all notifications');
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="notification-center relative">
      {/* Modern Notification Bell */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="modern-btn btn-toggle p-2 relative"
      >
        <span className="material-icons text-gray-600">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modern Notification Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 z-50">
            <div className="modern-card border border-white/30 shadow-xl max-h-96 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-blue-600">notifications</span>
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {/* Permission Status */}
                {!isPermissionGranted && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="material-icons text-yellow-600 text-sm">warning</span>
                      <span className="text-yellow-800">Enable notifications for real-time alerts</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-6xl mb-3">🔕</div>
                    <h4 className="font-medium text-gray-700 mb-1">No notifications yet</h4>
                    <p className="text-sm text-gray-500">We'll notify you when something happens</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        notification.read ? 'opacity-60' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Read Status Indicator */}
                        <div className={`w-2 h-2 rounded-full mt-3 flex-shrink-0 ${
                          notification.read ? 'bg-gray-300' : 'bg-blue-500'
                        }`} />
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {notification.body}
                          </p>
                          
                          {/* Actionable Advice */}
                          {notification.actionable && (
                            <div className="list-item mb-2 border-l-4 border-blue-500 bg-blue-50">
                              <div className="flex items-center space-x-2">
                                <span className="material-icons text-blue-600 text-sm">lightbulb</span>
                                <p className="text-sm text-blue-700 font-medium">
                                  {notification.actionable}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Timestamp */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {notification.timestamp?.toLocaleString() || 'Just now'}
                            </p>
                            
                            {/* Type Badge */}
                            {notification.type && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                notification.type === 'traffic' ? 'bg-red-100 text-red-700' :
                                notification.type === 'infrastructure' ? 'bg-blue-100 text-blue-700' :
                                notification.type === 'area_alert' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {notification.type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter; 