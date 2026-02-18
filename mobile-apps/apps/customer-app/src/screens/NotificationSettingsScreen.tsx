/**
 * Notification Settings Screen
 * Configure notification preferences
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, theme } from '@household-services/ui-kit';
import { MainScreenProps } from '../types/navigation';

export const NotificationSettingsScreen: React.FC<MainScreenProps<'NotificationSettings'>> = ({ navigation }) => {
  const [orderUpdates, setOrderUpdates] = React.useState(true);
  const [promotions, setPromotions] = React.useState(false);
  const [reminders, setReminders] = React.useState(true);
  const [newsletters, setNewsletters] = React.useState(false);

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
          Notifications
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: theme.spacing[4] }}>
        <Card>
          {[
            {
              title: 'Order Updates',
              subtitle: 'Get notified about order status changes',
              value: orderUpdates,
              onValueChange: setOrderUpdates,
            },
            {
              title: 'Service Reminders',
              subtitle: 'Reminders for upcoming appointments',
              value: reminders,
              onValueChange: setReminders,
            },
            {
              title: 'Promotions & Offers',
              subtitle: 'Special deals and discounts',
              value: promotions,
              onValueChange: setPromotions,
            },
            {
              title: 'Newsletter',
              subtitle: 'Weekly newsletter with tips and updates',
              value: newsletters,
              onValueChange: setNewsletters,
            },
          ].map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing[4],
                borderBottomWidth: index < 3 ? 1 : 0,
                borderBottomColor: theme.colors.gray[200],
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[
                  theme.typography.body.base,
                  { color: theme.colors.gray[900], marginBottom: theme.spacing[1] }
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[600] }
                ]}>
                  {item.subtitle}
                </Text>
              </View>

              <Switch
                value={item.value}
                onValueChange={item.onValueChange}
                trackColor={{
                  false: theme.colors.gray[300],
                  true: theme.colors.primary[500],
                }}
                thumbColor={theme.colors.white}
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;