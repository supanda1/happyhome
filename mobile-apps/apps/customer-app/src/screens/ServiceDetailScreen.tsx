/**
 * Service Detail Screen
 * Detailed view of a service with booking options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, Badge, theme, Loading } from '@household-services/ui-kit';
import { useDataSync, useRealTimeData, usePullToRefresh } from '@household-services/shared';
import { MainScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  categoryId: string;
  icon: string;
  images: string[];
  pricing: {
    basePrice: number;
    currency: string;
    priceType: 'fixed' | 'hourly' | 'custom';
    estimatedDuration?: number;
  };
  features: string[];
  includedServices: string[];
  additionalInfo?: string[];
  rating: number;
  reviewCount: number;
  providerInfo?: {
    totalProviders: number;
    averageExperience: number;
  };
  availability: {
    nextAvailable: string;
    timeSlots: string[];
  };
}

export const ServiceDetailScreen: React.FC<MainScreenProps<'ServiceDetail'>> = ({ 
  navigation, 
  route 
}) => {
  const { serviceId } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Use sync hooks for data management
  const { data: service, loading, error, refresh } = useDataSync<ServiceDetail>(`service-${serviceId}`);
  const { pricing, availability } = useRealTimeData(serviceId);
  const { refreshing, onRefresh } = usePullToRefresh([`service-${serviceId}`]);

  // Mock service data for demonstration
  const mockService: ServiceDetail = {
    id: serviceId,
    name: 'Professional Plumbing Repair',
    description: 'Expert plumbing services for all your home needs',
    longDescription: 'Our certified plumbers provide comprehensive plumbing solutions including leak repairs, pipe installations, drain cleaning, and fixture replacements. We use high-quality materials and offer a satisfaction guarantee on all our work.',
    category: 'Plumbing',
    categoryId: 'plumbing',
    icon: 'pipe-wrench',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    ],
    pricing: {
      basePrice: 120,
      currency: 'USD',
      priceType: 'fixed',
      estimatedDuration: 120, // 2 hours
    },
    features: [
      '24/7 Emergency Service',
      'Licensed & Insured',
      'Free Estimates',
      '1-Year Warranty',
      'Same-Day Service',
    ],
    includedServices: [
      'Leak Detection & Repair',
      'Pipe Installation',
      'Drain Cleaning',
      'Fixture Replacement',
      'Water Pressure Assessment',
    ],
    additionalInfo: [
      'Service includes basic materials',
      'Additional parts charged separately',
      'Emergency service available 24/7 with surcharge',
    ],
    rating: 4.8,
    reviewCount: 156,
    providerInfo: {
      totalProviders: 12,
      averageExperience: 8,
    },
    availability: {
      nextAvailable: '2024-01-20T10:00:00Z',
      timeSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    },
  };

  const displayService = service || mockService;
  const currentPricing = pricing || displayService.pricing;
  const currentAvailability = availability || displayService.availability;

  const handleBookService = () => {
    navigation.navigate('BookingFlow', { serviceId: displayService.id });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refresh()]);
  };

  if (loading && !displayService) {
    return <Loading message="Loading service details..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.white }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
      }}>
        <TouchableOpacity onPress={handleGoBack} style={{ marginRight: theme.spacing[4] }}>
          <Icon name="arrow-left" size={24} color={theme.colors.gray[700]} />
        </TouchableOpacity>
        
        <Text style={[
          theme.typography.heading.h3,
          { color: theme.colors.gray[900], flex: 1 }
        ]}>
          Service Details
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Service Images */}
        <View style={{ height: 250, backgroundColor: theme.colors.gray[100] }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const imageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(imageIndex);
            }}
          >
            {displayService.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width, height: 250 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={{
            position: 'absolute',
            bottom: theme.spacing[4],
            alignSelf: 'center',
            flexDirection: 'row',
          }}>
            {displayService.images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === selectedImageIndex 
                    ? theme.colors.white 
                    : 'rgba(255, 255, 255, 0.5)',
                  marginHorizontal: 3,
                }}
              />
            ))}
          </View>
        </View>

        {/* Service Info */}
        <View style={{ padding: theme.spacing[4] }}>
          {/* Header Info */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing[3],
          }}>
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.heading.h2,
                {
                  color: theme.colors.gray[900],
                  marginBottom: theme.spacing[2],
                }
              ]}>
                {displayService.name}
              </Text>
              
              <Badge variant="info" size="sm">
                {displayService.category}
              </Badge>
            </View>
          </View>

          {/* Rating */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing[4],
          }}>
            <View style={{ flexDirection: 'row', marginRight: theme.spacing[2] }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name="star"
                  size={16}
                  color={star <= displayService.rating 
                    ? theme.colors.warning[500] 
                    : theme.colors.gray[300]
                  }
                />
              ))}
            </View>
            <Text style={[
              theme.typography.body.base,
              { color: theme.colors.gray[600] }
            ]}>
              {displayService.rating} ({displayService.reviewCount} reviews)
            </Text>
          </View>

          {/* Description */}
          <Text style={[
            theme.typography.body.base,
            {
              color: theme.colors.gray[700],
              lineHeight: 22,
              marginBottom: theme.spacing[6],
            }
          ]}>
            {displayService.longDescription || displayService.description}
          </Text>

          {/* Pricing Card */}
          <Card style={{ padding: theme.spacing[4], marginBottom: theme.spacing[6] }}>
            <Text style={[
              theme.typography.heading.h4,
              {
                color: theme.colors.gray[900],
                marginBottom: theme.spacing[3],
              }
            ]}>
              Pricing
            </Text>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View>
                <Text style={[
                  theme.typography.heading.h2,
                  { color: theme.colors.primary[600] }
                ]}>
                  ${currentPricing.basePrice}
                </Text>
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[600] }
                ]}>
                  {currentPricing.priceType === 'hourly' ? 'per hour' : 'fixed price'}
                </Text>
              </View>
              
              {displayService.pricing.estimatedDuration && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[
                    theme.typography.body.base,
                    { color: theme.colors.gray[700] }
                  ]}>
                    Est. Duration
                  </Text>
                  <Text style={[
                    theme.typography.body.base,
                    { color: theme.colors.gray[900], fontWeight: '600' }
                  ]}>
                    {Math.floor(displayService.pricing.estimatedDuration / 60)}h{' '}
                    {displayService.pricing.estimatedDuration % 60 > 0 && 
                      `${displayService.pricing.estimatedDuration % 60}m`
                    }
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* What's Included */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <Text style={[
              theme.typography.heading.h4,
              {
                color: theme.colors.gray[900],
                marginBottom: theme.spacing[3],
              }
            ]}>
              What's Included
            </Text>
            
            {displayService.includedServices.map((service, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing[2],
                }}
              >
                <Icon
                  name="check-circle"
                  size={16}
                  color={theme.colors.success[500]}
                  style={{ marginRight: theme.spacing[3] }}
                />
                <Text style={[
                  theme.typography.body.base,
                  { color: theme.colors.gray[700], flex: 1 }
                ]}>
                  {service}
                </Text>
              </View>
            ))}
          </View>

          {/* Features */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <Text style={[
              theme.typography.heading.h4,
              {
                color: theme.colors.gray[900],
                marginBottom: theme.spacing[3],
              }
            ]}>
              Service Features
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -theme.spacing[1],
            }}>
              {displayService.features.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: theme.colors.primary[50],
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[2],
                    borderRadius: 16,
                    margin: theme.spacing[1],
                  }}
                >
                  <Text style={[
                    theme.typography.body.sm,
                    {
                      color: theme.colors.primary[700],
                      fontWeight: '600',
                    }
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Additional Info */}
          {displayService.additionalInfo && displayService.additionalInfo.length > 0 && (
            <View style={{ marginBottom: theme.spacing[6] }}>
              <Text style={[
                theme.typography.heading.h4,
                {
                  color: theme.colors.gray[900],
                  marginBottom: theme.spacing[3],
                }
              ]}>
                Additional Information
              </Text>
              
              {displayService.additionalInfo.map((info, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: theme.spacing[2],
                  }}
                >
                  <Icon
                    name="information"
                    size={16}
                    color={theme.colors.gray[500]}
                    style={{ marginRight: theme.spacing[3], marginTop: 2 }}
                  />
                  <Text style={[
                    theme.typography.body.sm,
                    { color: theme.colors.gray[600], flex: 1 }
                  ]}>
                    {info}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Provider Info */}
          {displayService.providerInfo && (
            <Card style={{ padding: theme.spacing[4], marginBottom: theme.spacing[8] }}>
              <Text style={[
                theme.typography.heading.h4,
                {
                  color: theme.colors.gray[900],
                  marginBottom: theme.spacing[3],
                }
              ]}>
                Our Professionals
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={[
                    theme.typography.heading.h3,
                    { color: theme.colors.primary[600], marginBottom: theme.spacing[1] }
                  ]}>
                    {displayService.providerInfo.totalProviders}+
                  </Text>
                  <Text style={[
                    theme.typography.body.sm,
                    { color: theme.colors.gray[600], textAlign: 'center' }
                  ]}>
                    Certified{'\n'}Professionals
                  </Text>
                </View>
                
                <View style={{
                  width: 1,
                  backgroundColor: theme.colors.gray[200],
                  marginHorizontal: theme.spacing[4],
                }} />
                
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={[
                    theme.typography.heading.h3,
                    { color: theme.colors.primary[600], marginBottom: theme.spacing[1] }
                  ]}>
                    {displayService.providerInfo.averageExperience}+
                  </Text>
                  <Text style={[
                    theme.typography.body.sm,
                    { color: theme.colors.gray[600], textAlign: 'center' }
                  ]}>
                    Years Average{'\n'}Experience
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={{
        padding: theme.spacing[4],
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        ...theme.shadows.sm,
      }}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleBookService}
        >
          Book This Service
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ServiceDetailScreen;