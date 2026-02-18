import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';
import type { AuthNavigationProp } from '../../types/navigation';
import { LoadingScreen } from '../../components/common/LoadingScreen';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  experience: string;
  primarySkill: string;
  city: string;
  referralCode?: string;
}

const EXPERIENCE_OPTIONS = [
  { label: 'Select Experience', value: '' },
  { label: '0-1 years', value: '0-1' },
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5-10 years', value: '5-10' },
  { label: '10+ years', value: '10+' },
];

const SKILL_OPTIONS = [
  { label: 'Select Primary Skill', value: '' },
  { label: 'Plumbing', value: 'plumbing' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Carpentry', value: 'carpentry' },
  { label: 'Painting', value: 'painting' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Appliance Repair', value: 'appliance-repair' },
  { label: 'HVAC', value: 'hvac' },
  { label: 'Handyman', value: 'handyman' },
];

export const EngineerRegistrationScreen = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    experience: '',
    primarySkill: '',
    city: '',
    referralCode: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Experience validation
    if (!formData.experience) {
      newErrors.experience = 'Please select your experience level';
    }

    // Primary skill validation
    if (!formData.primarySkill) {
      newErrors.primarySkill = 'Please select your primary skill';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual registration API call
      // const response = await engineerApi.register({
      //   first_name: formData.firstName,
      //   last_name: formData.lastName,
      //   email: formData.email,
      //   phone: formData.phone,
      //   password: formData.password,
      //   experience: formData.experience,
      //   primary_skill: formData.primarySkill,
      //   city: formData.city,
      //   referral_code: formData.referralCode || undefined,
      // });
      
      // Mock registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Application Submitted!',
        'Your engineer application has been submitted successfully. We will review your profile and contact you within 2-3 business days.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to skills setup or back to login
              // navigation.navigate('SkillsSetup', { engineerId: 'mock-id' });
              navigation.navigate('Login');
            },
          },
        ]
      );
      
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
            <Icon name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Join Our Team</Text>
          <Text style={styles.subtitle}>Become a Happy Homes Professional</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          {/* Personal Information */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                autoCapitalize="words"
                returnKeyType="next"
                placeholderTextColor={theme.colors.placeholder}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>
            
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                autoCapitalize="words"
                returnKeyType="next"
                placeholderTextColor={theme.colors.placeholder}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              placeholderTextColor={theme.colors.placeholder}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="9876543210"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="next"
              placeholderTextColor={theme.colors.placeholder}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Professional Information */}
          <Text style={styles.sectionTitle}>Professional Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Experience Level *</Text>
            <TouchableOpacity 
              style={[styles.pickerContainer, errors.experience && styles.inputError]}
              onPress={() => setShowExperiencePicker(true)}
            >
              <Text style={styles.pickerText}>
                {EXPERIENCE_OPTIONS.find(opt => opt.value === formData.experience)?.label || 'Select Experience Level'}
              </Text>
              <Icon name="chevron-down" size={20} color={theme.colors.disabled} />
            </TouchableOpacity>
            {errors.experience && (
              <Text style={styles.errorText}>{errors.experience}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Primary Skill *</Text>
            <TouchableOpacity 
              style={[styles.pickerContainer, errors.primarySkill && styles.inputError]}
              onPress={() => setShowSkillPicker(true)}
            >
              <Text style={styles.pickerText}>
                {SKILL_OPTIONS.find(opt => opt.value === formData.primarySkill)?.label || 'Select Primary Skill'}
              </Text>
              <Icon name="chevron-down" size={20} color={theme.colors.disabled} />
            </TouchableOpacity>
            {errors.primarySkill && (
              <Text style={styles.errorText}>{errors.primarySkill}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Your city"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              autoCapitalize="words"
              returnKeyType="next"
              placeholderTextColor={theme.colors.placeholder}
            />
            {errors.city && (
              <Text style={styles.errorText}>{errors.city}</Text>
            )}
          </View>

          {/* Account Security */}
          <Text style={styles.sectionTitle}>Account Security</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.inputWithIcon, errors.password && styles.inputError]}
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                placeholderTextColor={theme.colors.placeholder}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={theme.colors.disabled} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.inputWithIcon, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="next"
                placeholderTextColor={theme.colors.placeholder}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={theme.colors.disabled} 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Optional Information */}
          <Text style={styles.sectionTitle}>Optional Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Referral Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code if you have one"
              value={formData.referralCode}
              onChangeText={(value) => handleInputChange('referralCode', value)}
              autoCapitalize="characters"
              returnKeyType="done"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Submit Application</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Experience Picker Modal */}
      <Modal visible={showExperiencePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Experience Level</Text>
              <TouchableOpacity onPress={() => setShowExperiencePicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {EXPERIENCE_OPTIONS.slice(1).map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('experience', option.value);
                    setShowExperiencePicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  {formData.experience === option.value && (
                    <Icon name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Skill Picker Modal */}
      <Modal visible={showSkillPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Primary Skill</Text>
              <TouchableOpacity onPress={() => setShowSkillPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SKILL_OPTIONS.slice(1).map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('primarySkill', option.value);
                    setShowSkillPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  {formData.primarySkill === option.value && (
                    <Icon name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.disabled,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  inputWithIcon: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  passwordToggle: {
    padding: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    height: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  picker: {
    height: 44,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 8,
  },
  loginLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
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
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default EngineerRegistrationScreen;