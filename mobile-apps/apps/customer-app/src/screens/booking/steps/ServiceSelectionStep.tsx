/**
 * Service Selection Step
 * First step of booking flow - display service details and options
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Button, Card, Badge, theme } from '@household-services/ui-kit';

const { width } = Dimensions.get('window');

interface Props {
  bookingData: any;
  service?: any;
  onNext: (data?: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const ServiceSelectionStep: React.FC<Props> = ({
  bookingData,
  service,
  onNext,
  isLoading,
}) => {
  // Mock service data
  const displayService = service || {
    id: bookingData.serviceId,
    name: 'Professional Plumbing Repair',
    description: 'Expert plumbing services for all your home needs',
    category: 'Plumbing',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    pricing: { basePrice: 120, currency: 'USD', priceType: 'fixed' },
    rating: 4.8,
    reviewCount: 156,
    features: ['24/7 Emergency Service', 'Licensed & Insured', 'Same-Day Service'],
  };

  const handleContinue = () => {
    onNext({
      serviceName: displayService.name,
      totalAmount: displayService.pricing.basePrice,
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Service Image */}
      <View style={{ height: 200, backgroundColor: theme.colors.gray[100] }}>
        <Image
          source={{ uri: displayService.images[0] }}
          style={{ width, height: 200 }}
          resizeMode="cover"
        />
      </View>

      <View style={{ padding: theme.spacing[4], flex: 1 }}>
        {/* Service Info */}
        <View style={{ marginBottom: theme.spacing[6] }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing[3],
          }}>
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.heading.h2,
                { color: theme.colors.gray[900], marginBottom: theme.spacing[2] }
              ]}>
                {displayService.name}
              </Text>
              
              <Badge variant="info" size="sm">
                {displayService.category}
              </Badge>
            </View>
          </View>

          <Text style={[
            theme.typography.body.base,
            { color: theme.colors.gray[700], lineHeight: 22, marginBottom: theme.spacing[4] }
          ]}>
            {displayService.description}
          </Text>

          {/* Features */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text style={[
              theme.typography.heading.h4,
              { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
            ]}>
              Service Features
            </Text>
            
            {displayService.features.map((feature: string, index: number) => (
              <Text
                key={index}
                style={[
                  theme.typography.body.base,
                  { color: theme.colors.gray[700], marginBottom: theme.spacing[2] }
                ]}
              >
                • {feature}
              </Text>
            ))}
          </View>
        </View>

        {/* Pricing Card */}
        <Card style={{ padding: theme.spacing[4], marginBottom: theme.spacing[6] }}>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
          ]}>
            Pricing
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={[
              theme.typography.heading.h2,
              { color: theme.colors.primary[600] }
            ]}>
              ${displayService.pricing.basePrice}
            </Text>
            <Text style={[
              theme.typography.body.sm,
              { color: theme.colors.gray[600] }
            ]}>
              {displayService.pricing.priceType === 'hourly' ? 'per hour' : 'fixed price'}
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
          Continue to Date & Time
        </Button>
      </View>
    </ScrollView>
  );
};

export default ServiceSelectionStep;