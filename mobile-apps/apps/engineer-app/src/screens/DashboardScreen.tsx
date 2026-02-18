import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../config/theme';
import type { RootState } from '../store';
import type { DashboardNavigationProp } from '../types/navigation';
import { 
  selectEngineerProfile, 
  selectEngineerStats, 
  selectIsAvailable,
  selectCurrentShift,
  startShift,
  endShift,
  setAvailability,
} from '../store/slices/engineerSlice';
import { 
  selectAssignedJobs, 
  selectCurrentJob,
  selectJobsLoading,
} from '../store/slices/jobsSlice';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  action: () => void;
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  change?: string;
}

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const dispatch = useDispatch();
  
  // Selectors
  const profile = useSelector(selectEngineerProfile);
  const stats = useSelector(selectEngineerStats);
  const isAvailable = useSelector(selectIsAvailable);
  const currentShift = useSelector(selectCurrentShift);
  const assignedJobs = useSelector(selectAssignedJobs);
  const currentJob = useSelector(selectCurrentJob);
  const jobsLoading = useSelector(selectJobsLoading);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'toggle-availability',
      title: isAvailable ? 'Go Offline' : 'Go Online',
      icon: isAvailable ? 'power-off' : 'power-on',
      color: isAvailable ? theme.colors.warning : theme.colors.success,
      action: handleToggleAvailability,
    },
    {
      id: 'view-jobs',
      title: 'My Jobs',
      icon: 'briefcase-outline',
      color: theme.colors.primary,
      action: () => navigation.navigate('Jobs', { screen: 'JobsList' }),
    },
    {
      id: 'navigate-current',
      title: 'Navigate',
      icon: 'navigation',
      color: theme.colors.info,
      action: handleNavigateToCurrentJob,
    },
    {
      id: 'help-support',
      title: 'Support',
      icon: 'help-circle-outline',
      color: theme.colors.disabled,
      action: () => navigation.navigate('Profile', { screen: 'HelpSupport' }),
    },
  ];

  // Stats cards configuration
  const statsCards: StatCard[] = [
    {
      title: "Today's Jobs",
      value: stats.todayJobs.toString(),
      icon: 'calendar-today',
      color: theme.colors.primary,
      change: '+2 from yesterday',
    },
    {
      title: 'This Week',
      value: stats.weeklyJobs.toString(),
      icon: 'calendar-week',
      color: theme.colors.success,
      change: '+5 from last week',
    },
    {
      title: "Today's Earnings",
      value: `₹${stats.monthlyEarnings.toLocaleString()}`,
      icon: 'cash',
      color: theme.colors.warning,
      change: '+15% vs yesterday',
    },
    {
      title: 'Rating',
      value: stats.averageRating.toFixed(1),
      icon: 'star',
      color: theme.colors.info,
      change: `${stats.completionRate}% completion`,
    },
  ];

  // Handlers
  function handleToggleAvailability() {
    if (!currentShift.started && !isAvailable) {
      // Start shift and go online
      dispatch(startShift());
      Alert.alert('Shift Started', 'You are now online and available for jobs.');
    } else if (currentShift.started && isAvailable) {
      // Go offline but keep shift running
      Alert.alert(
        'Go Offline',
        'You will not receive new job assignments. Continue with current jobs.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Offline',
            onPress: () => dispatch(setAvailability(false)),
          },
        ]
      );
    } else if (currentShift.started && !isAvailable) {
      // Go back online
      dispatch(setAvailability(true));
      Alert.alert('You are Online', 'You will now receive new job assignments.');
    } else {
      // End shift completely
      Alert.alert(
        'End Shift',
        'This will mark you as offline and end your current shift. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Shift',
            style: 'destructive',
            onPress: () => dispatch(endShift()),
          },
        ]
      );
    }
  }

  function handleNavigateToCurrentJob() {
    if (currentJob) {
      navigation.navigate('Jobs', {
        screen: 'Navigation',
        params: {
          jobId: currentJob.id,
          destination: {
            latitude: currentJob.location.latitude,
            longitude: currentJob.location.longitude,
            address: currentJob.location.address,
          },
        },
      });
    } else {
      Alert.alert('No Active Job', 'You don\'t have an active job to navigate to.');
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Refresh dashboard data
      // await Promise.all([
      //   dispatch(fetchEngineerStats()),
      //   dispatch(fetchAssignedJobs()),
      //   dispatch(fetchProfile()),
      // ]);
      
      // Mock refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = () => {
    if (currentJob) return theme.colors.info;
    if (isAvailable) return theme.colors.success;
    return theme.colors.disabled;
  };

  const getStatusText = () => {
    if (currentJob) return 'Working on Job';
    if (isAvailable) return 'Available';
    return 'Offline';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Icon name="account" size={32} color={theme.colors.surface} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>
                {getGreeting()}, {profile?.employee_id || 'Engineer'}!
              </Text>
              <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Job Card */}
        {currentJob && (
          <View style={styles.currentJobCard}>
            <View style={styles.currentJobHeader}>
              <Icon name="briefcase" size={24} color={theme.colors.primary} />
              <Text style={styles.currentJobTitle}>Current Job</Text>
            </View>
            
            <View style={styles.currentJobContent}>
              <Text style={styles.customerName}>{currentJob.customer.name}</Text>
              <Text style={styles.serviceType}>{currentJob.service.name}</Text>
              <View style={styles.locationRow}>
                <Icon name="map-marker" size={16} color={theme.colors.disabled} />
                <Text style={styles.locationText}>{currentJob.location.address}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.continueJobButton}
                onPress={() => navigation.navigate('Jobs', {
                  screen: 'WorkTracking',
                  params: { jobId: currentJob.id },
                })}
              >
                <Text style={styles.continueJobButtonText}>Continue Job</Text>
                <Icon name="arrow-right" size={20} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.action}
              >
                <Icon
                  name={action.icon}
                  size={28}
                  color={action.color}
                />
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.statsGrid}>
            {statsCards.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Icon name={stat.icon} size={24} color={stat.color} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                <Text style={styles.statTitle}>{stat.title}</Text>
                {stat.change && (
                  <Text style={styles.statChange}>{stat.change}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Jobs', { screen: 'JobsList' })}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {assignedJobs.slice(0, 3).map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => navigation.navigate('Jobs', {
                screen: 'JobDetail',
                params: { jobId: job.id },
              })}
            >
              <View style={styles.jobHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                  <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
                </View>
                <Text style={styles.jobTime}>
                  {new Date(job.scheduled_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>
              
              <Text style={styles.jobCustomer}>{job.customer.name}</Text>
              <Text style={styles.jobService}>{job.service.name}</Text>
              
              <View style={styles.jobFooter}>
                <View style={styles.locationRow}>
                  <Icon name="map-marker" size={14} color={theme.colors.disabled} />
                  <Text style={styles.jobLocation}>{job.location.city}</Text>
                </View>
                <Text style={styles.jobPayment}>₹{job.amount}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {assignedJobs.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="calendar-blank" size={48} color={theme.colors.disabled} />
              <Text style={styles.emptyStateText}>No upcoming jobs</Text>
              <Text style={styles.emptyStateSubtext}>
                New job assignments will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return theme.colors.error;
    case 'high':
      return theme.colors.warning;
    case 'medium':
      return theme.colors.info;
    default:
      return theme.colors.disabled;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.surface}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.surface,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: `${theme.colors.surface}80`,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
    marginBottom: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  currentJobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  currentJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  currentJobContent: {
    marginLeft: 32,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 16,
    color: theme.colors.disabled,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginLeft: 4,
    flex: 1,
  },
  continueJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  continueJobButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: theme.colors.success,
  },
  jobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  jobTime: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  jobCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  jobService: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobLocation: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginLeft: 4,
  },
  jobPayment: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.disabled,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.disabled,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DashboardScreen;