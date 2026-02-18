# Household Services Mobile Apps

A production-grade React Native monorepo for Household Services platform with separate apps for Engineers and Customers.

## 🏗️ Architecture

This monorepo contains:

- **Engineer App**: Field engineer app for job management and work tracking
- **Customer App**: Customer app for service booking and management  
- **Shared Package**: Common utilities, types, API clients, and Redux store
- **UI Kit Package**: Reusable UI components and design system

## 📱 Apps

### Engineer App
- Job assignment and management
- Real-time location tracking
- Work progress tracking
- Photo documentation
- Earnings dashboard
- Performance analytics

### Customer App  
- Service discovery and booking
- Address management
- Order tracking
- Payment integration
- Review and rating system
- Customer support

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Expo CLI
- Android Studio / Xcode for development

### Installation

1. **Clone and install dependencies**
```bash
cd mobile-apps
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Build shared packages**
```bash
npm run bootstrap
```

4. **Start development servers**

For Engineer App:
```bash
npm run dev:engineer
```

For Customer App:
```bash
npm run dev:customer
```

## 🛠️ Development

### Project Structure
```
mobile-apps/
├── apps/
│   ├── engineer-app/          # Engineer mobile app
│   └── customer-app/          # Customer mobile app
├── packages/
│   ├── shared/                # Shared utilities and services
│   └── ui-kit/               # UI components library
├── package.json              # Workspace configuration
└── README.md
```

### Available Scripts

#### Workspace Level
- `npm run bootstrap` - Install deps and build packages
- `npm run dev:engineer` - Start Engineer app development
- `npm run dev:customer` - Start Customer app development
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run clean` - Clean all build artifacts

#### App Level (run from app directory)
- `npm start` - Start Expo development server
- `npm run ios` - Build and run on iOS simulator
- `npm run android` - Build and run on Android emulator
- `npm run build:release` - Create production build
- `npm run test:e2e` - Run E2E tests with Detox

### Environment Configuration

Create `.env` files for different environments:

- `.env` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

Key environment variables:
```bash
EXPO_PUBLIC_API_URL=your_backend_api_url
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
EXPO_PUBLIC_FIREBASE_CONFIG=your_firebase_config
```

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# Build test app
npm run test:e2e:build

# Run E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Development Builds
```bash
# Engineer app
cd apps/engineer-app
eas build --profile development --platform all

# Customer app  
cd apps/customer-app
eas build --profile development --platform all
```

### Production Builds
```bash
# Engineer app production
npm run build:release:engineer

# Customer app production
npm run build:release:customer
```

### Over-the-Air Updates
```bash
# Staging updates
npm run deploy:engineer:staging
npm run deploy:customer:staging

# Production updates
npm run deploy:engineer:prod
npm run deploy:customer:prod
```

## 🏗️ Build Configuration

### iOS Configuration
- Bundle ID: `com.householdservices.engineer` / `com.householdservices.customer`
- Minimum iOS version: 12.0
- Required permissions: Location, Camera, Photos

### Android Configuration  
- Package name: `com.householdservices.engineer` / `com.householdservices.customer`
- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)

## 🔧 Tech Stack

### Core
- **React Native** 0.73.2
- **Expo** ~50.0.0
- **TypeScript** 5.3.2

### State Management
- **Redux Toolkit** 2.0.1
- **RTK Query** for API calls
- **Redux Persist** for offline storage

### Navigation
- **React Navigation** 6.x
- Native stack navigation
- Bottom tabs, Drawer navigation

### UI/UX
- **React Native Paper** 5.x
- **React Native Vector Icons**
- **React Native SVG**
- **React Native Reanimated** 3.x

### Development Tools
- **ESLint** + **Prettier**
- **Husky** for Git hooks
- **Jest** for testing
- **Detox** for E2E testing

## 📊 Performance Optimization

### Bundle Optimization
- Code splitting by features
- Dynamic imports for heavy screens
- Tree shaking for unused code
- Image optimization and caching

### Runtime Performance
- Memoization with React.memo
- FlatList for large datasets
- Image lazy loading
- Background task optimization

## 🔒 Security

### Authentication
- JWT token-based auth
- Biometric authentication support
- Secure token storage with Keychain

### Data Protection
- API request/response encryption
- Sensitive data encryption
- Certificate pinning
- Secure storage for credentials

## 📱 Platform Features

### Native Integrations
- Push notifications (Firebase)
- Location services
- Camera and photo gallery
- Maps integration
- Biometric authentication
- Background location tracking (Engineer app)

## 🚨 Error Handling

### Global Error Boundary
- Crash reporting integration
- User-friendly error screens
- Automatic error logging

### API Error Handling
- Retry mechanisms
- Offline support
- Network error handling
- Timeout management

## 📈 Analytics & Monitoring

### Analytics Integration
- Custom event tracking
- User behavior analysis
- Performance monitoring
- Crash reporting

### Performance Monitoring
- App launch time tracking
- Screen load performance
- API response times
- Memory usage monitoring

## 🌍 Internationalization

### Multi-language Support
- i18n integration ready
- RTL language support
- Dynamic language switching
- Locale-specific formatting

## 🔄 CI/CD Pipeline

### GitHub Actions / GitLab CI
- Automated testing
- Code quality checks
- Automated builds
- Deployment automation

### Quality Gates
- Unit test coverage > 80%
- E2E test passing
- No ESLint errors
- Security vulnerability scan

## 📚 Documentation

### Additional Resources
- [API Integration Guide](./docs/API_INTEGRATION.md)
- [Component Library](./docs/UI_COMPONENTS.md)
- [State Management](./docs/STATE_MANAGEMENT.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Contributing

1. Create feature branch from `main`
2. Follow coding standards (ESLint + Prettier)
3. Write tests for new features
4. Ensure all tests pass
5. Create pull request with description

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For technical support:
- Email: dev-team@householdservices.com
- Slack: #mobile-dev-support
- Documentation: https://docs.householdservices.com/mobile