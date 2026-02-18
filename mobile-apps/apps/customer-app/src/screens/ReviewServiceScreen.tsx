/**
 * Review Service Screen
 * Rate and review completed service
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

export const ReviewServiceScreen: React.FC<MainScreenProps<'ReviewService'>> = ({ navigation, route }) => {
  const { bookingId } = route.params;

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
          Rate Service
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: theme.spacing[4] }}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing[12] }}>
          <Icon name="star" size={64} color={theme.colors.gray[400]} />
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[600], textAlign: 'center', marginTop: theme.spacing[4] }
          ]}>
            Service rating for booking #{bookingId} coming soon
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewServiceScreen;