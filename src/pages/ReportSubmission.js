import React, { useState, useEffect, useRef } from 'react';
import { useMap } from '../contexts/DemoMapContext';
import { useData } from '../contexts/DemoDataContext';
import { useAuth } from '../contexts/DemoAuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ReportSubmission = () => {
  const { user } = useAuth();
  const {
    isLoaded: mapLoaded,
    loading: mapLoading,
    initializeMapInstance,
    selectedLocation,
    setSelectedLocation,
    userLocation,
    reverseGeocode,
    geocodeAddress
  } = useMap();
  
  const { submitReport } = useData();

  const mapRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [map, setMap] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    severity: 'medium',
    location: null,
    address: ''
  });
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  const categories = [
    { value: 'traffic', label: 'Traffic & Transportation', icon: '🚗' },
    { value: 'safety', label: 'Safety & Security', icon: '🚨' },
    { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
    { value: 'environment', label: 'Environment', icon: '🌱' },
    { value: 'events', label: 'Events & Gatherings', icon: '🎉' },
    { value: 'emergency', label: 'Emergency', icon: '🆘' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'severity-low', description: 'Minor issue, non-urgent' },
    { value: 'medium', label: 'Medium', color: 'severity-medium', description: 'Moderate concern' },
    { value: 'high', label: 'High', color: 'severity-high', description: 'Urgent attention needed' }
  ];

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !map) {
      const mapInstance = initializeMapInstance(mapRef.current);
      setMap(mapInstance);
    }
  }, [mapLoaded, initializeMapInstance, map]);

  // Update location when map selection changes
  useEffect(() => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        location: selectedLocation
      }));
      
      // Reverse geocode to get address
      reverseGeocode(selectedLocation.lat, selectedLocation.lng)
        .then(result => {
          setFormData(prev => ({
            ...prev,
            address: result.address
          }));
        })
        .catch(console.error);
    }
  }, [selectedLocation, reverseGeocode]);

  // Use current location button
  const useCurrentLocation = async () => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      if (map) {
        map.setCenter(userLocation);
        map.setZoom(16);
      }
    } else {
      setErrorMessage('Unable to get your current location. Please select a location on the map.');
    }
  };

  // Handle address search
  const handleAddressSearch = async () => {
    if (!formData.address.trim()) return;
    
    try {
      const location = await geocodeAddress(formData.address);
      setSelectedLocation(location);
      if (map) {
        map.setCenter(location);
        map.setZoom(16);
      }
    } catch (error) {
      setErrorMessage('Address not found. Please try a different address or select location on map.');
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        setErrorMessage(`${file.name} is not a valid image or video file.`);
        return false;
      }
      
      if (!isValidSize) {
        setErrorMessage(`${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreviews(prev => [...prev, {
            id: Math.random().toString(36),
            file,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: e.target.result,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove media file
  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!user) {
      setErrorMessage('You must be signed in to submit a report.');
      return;
    }

    if (!formData.location) {
      setErrorMessage('Please select a location on the map or enter an address.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setErrorMessage('Please provide both a title and description for your report.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        severity: formData.severity,
        type: 'citizen_report',
        location: {
          lat: formData.location.lat,
          lng: formData.location.lng,
          address: formData.address
        }
      };

      await submitReport(reportData, mediaFiles);
      
      setSuccessMessage('Report submitted successfully! Our AI is analyzing your submission.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'infrastructure',
        severity: 'medium',
        location: null,
        address: ''
      });
      setMediaFiles([]);
      setMediaPreviews([]);
      setSelectedLocation(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage(`Failed to submit report: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (mapLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading report submission..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container">
        <div className="h-[calc(100vh-2rem)] flex flex-col">
          
          {/* Modern Header */}
          <div className="dashboard-header">
            <div className="text-center">
              <h1 className="dashboard-title">Submit a Report</h1>
              <p className="text-gray-600 text-lg">
                Help improve your city by reporting issues with photos, videos, and location data
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="modern-card mb-6 border-l-4 border-green-500 bg-green-50">
              <div className="flex items-center space-x-3">
                <span className="material-icons text-green-600">check_circle</span>
                <span className="text-green-800 font-medium">{successMessage}</span>
              </div>
            </div>
          )}
          
          {errorMessage && (
            <div className="modern-card mb-6 border-l-4 border-red-500 bg-red-50">
              <div className="flex items-center space-x-3">
                <span className="material-icons text-red-600">error</span>
                <span className="text-red-800 font-medium">{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="flex-1 flex gap-6 pb-4">
            {/* Form */}
            <div className="flex-1 modern-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(category => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          formData.category === category.value
                            ? 'border-blue-500 bg-blue-50 transform scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-medium text-sm">{category.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Title</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Brief description of the issue..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                    rows="4"
                    placeholder="Provide detailed information about what you observed..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Severity Level</label>
                  <div className="space-y-2">
                    {severityLevels.map(level => (
                      <label
                        key={level.value}
                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          formData.severity === level.value
                            ? 'border-blue-500 bg-blue-50 transform scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={level.value}
                          checked={formData.severity === level.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className={`font-semibold severity-badge ${level.color}`}>
                            {level.label}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {level.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter address or click on map..."
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={handleAddressSearch}
                        className="modern-btn btn-primary"
                      >
                        Search
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      className="modern-btn btn-toggle w-full flex items-center justify-center space-x-2"
                    >
                      <span className="material-icons">my_location</span>
                      <span>Use Current Location</span>
                    </button>

                    {formData.location && (
                      <div className="list-item border-l-4 border-green-500 bg-green-50">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">📍</span>
                          <span className="text-green-800 font-medium">
                            Location selected: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Upload */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Photos & Videos (Optional)</label>
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                    >
                      <span className="material-icons text-gray-400 text-5xl block mb-3">cloud_upload</span>
                      <span className="text-gray-700 font-medium text-lg">Click to select photos or videos</span>
                      <p className="text-sm text-gray-500 mt-2">Max 50MB per file • Supports images and videos</p>
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Media Previews */}
                    {mediaPreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {mediaPreviews.map((preview, index) => (
                          <div key={preview.id} className="relative bg-gray-100 rounded-lg overflow-hidden list-item">
                            {preview.type === 'image' ? (
                              <img
                                src={preview.url}
                                alt={preview.name}
                                className="w-full h-32 object-cover"
                              />
                            ) : (
                              <video
                                src={preview.url}
                                className="w-full h-32 object-cover"
                                controls
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMediaFile(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                              {preview.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !formData.location}
                  className="w-full modern-btn btn-primary flex items-center justify-center space-x-3 py-4 text-lg"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons">send</span>
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map */}
            <div className="w-96 map-container">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Select Location</h3>
                <p className="text-sm text-gray-600 mt-1">Click on the map to mark the location of your report</p>
              </div>
              <div className="h-full min-h-96">
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSubmission; 