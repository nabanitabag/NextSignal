#!/bin/bash

# NextSignal Production Deployment Script
echo "🚀 Starting NextSignal deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
print_status "Checking deployment prerequisites..."

if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found!"
    echo "Please create .env.local with your Firebase configuration"
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found!"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Login check
print_status "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged into Firebase CLI"
    print_status "Please login to Firebase..."
    firebase login
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Install functions dependencies
print_status "Installing Functions dependencies..."
cd functions
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install Functions dependencies"
    exit 1
fi
cd ..

# Build the React app
print_status "Building React application for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build React app"
    exit 1
fi

# Deploy Functions first
print_status "Deploying Firebase Functions..."
firebase deploy --only functions
if [ $? -ne 0 ]; then
    print_error "Failed to deploy Functions"
    exit 1
fi

# Deploy Firestore rules and indexes
print_status "Deploying Firestore rules and indexes..."
firebase deploy --only firestore
if [ $? -ne 0 ]; then
    print_error "Failed to deploy Firestore configuration"
    exit 1
fi

# Deploy Storage rules
print_status "Deploying Storage rules..."
firebase deploy --only storage
if [ $? -ne 0 ]; then
    print_error "Failed to deploy Storage rules"
    exit 1
fi

# Deploy to Firebase Hosting
print_status "Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    print_error "Failed to deploy to Hosting"
    exit 1
fi

# Get the hosting URL
HOSTING_URL=$(firebase hosting:channel:list 2>/dev/null | grep "live" | awk '{print $4}' | head -1)
if [ -z "$HOSTING_URL" ]; then
    HOSTING_URL="https://your-project.web.app"
fi

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📱 Your NextSignal app is live at:"
echo "   $HOSTING_URL"
echo ""
echo "🔧 Next steps:"
echo "   1. Update your .env.local with production API keys"
echo "   2. Configure your Google Maps API key for production domain"
echo "   3. Set up your Gemini AI API key"
echo "   4. Generate Firebase Cloud Messaging VAPID key"
echo "   5. Test the notification system"
echo ""
echo "📚 Documentation: Check README.md for detailed setup"
echo ""
print_success "Deployment script completed!" 