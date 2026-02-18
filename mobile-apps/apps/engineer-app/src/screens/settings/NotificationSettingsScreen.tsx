import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';

interface NotificationSettings {
  // Job Notifications
  newJobAssignments: boolean;
  jobUpdates: boolean;
  jobReminders: boolean;
  jobCancellations: boolean;
  customerMessages: boolean;
  
  // Schedule Notifications
  dailySchedule: boolean;
  scheduleChanges: boolean;
  upcomingJobs: boolean;
  
  // Payment Notifications
  paymentReceived: boolean;
  paymentProcessed: boolean;
  earningsReports: boolean;
  
  // System Notifications
  appUpdates: boolean;
  systemMaintenance: boolean;
  promotions: boolean;
  
  // Emergency Notifications
  emergencyJobs: boolean;
  safetyAlerts: boolean;
  
  // Notification Preferences
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ledEnabled: boolean;
  
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Notification Frequency
  jobReminderTime: number; // minutes before job
  summaryFrequency: 'daily' | 'weekly' | 'never';
}

export const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    // Job Notifications
    newJobAssignments: true,
    jobUpdates: true,
    jobReminders: true,
    jobCancellations: true,
    customerMessages: true,
    
    // Schedule Notifications
    dailySchedule: true,
    scheduleChanges: true,
    upcomingJobs: true,
    
    // Payment Notifications
    paymentReceived: true,
    paymentProcessed: false,
    earningsReports: true,
    
    // System Notifications
    appUpdates: true,
    systemMaintenance: true,
    promotions: false,
    
    // Emergency Notifications
    emergencyJobs: true,
    safetyAlerts: true,
    
    // Notification Preferences
    soundEnabled: true,
    vibrationEnabled: true,
    ledEnabled: false,
    
    // Quiet Hours
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    
    // Notification Frequency
    jobReminderTime: 30,
    summaryFrequency: 'daily',
  });

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleAllJobNotifications = () => {
    const allEnabled = settings.newJobAssignments && 
                      settings.jobUpdates && 
                      settings.jobReminders && 
                      settings.jobCancellations && 
                      settings.customerMessages;
    
    const newValue = !allEnabled;
    setSettings(prev => ({
      ...prev,
      newJobAssignments: newValue,
      jobUpdates: newValue,
      jobReminders: newValue,
      jobCancellations: newValue,
      customerMessages: newValue,
    }));
  };

  const testNotification = () => {
    Alert.alert(
      'Test Notification',
      'A test notification will be sent to verify your settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: () => {
            // Send test notification
            console.log('Sending test notification');
            Alert.alert('Success', 'Test notification sent!');
          },
        },
      ]
    );
  };

  const saveSettings = () => {
    Alert.alert(
      'Save Settings',
      'Save notification preferences?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            // Save settings to backend/store
            console.log('Saving notification settings:', settings);
            Alert.alert('Success', 'Notification settings saved successfully');
          },
        },
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all notification settings to default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset to default settings
            console.log('Resetting notification settings to defaults');
          },
        },
      ]
    );
  };

  const NotificationRow: React.FC<{
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon?: string;
    iconColor?: string;
    important?: boolean;
  }> = ({ title, description, value, onValueChange, icon, iconColor, important }) => (
    <View style={[styles.settingRow, important && styles.importantRow]}>
      <View style={styles.settingLeft}>
        {icon && (
          <View style={[styles.settingIcon, { backgroundColor: (iconColor || theme.colors.primary) + '20' }]}>
            <Icon name={icon} size={20} color={iconColor || theme.colors.primary} />
          </View>
        )}
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, important && styles.importantLabel]}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ 
          false: theme.colors.disabled, 
          true: (iconColor || theme.colors.primary) + '30' 
        }}
        thumbColor={value ? (iconColor || theme.colors.primary) : theme.colors.surface}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Test Notification */}
      <View style={styles.testSection}>
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Icon name="bell-ring" size={20} color={theme.colors.primary} />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Job Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Job Notifications</Text>
          <TouchableOpacity onPress={toggleAllJobNotifications}>
            <Text style={styles.toggleAllText}>Toggle All</Text>
          </TouchableOpacity>
        </View>

        <NotificationRow
          title="New Job Assignments"
          description="When you're assigned a new job"
          value={settings.newJobAssignments}
          onValueChange={(value) => updateSetting('newJobAssignments', value)}
          icon="briefcase-plus"
          iconColor={theme.colors.success}
          important
        />

        <NotificationRow
          title="Job Updates"
          description="Changes to job details or status"
          value={settings.jobUpdates}
          onValueChange={(value) => updateSetting('jobUpdates', value)}
          icon="briefcase-edit"
        />

        <NotificationRow
          title="Job Reminders"
          description="Upcoming job notifications"
          value={settings.jobReminders}
          onValueChange={(value) => updateSetting('jobReminders', value)}
          icon="clock-alert"
          iconColor={theme.colors.warning}
        />

        <NotificationRow
          title="Job Cancellations"
          description="When a job is cancelled"
          value={settings.jobCancellations}
          onValueChange={(value) => updateSetting('jobCancellations', value)}
          icon="briefcase-remove"
          iconColor={theme.colors.error}
        />

        <NotificationRow
          title="Customer Messages"
          description="Messages from customers"
          value={settings.customerMessages}
          onValueChange={(value) => updateSetting('customerMessages', value)}
          icon="message"
          iconColor={theme.colors.primary}
        />
      </View>

      {/* Schedule Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule Notifications</Text>

        <NotificationRow
          title="Daily Schedule"
          description="Your schedule summary each morning"
          value={settings.dailySchedule}
          onValueChange={(value) => updateSetting('dailySchedule', value)}
          icon="calendar-today"
        />

        <NotificationRow
          title="Schedule Changes"
          description="When your schedule is modified"
          value={settings.scheduleChanges}
          onValueChange={(value) => updateSetting('scheduleChanges', value)}
          icon="calendar-edit"
        />

        <NotificationRow
          title="Upcoming Jobs"
          description="Reminders before jobs start"
          value={settings.upcomingJobs}
          onValueChange={(value) => updateSetting('upcomingJobs', value)}
          icon="calendar-clock"
          iconColor={theme.colors.warning}
        />
      </View>

      {/* Payment Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Notifications</Text>

        <NotificationRow
          title="Payment Received"
          description="When you receive payment for completed jobs"
          value={settings.paymentReceived}
          onValueChange={(value) => updateSetting('paymentReceived', value)}
          icon="cash"
          iconColor={theme.colors.success}
        />

        <NotificationRow
          title="Payment Processed"
          description="Payment processing status updates"
          value={settings.paymentProcessed}
          onValueChange={(value) => updateSetting('paymentProcessed', value)}
          icon="credit-card"
        />

        <NotificationRow
          title="Earnings Reports"
          description="Weekly and monthly earnings summaries"
          value={settings.earningsReports}
          onValueChange={(value) => updateSetting('earningsReports', value)}
          icon="chart-line"
          iconColor={theme.colors.success}
        />
      </View>

      {/* Emergency Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Notifications</Text>

        <NotificationRow
          title="Emergency Jobs"
          description="Urgent job assignments"
          value={settings.emergencyJobs}
          onValueChange={(value) => updateSetting('emergencyJobs', value)}
          icon="alert-circle"
          iconColor={theme.colors.error}
          important
        />

        <NotificationRow
          title="Safety Alerts"
          description="Important safety notifications"
          value={settings.safetyAlerts}
          onValueChange={(value) => updateSetting('safetyAlerts', value)}
          icon="shield-alert"
          iconColor={theme.colors.error}
          important
        />
      </View>

      {/* System Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Notifications</Text>

        <NotificationRow
          title="App Updates"
          description="New features and app updates"
          value={settings.appUpdates}
          onValueChange={(value) => updateSetting('appUpdates', value)}
          icon="update"
        />

        <NotificationRow
          title="System Maintenance"
          description="Scheduled maintenance notifications"
          value={settings.systemMaintenance}
          onValueChange={(value) => updateSetting('systemMaintenance', value)}
          icon="wrench"
        />

        <NotificationRow
          title="Promotions"
          description="Special offers and promotions"
          value={settings.promotions}
          onValueChange={(value) => updateSetting('promotions', value)}
          icon="tag"
          iconColor={theme.colors.warning}
        />
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>

        <NotificationRow
          title="Sound"
          description="Play notification sounds"
          value={settings.soundEnabled}
          onValueChange={(value) => updateSetting('soundEnabled', value)}
          icon="volume-high"
        />

        <NotificationRow
          title="Vibration"
          description="Vibrate for notifications"
          value={settings.vibrationEnabled}
          onValueChange={(value) => updateSetting('vibrationEnabled', value)}
          icon="vibrate"
        />

        <NotificationRow
          title="LED Light"
          description="LED indicator for notifications"
          value={settings.ledEnabled}
          onValueChange={(value) => updateSetting('ledEnabled', value)}
          icon="led-on"
        />
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>

        <NotificationRow
          title="Enable Quiet Hours"
          description="Silence non-urgent notifications during set hours"
          value={settings.quietHoursEnabled}
          onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
          icon="sleep"
          iconColor={theme.colors.disabled}
        />

        {settings.quietHoursEnabled && (
          <View style={styles.quietHoursContainer}>
            <View style={styles.timeRangeRow}>
              <Text style={styles.timeLabel}>From:</Text>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeText}>{settings.quietHoursStart}</Text>
                <Icon name="chevron-down" size={16} color={theme.colors.disabled} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeRangeRow}>
              <Text style={styles.timeLabel}>To:</Text>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeText}>{settings.quietHoursEnd}</Text>
                <Icon name="chevron-down" size={16} color={theme.colors.disabled} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Notification Frequency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Frequency</Text>

        <View style={styles.frequencyRow}>
          <Text style={styles.frequencyLabel}>Job Reminder Time</Text>
          <View style={styles.reminderControls}>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => updateSetting('jobReminderTime', Math.max(5, settings.jobReminderTime - 5))}
            >
              <Icon name="minus" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.reminderText}>{settings.jobReminderTime} min</Text>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => updateSetting('jobReminderTime', Math.min(120, settings.jobReminderTime + 5))}
            >
              <Icon name="plus" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.frequencyRow}>
          <Text style={styles.frequencyLabel}>Summary Reports</Text>
          <View style={styles.summaryButtons}>
            {['daily', 'weekly', 'never'].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.summaryButton,
                  settings.summaryFrequency === freq && styles.summaryButtonActive,
                ]}
                onPress={() => updateSetting('summaryFrequency', freq)}
              >
                <Text
                  style={[
                    styles.summaryButtonText,
                    settings.summaryFrequency === freq && styles.summaryButtonTextActive,
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Icon name="check" size={20} color={theme.colors.surface} />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
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
  testSection: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    marginBottom: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  toggleAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  importantRow: {
    backgroundColor: theme.colors.warning + '10',
    marginHorizontal: -10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  importantLabel: {
    color: theme.colors.error,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
    lineHeight: 16,
  },
  quietHoursContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  timeRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.text,
    marginRight: 6,
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reminderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: 15,
  },
  summaryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  summaryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  summaryButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  summaryButtonTextActive: {
    color: theme.colors.surface,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
    marginLeft: 8,
  },
});

export default NotificationSettingsScreen;