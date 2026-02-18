/**
 * Booking Flow Screen
 * Multi-step service booking process
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, theme, Loading } from '@household-services/ui-kit';
import { useDataSync } from '@household-services/shared';
import { MainScreenProps } from '../../types/navigation';

// Import step components
import ServiceSelectionStep from './steps/ServiceSelectionStep';
import DateTimeSelectionStep from './steps/DateTimeSelectionStep';
import AddressSelectionStep from './steps/AddressSelectionStep';
import BookingDetailsStep from './steps/BookingDetailsStep';
import PaymentStep from './steps/PaymentStep';
import BookingConfirmationStep from './steps/BookingConfirmationStep';

type BookingStep = 
  | 'service'
  | 'datetime' 
  | 'address' 
  | 'details' 
  | 'payment' 
  | 'confirmation';

interface BookingData {
  serviceId: string;
  serviceName?: string;
  selectedDate?: string;
  selectedTime?: string;
  address?: {
    id?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    additionalInfo?: string;
  };
  specialInstructions?: string;
  urgency?: 'standard' | 'urgent' | 'emergency';
  paymentMethod?: {
    type: 'card' | 'cash' | 'online';
    cardId?: string;
  };
  totalAmount?: number;
  bookingId?: string;
}

const STEPS: { key: BookingStep; title: string; icon: string }[] = [
  { key: 'service', title: 'Service', icon: 'wrench' },
  { key: 'datetime', title: 'Date & Time', icon: 'calendar-clock' },
  { key: 'address', title: 'Address', icon: 'map-marker' },
  { key: 'details', title: 'Details', icon: 'text' },
  { key: 'payment', title: 'Payment', icon: 'credit-card' },
  { key: 'confirmation', title: 'Confirm', icon: 'check-circle' },
];

export const BookingFlowScreen: React.FC<MainScreenProps<'BookingFlow'>> = ({ 
  navigation, 
  route 
}) => {
  const { serviceId } = route.params;
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get service data
  const { data: service } = useDataSync(`service-${serviceId}`);

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleGoBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    } else {
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          { text: 'Continue Booking', style: 'cancel' },
          { 
            text: 'Cancel', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          },
        ]
      );
    }
  };

  const handleNext = (stepData?: Partial<BookingData>) => {
    // Update booking data with step data
    if (stepData) {
      setBookingData(prev => ({ ...prev, ...stepData }));
    }

    // Move to next step
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const handleStepSelect = (step: BookingStep) => {
    const stepIndex = STEPS.findIndex(s => s.key === step);
    if (stepIndex <= currentStepIndex) {
      setCurrentStep(step);
    }
  };

  const handleBookingComplete = () => {
    navigation.navigate('OrderTracking', { orderId: bookingData.bookingId || '12345' });
  };

  const renderStepContent = () => {
    const commonProps = {
      bookingData,
      onNext: handleNext,
      onBack: handleGoBack,
      isLoading,
    };

    switch (currentStep) {
      case 'service':
        return (
          <ServiceSelectionStep
            {...commonProps}
            service={service}
          />
        );
      case 'datetime':
        return (
          <DateTimeSelectionStep
            {...commonProps}
          />
        );
      case 'address':
        return (
          <AddressSelectionStep
            {...commonProps}
          />
        );
      case 'details':
        return (
          <BookingDetailsStep
            {...commonProps}
          />
        );
      case 'payment':
        return (
          <PaymentStep
            {...commonProps}
          />
        );
      case 'confirmation':
        return (
          <BookingConfirmationStep
            {...commonProps}
            onComplete={handleBookingComplete}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loading message="Processing your booking..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Header with Progress */}
      <View style={{
        backgroundColor: theme.colors.white,
        paddingBottom: theme.spacing[4],
        ...theme.shadows.sm,
      }}>
        {/* Navigation Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        }}>
          <TouchableOpacity onPress={handleGoBack} style={{ marginRight: theme.spacing[4] }}>
            <Icon name="arrow-left" size={24} color={theme.colors.gray[700]} />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={[
              theme.typography.heading.h3,
              { color: theme.colors.gray[900] }
            ]}>
              Book Service
            </Text>
            <Text style={[
              theme.typography.body.sm,
              { color: theme.colors.gray[600] }
            ]}>
              Step {currentStepIndex + 1} of {STEPS.length}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{
          backgroundColor: theme.colors.gray[200],
          height: 4,
          marginHorizontal: theme.spacing[4],
          borderRadius: 2,
          marginBottom: theme.spacing[3],
        }}>
          <View style={{
            backgroundColor: theme.colors.primary[500],
            height: '100%',
            width: `${progress}%`,
            borderRadius: 2,
          }} />
        </View>

        {/* Step Indicators */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing[4],
          }}
        >
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;
            const isAccessible = index <= currentStepIndex;

            return (
              <TouchableOpacity
                key={step.key}
                onPress={() => handleStepSelect(step.key)}
                disabled={!isAccessible}
                style={{
                  alignItems: 'center',
                  marginRight: theme.spacing[6],
                  opacity: isAccessible ? 1 : 0.5,
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isCompleted 
                    ? theme.colors.success[500]
                    : isActive 
                      ? theme.colors.primary[500] 
                      : theme.colors.gray[300],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: theme.spacing[2],
                }}>
                  <Icon
                    name={isCompleted ? 'check' : step.icon}
                    size={16}
                    color={isActive || isCompleted ? theme.colors.white : theme.colors.gray[600]}
                  />
                </View>
                
                <Text style={[
                  theme.typography.body.xs,
                  {
                    color: isActive 
                      ? theme.colors.primary[600] 
                      : isCompleted
                        ? theme.colors.success[600]
                        : theme.colors.gray[600],
                    fontWeight: isActive ? '600' : 'normal',
                    textAlign: 'center',
                  }
                ]}>
                  {step.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Step Content */}
      <View style={{ flex: 1 }}>
        {renderStepContent()}
      </View>
    </SafeAreaView>
  );
};

export default BookingFlowScreen;