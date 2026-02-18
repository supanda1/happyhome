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

interface CompletionData {
  workCompleted: string;
  timeSpent: number;
  materialsUsed: MaterialUsed[];
  additionalServices: string;
  customerNotes: string;
  beforePhotos: string[];
  afterPhotos: string[];
  customerSignature?: string;
  rating: number;
}

interface MaterialUsed {
  id: string;
  name: string;
  quantity: number;
  cost: number;
}

export const CompletionFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params as { jobId: string };

  const [completionData, setCompletionData] = useState<CompletionData>({
    workCompleted: '',
    timeSpent: 0,
    materialsUsed: [],
    additionalServices: '',
    customerNotes: '',
    beforePhotos: [],
    afterPhotos: [],
    rating: 0,
  });

  const [showMaterialsForm, setShowMaterialsForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: '',
    cost: '',
  });

  // Mock job data
  const jobDetails = {
    id: jobId,
    title: 'Kitchen Deep Clean',
    customerName: 'Sarah Johnson',
    originalScope: 'Complete kitchen cleaning including appliances, countertops, and floors',
    estimatedDuration: 180, // minutes
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.cost) {
      Alert.alert('Error', 'Please fill in all material fields');
      return;
    }

    const material: MaterialUsed = {
      id: Date.now().toString(),
      name: newMaterial.name,
      quantity: parseFloat(newMaterial.quantity),
      cost: parseFloat(newMaterial.cost),
    };

    setCompletionData(prev => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, material],
    }));

    setNewMaterial({ name: '', quantity: '', cost: '' });
    setShowMaterialsForm(false);
  };

  const removeMaterial = (materialId: string) => {
    setCompletionData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter(m => m.id !== materialId),
    }));
  };

  const takePhotos = (type: 'before' | 'after') => {
    navigation.navigate('PhotoCapture' as never, {
      jobId,
      type,
    } as never);
  };

  const getCustomerSignature = () => {
    Alert.alert(
      'Customer Signature',
      'Would you like to get the customer signature now?',
      [
        { text: 'Skip', style: 'cancel' },
        {
          text: 'Get Signature',
          onPress: () => {
            // Navigate to signature screen or show signature modal
            Alert.alert('Signature', 'Signature collection feature would be implemented here');
            setCompletionData(prev => ({
              ...prev,
              customerSignature: 'signature_placeholder',
            }));
          },
        },
      ]
    );
  };

  const submitCompletion = () => {
    if (!completionData.workCompleted.trim()) {
      Alert.alert('Error', 'Please describe the work completed');
      return;
    }

    if (completionData.timeSpent <= 0) {
      Alert.alert('Error', 'Please enter the time spent on this job');
      return;
    }

    Alert.alert(
      'Complete Job',
      'Are you sure you want to mark this job as completed? This action cannot be undone.',
      [
        { text: 'Review', style: 'cancel' },
        {
          text: 'Complete Job',
          onPress: () => {
            // Submit completion data
            console.log('Job completion data:', completionData);
            
            Alert.alert(
              'Job Completed!',
              'Thank you for your great work. The customer will be notified.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to jobs list
                    navigation.navigate('Jobs' as never);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rate this job experience:</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() =>
                setCompletionData(prev => ({ ...prev, rating: star }))
              }
            >
              <Icon
                name={star <= completionData.rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= completionData.rating ? theme.colors.warning : theme.colors.disabled}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const calculateTotalMaterialCost = () => {
    return completionData.materialsUsed.reduce((total, material) => total + material.cost, 0);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Complete Job</Text>
        <Text style={styles.jobTitle}>{jobDetails.title}</Text>
        <Text style={styles.customerName}>for {jobDetails.customerName}</Text>
      </View>

      {/* Work Completed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Completed</Text>
        <View style={styles.originalScopeContainer}>
          <Text style={styles.originalScopeLabel}>Original Scope:</Text>
          <Text style={styles.originalScopeText}>{jobDetails.originalScope}</Text>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the work you completed in detail..."
          value={completionData.workCompleted}
          onChangeText={(text) =>
            setCompletionData(prev => ({ ...prev, workCompleted: text }))
          }
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Time Spent */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Spent</Text>
        <View style={styles.timeInputContainer}>
          <View style={styles.timeInput}>
            <Text style={styles.timeLabel}>Hours</Text>
            <TextInput
              style={styles.timeField}
              placeholder="0"
              value={Math.floor(completionData.timeSpent / 60).toString()}
              onChangeText={(text) => {
                const hours = parseInt(text) || 0;
                const minutes = completionData.timeSpent % 60;
                setCompletionData(prev => ({ 
                  ...prev, 
                  timeSpent: hours * 60 + minutes 
                }));
              }}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.timeInput}>
            <Text style={styles.timeLabel}>Minutes</Text>
            <TextInput
              style={styles.timeField}
              placeholder="0"
              value={(completionData.timeSpent % 60).toString()}
              onChangeText={(text) => {
                const minutes = parseInt(text) || 0;
                const hours = Math.floor(completionData.timeSpent / 60);
                setCompletionData(prev => ({ 
                  ...prev, 
                  timeSpent: hours * 60 + minutes 
                }));
              }}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.estimatedTimeContainer}>
            <Text style={styles.estimatedTimeLabel}>Estimated:</Text>
            <Text style={styles.estimatedTimeText}>
              {Math.floor(jobDetails.estimatedDuration / 60)}h {jobDetails.estimatedDuration % 60}m
            </Text>
          </View>
        </View>
      </View>

      {/* Materials Used */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Materials Used</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowMaterialsForm(!showMaterialsForm)}
          >
            <Icon name="plus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {showMaterialsForm && (
          <View style={styles.materialForm}>
            <TextInput
              style={styles.input}
              placeholder="Material name"
              value={newMaterial.name}
              onChangeText={(text) => setNewMaterial(prev => ({ ...prev, name: text }))}
            />
            <View style={styles.materialInputRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Qty"
                value={newMaterial.quantity}
                onChangeText={(text) => setNewMaterial(prev => ({ ...prev, quantity: text }))}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.costInput]}
                placeholder="Cost ($)"
                value={newMaterial.cost}
                onChangeText={(text) => setNewMaterial(prev => ({ ...prev, cost: text }))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.materialFormButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowMaterialsForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addMaterial}>
                <Text style={styles.saveButtonText}>Add Material</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {completionData.materialsUsed.map((material) => (
          <View key={material.id} style={styles.materialItem}>
            <View style={styles.materialInfo}>
              <Text style={styles.materialName}>{material.name}</Text>
              <Text style={styles.materialDetails}>
                Qty: {material.quantity} • Cost: ${material.cost.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeMaterial(material.id)}
            >
              <Icon name="close" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {completionData.materialsUsed.length > 0 && (
          <View style={styles.totalCostContainer}>
            <Text style={styles.totalCostLabel}>Total Material Cost:</Text>
            <Text style={styles.totalCostValue}>
              ${calculateTotalMaterialCost().toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => takePhotos('before')}
          >
            <Icon name="camera-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.photoButtonText}>Before Photos</Text>
            <Text style={styles.photoCount}>
              ({completionData.beforePhotos.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => takePhotos('after')}
          >
            <Icon name="camera-check" size={24} color={theme.colors.success} />
            <Text style={styles.photoButtonText}>After Photos</Text>
            <Text style={styles.photoCount}>
              ({completionData.afterPhotos.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Services (Optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Any additional work performed beyond the original scope..."
          value={completionData.additionalServices}
          onChangeText={(text) =>
            setCompletionData(prev => ({ ...prev, additionalServices: text }))
          }
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Customer Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes for Customer (Optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Any special instructions or information for the customer..."
          value={completionData.customerNotes}
          onChangeText={(text) =>
            setCompletionData(prev => ({ ...prev, customerNotes: text }))
          }
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Rating */}
      <View style={styles.section}>
        {renderStarRating()}
      </View>

      {/* Customer Signature */}
      <View style={styles.section}>
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Customer Signature</Text>
          {completionData.customerSignature ? (
            <View style={styles.signatureComplete}>
              <Icon name="check-circle" size={24} color={theme.colors.success} />
              <Text style={styles.signatureCompleteText}>Signature collected</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.signatureButton} onPress={getCustomerSignature}>
              <Icon name="draw" size={20} color={theme.colors.primary} />
              <Text style={styles.signatureButtonText}>Get Customer Signature</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={submitCompletion}>
        <Icon name="check-circle" size={24} color={theme.colors.surface} />
        <Text style={styles.submitButtonText}>Complete Job</Text>
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  customerName: {
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
  originalScopeContainer: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  originalScopeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.disabled,
    marginBottom: 4,
  },
  originalScopeText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
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
    marginBottom: 10,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeInput: {
    flex: 1,
    marginRight: 15,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  timeField: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  estimatedTimeContainer: {
    alignItems: 'center',
  },
  estimatedTimeLabel: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginBottom: 2,
  },
  estimatedTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialForm: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  materialInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
  },
  costInput: {
    flex: 1,
  },
  materialFormButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: theme.colors.backdrop,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  materialDetails: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  removeButton: {
    padding: 4,
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  photoButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
  },
  photoCount: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 15,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    marginHorizontal: 5,
  },
  signatureSection: {
    alignItems: 'center',
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signatureButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signatureComplete: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signatureCompleteText: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    marginHorizontal: 20,
    marginTop: 20,
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

export default CompletionFormScreen;