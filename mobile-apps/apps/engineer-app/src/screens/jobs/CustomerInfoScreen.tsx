import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { theme } from '../../config/theme';

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    apartment?: string;
    instructions?: string;
  };
  preferences: {
    communicationMethod: 'phone' | 'text' | 'email';
    accessInstructions?: string;
    petInfo?: string;
    allergies?: string;
    specialRequests?: string;
  };
  history: {
    totalJobs: number;
    rating: number;
    lastJobDate: string;
  };
}

export const CustomerInfoScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params as { jobId: string };

  // Mock customer data - replace with real data from store
  const customerInfo: CustomerInfo = {
    id: 'cust_001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    profileImage: 'https://via.placeholder.com/80x80.png?text=SJ',
    address: {
      street: '123 Oak Street',
      apartment: 'Apt 2B',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      instructions: 'Use the side entrance, doorbell is broken. Ring apartment 2B on the intercom.',
    },
    preferences: {
      communicationMethod: 'text',
      accessInstructions: 'Key is under the flower pot by the door. Please lock up when leaving.',
      petInfo: '1 friendly golden retriever named Max. He may be excited but is harmless.',
      allergies: 'No strong chemical cleaners please - customer has asthma',
      specialRequests: 'Please be extra careful with the antique vase on the kitchen counter.',
    },
    history: {
      totalJobs: 12,
      rating: 4.9,
      lastJobDate: '2024-01-10',
    },
  };

  const handleCall = () => {
    Alert.alert(
      'Call Customer',
      `Call ${customerInfo.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${customerInfo.phone}`);
          },
        },
      ]
    );
  };

  const handleText = () => {
    Alert.alert(
      'Send Text',
      `Send a text message to ${customerInfo.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Linking.openURL(`sms:${customerInfo.phone}`);
          },
        },
      ]
    );
  };

  const handleEmail = () => {
    Alert.alert(
      'Send Email',
      `Send an email to ${customerInfo.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Linking.openURL(`mailto:${customerInfo.email}`);
          },
        },
      ]
    );
  };

  const handleNavigate = () => {
    const address = `${customerInfo.address.street}, ${customerInfo.address.city}, ${customerInfo.address.state} ${customerInfo.address.zipCode}`;
    navigation.navigate('Navigation' as never, {
      jobId,
      destination: {
        latitude: 37.7749, // Mock coordinates for SF
        longitude: -122.4194,
        address,
      },
    } as never);
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={i} name="star" size={16} color={theme.colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half-full" size={16} color={theme.colors.warning} />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-outline" size={16} color={theme.colors.disabled} />
      );
    }

    return stars;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Customer Header */}
      <View style={styles.customerHeader}>
        <View style={styles.customerProfile}>
          <Image 
            source={{ uri: customerInfo.profileImage }} 
            style={styles.profileImage}
          />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customerInfo.name}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStarRating(customerInfo.history.rating)}
              </View>
              <Text style={styles.ratingText}>
                {customerInfo.history.rating} • {customerInfo.history.totalJobs} jobs
              </Text>
            </View>
            <Text style={styles.lastJobText}>
              Last job: {new Date(customerInfo.history.lastJobDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Communication Buttons */}
        <View style={styles.communicationButtons}>
          <TouchableOpacity style={styles.commButton} onPress={handleCall}>
            <Icon name="phone" size={24} color={theme.colors.success} />
            <Text style={styles.commButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commButton} onPress={handleText}>
            <Icon name="message-text" size={24} color={theme.colors.primary} />
            <Text style={styles.commButtonText}>Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commButton} onPress={handleEmail}>
            <Icon name="email" size={24} color={theme.colors.warning} />
            <Text style={styles.commButtonText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color={theme.colors.disabled} />
            <Text style={styles.infoText}>{customerInfo.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color={theme.colors.disabled} />
            <Text style={styles.infoText}>{customerInfo.email}</Text>
          </View>
          <View style={styles.preferredMethodContainer}>
            <Text style={styles.preferredMethodLabel}>Preferred Contact:</Text>
            <View style={styles.preferredMethodBadge}>
              <Text style={styles.preferredMethodText}>
                {customerInfo.preferences.communicationMethod.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Address & Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <View style={styles.infoCard}>
          <View style={styles.addressContainer}>
            <Icon name="map-marker" size={20} color={theme.colors.primary} />
            <View style={styles.addressText}>
              <Text style={styles.addressLine}>
                {customerInfo.address.street}
                {customerInfo.address.apartment && ` ${customerInfo.address.apartment}`}
              </Text>
              <Text style={styles.addressLine}>
                {customerInfo.address.city}, {customerInfo.address.state} {customerInfo.address.zipCode}
              </Text>
            </View>
          </View>
          
          {customerInfo.address.instructions && (
            <View style={styles.instructionsContainer}>
              <Icon name="information" size={16} color={theme.colors.warning} />
              <Text style={styles.instructionsText}>{customerInfo.address.instructions}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <Icon name="navigation" size={20} color={theme.colors.surface} />
            <Text style={styles.navigateButtonText}>Navigate to Address</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Access Instructions */}
      {customerInfo.preferences.accessInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Instructions</Text>
          <View style={styles.highlightCard}>
            <Icon name="key" size={24} color={theme.colors.primary} />
            <Text style={styles.highlightText}>{customerInfo.preferences.accessInstructions}</Text>
          </View>
        </View>
      )}

      {/* Important Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Information</Text>
        
        {customerInfo.preferences.petInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="paw" size={20} color={theme.colors.warning} />
              <Text style={styles.infoHeaderText}>Pet Information</Text>
            </View>
            <Text style={styles.infoDescription}>{customerInfo.preferences.petInfo}</Text>
          </View>
        )}
        
        {customerInfo.preferences.allergies && (
          <View style={[styles.infoCard, styles.alertCard]}>
            <View style={styles.infoHeader}>
              <Icon name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={[styles.infoHeaderText, { color: theme.colors.error }]}>Allergies</Text>
            </View>
            <Text style={styles.infoDescription}>{customerInfo.preferences.allergies}</Text>
          </View>
        )}
        
        {customerInfo.preferences.specialRequests && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="star" size={20} color={theme.colors.primary} />
              <Text style={styles.infoHeaderText}>Special Requests</Text>
            </View>
            <Text style={styles.infoDescription}>{customerInfo.preferences.specialRequests}</Text>
          </View>
        )}
      </View>

      {/* Emergency Actions */}
      <View style={styles.emergencySection}>
        <Text style={styles.sectionTitle}>Emergency Actions</Text>
        <View style={styles.emergencyButtons}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Icon name="phone-alert" size={24} color={theme.colors.error} />
            <Text style={styles.emergencyButtonText}>Emergency Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.emergencyButton}>
            <Icon name="shield-alert" size={24} color={theme.colors.warning} />
            <Text style={styles.emergencyButtonText}>Report Safety Issue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  customerHeader: {
    backgroundColor: theme.colors.surface,
    padding: 20,
  },
  customerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.disabled,
    marginRight: 15,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  lastJobText: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  communicationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  commButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
  },
  commButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  preferredMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferredMethodLabel: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  preferredMethodBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  preferredMethodText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    marginLeft: 12,
  },
  addressLine: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  navigateButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  navigateButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  highlightCard: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  highlightText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  emergencySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emergencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  emergencyButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    minWidth: 120,
  },
  emergencyButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomerInfoScreen;