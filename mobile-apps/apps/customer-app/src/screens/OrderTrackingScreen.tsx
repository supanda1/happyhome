/**
 * Order Tracking Screen
 * Track order status and progress
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, theme } from '@household-services/ui-kit';
import { MainScreenProps } from '../types/navigation';

export const OrderTrackingScreen: React.FC<MainScreenProps<'OrderTracking'>> = ({ navigation, route }) => {
  const { orderId } = route.params;

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
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
          { color: theme.colors.gray[900] }
        ]}>
          Order Tracking
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: theme.spacing[4] }}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing[12] }}>
          <Icon name="clipboard-list" size={64} color={theme.colors.gray[400]} />
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[600], textAlign: 'center', marginTop: theme.spacing[4] }
          ]}>
            Order tracking for #{orderId} coming soon
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderTrackingScreen;