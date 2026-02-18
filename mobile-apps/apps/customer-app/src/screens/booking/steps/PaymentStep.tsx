/**
 * Payment Step
 * Fifth step - payment method selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, Card, theme } from '@household-services/ui-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  bookingData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

type PaymentMethod = 'card' | 'cash' | 'online';

const PAYMENT_OPTIONS = [
  {
    value: 'online' as PaymentMethod,
    label: 'Pay Online',
    description: 'Secure online payment',
    icon: 'credit-card',
    recommended: true,
  },
  {
    value: 'cash' as PaymentMethod,
    label: 'Cash on Delivery',
    description: 'Pay when service is complete',
    icon: 'cash',
  },
];

export const PaymentStep: React.FC<Props> = ({
  bookingData,
  onNext,
  isLoading,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('online');

  const handleContinue = () => {
    onNext({
      paymentMethod: {
        type: selectedPayment,
      },
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: theme.spacing[4], flex: 1 }}>
        <Text style={[
          theme.typography.heading.h3,
          { color: theme.colors.gray[900], marginBottom: theme.spacing[6] }
        ]}>
          Payment Method
        </Text>

        {/* Payment Options */}
        <View style={{ marginBottom: theme.spacing[6] }}>
          {PAYMENT_OPTIONS.map((option) => {
            const isSelected = selectedPayment === option.value;
            
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedPayment(option.value)}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[
                        theme.typography.body.lg,
                        {
                          fontWeight: '600',
                          color: isSelected ? theme.colors.primary[700] : theme.colors.gray[900],
                        }
                      ]}>
                        {option.label}
                      </Text>
                      
                      {option.recommended && (
                        <View style={{
                          backgroundColor: theme.colors.success[500],
                          paddingHorizontal: theme.spacing[2],
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginLeft: theme.spacing[2],
                        }}>
                          <Text style={[
                            theme.typography.body.xs,
                            { color: theme.colors.white, fontWeight: '600' }
                          ]}>
                            RECOMMENDED
                          </Text>
                        </View>
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
                  
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[300],
                    backgroundColor: isSelected ? theme.colors.primary[500] : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {isSelected && (
                      <Icon name="check" size={12} color={theme.colors.white} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order Summary */}
        <Card style={{ padding: theme.spacing[4] }}>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
          ]}>
            Order Summary
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[2],
          }}>
            <Text style={[
              theme.typography.body.base,
              { color: theme.colors.gray[700] }
            ]}>
              {bookingData.serviceName || 'Service'}
            </Text>
            <Text style={[
              theme.typography.body.base,
              { color: theme.colors.gray[900], fontWeight: '600' }
            ]}>
              ${bookingData.totalAmount || 120}
            </Text>
          </View>
          
          <View style={{
            borderTopWidth: 1,
            borderTopColor: theme.colors.gray[200],
            paddingTop: theme.spacing[3],
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <Text style={[
              theme.typography.body.lg,
              { color: theme.colors.gray[900], fontWeight: 'bold' }
            ]}>
              Total Amount
            </Text>
            <Text style={[
              theme.typography.body.lg,
              { color: theme.colors.primary[600], fontWeight: 'bold' }
            ]}>
              ${bookingData.totalAmount || 120}
            </Text>
          </View>
        </Card>
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
          Continue to Confirmation
        </Button>
      </View>
    </ScrollView>
  );
};

export default PaymentStep;