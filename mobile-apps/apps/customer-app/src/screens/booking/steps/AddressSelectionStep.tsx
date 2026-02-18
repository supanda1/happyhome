/**
 * Address Selection Step
 * Third step of booking flow - select service address
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Button, Card, Input, theme } from '@household-services/ui-kit';
import { useForm, Controller } from 'react-hook-form';

interface Props {
  bookingData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  additionalInfo?: string;
}

export const AddressSelectionStep: React.FC<Props> = ({
  bookingData,
  onNext,
  isLoading,
}) => {
  const { control, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    defaultValues: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      additionalInfo: '',
    },
  });

  const handleContinue = (data: AddressForm) => {
    onNext({
      address: data,
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: theme.spacing[4], flex: 1 }}>
        <Text style={[
          theme.typography.heading.h3,
          { color: theme.colors.gray[900], marginBottom: theme.spacing[6] }
        ]}>
          Where should we come?
        </Text>

        <Card style={{ padding: theme.spacing[4], marginBottom: theme.spacing[6] }}>
          <Controller
            control={control}
            name="street"
            rules={{ required: 'Street address is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Street Address"
                placeholder="123 Main Street"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.street?.message}
                style={{ marginBottom: theme.spacing[4] }}
              />
            )}
          />

          <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
            <Controller
              control={control}
              name="city"
              rules={{ required: 'City is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="City"
                  placeholder="New York"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.city?.message}
                  style={{ flex: 1 }}
                />
              )}
            />

            <Controller
              control={control}
              name="state"
              rules={{ required: 'State is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="State"
                  placeholder="NY"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.state?.message}
                  style={{ flex: 1 }}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="zipCode"
            rules={{ required: 'ZIP code is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="ZIP Code"
                placeholder="10001"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.zipCode?.message}
                keyboardType="numeric"
                style={{ marginBottom: theme.spacing[4] }}
              />
            )}
          />

          <Controller
            control={control}
            name="additionalInfo"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Additional Information (Optional)"
                placeholder="Apartment number, gate code, etc."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
              />
            )}
          />
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
          onPress={handleSubmit(handleContinue)}
          disabled={isLoading}
        >
          Continue to Details
        </Button>
      </View>
    </ScrollView>
  );
};

export default AddressSelectionStep;