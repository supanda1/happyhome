import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';
import type { RootState } from '../../store';
import type { JobsNavigationProp } from '../../types/navigation';
import { 
  selectAssignedJobs,
  selectAvailableJobs,
  selectCurrentJob,
  selectJobsLoading,
  selectJobsError,
  acceptJob,
  rejectJob,
  startJob,
} from '../../store/slices/jobsSlice';

interface JobFilterState {
  status: 'all' | 'assigned' | 'available' | 'completed';
  priority: 'all' | 'urgent' | 'high' | 'medium' | 'low';
  distance: number; // in km
}

interface Job {
  id: string;
  booking_id: string;
  order_id: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    rating?: number;
  };
  service: {
    id: string;
    name: string;
    category: string;
    estimated_duration: number;
    price: number;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    pincode: string;
  };
  scheduled_at: string;
  status: 'pending' | 'accepted' | 'started' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  special_instructions?: string;
  estimated_duration: number;
  amount: number;
  distance?: number;
  created_at: string;
  updated_at: string;
}

const FILTER_TABS = [
  { id: 'assigned', label: 'My Jobs', icon: 'briefcase' },
  { id: 'available', label: 'Available', icon: 'briefcase-plus' },
  { id: 'all', label: 'All', icon: 'briefcase-outline' },
];

export const JobsListScreen = () => {
  const navigation = useNavigation<JobsNavigationProp>();
  const dispatch = useDispatch();
  
  // Selectors
  const assignedJobs = useSelector(selectAssignedJobs);
  const availableJobs = useSelector(selectAvailableJobs);
  const currentJob = useSelector(selectCurrentJob);
  const isLoading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<JobFilterState>({
    status: 'assigned',
    priority: 'all',
    distance: 50,
  });

  // Get filtered jobs based on current filter
  const getFilteredJobs = (): Job[] => {
    let jobs: Job[] = [];
    
    switch (filters.status) {
      case 'assigned':
        jobs = assignedJobs;
        break;
      case 'available':
        jobs = availableJobs;
        break;
      case 'all':
        jobs = [...assignedJobs, ...availableJobs];
        break;
      default:
        jobs = assignedJobs;
    }
    
    // Filter by priority
    if (filters.priority !== 'all') {
      jobs = jobs.filter(job => job.priority === filters.priority);
    }
    
    // Filter by distance
    jobs = jobs.filter(job => !job.distance || job.distance <= filters.distance);
    
    // Sort by priority and scheduled time
    return jobs.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });
  };

  const filteredJobs = getFilteredJobs();

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Refresh jobs from API
      // await dispatch(fetchJobs());
      
      // Mock refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { jobId: job.id });
  };

  const handleAcceptJob = (job: Job) => {
    Alert.alert(
      'Accept Job',
      `Accept job for ${job.customer.name}?\\n${job.service.name}\\n₹${job.amount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            dispatch(acceptJob(job));
            setFilters(prev => ({ ...prev, status: 'assigned' }));
          },
        },
      ]
    );
  };

  const handleRejectJob = (job: Job) => {
    Alert.alert(
      'Reject Job',
      'Are you sure you want to reject this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => dispatch(rejectJob(job.id)),
        },
      ]
    );
  };

  const handleStartJob = (job: Job) => {
    Alert.alert(
      'Start Job',
      `Start working on job for ${job.customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            dispatch(startJob(job.id));
            navigation.navigate('WorkTracking', { jobId: job.id });
          },
        },
      ]
    );
  };

  const renderJobCard = ({ item: job }: { item: Job }) => {
    const isAssigned = assignedJobs.some(j => j.id === job.id);
    const isAvailable = availableJobs.some(j => j.id === job.id);
    const isCurrent = currentJob?.id === job.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.jobCard,
          isCurrent && styles.currentJobCard,
        ]}
        onPress={() => handleJobPress(job)}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(job.priority) }
            ]}>
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(job.status) }
            ]}>
              <Text style={styles.statusText}>{job.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.jobHeaderRight}>
            <Text style={styles.jobTime}>
              {new Date(job.scheduled_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
            <Text style={styles.jobDate}>
              {new Date(job.scheduled_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <Text style={styles.customerName}>{job.customer.name}</Text>
          <View style={styles.customerDetails}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color={theme.colors.warning} />
              <Text style={styles.ratingText}>
                {job.customer.rating?.toFixed(1) || 'New'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {/* TODO: Implement call functionality */}}
            >
              <Icon name="phone" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceName}>{job.service.name}</Text>
          <Text style={styles.serviceCategory}>{job.service.category}</Text>
          
          <View style={styles.serviceDetails}>
            <View style={styles.durationContainer}>
              <Icon name="clock-outline" size={14} color={theme.colors.disabled} />
              <Text style={styles.durationText}>{job.estimated_duration} min</Text>
            </View>
            <Text style={styles.paymentAmount}>₹{job.amount}</Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationSection}>
          <Icon name="map-marker" size={16} color={theme.colors.disabled} />
          <Text style={styles.locationText} numberOfLines={1}>
            {job.location.address}
          </Text>
          {job.distance && (
            <Text style={styles.distanceText}>{job.distance.toFixed(1)} km</Text>
          )}
        </View>

        {/* Special Instructions */}
        {job.special_instructions && (
          <View style={styles.instructionsSection}>
            <Icon name="information" size={16} color={theme.colors.info} />
            <Text style={styles.instructionsText} numberOfLines={2}>
              {job.special_instructions}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isAvailable && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectJob(job)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptJob(job)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}
          
          {isAssigned && job.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStartJob(job)}
            >
              <Text style={styles.startButtonText}>Start Job</Text>
            </TouchableOpacity>
          )}
          
          {isAssigned && job.status === 'started' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.continueButton]}
              onPress={() => navigation.navigate('WorkTracking', { jobId: job.id })}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon
        name={filters.status === 'available' ? 'briefcase-plus' : 'briefcase-outline'}
        size={64}
        color={theme.colors.disabled}
      />
      <Text style={styles.emptyStateTitle}>
        {filters.status === 'available' ? 'No Available Jobs' : 'No Jobs Found'}
      </Text>
      <Text style={styles.emptyStateText}>
        {filters.status === 'available'
          ? 'Check back later for new job opportunities'
          : 'Your assigned jobs will appear here'
        }
      </Text>
      
      {filters.status === 'available' && (
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh Jobs</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      {FILTER_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.filterTab,
            filters.status === tab.id && styles.activeFilterTab,
          ]}
          onPress={() => setFilters(prev => ({ ...prev, status: tab.id as any }))}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={filters.status === tab.id ? theme.colors.primary : theme.colors.disabled}
          />
          <Text
            style={[
              styles.filterTabText,
              filters.status === tab.id && styles.activeFilterTabText,
            ]}
          >
            {tab.label}
          </Text>
          
          {/* Job count badge */}
          {tab.id === 'assigned' && assignedJobs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{assignedJobs.length}</Text>
            </View>
          )}
          
          {tab.id === 'available' && availableJobs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{availableJobs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Helper functions
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return theme.colors.success;
    case 'in_progress':
    case 'started':
      return theme.colors.primary;
    case 'accepted':
      return theme.colors.info;
    case 'cancelled':
      return theme.colors.error;
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  filterButton: {
    padding: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    position: 'relative',
  },
  activeFilterTab: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.disabled,
    marginLeft: 6,
  },
  activeFilterTabText: {
    color: theme.colors.primary,
  },
  countBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentJobCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}05`,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  jobHeaderRight: {
    alignItems: 'flex-end',
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
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  jobTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  jobDate: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  customerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  callButton: {
    padding: 8,
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 6,
  },
  serviceSection: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  serviceCategory: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.disabled,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: theme.colors.info,
    fontWeight: '600',
  },
  instructionsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 8,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: 6,
    gap: 6,
  },
  instructionsText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: `${theme.colors.error}20`,
  },
  rejectButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: theme.colors.success,
  },
  startButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: theme.colors.info,
  },
  continueButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.disabled,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.disabled,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
});

export default JobsListScreen;