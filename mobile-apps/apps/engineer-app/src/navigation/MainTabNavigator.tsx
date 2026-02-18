import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Import main screens (will be created next)
import { DashboardScreen } from '../screens/DashboardScreen';
import { JobsListScreen } from '../screens/jobs/JobsListScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { WorkTrackingScreen } from '../screens/jobs/WorkTrackingScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Additional screens
import { CustomerInfoScreen } from '../screens/jobs/CustomerInfoScreen';
import { NavigationScreen } from '../screens/jobs/NavigationScreen';
import { PhotoCaptureScreen } from '../screens/jobs/PhotoCaptureScreen';
import { CompletionFormScreen } from '../screens/jobs/CompletionFormScreen';
import { IssueReportingScreen } from '../screens/jobs/IssueReportingScreen';

// Settings screens
import { AvailabilitySettingsScreen } from '../screens/settings/AvailabilitySettingsScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import { PaymentSettingsScreen } from '../screens/settings/PaymentSettingsScreen';
import { HelpSupportScreen } from '../screens/settings/HelpSupportScreen';

import { theme } from '../config/theme';

// Navigation types
export type MainTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Schedule: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type JobsStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
  WorkTracking: { jobId: string };
  CustomerInfo: { jobId: string };
  Navigation: { jobId: string; destination: { latitude: number; longitude: number; address: string } };
  PhotoCapture: { jobId: string; type: 'before' | 'after' | 'issue' };
  CompletionForm: { jobId: string };
  IssueReporting: { jobId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  AvailabilitySettings: undefined;
  NotificationSettings: undefined;
  PaymentSettings: undefined;
  HelpSupport: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const JobsStack = createNativeStackNavigator<JobsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Jobs Stack Navigator
const JobsStackNavigator = () => (
  <JobsStack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.text,
      animation: 'slide_from_right',
    }}
  >
    <JobsStack.Screen 
      name="JobsList" 
      component={JobsListScreen}
      options={{ title: 'My Jobs' }}
    />
    <JobsStack.Screen 
      name="JobDetail" 
      component={JobDetailScreen}
      options={{ title: 'Job Details' }}
    />
    <JobsStack.Screen 
      name="WorkTracking" 
      component={WorkTrackingScreen}
      options={{ title: 'Work in Progress' }}
    />
    <JobsStack.Screen 
      name="CustomerInfo" 
      component={CustomerInfoScreen}
      options={{ title: 'Customer Information' }}
    />
    <JobsStack.Screen 
      name="Navigation" 
      component={NavigationScreen}
      options={{ 
        title: 'Navigate to Customer',
        headerShown: false, // Hide header for full-screen map
      }}
    />
    <JobsStack.Screen 
      name="PhotoCapture" 
      component={PhotoCaptureScreen}
      options={{ 
        title: 'Capture Photo',
        headerShown: false, // Hide header for full-screen camera
      }}
    />
    <JobsStack.Screen 
      name="CompletionForm" 
      component={CompletionFormScreen}
      options={{ title: 'Complete Job' }}
    />
    <JobsStack.Screen 
      name="IssueReporting" 
      component={IssueReportingScreen}
      options={{ title: 'Report Issue' }}
    />
  </JobsStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.text,
      animation: 'slide_from_right',
    }}
  >
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <ProfileStack.Screen 
      name="AvailabilitySettings" 
      component={AvailabilitySettingsScreen}
      options={{ title: 'Availability Settings' }}
    />
    <ProfileStack.Screen 
      name="NotificationSettings" 
      component={NotificationSettingsScreen}
      options={{ title: 'Notifications' }}
    />
    <ProfileStack.Screen 
      name="PaymentSettings" 
      component={PaymentSettingsScreen}
      options={{ title: 'Payment Settings' }}
    />
    <ProfileStack.Screen 
      name="HelpSupport" 
      component={HelpSupportScreen}
      options={{ title: 'Help & Support' }}
    />
  </ProfileStack.Navigator>
);

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Jobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Earnings':
              iconName = focused ? 'cash-multiple' : 'cash-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.backdrop,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      
      <Tab.Screen 
        name="Jobs" 
        component={JobsStackNavigator}
        options={{ title: 'Jobs' }}
      />
      
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ title: 'Schedule' }}
      />
      
      <Tab.Screen 
        name="Earnings" 
        component={EarningsScreen}
        options={{ title: 'Earnings' }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;