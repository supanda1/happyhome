import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';
import type { JobDetailRouteProp, JobsNavigationProp } from '../../types/navigation';
import { 
  selectAssignedJobs,
  selectAvailableJobs,
  selectCurrentJob,
  acceptJob,
  startJob,
  updateJobProgress,
} from '../../store/slices/jobsSlice';

interface CustomerAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  color: string;
}

interface JobAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  backgroundColor: string;
  textColor: string;
  disabled?: boolean;
}

export const JobDetailScreen = () => {
  const route = useRoute<JobDetailRouteProp>();
  const navigation = useNavigation<JobsNavigationProp>();
  const dispatch = useDispatch();
  
  const { jobId } = route.params;
  
  // Find job from either assigned or available jobs
  const assignedJobs = useSelector(selectAssignedJobs);
  const availableJobs = useSelector(selectAvailableJobs);
  const currentJob = useSelector(selectCurrentJob);
  
  const job = [...assignedJobs, ...availableJobs].find(j => j.id === jobId);
  
  const [refreshing, setRefreshing] = useState(false);

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Job Not Found</Text>
        <Text style={styles.errorText}>
          This job may have been removed or reassigned.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAssigned = assignedJobs.some(j => j.id === jobId);
  const isAvailable = availableJobs.some(j => j.id === jobId);
  const isCurrent = currentJob?.id === jobId;

  // Customer actions
  const customerActions: CustomerAction[] = [
    {
      id: 'call',
      title: 'Call',
      icon: 'phone',
      color: theme.colors.primary,
      action: () => handleCall(job.customer.phone),
    },
    {
      id: 'sms',
      title: 'SMS',
      icon: 'message-text',
      color: theme.colors.info,
      action: () => handleSMS(job.customer.phone),
    },
    {
      id: 'directions',
      title: 'Directions',
      icon: 'map',
      color: theme.colors.success,
      action: () => handleDirections(),
    },
  ];

  // Job actions based on status
  const getJobActions = (): JobAction[] => {
    const actions: JobAction[] = [];

    if (isAvailable) {
      actions.push(
        {
          id: 'reject',
          title: 'Reject Job',
          icon: 'close',
          backgroundColor: `${theme.colors.error}20`,
          textColor: theme.colors.error,
          action: () => handleRejectJob(),
        },
        {
          id: 'accept',
          title: 'Accept Job',
          icon: 'check',
          backgroundColor: theme.colors.primary,
          textColor: theme.colors.surface,
          action: () => handleAcceptJob(),
        }
      );
    }

    if (isAssigned && job.status === 'accepted') {
      actions.push({
        id: 'start',
        title: 'Start Job',
        icon: 'play',
        backgroundColor: theme.colors.success,
        textColor: theme.colors.surface,
        action: () => handleStartJob(),
      });
    }

    if (isAssigned && (job.status === 'started' || job.status === 'in_progress')) {
      actions.push({
        id: 'continue',
        title: 'Continue Job',
        icon: 'arrow-right',
        backgroundColor: theme.colors.info,
        textColor: theme.colors.surface,
        action: () => handleContinueJob(),
      });
    }

    return actions;
  };

  const jobActions = getJobActions();

  // Handlers
  const handleCall = async (phoneNumber: string) => {
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

  const handleSMS = async (phoneNumber: string) => {
    try {
      const url = `sms:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'SMS is not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open SMS');
    }
  };

  const handleDirections = () => {
    navigation.navigate('Navigation', {
      jobId: job.id,
      destination: {
        latitude: job.location.latitude,
        longitude: job.location.longitude,
        address: job.location.address,
      },
    });
  };

  const handleAcceptJob = () => {
    Alert.alert(
      'Accept Job',
      `Accept job for ${job.customer.name}?\\n${job.service.name}\\n₹${job.amount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            dispatch(acceptJob(job));
            Alert.alert('Job Accepted', 'You have successfully accepted this job.');
          },
        },
      ]
    );
  };

  const handleRejectJob = () => {
    Alert.alert(
      'Reject Job',
      'Are you sure you want to reject this job? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // dispatch(rejectJob(job.id));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleStartJob = () => {
    Alert.alert(
      'Start Job',
      `Ready to start working on this job?\\n\\nMake sure you're at the customer location and have all necessary tools.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Job',
          onPress: () => {
            dispatch(startJob(job.id));
            navigation.navigate('WorkTracking', { jobId: job.id });
          },
        },
      ]
    );
  };

  const handleContinueJob = () => {
    navigation.navigate('WorkTracking', { jobId: job.id });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const scheduledDateTime = formatDateTime(job.scheduled_at);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerBadges}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
              <Text style={styles.badgeText}>{job.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
              <Text style={styles.badgeText}>{job.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.serviceTitle}>{job.service.name}</Text>
          <Text style={styles.serviceCategory}>{job.service.category}</Text>
          
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentAmount}>₹{job.amount.toLocaleString()}</Text>
            <View style={styles.durationContainer}>
              <Icon name="clock-outline" size={16} color={theme.colors.disabled} />
              <Text style={styles.durationText}>~{job.estimated_duration} min</Text>
            </View>
          </View>
        </View>

        {/* Schedule Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <View style={styles.scheduleContent}>
            <Icon name="calendar" size={24} color={theme.colors.primary} />
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleDate}>{scheduledDateTime.date}</Text>
              <Text style={styles.scheduleTime}>{scheduledDateTime.time}</Text>
            </View>
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          
          <View style={styles.customerInfo}>
            <View style={styles.customerHeader}>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{job.customer.name}</Text>
                <Text style={styles.customerPhone}>{job.customer.phone}</Text>
                {job.customer.email && (
                  <Text style={styles.customerEmail}>{job.customer.email}</Text>
                )}
              </View>
              
              {job.customer.rating && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={20} color={theme.colors.warning} />
                  <Text style={styles.ratingText}>{job.customer.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Customer Actions */}
            <View style={styles.customerActions}>
              {customerActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.customerActionButton, { borderColor: action.color }]}
                  onPress={action.action}
                >
                  <Icon name={action.icon} size={20} color={action.color} />
                  <Text style={[styles.customerActionText, { color: action.color }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Location</Text>
          
          <TouchableOpacity style={styles.locationContainer} onPress={handleDirections}>
            <Icon name="map-marker" size={24} color={theme.colors.error} />
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{job.location.address}</Text>
              <Text style={styles.locationCity}>
                {job.location.city}, {job.location.pincode}
              </Text>
              {job.distance && (
                <Text style={styles.locationDistance}>
                  ~{job.distance.toFixed(1)} km from your location
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.disabled} />
          </TouchableOpacity>
        </View>

        {/* Special Instructions */}
        {job.special_instructions && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Special Instructions</Text>
            <View style={styles.instructionsContainer}>
              <Icon name="information" size={20} color={theme.colors.info} />
              <Text style={styles.instructionsText}>{job.special_instructions}</Text>
            </View>
          </View>
        )}

        {/* Job Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Job ID</Text>
              <Text style={styles.detailValue}>{job.booking_id}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>{job.order_id}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Service Price</Text>
              <Text style={styles.detailValue}>₹{job.service.price}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(job.created_at).toLocaleDateString('en-US')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {jobActions.length > 0 && (
        <View style={styles.actionButtonsContainer}>
          {jobActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                { backgroundColor: action.backgroundColor },
                action.disabled && styles.disabledButton,
              ]}
              onPress={action.action}
              disabled={action.disabled}
            >
              <Icon name={action.icon} size={20} color={action.textColor} />
              <Text style={[styles.actionButtonText, { color: action.textColor }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.disabled,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 16,
    color: theme.colors.disabled,
    marginBottom: 16,
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.success,
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
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scheduleTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  customerInfo: {
    gap: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  customerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  customerActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 4,
  },
  locationDistance: {
    fontSize: 12,
    color: theme.colors.info,
    fontWeight: '600',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: 6,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backdrop,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobDetailScreen;