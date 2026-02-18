import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HH Customer',
  slug: 'household-services-customer',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.householdservices.customer',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app needs location access to find nearby services.',
      NSCameraUsageDescription: 'This app needs camera access to take photos for service requests.',
      NSPhotoLibraryUsageDescription: 'This app needs photo library access to upload images.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.householdservices.customer',
    versionCode: 1,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'VIBRATE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'webpack',
  },
  plugins: [
    'expo-location',
    'expo-camera',
    'expo-image-picker',
    'expo-font',
  ],
  scheme: 'household-customer',
  extra: {
    eas: { projectId: 'your-eas-project-id-customer' },
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001/api',
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  },
});