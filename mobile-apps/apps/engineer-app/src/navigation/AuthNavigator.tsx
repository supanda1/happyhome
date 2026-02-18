import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import auth screens (will be created next)
import { EngineerLoginScreen } from '../screens/auth/EngineerLoginScreen';
import { EngineerRegistrationScreen } from '../screens/auth/EngineerRegistrationScreen';
import { SkillsSetupScreen } from '../screens/auth/SkillsSetupScreen';

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  SkillsSetup: { engineerId: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={EngineerLoginScreen}
        options={{
          title: 'Engineer Login',
        }}
      />
      
      <Stack.Screen 
        name="Register" 
        component={EngineerRegistrationScreen}
        options={{
          title: 'Join as Engineer',
        }}
      />
      
      <Stack.Screen 
        name="SkillsSetup" 
        component={SkillsSetupScreen}
        options={{
          title: 'Setup Your Profile',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;