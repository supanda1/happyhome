# 🧪 Engineer App Testing Guide

## 🚀 Setup & Launch

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed (`npm install -g @expo/cli`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- Physical device with Expo Go app (optional)

### Launch Commands
```bash
# Navigate to engineer app directory
cd /Users/sunilkumarpanda/Desktop/AI/claude/household-services/mobile-apps/apps/engineer-app

# Start development server
npm run start

# Launch on specific platforms
npm run start:ios     # iOS Simulator
npm run start:android # Android Emulator
npm run preview       # Expo Go with tunnel
```

## 📱 Manual Testing Checklist

### ✅ Core Navigation
- [ ] App launches without crashes
- [ ] Bottom tabs work: Dashboard, Jobs, Schedule, Earnings, Profile
- [ ] Screen transitions are smooth
- [ ] Header navigation and back buttons function

### ✅ Authentication Flow
- [ ] Login screen validates employee ID and password
- [ ] Registration form with multi-step flow
- [ ] Skills setup screen with checkboxes
- [ ] Form validation and error messages
- [ ] Loading states during authentication

### ✅ Dashboard Screen
- [ ] Welcome message with engineer name
- [ ] Today's jobs count and earnings display
- [ ] Quick stats cards (Active Jobs, Completion Rate, Rating)
- [ ] Recent jobs list with job cards
- [ ] Quick action buttons (View Schedule, Start Job, etc.)
- [ ] Availability toggle switch

### ✅ Jobs Management
#### Jobs List Screen
- [ ] Filter tabs (All, Available, Active, Completed)
- [ ] Job cards with status indicators
- [ ] Job acceptance/decline actions
- [ ] Navigation to job details

#### Job Detail Screen
- [ ] Complete job information display
- [ ] Customer details and contact options
- [ ] Service requirements and notes
- [ ] Action buttons (Accept, Start, Navigate, etc.)
- [ ] Photo galleries (before/after)

#### Work Tracking Screen
- [ ] Real-time timer functionality
- [ ] Start/pause/stop work controls
- [ ] Progress bar updates
- [ ] Session history tracking
- [ ] Break management modal

#### Customer Info Screen
- [ ] Customer profile and rating display
- [ ] Contact methods (call, text, email)
- [ ] Address with navigation button
- [ ] Special instructions and notes
- [ ] Pet info and allergies alerts
- [ ] Emergency contact options

#### Photo Capture Screen
- [ ] Camera interface (simulated)
- [ ] Photo type selection (before/after/issue)
- [ ] Gallery integration
- [ ] Photo annotation and notes
- [ ] Flash and camera controls

#### Navigation Screen
- [ ] Map display with markers
- [ ] Route planning interface
- [ ] Navigation app integration (Apple Maps, Google Maps, Waze)
- [ ] Arrival confirmation
- [ ] Current location tracking

#### Completion Form Screen
- [ ] Work description text area
- [ ] Time tracking summary
- [ ] Materials used tracking
- [ ] Photo requirements
- [ ] Customer signature capture
- [ ] Job completion submission

#### Issue Reporting Screen
- [ ] Issue category selection
- [ ] Severity level indicators
- [ ] Detailed description form
- [ ] Photo documentation
- [ ] Emergency reporting options

### ✅ Schedule Screen
- [ ] Monthly calendar view
- [ ] Job scheduling interface
- [ ] Date selection functionality
- [ ] Daily job summaries
- [ ] Availability indicators
- [ ] Weekly statistics

### ✅ Earnings Screen
- [ ] Total earnings display
- [ ] Charts rendering (Line and Pie charts)
- [ ] Payment period selection (Week/Month/Year)
- [ ] Transaction history list
- [ ] Earnings breakdown by service type
- [ ] Withdrawal button functionality

### ✅ Profile & Settings
#### Profile Screen
- [ ] Engineer information display
- [ ] Profile photo and ratings
- [ ] Skills and certifications
- [ ] Statistics overview
- [ ] Settings navigation menu
- [ ] Sign out functionality

#### Availability Settings
- [ ] Overall availability toggle
- [ ] Weekly schedule configuration
- [ ] Time slot management
- [ ] Job limits and break settings
- [ ] Service radius configuration
- [ ] Emergency availability options

#### Notification Settings
- [ ] Notification categories
- [ ] Toggle switches for each type
- [ ] Quiet hours configuration
- [ ] Sound and vibration preferences
- [ ] Test notification button

#### Payment Settings
- [ ] Current balance display
- [ ] Bank account management
- [ ] Add/remove bank accounts
- [ ] Automatic withdrawal settings
- [ ] Instant pay configuration
- [ ] Tax information display
- [ ] Document downloads

#### Help & Support
- [ ] Emergency contacts with call functionality
- [ ] Support contact options
- [ ] FAQ sections with expandable items
- [ ] Support ticket creation
- [ ] Resource links
- [ ] App version information

## 🔧 Device Feature Testing

### Camera Integration
```javascript
// Test photo capture functionality
1. Navigate to any job detail
2. Tap "Take Photos"
3. Test camera interface (simulated)
4. Verify photo saving and annotation
5. Check gallery integration
```

### GPS/Navigation
```javascript
// Test navigation features
1. Open Customer Info screen
2. Tap "Navigate to Address"
3. Verify map display
4. Test navigation app options
5. Check arrival confirmation
```

### Phone Integration
```javascript
// Test communication features
1. Navigate to Customer Info
2. Test call button functionality
3. Test SMS/text integration
4. Test email functionality
5. Verify contact preferences
```

## 🧪 Automated Testing

### Run Unit Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage Areas
- [ ] Screen component rendering
- [ ] Navigation integration
- [ ] State management (Redux)
- [ ] Form validation logic
- [ ] API service mocking
- [ ] Error handling

### E2E Testing (Optional)
```bash
# Build for testing
npm run test:e2e:build

# Run E2E tests
npm run test:e2e:ios      # iOS
npm run test:e2e:android  # Android
```

## 🐛 Common Issues & Solutions

### Build/Compilation Issues
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules
npm install --legacy-peer-deps

# Fix Expo installation
npx expo install --fix
```

### Missing Dependencies
```bash
# Install chart libraries
npm install react-native-chart-kit react-native-svg

# Install calendar
npm install react-native-calendars

# Install camera (Expo managed)
npx expo install expo-camera expo-image-picker

# Install maps
npm install react-native-maps
```

### Performance Issues
- Check for memory leaks in timer components
- Verify image optimization in photo components
- Monitor network requests and caching
- Test on lower-end devices

## 📊 Testing Metrics

### Performance Benchmarks
- [ ] App launch time < 3 seconds
- [ ] Screen transitions < 300ms
- [ ] Image loading < 2 seconds
- [ ] Form submissions < 1 second
- [ ] Navigation responsiveness

### User Experience Testing
- [ ] Intuitive navigation flow
- [ ] Clear visual feedback
- [ ] Proper loading states
- [ ] Error message clarity
- [ ] Accessibility compliance

## 🚀 Production Readiness Checklist

- [ ] All screens render without errors
- [ ] Navigation flows work completely
- [ ] Forms validate properly
- [ ] Device features integrate correctly
- [ ] Error handling works appropriately
- [ ] Performance meets benchmarks
- [ ] UI/UX follows design system
- [ ] Accessibility requirements met
- [ ] Security best practices implemented
- [ ] Backend integration ready

## 📝 Bug Reporting Template

When reporting bugs, include:

```
**Bug Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Navigate to...
2. Tap on...
3. Enter...
4. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Device Info:**
- Platform: iOS/Android
- Version: 
- Device: 
- App Version:

**Screenshots/Videos:**
[Attach relevant media]
```

---

**Happy Testing! 🧪✨**

The Engineer App is ready for comprehensive testing. Start with the basic navigation and work through each feature systematically to ensure everything functions correctly for field engineers.