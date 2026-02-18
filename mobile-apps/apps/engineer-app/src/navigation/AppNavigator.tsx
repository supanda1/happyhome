import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

// Import navigators
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingScreen } from '../components/common/LoadingScreen';

// Import types
import type { RootState } from '../store';

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => {
  // Check authentication status from shared auth state
  const isAuthenticated = useSelector((state: RootState) => 
    state.auth?.isAuthenticated || false
  );
  
  const isLoading = useSelector((state: RootState) => 
    state.auth?.isLoading || false
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;