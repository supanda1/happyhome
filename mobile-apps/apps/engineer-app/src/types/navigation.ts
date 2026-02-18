import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Root Navigation Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  SkillsSetup: { engineerId: string };
};

// Main Tab Types
export type MainTabParamList = {
  Dashboard: undefined;
  Jobs: NavigatorScreenParams<JobsStackParamList>;
  Schedule: undefined;
  Earnings: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Jobs Stack Types
export type JobsStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
  WorkTracking: { jobId: string };
  CustomerInfo: { jobId: string };
  Navigation: { 
    jobId: string; 
    destination: { 
      latitude: number; 
      longitude: number; 
      address: string; 
    }; 
  };
  PhotoCapture: { 
    jobId: string; 
    type: 'before' | 'after' | 'issue'; 
    description?: string;
  };
  CompletionForm: { jobId: string };
  IssueReporting: { jobId: string };
};

// Profile Stack Types
export type ProfileStackParamList = {
  ProfileMain: undefined;
  AvailabilitySettings: undefined;
  NotificationSettings: undefined;
  PaymentSettings: undefined;
  HelpSupport: undefined;
};

// Navigation Props Types
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export type JobsNavigationProp = NativeStackNavigationProp<JobsStackParamList>;

export type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

// Screen-specific Navigation Props
export type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export type JobsListNavigationProp = NativeStackNavigationProp<JobsStackParamList, 'JobsList'>;

export type JobDetailNavigationProp = NativeStackNavigationProp<JobsStackParamList, 'JobDetail'>;

export type WorkTrackingNavigationProp = NativeStackNavigationProp<JobsStackParamList, 'WorkTracking'>;

export type ScheduleNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Schedule'>;

export type EarningsNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Earnings'>;

export type ProfileMainNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

// Route Props Types (for accessing params in screens)
export type JobDetailRouteProp = {
  key: string;
  name: 'JobDetail';
  params: JobsStackParamList['JobDetail'];
};

export type WorkTrackingRouteProp = {
  key: string;
  name: 'WorkTracking';
  params: JobsStackParamList['WorkTracking'];
};

export type NavigationRouteProp = {
  key: string;
  name: 'Navigation';
  params: JobsStackParamList['Navigation'];
};

export type PhotoCaptureRouteProp = {
  key: string;
  name: 'PhotoCapture';
  params: JobsStackParamList['PhotoCapture'];
};

// Combined Navigation & Route Props (for useNavigation and useRoute hooks)
export type NavigationProps<T extends keyof JobsStackParamList> = {
  navigation: NativeStackNavigationProp<JobsStackParamList, T>;
  route: {
    key: string;
    name: T;
    params: JobsStackParamList[T];
  };
};

// Utility types for navigation actions
export interface NavigateToJobDetail {
  screen: 'JobDetail';
  params: { jobId: string };
}

export interface NavigateToWorkTracking {
  screen: 'WorkTracking';
  params: { jobId: string };
}

export interface NavigateToCustomerInfo {
  screen: 'CustomerInfo';
  params: { jobId: string };
}

export interface NavigateToNavigation {
  screen: 'Navigation';
  params: JobsStackParamList['Navigation'];
}

export interface NavigateToPhotoCapture {
  screen: 'PhotoCapture';
  params: JobsStackParamList['PhotoCapture'];
}

export interface NavigateToCompletionForm {
  screen: 'CompletionForm';
  params: { jobId: string };
}

export interface NavigateToIssueReporting {
  screen: 'IssueReporting';
  params: { jobId: string };
}

// Navigation actions union type
export type JobsNavigationAction = 
  | NavigateToJobDetail 
  | NavigateToWorkTracking 
  | NavigateToCustomerInfo 
  | NavigateToNavigation 
  | NavigateToPhotoCapture 
  | NavigateToCompletionForm 
  | NavigateToIssueReporting;