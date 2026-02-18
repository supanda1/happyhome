import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';

interface TimeSlot {
  start: string;
  end: string;
  enabled: boolean;
}

interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface WeeklySchedule {
  [key: string]: DaySchedule;
}

interface AvailabilitySettings {
  isAvailable: boolean;
  automaticScheduling: boolean;
  maxJobsPerDay: number;
  minBreakBetweenJobs: number; // minutes
  weeklySchedule: WeeklySchedule;
  serviceRadius: number; // miles
  emergencyAvailability: boolean;
  weekendWork: boolean;
  holidayWork: boolean;
}

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM'
];

export const AvailabilitySettingsScreen = () => {
  const [settings, setSettings] = useState<AvailabilitySettings>({
    isAvailable: true,
    automaticScheduling: true,
    maxJobsPerDay: 6,
    minBreakBetweenJobs: 30,
    serviceRadius: 15,
    emergencyAvailability: false,
    weekendWork: true,
    holidayWork: false,
    weeklySchedule: {
      monday: {
        enabled: true,
        timeSlots: [{ start: '08:00', end: '17:00', enabled: true }],
      },
      tuesday: {
        enabled: true,
        timeSlots: [{ start: '08:00', end: '17:00', enabled: true }],
      },
      wednesday: {
        enabled: true,
        timeSlots: [{ start: '08:00', end: '17:00', enabled: true }],
      },
      thursday: {
        enabled: true,
        timeSlots: [{ start: '08:00', end: '17:00', enabled: true }],
      },
      friday: {
        enabled: true,
        timeSlots: [{ start: '08:00', end: '17:00', enabled: true }],
      },
      saturday: {
        enabled: true,
        timeSlots: [{ start: '09:00', end: '15:00', enabled: true }],
      },
      sunday: {
        enabled: false,
        timeSlots: [{ start: '09:00', end: '15:00', enabled: false }],
      },
    },
  });

  const [editingTime, setEditingTime] = useState<{
    day: string;
    slotIndex: number;
    type: 'start' | 'end';
  } | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const updateDayEnabled = (day: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          enabled,
          timeSlots: prev.weeklySchedule[day].timeSlots.map(slot => ({
            ...slot,
            enabled: enabled && slot.enabled,
          })),
        },
      },
    }));
  };

  const updateTimeSlot = (day: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.map((slot, index) =>
            index === slotIndex ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
  };

  const addTimeSlot = (day: string) => {
    const newSlot: TimeSlot = {
      start: '09:00',
      end: '17:00',
      enabled: true,
    };

    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: [...prev.weeklySchedule[day].timeSlots, newSlot],
        },
      },
    }));
  };

  const removeTimeSlot = (day: string, slotIndex: number) => {
    if (settings.weeklySchedule[day].timeSlots.length <= 1) {
      Alert.alert('Error', 'At least one time slot is required for each enabled day');
      return;
    }

    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.filter((_, index) => index !== slotIndex),
        },
      },
    }));
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    if (editingTime) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      updateTimeSlot(editingTime.day, editingTime.slotIndex, editingTime.type, timeString);
    }
    setShowTimePicker(false);
    setEditingTime(null);
  };

  const saveSettings = () => {
    Alert.alert(
      'Save Settings',
      'Are you sure you want to save these availability settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            // Save settings to backend/store
            console.log('Saving availability settings:', settings);
            Alert.alert('Success', 'Availability settings saved successfully');
          },
        },
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all availability settings to default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset to default settings
            console.log('Resetting to defaults');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Overall Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Availability</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Currently Available</Text>
            <Text style={styles.settingDescription}>
              Accept new job assignments
            </Text>
          </View>
          <Switch
            value={settings.isAvailable}
            onValueChange={(value) =>
              setSettings(prev => ({ ...prev, isAvailable: value }))
            }
            trackColor={{ false: theme.colors.disabled, true: theme.colors.success + '30' }}
            thumbColor={settings.isAvailable ? theme.colors.success : theme.colors.surface}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Automatic Scheduling</Text>
            <Text style={styles.settingDescription}>
              Allow system to automatically assign jobs
            </Text>
          </View>
          <Switch
            value={settings.automaticScheduling}
            onValueChange={(value) =>
              setSettings(prev => ({ ...prev, automaticScheduling: value }))
            }
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary + '30' }}
            thumbColor={settings.automaticScheduling ? theme.colors.primary : theme.colors.surface}
          />
        </View>
      </View>

      {/* Job Limits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Limits</Text>
        
        <View style={styles.numberSettingRow}>
          <Text style={styles.settingLabel}>Maximum jobs per day</Text>
          <View style={styles.numberControls}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setSettings(prev => ({
                  ...prev,
                  maxJobsPerDay: Math.max(1, prev.maxJobsPerDay - 1),
                }))
              }
            >
              <Icon name="minus" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{settings.maxJobsPerDay}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setSettings(prev => ({
                  ...prev,
                  maxJobsPerDay: Math.min(10, prev.maxJobsPerDay + 1),
                }))
              }
            >
              <Icon name="plus" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.numberSettingRow}>
          <Text style={styles.settingLabel}>Minimum break between jobs (minutes)</Text>
          <View style={styles.numberControls}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setSettings(prev => ({
                  ...prev,
                  minBreakBetweenJobs: Math.max(0, prev.minBreakBetweenJobs - 15),
                }))
              }
            >
              <Icon name="minus" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{settings.minBreakBetweenJobs}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setSettings(prev => ({
                  ...prev,
                  minBreakBetweenJobs: Math.min(120, prev.minBreakBetweenJobs + 15),
                }))
              }
            >
              <Icon name="plus" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.numberSettingRow}>
          <Text style={styles.settingLabel}>Service radius (miles)</Text>
          <View style={styles.numberControls}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setSettings(prev => ({
                  ...prev,
                  serviceRadius: Math.max(5, prev.serviceRadius - 5),
                }))
              }
            >
              <Icon name="minus" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{settings.serviceRadius}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setSettings(prev => ({
                  ...prev,
                  serviceRadius: Math.min(50, prev.serviceRadius + 5),
                }))
              }
            >
              <Icon name="plus" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Weekly Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        
        {daysOfWeek.map((day) => {
          const daySchedule = settings.weeklySchedule[day.key];
          return (
            <View key={day.key} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <Switch
                  value={daySchedule.enabled}
                  onValueChange={(enabled) => updateDayEnabled(day.key, enabled)}
                  trackColor={{ false: theme.colors.disabled, true: theme.colors.success + '30' }}
                  thumbColor={daySchedule.enabled ? theme.colors.success : theme.colors.surface}
                />
              </View>

              {daySchedule.enabled && (
                <View style={styles.timeSlotsContainer}>
                  {daySchedule.timeSlots.map((slot, slotIndex) => (
                    <View key={slotIndex} style={styles.timeSlotRow}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => {
                          setEditingTime({ day: day.key, slotIndex, type: 'start' });
                          setShowTimePicker(true);
                        }}
                      >
                        <Text style={styles.timeText}>{slot.start}</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.timeSeparator}>to</Text>
                      
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => {
                          setEditingTime({ day: day.key, slotIndex, type: 'end' });
                          setShowTimePicker(true);
                        }}
                      >
                        <Text style={styles.timeText}>{slot.end}</Text>
                      </TouchableOpacity>

                      {daySchedule.timeSlots.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeSlotButton}
                          onPress={() => removeTimeSlot(day.key, slotIndex)}
                        >
                          <Icon name="close" size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSlotButton}
                    onPress={() => addTimeSlot(day.key)}
                  >
                    <Icon name="plus" size={16} color={theme.colors.primary} />
                    <Text style={styles.addSlotText}>Add time slot</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Special Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Availability</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Emergency Jobs</Text>
            <Text style={styles.settingDescription}>
              Accept urgent/emergency service calls
            </Text>
          </View>
          <Switch
            value={settings.emergencyAvailability}
            onValueChange={(value) =>
              setSettings(prev => ({ ...prev, emergencyAvailability: value }))
            }
            trackColor={{ false: theme.colors.disabled, true: theme.colors.warning + '30' }}
            thumbColor={settings.emergencyAvailability ? theme.colors.warning : theme.colors.surface}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Weekend Work</Text>
            <Text style={styles.settingDescription}>
              Accept jobs on Saturday and Sunday
            </Text>
          </View>
          <Switch
            value={settings.weekendWork}
            onValueChange={(value) =>
              setSettings(prev => ({ ...prev, weekendWork: value }))
            }
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary + '30' }}
            thumbColor={settings.weekendWork ? theme.colors.primary : theme.colors.surface}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Holiday Work</Text>
            <Text style={styles.settingDescription}>
              Accept jobs on public holidays
            </Text>
          </View>
          <Switch
            value={settings.holidayWork}
            onValueChange={(value) =>
              setSettings(prev => ({ ...prev, holidayWork: value }))
            }
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary + '30' }}
            thumbColor={settings.holidayWork ? theme.colors.primary : theme.colors.surface}
          />
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

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => {
                setShowTimePicker(false);
                setEditingTime(null);
              }}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeOptionsContainer}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.timeOption}
                  onPress={() => handleTimeConfirm(new Date(`2000-01-01 ${time}`))}
                >
                  <Text style={styles.timeOptionText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  section: {
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
    lineHeight: 16,
  },
  numberSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  numberControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  dayContainer: {
    marginBottom: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 15,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timeSlotsContainer: {
    paddingTop: 10,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timeSeparator: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginHorizontal: 10,
  },
  removeSlotButton: {
    marginLeft: 10,
    padding: 8,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  addSlotText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timeOptionsContainer: {
    maxHeight: 300,
  },
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  timeOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default AvailabilitySettingsScreen;