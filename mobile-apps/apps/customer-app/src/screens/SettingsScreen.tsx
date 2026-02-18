/**
 * Settings Screen
 * App preferences and configuration options
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

export const SettingsScreen: React.FC<MainScreenProps<'Settings'>> = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [locationServices, setLocationServices] = React.useState(true);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell',
          title: 'Push Notifications',
          subtitle: 'Receive order updates and reminders',
          type: 'switch' as const,
          value: pushNotifications,
          onValueChange: setPushNotifications,
        },
        {
          icon: 'email',
          title: 'Email Notifications',
          subtitle: 'Receive promotional offers and updates',
          type: 'switch' as const,
          value: emailNotifications,
          onValueChange: setEmailNotifications,
        },
      ],
    },
    {
      title: 'Privacy & Permissions',
      items: [
        {
          icon: 'map-marker',
          title: 'Location Services',
          subtitle: 'Allow location access for better service',
          type: 'switch' as const,
          value: locationServices,
          onValueChange: setLocationServices,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          title: 'Help Center',
          subtitle: 'Get help and find answers',
          type: 'navigation' as const,
          onPress: () => {},
        },
        {
          icon: 'message',
          title: 'Contact Support',
          subtitle: 'Reach out to our team',
          type: 'navigation' as const,
          onPress: () => {},
        },
      ],
    },
  ];

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
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={{ marginVertical: theme.spacing[4] }}>
            <Text style={[
              theme.typography.heading.h4,
              {
                color: theme.colors.gray[900],
                marginHorizontal: theme.spacing[4],
                marginBottom: theme.spacing[3],
              }
            ]}>
              {section.title}
            </Text>

            <Card style={{ marginHorizontal: theme.spacing[4] }}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={item.type === 'navigation' ? item.onPress : undefined}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: theme.spacing[4],
                    borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.gray[200],
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={24}
                    color={theme.colors.gray[600]}
                    style={{ marginRight: theme.spacing[3] }}
                  />
                  
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

                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{
                        false: theme.colors.gray[300],
                        true: theme.colors.primary[500],
                      }}
                      thumbColor={theme.colors.white}
                    />
                  ) : (
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={theme.colors.gray[400]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;