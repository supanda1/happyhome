/**
 * Booking Details Step
 * Fourth step - special instructions and urgency
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, Card, Input, theme } from '@household-services/ui-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  bookingData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

type UrgencyLevel = 'standard' | 'urgent' | 'emergency';

const URGENCY_OPTIONS = [
  {
    value: 'standard' as UrgencyLevel,
    label: 'Standard',
    description: 'Within 24-48 hours',
    icon: 'clock-outline',
    price: 0,
  },
  {
    value: 'urgent' as UrgencyLevel,
    label: 'Urgent',
    description: 'Same day service',
    icon: 'clock-fast',
    price: 25,
  },
  {
    value: 'emergency' as UrgencyLevel,
    label: 'Emergency',
    description: 'Within 2 hours',
    icon: 'alert-circle',
    price: 50,
  },
];

export const BookingDetailsStep: React.FC<Props> = ({
  bookingData,
  onNext,
  isLoading,
}) => {
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');

  const handleContinue = () => {
    const urgencyOption = URGENCY_OPTIONS.find(opt => opt.value === urgency);
    const totalAmount = (bookingData.totalAmount || 0) + (urgencyOption?.price || 0);
    
    onNext({
      specialInstructions,
      urgency,
      totalAmount,
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: theme.spacing[4], flex: 1 }}>
        <Text style={[
          theme.typography.heading.h3,
          { color: theme.colors.gray[900], marginBottom: theme.spacing[6] }
        ]}>
          Booking Details
        </Text>

        {/* Urgency Selection */}
        <View style={{ marginBottom: theme.spacing[6] }}>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
          ]}>
            Service Urgency
          </Text>
          
          {URGENCY_OPTIONS.map((option) => {
            const isSelected = urgency === option.value;
            
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setUrgency(option.value)}
                style={{
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[200],
                  borderRadius: 8,
                  padding: theme.spacing[4],
                  marginBottom: theme.spacing[3],
                  backgroundColor: isSelected ? theme.colors.primary[50] : theme.colors.white,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon
                    name={option.icon}
                    size={24}
                    color={isSelected ? theme.colors.primary[600] : theme.colors.gray[600]}
                    style={{ marginRight: theme.spacing[3] }}
                  />
                  
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[
                        theme.typography.body.lg,
                        {
                          fontWeight: '600',
                          color: isSelected ? theme.colors.primary[700] : theme.colors.gray[900],
                        }
                      ]}>
                        {option.label}
                      </Text>
                      
                      {option.price > 0 && (
                        <Text style={[
                          theme.typography.body.base,
                          {
                            color: isSelected ? theme.colors.primary[600] : theme.colors.gray[600],
                            fontWeight: '600',
                          }
                        ]}>
                          +${option.price}
                        </Text>
                      )}
                    </View>
                    
                    <Text style={[
                      theme.typography.body.sm,
                      {
                        color: isSelected ? theme.colors.primary[600] : theme.colors.gray[600],
                        marginTop: theme.spacing[1],
                      }
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Special Instructions */}
        <View>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
          ]}>
            Special Instructions (Optional)
          </Text>
          
          <Input
            placeholder="Any specific requirements or instructions for the service provider..."
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={4}
            style={{ height: 100 }}
          />
        </View>
      </View>

      {/* Continue Button */}
      <View style={{
        padding: theme.spacing[4],
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
      }}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={isLoading}
        >
          Continue to Payment
        </Button>
      </View>
    </ScrollView>
  );
};

export default BookingDetailsStep;