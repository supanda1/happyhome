/**
 * Booking Confirmation Step
 * Final step - confirm and complete booking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, theme } from '@household-services/ui-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

interface Props {
  bookingData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
  onComplete: () => void;
  isLoading: boolean;
}

export const BookingConfirmationStep: React.FC<Props> = ({
  bookingData,
  onComplete,
  isLoading,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmBooking = async () => {
    try {
      setIsProcessing(true);
      
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success alert
      Alert.alert(
        'Booking Confirmed!',
        'Your service has been booked successfully. You will receive a confirmation email shortly.',
        [{
          text: 'View Order',
          onPress: onComplete,
        }]
      );
      
    } catch (error) {
      Alert.alert(
        'Booking Failed',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Address not provided';
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const getPaymentMethodLabel = (paymentMethod: any) => {
    switch (paymentMethod?.type) {
      case 'online':
        return 'Pay Online';
      case 'cash':
        return 'Cash on Delivery';
      case 'card':
        return 'Credit Card';
      default:
        return 'Not selected';
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: theme.spacing[4], flex: 1 }}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing[6] }}>
          <View style={{
            backgroundColor: theme.colors.success[50],
            borderRadius: 40,
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing[4],
          }}>
            <Icon name="check-circle" size={40} color={theme.colors.success[500]} />
          </View>
          
          <Text style={[
            theme.typography.heading.h3,
            { color: theme.colors.gray[900], textAlign: 'center', marginBottom: theme.spacing[2] }
          ]}>
            Review Your Booking
          </Text>
          
          <Text style={[
            theme.typography.body.base,
            { color: theme.colors.gray[600], textAlign: 'center' }
          ]}>
            Please review the details below before confirming
          </Text>
        </View>

        {/* Booking Summary */}
        <Card style={{ padding: theme.spacing[4], marginBottom: theme.spacing[4] }}>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[4] }
          ]}>
            Booking Summary
          </Text>
          
          {/* Service */}
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
            <Icon name="wrench" size={20} color={theme.colors.gray[500]} style={{ marginRight: theme.spacing[3], marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[600] }
              ]}>Service</Text>
              <Text style={[
                theme.typography.body.base,
                { color: theme.colors.gray[900], fontWeight: '600' }
              ]}>               {bookingData.serviceName || 'Professional Plumbing Repair'}
              </Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
            <Icon name="calendar-clock" size={20} color={theme.colors.gray[500]} style={{ marginRight: theme.spacing[3], marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[600] }
              ]}>Date & Time</Text>
              <Text style={[
                theme.typography.body.base,
                { color: theme.colors.gray[900], fontWeight: '600' }
              ]}>
                {bookingData.selectedDate ? 
                  format(new Date(bookingData.selectedDate), 'MMM dd, yyyy')
                  : 'Date not selected'
                } at {bookingData.selectedTime || 'Time not selected'}
              </Text>
            </View>
          </View>

          {/* Address */}
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
            <Icon name="map-marker" size={20} color={theme.colors.gray[500]} style={{ marginRight: theme.spacing[3], marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[600] }
              ]}>Address</Text>
              <Text style={[
                theme.typography.body.base,
                { color: theme.colors.gray[900], fontWeight: '600' }
              ]}>
                {formatAddress(bookingData.address)}
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
            <Icon name="credit-card" size={20} color={theme.colors.gray[500]} style={{ marginRight: theme.spacing[3], marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[600] }
              ]}>Payment Method</Text>
              <Text style={[
                theme.typography.body.base,
                { color: theme.colors.gray[900], fontWeight: '600' }
              ]}>
                {getPaymentMethodLabel(bookingData.paymentMethod)}
              </Text>
            </View>
          </View>

          {/* Special Instructions */}
          {bookingData.specialInstructions && (
            <View style={{ flexDirection: 'row' }}>
              <Icon name="text" size={20} color={theme.colors.gray[500]} style={{ marginRight: theme.spacing[3], marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[600] }
                ]}>Special Instructions</Text>
                <Text style={[
                  theme.typography.body.base,
                  { color: theme.colors.gray[900] }
                ]}>
                  {bookingData.specialInstructions}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Price Breakdown */}
        <Card style={{ padding: theme.spacing[4] }}>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[4] }
          ]}>
            Price Breakdown
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
              Service Fee
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
              theme.typography.heading.h4,
              { color: theme.colors.gray[900] }
            ]}>
              Total Amount
            </Text>
            <Text style={[
              theme.typography.heading.h4,
              { color: theme.colors.primary[600] }
            ]}>
              ${bookingData.totalAmount || 120}
            </Text>
          </View>
        </Card>
      </View>

      {/* Confirm Button */}
      <View style={{
        padding: theme.spacing[4],
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
      }}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleConfirmBooking}
          disabled={isProcessing || isLoading}
          loading={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default BookingConfirmationStep;