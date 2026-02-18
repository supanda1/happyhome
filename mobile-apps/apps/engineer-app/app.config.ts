import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HH Engineer',
  slug: 'household-services-engineer',
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
    bundleIdentifier: 'com.householdservices.engineer',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app needs location access to show nearby jobs and track work progress.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs location access to show nearby jobs and track work progress.',
      NSCameraUsageDescription: 'This app needs camera access to take photos of completed work.',
      NSPhotoLibraryUsageDescription: 'This app needs photo library access to upload work images.',
      NSMicrophoneUsageDescription: 'This app may need microphone access for voice notes.',
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.householdservices.engineer',
    versionCode: 1,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECORD_AUDIO',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'webpack',
  },
  plugins: [
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ffffff',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location for job tracking.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera for taking work photos.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow $(PRODUCT_NAME) to access your photos for uploading work images.',
      },
    ],
    'expo-font',
  ],
  scheme: 'household-engineer',
  extra: {
    eas: {
      projectId: 'your-eas-project-id-engineer',
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  },
  updates: {
    url: 'https://u.expo.dev/your-eas-project-id-engineer',
    enabled: true,
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
});