import React, { useState } from 'react';
import { useAuth } from '../contexts/DemoAuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    preferences: {
      notifications: {
        email: userProfile?.preferences?.notifications?.email || false,
        push: userProfile?.preferences?.notifications?.push || true,
        sms: userProfile?.preferences?.notifications?.sms || false
      },
      location: {
        shareLocation: userProfile?.preferences?.location?.shareLocation || false,
        defaultRadius: userProfile?.preferences?.location?.defaultRadius || 5000
      }
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error updating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      preferences: userProfile?.preferences || formData.preferences
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Profile Avatar */}
                <div className="relative">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt="Profile"
                      className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {userProfile?.displayName?.charAt(0) || 'D'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Profile Info */}
                <div>
                  <h1 className="dashboard-title">
                    {userProfile?.displayName || 'Demo User'}
                  </h1>
                  <p className="text-gray-600 text-lg">{userProfile?.email || 'demo@nextsignal.com'}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">
                      Member since {new Date(userProfile?.createdAt || '2025-07-24').toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Account Type: {userProfile?.isAnonymous ? 'Guest Account' : 'Registered User'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="modern-btn btn-primary flex items-center space-x-2"
                  >
                    <span className="material-icons">edit</span>
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="modern-btn btn-toggle"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="modern-btn btn-primary flex items-center space-x-2"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-icons">save</span>
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Last Login Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-700">
                <span className="material-icons text-lg">schedule</span>
                <span className="text-sm font-medium">
                  Last Login: {new Date(userProfile?.lastLoginAt || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div className={`modern-card mb-6 border-l-4 ${
              message.includes('Error') 
                ? 'border-red-500 bg-red-50' 
                : 'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-center space-x-3">
                <span className={`material-icons ${
                  message.includes('Error') ? 'text-red-600' : 'text-green-600'
                }`}>
                  {message.includes('Error') ? 'error' : 'check_circle'}
                </span>
                <span className={`font-medium ${
                  message.includes('Error') ? 'text-red-800' : 'text-green-800'
                }`}>
                  {message}
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 flex gap-6 pb-4">
            {/* Profile Information */}
            <div className="flex-1 modern-card">
              <div className="flex items-center space-x-2 mb-6">
                <span className="material-icons text-blue-600">person</span>
                <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Display Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        displayName: e.target.value
                      }))}
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <div className="list-item">
                      <span className="text-gray-800 font-medium">
                        {userProfile?.displayName || 'Demo User'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Email</label>
                  <div className="list-item">
                    <div className="flex items-center space-x-2">
                      <span className="material-icons text-gray-500">email</span>
                      <span className="text-gray-800">{userProfile?.email || 'demo@nextsignal.com'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Account Status</label>
                  <div className="list-item">
                    <div className="flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full ${
                        userProfile?.isAnonymous ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-gray-800 font-medium">
                        {userProfile?.isAnonymous ? 'Guest Account' : 'Verified User'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="w-96 modern-card">
              <div className="flex items-center space-x-2 mb-6">
                <span className="material-icons text-purple-600">settings</span>
                <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>
              </div>

              <div className="space-y-6">
                {/* Notifications */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="material-icons text-orange-600">notifications</span>
                    <h3 className="text-lg font-medium text-gray-700">Notifications</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email notifications', icon: 'email' },
                      { key: 'push', label: 'Push notifications', icon: 'push_pin' },
                      { key: 'sms', label: 'SMS notifications', icon: 'sms' }
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="list-item">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <span className="material-icons text-gray-500">{icon}</span>
                            <span className="text-gray-700 font-medium">{label}</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={formData.preferences.notifications[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  notifications: {
                                    ...prev.preferences.notifications,
                                    [key]: e.target.checked
                                  }
                                }
                              }))}
                              disabled={!isEditing}
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors ${
                              formData.preferences.notifications[key] 
                                ? 'bg-blue-500' 
                                : 'bg-gray-300'
                            }`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ml-1 ${
                                formData.preferences.notifications[key] ? 'translate-x-6' : ''
                              }`}></div>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="material-icons text-green-600">location_on</span>
                    <h3 className="text-lg font-medium text-gray-700">Location</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="list-item">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <span className="material-icons text-gray-500">share_location</span>
                          <span className="text-gray-700 font-medium">Share location for better recommendations</span>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.preferences.location.shareLocation}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                location: {
                                  ...prev.preferences.location,
                                  shareLocation: e.target.checked
                                }
                              }
                            }))}
                            disabled={!isEditing}
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${
                            formData.preferences.location.shareLocation 
                              ? 'bg-blue-500' 
                              : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ml-1 ${
                              formData.preferences.location.shareLocation ? 'translate-x-6' : ''
                            }`}></div>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Default notification radius</label>
                      {isEditing ? (
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.preferences.location.defaultRadius}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              location: {
                                ...prev.preferences.location,
                                defaultRadius: parseInt(e.target.value)
                              }
                            }
                          }))}
                        >
                          <option value={1000}>1 km</option>
                          <option value={2000}>2 km</option>
                          <option value={5000}>5 km</option>
                          <option value={10000}>10 km</option>
                          <option value={20000}>20 km</option>
                        </select>
                      ) : (
                        <div className="list-item">
                          <div className="flex items-center space-x-2">
                            <span className="material-icons text-gray-500">radio_button_checked</span>
                            <span className="text-gray-800 font-medium">
                              {(formData.preferences.location.defaultRadius / 1000).toFixed(1)} km
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="material-icons text-red-600">security</span>
                    <h3 className="text-lg font-medium text-gray-700">Account Actions</h3>
                  </div>
                  
                  <button
                    onClick={logout}
                    className="modern-btn btn-toggle w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50"
                  >
                    <span className="material-icons">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 