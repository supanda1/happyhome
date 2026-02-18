import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { theme } from '../config/theme';
import type { RootState } from '../store';

interface ScheduledJob {
  id: string;
  title: string;
  customerName: string;
  address: string;
  time: string;
  duration: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  estimatedEarnings: number;
}

interface MarkedDates {
  [key: string]: {
    marked?: boolean;
    dotColor?: string;
    activeOpacity?: number;
  };
}

export const ScheduleScreen = () => {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  // Mock data - replace with real data from store
  useEffect(() => {
    const mockJobs: ScheduledJob[] = [
      {
        id: '1',
        title: 'Plumbing Repair',
        customerName: 'Sarah Johnson',
        address: '123 Oak Street, Downtown',
        time: '09:00 AM',
        duration: '2 hours',
        status: 'confirmed',
        estimatedEarnings: 85,
      },
      {
        id: '2',
        title: 'Kitchen Deep Clean',
        customerName: 'Mike Chen',
        address: '456 Maple Ave, Midtown',
        time: '02:00 PM',
        duration: '3 hours',
        status: 'pending',
        estimatedEarnings: 120,
      },
    ];

    // Filter jobs for selected date
    setScheduledJobs(mockJobs);

    // Create marked dates
    const marked: MarkedDates = {};
    marked[selectedDate] = { 
      marked: true, 
      dotColor: theme.colors.primary,
      activeOpacity: 0 
    };
    
    // Mark days with jobs
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    marked[today] = { marked: true, dotColor: theme.colors.success };
    marked[tomorrow] = { marked: true, dotColor: theme.colors.warning };
    
    setMarkedDates(marked);
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.disabled;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleJobPress = (job: ScheduledJob) => {
    Alert.alert(
      'Job Details',
      `${job.title}\nCustomer: ${job.customerName}\nTime: ${job.time}\nEarnings: $${job.estimatedEarnings}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => console.log('Navigate to job details') },
      ]
    );
  };

  const handleAvailabilityToggle = () => {
    Alert.alert(
      'Set Availability',
      'Would you like to mark yourself as available for new jobs today?',
      [
        { text: 'Not Available', style: 'cancel' },
        { text: 'Available', onPress: () => console.log('Set available') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Schedule</Text>
        <TouchableOpacity 
          style={styles.availabilityButton}
          onPress={handleAvailabilityToggle}
        >
          <Icon name="account-clock" size={20} color={theme.colors.surface} />
          <Text style={styles.availabilityButtonText}>Set Availability</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              selected: true,
              selectedColor: theme.colors.primary,
            },
          }}
          theme={{
            backgroundColor: theme.colors.surface,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.text,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: theme.colors.surface,
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.disabled,
            dotColor: theme.colors.primary,
            selectedDotColor: theme.colors.surface,
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.text,
            indicatorColor: theme.colors.primary,
            textDayFontFamily: 'Inter-Regular',
            textMonthFontFamily: 'Inter-Medium',
            textDayHeaderFontFamily: 'Inter-Medium',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      {/* Selected Date Jobs */}
      <View style={styles.jobsSection}>
        <Text style={styles.sectionTitle}>
          Jobs for {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>

        {scheduledJobs.length === 0 ? (
          <View style={styles.noJobsContainer}>
            <Icon name="calendar-blank" size={48} color={theme.colors.disabled} />
            <Text style={styles.noJobsText}>No jobs scheduled for this date</Text>
            <TouchableOpacity style={styles.findJobsButton}>
              <Text style={styles.findJobsButtonText}>Find Available Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          scheduledJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => handleJobPress(job)}
            >
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Icon 
                    name={getStatusIcon(job.status)} 
                    size={12} 
                    color={theme.colors.surface} 
                  />
                  <Text style={styles.statusText}>{job.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.jobDetails}>
                <View style={styles.jobDetailRow}>
                  <Icon name="account" size={16} color={theme.colors.disabled} />
                  <Text style={styles.jobDetailText}>{job.customerName}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Icon name="map-marker" size={16} color={theme.colors.disabled} />
                  <Text style={styles.jobDetailText}>{job.address}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Icon name="clock" size={16} color={theme.colors.disabled} />
                  <Text style={styles.jobDetailText}>{job.time} • {job.duration}</Text>
                </View>
                <View style={styles.jobDetailRow}>
                  <Icon name="cash" size={16} color={theme.colors.success} />
                  <Text style={[styles.jobDetailText, { color: theme.colors.success }]}>
                    ${job.estimatedEarnings}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Jobs This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Hours Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>$340</Text>
          <Text style={styles.statLabel}>Expected Earnings</Text>
        </View>
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  availabilityButtonText: {
    color: theme.colors.surface,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: theme.colors.surface,
    margin: 10,
    borderRadius: 12,
    padding: 10,
  },
  jobsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  noJobsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noJobsText: {
    fontSize: 16,
    color: theme.colors.disabled,
    marginTop: 10,
    marginBottom: 20,
  },
  findJobsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  findJobsButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  jobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  jobDetails: {
    gap: 8,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetailText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 10,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ScheduleScreen;