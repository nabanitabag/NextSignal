# NextSignal - Agentic City Intelligence Application

🏙️ **NextSignal** is an advanced city intelligence platform that provides a live, synthesized, and intelligent view of urban environments using AI-powered data fusion and real-time analytics.

![NextSignal Dashboard](./img.png)

## 🌟 Features

### 🤖 **AI-Powered Intelligence**
- **Gemini Multimodal Analysis**: Automatically analyzes uploaded photos/videos for city issues
- **Data Fusion Engine**: Synthesizes multiple reports into coherent summaries 
- **Predictive Analytics**: Uses AI to predict potential city issues before they escalate
- **Sentiment Analysis**: Creates mood maps from citizen feedback using Google Cloud Natural Language

### 📱 **Citizen Engagement**
- **Multimodal Reporting**: Submit reports with photos, videos, and geo-location
- **Real-time Dashboard**: Live map showing synthesized city events
- **Smart Notifications**: Area-based intelligent alert system
- **Anonymous & Authenticated**: Support for both guest and registered users

### 🗺️ **Advanced Mapping**
- **Google Maps Integration**: Interactive real-time city visualization
- **Heat Maps**: Visualize issue density and sentiment patterns
- **Predictive Overlays**: Show predicted problem areas
- **Location Intelligence**: Automatic geocoding and reverse geocoding

## 🏗️ **Tech Stack**

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Firebase Studio + Google Maps JS SDK |
| **Backend** | Firebase Cloud Functions, Node.js |
| **AI & Analytics** | Gemini Multimodal API, Google Cloud Natural Language |
| **Database** | Firestore (Real-time) |
| **Storage** | Firebase Storage |
| **Messaging** | Firebase Cloud Messaging |
| **Hosting** | Firebase Hosting |
| **Data Processing** | Google Cloud Pub/Sub |

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v18 or later)
- Firebase CLI
- Google Cloud Project with enabled APIs

### 1. Clone Repository
```bash
git clone https://github.com/nabanitabag/nextsignal.git
cd nextsignal
```

### 2. Install Dependencies
```bash
npm install
cd functions && npm install && cd ..
```

### 3. Environment Setup
```bash
cp env.example .env.local
```

Edit `.env.local` with your API keys:
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Gemini AI API Key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore,storage
```

### 5. Run Development Server
```bash
npm start
```
Your app will be available at `http://localhost:3000`

### 6. Stop Development Server
# Kill all react-scripts processes
pkill -f "react-scripts start"

# Or kill specific process on port 3000
lsof -ti:3000 | xargs kill -9

## 📦 **Deployment**

### Quick Deployment
```bash
# Automated deployment script
./deploy.sh
```

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

### Production Configuration
1. Update `.env.local` with production API keys
2. Configure domains in Google Maps API restrictions
3. Set up Firebase Cloud Messaging VAPID key
4. Enable Firebase Analytics

📋 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🔑 **API Keys Setup**

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API, Places API, Geocoding API
3. Create credentials → API Key
4. Restrict to your domains

### Firebase Project
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, Storage, Functions
3. Copy config from Project Settings

### Gemini AI
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enable in Google Cloud Console

### Google Cloud Natural Language
1. Enable Cloud Natural Language API in Google Cloud Console
2. Create service account key (for Functions)

## 🚀 **Deployment**

### Production Deployment to Firebase

1. **Build the application:**
```bash
npm run build
```

2. **Deploy Cloud Functions:**
```bash
cd functions
firebase deploy --only functions
```

3. **Deploy to Firebase Hosting:**
```bash
firebase deploy --only hosting
```

4. **Full deployment:**
```bash
npm run deploy
```

### Environment Configuration for Production

Set Firebase Functions configuration:
```bash
firebase functions:config:set gemini.api_key="your_gemini_api_key"
firebase functions:config:set google.project_id="your_project_id"
```

## 📊 **Key Components**

### Frontend Architecture
```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── dashboard/       # AI Insights Panel
│   └── layout/          # Navigation and layout
├── contexts/            # React Context providers
│   ├── AuthContext.js   # User authentication
│   ├── DataContext.js   # Real-time data management
│   └── MapContext.js    # Google Maps integration
├── pages/               # Main application pages
└── config/              # Firebase configuration
```

### Backend Functions
```
functions/
└── index.js             # All Cloud Functions
    ├── analyzeMedia     # Gemini vision analysis
    ├── synthesizeReports # Data fusion engine
    ├── generatePredictions # Predictive analytics
    └── analyzeSentiment # Mood mapping
```

## 🔧 **Core Features Deep Dive**

### 1. **Multimodal AI Analysis**
- Upload photos/videos of city issues
- Gemini Vision API automatically categorizes and describes problems
- Extracts severity, impact, and recommendations
- Supports real-time analysis with confidence scoring

### 2. **Data Fusion Engine**
- Groups similar reports by location and content
- AI-powered synthesis using Gemini Pro
- Eliminates duplicate information
- Creates actionable event summaries

### 3. **Predictive Analytics**
- Analyzes historical patterns
- Identifies potential problem areas
- Time-based risk assessment
- Preventive action recommendations

### 4. **Sentiment Mapping**
- Real-time mood analysis using Google Cloud Natural Language
- Geographical sentiment visualization
- Citizen satisfaction tracking
- Public mood trends

## 🛡️ **Security & Privacy**

- **Authentication**: Firebase Auth with Google Sign-in + Anonymous mode
- **Data Security**: Firestore security rules with user-based access
- **File Security**: Storage rules with size and type validation
- **API Security**: Cloud Functions with authentication checks
- **Privacy**: Optional location sharing with user consent

## 📈 **Analytics & Monitoring**

### Real-time Metrics
- Active events count
- Report submission rates
- AI analysis success rates
- User engagement patterns

### AI Performance
- Prediction accuracy tracking
- Sentiment analysis confidence
- Data fusion effectiveness
- Response time monitoring

## 🧪 **Testing**

```bash
# Run tests
npm test

# Run Firebase emulators
firebase emulators:start

# Test functions locally
npm run functions:serve
```

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

- 🧠 **AI Innovation**: Advanced Gemini multimodal integration
- 🌐 **Real-time Intelligence**: Live city monitoring and prediction

## 📞 **Support**

For support and questions:
- 📧 Email: nabanita.m.bag@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/nabanitabag/nextsignal/issues)
- 📖 Documentation: [Wiki](https://github.com/nabanitabag/nextsignal/wiki)

---

**NextSignal** - Transforming cities through intelligent data fusion and AI-powered insights. 🚀
