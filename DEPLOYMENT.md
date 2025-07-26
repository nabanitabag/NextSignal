# 🚀 NextSignal Deployment Guide

This guide will help you deploy NextSignal to Firebase Hosting for production use.

## Prerequisites

### 1. Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable the following services:
   - **Firestore Database**
   - **Firebase Storage** 
   - **Firebase Authentication**
   - **Firebase Hosting**
   - **Firebase Functions**
   - **Firebase Cloud Messaging**

### 3. API Keys Setup

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Create API key and restrict to your domain
4. Add HTTP referrers: `https://your-domain.com/*`

#### Gemini AI API
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create API key for Gemini Pro
3. Note: Keep this key secure

#### Firebase Cloud Messaging VAPID Key
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Generate Web Push certificate pair
3. Copy the VAPID key

## Environment Configuration

### 1. Update .env.local
```bash
# Firebase Configuration (from Firebase Console → Project Settings)
REACT_APP_FIREBASE_API_KEY=your_actual_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Gemini AI API Key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key

# Firebase Cloud Messaging VAPID Key
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key

# Development Settings
REACT_APP_USE_FIREBASE_EMULATOR=false
```

### 2. Update Firebase Service Worker
Edit `public/firebase-messaging-sw.js` with your Firebase configuration:

```javascript
firebase.initializeApp({
  apiKey: "your_actual_firebase_api_key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
});
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)
```bash
# Run the deployment script
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Build React app
npm run build

# 3. Deploy Functions
firebase deploy --only functions

# 4. Deploy Firestore rules and indexes
firebase deploy --only firestore

# 5. Deploy Storage rules  
firebase deploy --only storage

# 6. Deploy to Hosting
firebase deploy --only hosting
```

## Post-Deployment Setup

### 1. Configure Authentication
1. Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider
3. Add your domain to authorized domains

### 2. Test Core Features
- [ ] User authentication (Google Sign-In)
- [ ] Report submission with media upload
- [ ] Real-time map updates
- [ ] AI analysis (media → events)
- [ ] Notification system
- [ ] Analytics dashboard

### 3. Monitoring Setup
1. Firebase Console → Analytics
2. Set up performance monitoring
3. Configure crash reporting

## Domain Configuration

### 1. Custom Domain (Optional)
```bash
# Add custom domain
firebase hosting:channel:deploy production --only hosting
```

### 2. SSL Certificate
Firebase Hosting automatically provisions SSL certificates for custom domains.

## Security Checklist

- [ ] API keys are environment-specific
- [ ] Firestore security rules are properly configured
- [ ] Storage rules restrict unauthorized access
- [ ] Google Maps API is domain-restricted
- [ ] FCM VAPID key is secure

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Function Deployment Errors
```bash
# Check Functions logs
firebase functions:log

# Deploy individual function
firebase deploy --only functions:functionName
```

#### 3. API Key Issues
- Verify API keys in Firebase Console
- Check API restrictions and quotas
- Ensure domains are whitelisted

#### 4. Notification Issues
- Verify VAPID key configuration
- Check browser notification permissions
- Test with Firebase Console messaging

### Performance Optimization

#### 1. Enable Compression
Firebase Hosting automatically enables gzip compression.

#### 2. CDN Configuration
Firebase Hosting uses Google's global CDN automatically.

#### 3. Caching Strategy
```json
// firebase.json hosting section
{
  "headers": [
    {
      "source": "**/*.@(js|css)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000"
        }
      ]
    }
  ]
}
```

## Monitoring & Analytics

### 1. Firebase Analytics
- User engagement metrics
- App performance data
- Real-time user activity

### 2. Function Monitoring
```bash
# View function logs
firebase functions:log

# Monitor function performance
firebase functions:config:get
```

### 3. Error Tracking
Set up error monitoring for production issues:
- Function execution errors
- Client-side JavaScript errors
- API integration failures

## Scaling Considerations

### 1. Firestore Limits
- 10,000 writes/second per project
- 1MB document size limit
- Consider data partitioning for high volume

### 2. Cloud Functions
- 540 seconds max execution time
- Consider background functions for heavy processing
- Monitor cold starts

### 3. Storage Limits
- 5GB free tier
- Consider cleanup policies for old media files

## Support

For deployment issues:
1. Check Firebase Status: https://status.firebase.google.com/
2. Firebase Documentation: https://firebase.google.com/docs
3. Community Support: https://stackoverflow.com/questions/tagged/firebase

---

**🎉 Congratulations!** Your NextSignal app should now be live and ready to provide intelligent city insights! 