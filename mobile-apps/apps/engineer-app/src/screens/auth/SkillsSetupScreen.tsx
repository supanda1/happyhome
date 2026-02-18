import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';
import type { AuthNavigationProp } from '../../types/navigation';
import { LoadingScreen } from '../../components/common/LoadingScreen';

interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Document {
  id: string;
  type: string;
  name: string;
  required: boolean;
  uploaded: boolean;
}

const AVAILABLE_SKILLS: Skill[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'pipe-wrench',
    description: 'Pipes, faucets, water systems',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: 'lightning-bolt',
    description: 'Wiring, outlets, electrical repairs',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    icon: 'saw-blade',
    description: 'Wood work, furniture, installations',
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: 'format-paint',
    description: 'Interior/exterior painting',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'broom',
    description: 'Deep cleaning, maintenance',
  },
  {
    id: 'appliance-repair',
    name: 'Appliance Repair',
    icon: 'washing-machine',
    description: 'Home appliances, electronics',
  },
  {
    id: 'hvac',
    name: 'HVAC',
    icon: 'air-conditioner',
    description: 'Heating, cooling systems',
  },
  {
    id: 'handyman',
    name: 'General Handyman',
    icon: 'hammer-wrench',
    description: 'Multiple repair services',
  },
];

const REQUIRED_DOCUMENTS: Document[] = [
  {
    id: 'id-proof',
    type: 'ID Proof',
    name: 'Government ID (Aadhaar, PAN, Driving License)',
    required: true,
    uploaded: false,
  },
  {
    id: 'address-proof',
    type: 'Address Proof',
    name: 'Address verification document',
    required: true,
    uploaded: false,
  },
  {
    id: 'certification',
    type: 'Certification',
    name: 'Skill certification or experience letter',
    required: true,
    uploaded: false,
  },
  {
    id: 'background-check',
    type: 'Background Check',
    name: 'Police verification (if available)',
    required: false,
    uploaded: false,
  },
];

export const SkillsSetupScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<AuthNavigationProp>();
  const { engineerId } = route.params as { engineerId: string };
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [documents, setDocuments] = useState<Document[]>(REQUIRED_DOCUMENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleDocumentUpload = (documentId: string) => {
    // TODO: Implement document upload functionality
    Alert.alert('Document Upload', 'Document upload feature will be available soon');
    
    // Mock document upload
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId
          ? { ...doc, uploaded: true }
          : doc
      )
    );
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedSkills.length >= 1;
      case 2:
        return bio.trim().length >= 50 && hourlyRate.trim() !== '';
      case 3:
        const requiredDocs = documents.filter(doc => doc.required);
        const uploadedRequiredDocs = requiredDocs.filter(doc => doc.uploaded);
        return uploadedRequiredDocs.length === requiredDocs.length;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      let message = '';
      switch (currentStep) {
        case 1:
          message = 'Please select at least one skill';
          break;
        case 2:
          message = 'Please complete your profile information';
          break;
        case 3:
          message = 'Please upload all required documents';
          break;
      }
      Alert.alert('Incomplete Information', message);
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // TODO: Submit profile setup data to API
      // const profileData = {
      //   engineer_id: engineerId,
      //   skills: selectedSkills,
      //   bio,
      //   hourly_rate: parseFloat(hourlyRate),
      //   documents: documents.filter(doc => doc.uploaded),
      // };
      // await engineerApi.setupProfile(profileData);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Profile Setup Complete!',
        'Your engineer profile has been set up successfully. Our team will review your documents and activate your account within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      
    } catch (error: any) {
      console.error('Profile setup error:', error);
      Alert.alert(
        'Setup Failed',
        error?.response?.data?.message || 'Failed to complete profile setup. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderSkillsSelection();
      case 2:
        return renderProfileSetup();
      case 3:
        return renderDocumentUpload();
      default:
        return null;
    }
  };

  const renderSkillsSelection = () => (
    <View>
      <Text style={styles.stepTitle}>Select Your Skills</Text>
      <Text style={styles.stepDescription}>
        Choose the services you can provide. You can add more skills later.
      </Text>

      <View style={styles.skillsGrid}>
        {AVAILABLE_SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill.id}
            style={[
              styles.skillCard,
              selectedSkills.includes(skill.id) && styles.skillCardSelected,
            ]}
            onPress={() => toggleSkill(skill.id)}
          >
            <Icon
              name={skill.icon}
              size={32}
              color={
                selectedSkills.includes(skill.id)
                  ? theme.colors.primary
                  : theme.colors.disabled
              }
            />
            <Text
              style={[
                styles.skillName,
                selectedSkills.includes(skill.id) && styles.skillNameSelected,
              ]}
            >
              {skill.name}
            </Text>
            <Text style={styles.skillDescription}>{skill.description}</Text>
            
            {selectedSkills.includes(skill.id) && (
              <View style={styles.selectedIndicator}>
                <Icon name="check" size={16} color={theme.colors.surface} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProfileSetup = () => (
    <View>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepDescription}>
        Tell customers about yourself and set your rates.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Professional Bio *</Text>
        <TextInput
          style={[styles.textArea, bio.length < 50 && styles.inputError]}
          placeholder="Describe your experience, expertise, and what makes you a great engineer..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={theme.colors.placeholder}
        />
        <Text style={styles.characterCount}>{bio.length}/200 (minimum 50 characters)</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Hourly Rate (₹) *</Text>
        <View style={styles.rateContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.rateInput}
            placeholder="500"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.placeholder}
          />
          <Text style={styles.rateUnit}>/hour</Text>
        </View>
        <Text style={styles.helpText}>
          Set a competitive rate based on your skills and experience. You can adjust this later.
        </Text>
      </View>
    </View>
  );

  const renderDocumentUpload = () => (
    <View>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.stepDescription}>
        Upload required documents for verification. This helps build trust with customers.
      </Text>

      <View style={styles.documentsContainer}>
        {documents.map((document) => (
          <View key={document.id} style={styles.documentCard}>
            <View style={styles.documentInfo}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentType}>{document.type}</Text>
                {document.required && (
                  <Text style={styles.requiredBadge}>Required</Text>
                )}
              </View>
              <Text style={styles.documentName}>{document.name}</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.uploadButton,
                document.uploaded && styles.uploadedButton,
              ]}
              onPress={() => handleDocumentUpload(document.id)}
            >
              <Icon
                name={document.uploaded ? 'check' : 'upload'}
                size={20}
                color={
                  document.uploaded
                    ? theme.colors.success
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.uploadButtonText,
                  document.uploaded && styles.uploadedButtonText,
                ]}
              >
                {document.uploaded ? 'Uploaded' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Profile</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
              ]}
            >
              <Text
                style={[
                  styles.progressNumber,
                  currentStep >= step && styles.progressNumberActive,
                ]}
              >
                {step}
              </Text>
            </View>
            {step < 3 && (
              <View
                style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !validateCurrentStep() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!validateCurrentStep()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 3 ? 'Complete Setup' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: theme.colors.surface,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.disabled,
  },
  progressNumberActive: {
    color: theme.colors.surface,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.backdrop,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: theme.colors.disabled,
    marginBottom: 24,
    lineHeight: 22,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skillCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  skillCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  skillNameSelected: {
    color: theme.colors.primary,
  },
  skillDescription: {
    fontSize: 14,
    color: theme.colors.disabled,
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.disabled,
    textAlign: 'right',
    marginTop: 4,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    paddingHorizontal: 16,
    height: 48,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  rateUnit: {
    fontSize: 16,
    color: theme.colors.disabled,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 4,
    lineHeight: 16,
  },
  documentsContainer: {
    marginTop: 8,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginRight: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  requiredBadge: {
    backgroundColor: theme.colors.warning,
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  documentName: {
    fontSize: 14,
    color: theme.colors.disabled,
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadedButton: {
    backgroundColor: theme.colors.success,
  },
  uploadButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  uploadedButtonText: {
    color: theme.colors.surface,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  nextButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SkillsSetupScreen;