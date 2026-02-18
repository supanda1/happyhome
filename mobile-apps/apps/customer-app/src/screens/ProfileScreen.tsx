/**
 * Profile Screen
 * User profile management with settings and account options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Avatar, theme, Loading } from '@household-services/ui-kit';
import { useUserData, usePullToRefresh, RootState } from '@household-services/shared';
import { TabScreenProps } from '../types/navigation';
import navigationService from '../navigation/navigationService';

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  showChevron?: boolean;
  color?: string;
}

export const ProfileScreen: React.FC<TabScreenProps<'Profile'>> = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Get user data from Redux
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Use sync hooks for data management
  const { profile, loading, error, refreshUserData } = useUserData();
  const { refreshing, onRefresh } = usePullToRefresh(['user-profile']);

  // Mock user data for demonstration
  const displayUser = user || profile || {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: null,
    joinedDate: '2024-01-01',
    totalOrders: 12,
    favoriteServices: ['Plumbing', 'Cleaning'],
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refreshUserData()]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: Dispatch logout action
            // dispatch(authActions.logout());
            navigationService.redirectToAuth();
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      subtitle: 'Update your personal details',
      icon: 'account-edit',
      action: () => {
        // TODO: Navigate to edit profile screen
        Alert.alert('Coming Soon', 'Edit profile functionality coming soon!');
      },
      showChevron: true,
    },
    {
      id: 'addresses',
      title: 'Saved Addresses',
      subtitle: 'Manage your delivery addresses',
      icon: 'map-marker-multiple',
      action: () => navigation.navigate('AddressManagement'),
      showChevron: true,
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      icon: 'credit-card',
      action: () => {
        Alert.alert('Coming Soon', 'Payment methods management coming soon!');
      },
      showChevron: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Configure notification preferences',
      icon: 'bell-ring',
      action: () => navigation.navigate('NotificationSettings'),
      showChevron: true,
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      icon: 'cog',
      action: () => navigation.navigate('Settings'),
      showChevron: true,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      icon: 'help-circle',
      action: () => {
        Alert.alert('Help & Support', 'Contact us at support@happyhomes.com or call +1 (555) 123-HELP');
      },
      showChevron: true,
    },
    {
      id: 'about',
      title: 'About Happy Homes',
      subtitle: 'App version and information',
      icon: 'information',
      action: () => {
        Alert.alert(
          'About Happy Homes',
          'Version 1.0.0\n\nProfessional Home Services At Your Doorstep\n\n© 2024 Happy Homes. All rights reserved.'
        );
      },
      showChevron: true,
    },
    {
      id: 'logout',
      title: 'Sign Out',
      icon: 'logout',
      action: handleLogout,
      color: theme.colors.error[500],
      showChevron: false,
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.action}
      style={{
        marginBottom: theme.spacing[3],
      }}
    >
      <Card
        style={{
          padding: theme.spacing[4],
          marginHorizontal: theme.spacing[4],
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          {/* Icon */}
          <View style={{
            backgroundColor: item.color 
              ? `${item.color}15` 
              : theme.colors.gray[100],
            borderRadius: 10,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing[3],
          }}>
            <Icon
              name={item.icon}
              size={20}
              color={item.color || theme.colors.gray[600]}
            />
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text style={[
              theme.typography.body.base,
              {
                fontWeight: '600',
                color: item.color || theme.colors.gray[900],
                marginBottom: item.subtitle ? theme.spacing[1] : 0,
              }
            ]}>
              {item.title}
            </Text>
            
            {item.subtitle && (
              <Text style={[
                theme.typography.body.sm,
                {
                  color: theme.colors.gray[600],
                }
              ]}>
                {item.subtitle}
              </Text>
            )}
          </View>

          {/* Chevron */}
          {item.showChevron && (
            <Icon
              name="chevron-right"
              size={20}
              color={theme.colors.gray[400]}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !displayUser) {
    return <Loading message="Loading profile..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[3],
          backgroundColor: theme.colors.white,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.gray[200],
        }}>
          <Text style={[
            theme.typography.heading.h2,
            {
              color: theme.colors.gray[900],
              marginBottom: theme.spacing[4],
            }
          ]}>
            Profile
          </Text>
        </View>

        {/* User Info Card */}
        <View style={{ marginTop: theme.spacing[4], marginBottom: theme.spacing[6] }}>
          <Card
            style={{
              padding: theme.spacing[6],
              marginHorizontal: theme.spacing[4],
              alignItems: 'center',
            }}
          >
            {/* Avatar */}
            <Avatar
              source={displayUser.avatar ? { uri: displayUser.avatar } : undefined}
              size="xl"
              fallbackText={`${displayUser.firstName?.[0] || 'U'}${displayUser.lastName?.[0] || ''}`}
              style={{ marginBottom: theme.spacing[4] }}
            />

            {/* User Name */}
            <Text style={[
              theme.typography.heading.h3,
              {
                color: theme.colors.gray[900],
                textAlign: 'center',
                marginBottom: theme.spacing[2],
              }
            ]}>
              {displayUser.firstName} {displayUser.lastName}
            </Text>

            {/* Email */}
            <Text style={[
              theme.typography.body.base,
              {
                color: theme.colors.gray[600],
                textAlign: 'center',
                marginBottom: theme.spacing[4],
              }
            ]}>
              {displayUser.email}
            </Text>

            {/* Stats */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
              paddingTop: theme.spacing[4],
              borderTopWidth: 1,
              borderTopColor: theme.colors.gray[200],
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[
                  theme.typography.heading.h4,
                  {
                    color: theme.colors.primary[600],
                    marginBottom: theme.spacing[1],
                  }
                ]}>
                  {displayUser.totalOrders || 0}
                </Text>
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[600] }
                ]}>
                  Total Orders
                </Text>
              </View>

              <View style={{
                width: 1,
                backgroundColor: theme.colors.gray[200],
                marginHorizontal: theme.spacing[4],
              }} />

              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[
                  theme.typography.heading.h4,
                  {
                    color: theme.colors.primary[600],
                    marginBottom: theme.spacing[1],
                  }
                ]}>
                  {displayUser.favoriteServices?.length || 0}
                </Text>
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[600] }
                ]}>
                  Favorite Services
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Menu Items */}
        <View style={{ paddingBottom: theme.spacing[8] }}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* App Version Footer */}
        <View style={{
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
          alignItems: 'center',
        }}>
          <Text style={[
            theme.typography.body.xs,
            {
              color: theme.colors.gray[500],
              textAlign: 'center',
            }
          ]}>
            Happy Homes Customer App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;