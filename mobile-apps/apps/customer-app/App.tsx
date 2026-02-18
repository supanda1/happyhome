/**
 * Happy Homes Customer App
 * Main entry point with Redux, navigation, and provider setup
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Redux Store from shared package
import { store, persistor } from '@household-services/shared';

// Theme from UI Kit
import { theme } from '@household-services/ui-kit';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

// Toast configuration for Happy Homes branding
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: theme.colors.success[500],
        backgroundColor: theme.colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.gray[900],
      }}
      text2Style={{
        fontSize: 14,
        color: theme.colors.gray[600],
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: theme.colors.error[500],
        backgroundColor: theme.colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.error[600],
      }}
      text2Style={{
        fontSize: 14,
        color: theme.colors.gray[600],
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: theme.colors.primary[500],
        backgroundColor: theme.colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.gray[900],
      }}
      text2Style={{
        fontSize: 14,
        color: theme.colors.gray[600],
      }}
    />
  ),
};

// Loading component for PersistGate
const LoadingScreen: React.FC = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
  }}>
    <ActivityIndicator 
      size="large" 
      color={theme.colors.white}
    />
  </View>
);

// Paper Provider theme
const paperTheme = {
  colors: {
    primary: theme.colors.primary[500],
    accent: theme.colors.secondary[500],
    background: theme.colors.background.primary,
    surface: theme.colors.white,
    text: theme.colors.gray[900],
    onSurface: theme.colors.gray[700],
    disabled: theme.colors.gray[400],
    placeholder: theme.colors.gray[500],
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: theme.colors.red[500],
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <PaperProvider theme={paperTheme}>
                <StatusBar style="light" backgroundColor={theme.colors.primary[500]} />
                <AppNavigator />
                <Toast config={toastConfig} />
              </PaperProvider>
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}