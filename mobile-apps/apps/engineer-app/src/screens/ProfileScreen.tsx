import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../config/theme';
import type { RootState } from '../store';

interface ProfileStats {
  totalJobs: number;
  rating: number;
  totalEarnings: number;
  completionRate: number;
}

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const [isAvailable, setIsAvailable] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock data - replace with real data from store
  const engineerProfile = {
    id: '1',
    name: 'John Martinez',
    email: 'john.martinez@happyhomes.com',
    phone: '+1 (555) 123-4567',
    profileImage: 'https://via.placeholder.com/100x100.png?text=JM',
    joinedDate: '2023-06-15',
    location: 'San Francisco, CA',
    skills: ['Plumbing', 'Electrical', 'Cleaning', 'HVAC'],
    certifications: ['Licensed Plumber', 'Electrical Certification'],
    emergencyContact: {
      name: 'Maria Martinez',
      phone: '+1 (555) 987-6543',
      relationship: 'Spouse',
    },
  };

  const profileStats: ProfileStats = {
    totalJobs: 156,
    rating: 4.8,
    totalEarnings: 12450.75,
    completionRate: 98.5,
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Navigate to edit profile screen');
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Gallery', onPress: () => console.log('Open gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAvailabilityChange = (value: boolean) => {
    setIsAvailable(value);
    Alert.alert(
      'Availability Updated',
      `You are now ${value ? 'available' : 'unavailable'} for new jobs`
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'availability',
      title: 'Available for Jobs',
      subtitle: 'Toggle your availability status',
      icon: 'account-clock',
      action: () => {},
      showSwitch: true,
      switchValue: isAvailable,
      onSwitchChange: handleAvailabilityChange,
    },
    {
      id: 'availability_settings',
      title: 'Availability Settings',
      subtitle: 'Set working hours and preferences',
      icon: 'calendar-clock',
      action: () => navigation.navigate('AvailabilitySettings' as never),
      showArrow: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      icon: 'bell',
      action: () => navigation.navigate('NotificationSettings' as never),
      showArrow: true,
    },
    {
      id: 'payment',
      title: 'Payment Settings',
      subtitle: 'Bank details and payment methods',
      icon: 'credit-card',
      action: () => navigation.navigate('PaymentSettings' as never),
      showArrow: true,
    },
    {
      id: 'documents',
      title: 'Documents & Certifications',
      subtitle: 'Licenses, insurance, and certificates',
      icon: 'file-document',
      action: () => Alert.alert('Documents', 'Navigate to documents screen'),
      showArrow: true,
    },
    {
      id: 'emergency',
      title: 'Emergency Contact',
      subtitle: engineerProfile.emergencyContact.name,
      icon: 'phone-alert',
      action: () => Alert.alert('Emergency Contact', 'Edit emergency contact info'),
      showArrow: true,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      action: () => navigation.navigate('HelpSupport' as never),
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-account',
      action: () => Alert.alert('Privacy Policy', 'Show privacy policy'),
      showArrow: true,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'file-document-outline',
      action: () => Alert.alert('Terms of Service', 'Show terms of service'),
      showArrow: true,
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // Dispatch logout action
            console.log('Sign out');
          }
        },
      ]
    );
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={i} name="star" size={16} color={theme.colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half-full" size={16} color={theme.colors.warning} />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-outline" size={16} color={theme.colors.disabled} />
      );
    }

    return stars;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: engineerProfile.profileImage }} style={styles.profileImage} />
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
            <Icon name="camera" size={16} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{engineerProfile.name}</Text>
          <Text style={styles.profileEmail}>{engineerProfile.email}</Text>
          <Text style={styles.profilePhone}>{engineerProfile.phone}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStarRating(profileStats.rating)}
            </View>
            <Text style={styles.ratingText}>{profileStats.rating} ({profileStats.totalJobs} jobs)</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Icon name="pencil" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats.totalJobs}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            ${profileStats.totalEarnings.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {profileStats.completionRate}%
          </Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
      </View>

      {/* Skills & Certifications */}
      <View style={styles.skillsContainer}>
        <Text style={styles.sectionTitle}>Skills & Certifications</Text>
        <View style={styles.skillsGrid}>
          {engineerProfile.skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
        <View style={styles.certificationsContainer}>
          {engineerProfile.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <Icon name="certificate" size={16} color={theme.colors.primary} />
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.action}
            disabled={item.showSwitch}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.menuItemRight}>
              {item.showSwitch && item.onSwitchChange && (
                <Switch
                  value={item.switchValue}
                  onValueChange={item.onSwitchChange}
                  trackColor={{ false: theme.colors.disabled, true: theme.colors.primary + '30' }}
                  thumbColor={item.switchValue ? theme.colors.primary : theme.colors.surface}
                />
              )}
              {item.showArrow && (
                <Icon name="chevron-right" size={24} color={theme.colors.disabled} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Icon name="logout" size={20} color={theme.colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Happy Homes Engineer App</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
        <Text style={styles.joinedText}>
          Member since {new Date(engineerProfile.joinedDate).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.disabled,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 6,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  editButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    marginTop: 1,
    paddingVertical: 20,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.disabled,
    textAlign: 'center',
  },
  skillsContainer: {
    backgroundColor: theme.colors.surface,
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  skillChip: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  certificationsContainer: {
    gap: 8,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certificationText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  menuItemRight: {
    marginLeft: 10,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    marginTop: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginBottom: 2,
  },
  joinedText: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 8,
  },
});

export default ProfileScreen;