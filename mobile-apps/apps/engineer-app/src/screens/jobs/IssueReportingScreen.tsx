import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { theme } from '../../config/theme';

interface IssueReport {
  type: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  immediateAction: string;
  photos: string[];
  customerNotified: boolean;
  requiresSupport: boolean;
  estimatedCost?: number;
  timeline?: string;
}

interface IssueType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface IssueCategory {
  id: string;
  name: string;
  types: IssueType[];
}

export const IssueReportingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params as { jobId: string };

  const [issueReport, setIssueReport] = useState<IssueReport>({
    type: '',
    category: '',
    severity: 'medium',
    description: '',
    immediateAction: '',
    photos: [],
    customerNotified: false,
    requiresSupport: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showEstimatedCost, setShowEstimatedCost] = useState(false);

  // Issue categories and types
  const issueCategories: IssueCategory[] = [
    {
      id: 'safety',
      name: 'Safety Issues',
      types: [
        {
          id: 'electrical_hazard',
          name: 'Electrical Hazard',
          icon: 'flash-alert',
          color: theme.colors.error,
          description: 'Exposed wiring, electrical damage',
        },
        {
          id: 'structural_damage',
          name: 'Structural Damage',
          icon: 'home-alert',
          color: theme.colors.error,
          description: 'Cracks, unstable surfaces',
        },
        {
          id: 'water_damage',
          name: 'Water Damage',
          icon: 'water-alert',
          color: theme.colors.error,
          description: 'Leaks, flooding, moisture issues',
        },
        {
          id: 'gas_leak',
          name: 'Gas Leak',
          icon: 'gas-cylinder',
          color: theme.colors.error,
          description: 'Gas odor or visible leak',
        },
      ],
    },
    {
      id: 'equipment',
      name: 'Equipment Issues',
      types: [
        {
          id: 'appliance_malfunction',
          name: 'Appliance Malfunction',
          icon: 'washing-machine-alert',
          color: theme.colors.warning,
          description: 'Broken or faulty appliances',
        },
        {
          id: 'plumbing_issue',
          name: 'Plumbing Issue',
          icon: 'pipe-leak',
          color: theme.colors.warning,
          description: 'Pipe problems, drainage issues',
        },
        {
          id: 'hvac_problem',
          name: 'HVAC Problem',
          icon: 'air-conditioner',
          color: theme.colors.warning,
          description: 'Heating/cooling system issues',
        },
      ],
    },
    {
      id: 'access',
      name: 'Access Issues',
      types: [
        {
          id: 'locked_areas',
          name: 'Locked Areas',
          icon: 'lock',
          color: theme.colors.primary,
          description: 'Cannot access required areas',
        },
        {
          id: 'missing_keys',
          name: 'Missing Keys/Codes',
          icon: 'key-remove',
          color: theme.colors.primary,
          description: 'Access codes or keys not provided',
        },
        {
          id: 'pet_interference',
          name: 'Pet Interference',
          icon: 'dog',
          color: theme.colors.warning,
          description: 'Pets preventing work completion',
        },
      ],
    },
    {
      id: 'damage',
      name: 'Property Damage',
      types: [
        {
          id: 'accidental_damage',
          name: 'Accidental Damage',
          icon: 'alert-decagram',
          color: theme.colors.error,
          description: 'Damage caused during service',
        },
        {
          id: 'existing_damage',
          name: 'Pre-existing Damage',
          icon: 'shield-alert',
          color: theme.colors.warning,
          description: 'Damage found before starting work',
        },
        {
          id: 'material_defect',
          name: 'Material Defect',
          icon: 'package-variant-closed',
          color: theme.colors.warning,
          description: 'Defective materials or supplies',
        },
      ],
    },
    {
      id: 'scope',
      name: 'Scope Changes',
      types: [
        {
          id: 'additional_work',
          name: 'Additional Work Required',
          icon: 'plus-circle',
          color: theme.colors.primary,
          description: 'More work needed than originally scoped',
        },
        {
          id: 'incorrect_scope',
          name: 'Incorrect Job Scope',
          icon: 'file-question',
          color: theme.colors.warning,
          description: 'Job details do not match actual requirements',
        },
      ],
    },
  ];

  const severityLevels = [
    {
      level: 'low' as const,
      name: 'Low',
      description: 'Minor issue, work can continue',
      color: theme.colors.success,
      icon: 'information',
    },
    {
      level: 'medium' as const,
      name: 'Medium',
      description: 'Moderate issue, may need attention',
      color: theme.colors.warning,
      icon: 'alert',
    },
    {
      level: 'high' as const,
      name: 'High',
      description: 'Significant issue, requires immediate action',
      color: theme.colors.error,
      icon: 'alert-circle',
    },
    {
      level: 'critical' as const,
      name: 'Critical',
      description: 'Unsafe conditions, stop work immediately',
      color: theme.colors.error,
      icon: 'alert-octagon',
    },
  ];

  const handleTypeSelection = (category: string, type: string) => {
    setIssueReport(prev => ({
      ...prev,
      category,
      type,
    }));
    setSelectedCategory('');
  };

  const takePhoto = () => {
    navigation.navigate('PhotoCapture' as never, {
      jobId,
      type: 'issue',
    } as never);
  };

  const contactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact support:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => console.log('Calling support') },
        { text: 'Chat Support', onPress: () => console.log('Opening chat') },
      ]
    );
  };

  const submitReport = () => {
    if (!issueReport.type) {
      Alert.alert('Error', 'Please select an issue type');
      return;
    }

    if (!issueReport.description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue');
      return;
    }

    if (issueReport.severity === 'critical' && !issueReport.customerNotified) {
      Alert.alert(
        'Critical Issue',
        'For critical safety issues, the customer must be notified immediately. Have you informed the customer?',
        [
          { text: 'No, I will notify them', style: 'cancel' },
          {
            text: 'Yes, customer notified',
            onPress: () => {
              setIssueReport(prev => ({ ...prev, customerNotified: true }));
              submitReportData();
            },
          },
        ]
      );
      return;
    }

    submitReportData();
  };

  const submitReportData = () => {
    Alert.alert(
      'Submit Report',
      'Are you sure you want to submit this issue report?',
      [
        { text: 'Review', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            // Submit report data
            console.log('Issue report submitted:', issueReport);
            
            Alert.alert(
              'Report Submitted',
              'Your issue report has been submitted successfully. Support will be notified.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const getSelectedTypeInfo = () => {
    for (const category of issueCategories) {
      const type = category.types.find(t => t.id === issueReport.type);
      if (type) {
        return type;
      }
    }
    return null;
  };

  const selectedTypeInfo = getSelectedTypeInfo();
  const selectedSeverity = severityLevels.find(s => s.level === issueReport.severity);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Report Issue</Text>
        <Text style={styles.subtitle}>Document any problems or safety concerns</Text>
      </View>

      {/* Issue Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issue Type</Text>
        
        {selectedTypeInfo ? (
          <View style={styles.selectedType}>
            <View style={[styles.selectedTypeIcon, { backgroundColor: selectedTypeInfo.color + '20' }]}>
              <Icon name={selectedTypeInfo.icon} size={24} color={selectedTypeInfo.color} />
            </View>
            <View style={styles.selectedTypeInfo}>
              <Text style={styles.selectedTypeName}>{selectedTypeInfo.name}</Text>
              <Text style={styles.selectedTypeDescription}>{selectedTypeInfo.description}</Text>
            </View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setIssueReport(prev => ({ ...prev, type: '', category: '' }))}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {issueCategories.map((category) => (
              <View key={category.id}>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === category.id ? '' : category.id)
                  }
                >
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Icon
                    name={selectedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.disabled}
                  />
                </TouchableOpacity>

                {selectedCategory === category.id && (
                  <View style={styles.typesList}>
                    {category.types.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={styles.typeButton}
                        onPress={() => handleTypeSelection(category.id, type.id)}
                      >
                        <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                          <Icon name={type.icon} size={20} color={type.color} />
                        </View>
                        <View style={styles.typeInfo}>
                          <Text style={styles.typeName}>{type.name}</Text>
                          <Text style={styles.typeDescription}>{type.description}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Severity Level */}
      {issueReport.type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityButtons}>
            {severityLevels.map((severity) => (
              <TouchableOpacity
                key={severity.level}
                style={[
                  styles.severityButton,
                  issueReport.severity === severity.level && styles.severityButtonActive,
                  { borderColor: severity.color },
                  issueReport.severity === severity.level && { backgroundColor: severity.color + '20' },
                ]}
                onPress={() =>
                  setIssueReport(prev => ({ ...prev, severity: severity.level }))
                }
              >
                <Icon
                  name={severity.icon}
                  size={20}
                  color={issueReport.severity === severity.level ? severity.color : theme.colors.disabled}
                />
                <Text
                  style={[
                    styles.severityButtonText,
                    issueReport.severity === severity.level && { color: severity.color },
                  ]}
                >
                  {severity.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedSeverity && (
            <Text style={styles.severityDescription}>{selectedSeverity.description}</Text>
          )}
        </View>
      )}

      {/* Description */}
      {issueReport.type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the issue in detail. Include what happened, when it occurred, and any relevant conditions..."
            value={issueReport.description}
            onChangeText={(text) =>
              setIssueReport(prev => ({ ...prev, description: text }))
            }
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Immediate Action Taken */}
      {issueReport.type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Immediate Action Taken</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What steps did you take to address this issue immediately?"
            value={issueReport.immediateAction}
            onChangeText={(text) =>
              setIssueReport(prev => ({ ...prev, immediateAction: text }))
            }
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Photos */}
      {issueReport.type && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Icon name="camera" size={20} color={theme.colors.primary} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>
            Take photos to document the issue. Include close-ups and context shots.
          </Text>
        </View>
      )}

      {/* Additional Options */}
      {issueReport.type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          {/* Estimated Cost */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowEstimatedCost(!showEstimatedCost)}
          >
            <Text style={styles.optionLabel}>Estimated repair cost</Text>
            <Icon
              name={showEstimatedCost ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.disabled}
            />
          </TouchableOpacity>

          {showEstimatedCost && (
            <View style={styles.costInputContainer}>
              <Text style={styles.inputLabel}>Estimated Cost ($)</Text>
              <TextInput
                style={styles.costInput}
                placeholder="0.00"
                value={issueReport.estimatedCost?.toString() || ''}
                onChangeText={(text) =>
                  setIssueReport(prev => ({
                    ...prev,
                    estimatedCost: parseFloat(text) || undefined,
                  }))
                }
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Timeline */}
          <View style={styles.timelineContainer}>
            <Text style={styles.inputLabel}>Estimated repair timeline</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Same day, 2-3 days, 1 week"
              value={issueReport.timeline || ''}
              onChangeText={(text) =>
                setIssueReport(prev => ({ ...prev, timeline: text }))
              }
            />
          </View>

          {/* Customer Notification */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setIssueReport(prev => ({ ...prev, customerNotified: !prev.customerNotified }))
            }
          >
            <Icon
              name={issueReport.customerNotified ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={issueReport.customerNotified ? theme.colors.primary : theme.colors.disabled}
            />
            <Text style={styles.checkboxLabel}>Customer has been notified of this issue</Text>
          </TouchableOpacity>

          {/* Support Required */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setIssueReport(prev => ({ ...prev, requiresSupport: !prev.requiresSupport }))
            }
          >
            <Icon
              name={issueReport.requiresSupport ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={issueReport.requiresSupport ? theme.colors.primary : theme.colors.disabled}
            />
            <Text style={styles.checkboxLabel}>This issue requires immediate support assistance</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      {issueReport.type && (
        <View style={styles.actionButtons}>
          {issueReport.requiresSupport && (
            <TouchableOpacity style={styles.supportButton} onPress={contactSupport}>
              <Icon name="headset" size={20} color={theme.colors.surface} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
            <Icon name="send" size={20} color={theme.colors.surface} />
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    backgroundColor: theme.colors.surface,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
  },
  selectedTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedTypeInfo: {
    flex: 1,
  },
  selectedTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  selectedTypeDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  changeButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryList: {},
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  typesList: {
    paddingLeft: 15,
    paddingBottom: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  severityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  severityButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    backgroundColor: theme.colors.background,
  },
  severityButtonActive: {
    borderWidth: 2,
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.disabled,
    marginLeft: 6,
  },
  severityDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  textArea: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  photoButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  photoHint: {
    fontSize: 12,
    color: theme.colors.disabled,
    fontStyle: 'italic',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  costInputContainer: {
    paddingTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  costInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    width: 120,
  },
  timelineContainer: {
    marginTop: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
  actionButtons: {
    padding: 20,
    gap: 10,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.warning,
    paddingVertical: 14,
    borderRadius: 8,
  },
  supportButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default IssueReportingScreen;