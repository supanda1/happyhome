import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

import { theme } from '../../config/theme';

interface Location {
  latitude: number;
  longitude: number;
}

interface Destination {
  latitude: number;
  longitude: number;
  address: string;
}

interface NavigationInfo {
  distance: string;
  duration: string;
  nextTurn?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const NavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId, destination } = route.params as { 
    jobId: string; 
    destination: Destination;
  };

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [region, setRegion] = useState({
    latitude: destination.latitude,
    longitude: destination.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo>({
    distance: 'Calculating...',
    duration: 'Calculating...',
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    getCurrentLocation();
    
    // Mock navigation info - replace with real navigation service
    setTimeout(() => {
      setNavigationInfo({
        distance: '2.3 miles',
        duration: '8 minutes',
        nextTurn: 'Turn right on Oak Street in 0.5 miles',
      });
    }, 2000);
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Update region to show both current location and destination
        const midLat = (latitude + destination.latitude) / 2;
        const midLng = (longitude + destination.longitude) / 2;
        const latDelta = Math.abs(latitude - destination.latitude) * 1.5;
        const lngDelta = Math.abs(longitude - destination.longitude) * 1.5;
        
        setRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(latDelta, 0.01),
          longitudeDelta: Math.max(lngDelta, 0.01),
        });
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to get current location');
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const startNavigation = () => {
    const options = [
      {
        text: 'Apple Maps',
        onPress: () => openAppleMaps(),
      },
      {
        text: 'Google Maps',
        onPress: () => openGoogleMaps(),
      },
      {
        text: 'Waze',
        onPress: () => openWaze(),
      },
      {
        text: 'Cancel',
        style: 'cancel' as const,
      },
    ];

    Alert.alert('Choose Navigation App', 'Select your preferred navigation app:', options);
  };

  const openAppleMaps = () => {
    const url = `maps://app?daddr=${destination.latitude},${destination.longitude}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
        setIsNavigating(true);
      } else {
        Alert.alert('Error', 'Apple Maps is not available');
      }
    });
  };

  const openGoogleMaps = () => {
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${destination.latitude},${destination.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${destination.latitude},${destination.longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
          setIsNavigating(true);
        } else {
          // Fallback to web version
          const webUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}`;
          Linking.openURL(webUrl);
          setIsNavigating(true);
        }
      });
    }
  };

  const openWaze = () => {
    const url = `waze://?ll=${destination.latitude},${destination.longitude}&navigate=yes`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
        setIsNavigating(true);
      } else {
        Alert.alert('Error', 'Waze is not installed');
      }
    });
  };

  const callCustomer = () => {
    // Mock phone number - replace with real customer data
    const phoneNumber = '+1 (555) 123-4567';
    Alert.alert(
      'Call Customer',
      'Call customer to confirm arrival or get directions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
        },
      ]
    );
  };

  const markArrived = () => {
    Alert.alert(
      'Arrived at Location',
      'Have you arrived at the customer location?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, I\'m Here',
          onPress: () => {
            // Update job status and navigate back
            console.log('Engineer arrived at job location');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      getCurrentLocation();
    }
  };

  const centerOnDestination = () => {
    setRegion({
      latitude: destination.latitude,
      longitude: destination.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const toggleMapType = () => {
    setMapType(current => current === 'standard' ? 'satellite' : 'standard');
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Destination Marker */}
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title="Customer Location"
          description={destination.address}
        >
          <View style={styles.destinationMarker}>
            <Icon name="home" size={24} color={theme.colors.surface} />
          </View>
        </Marker>

        {/* Current Location Marker (if different from user location dot) */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.addressContainer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {destination.address}
          </Text>
        </View>

        <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
          <Icon
            name={mapType === 'standard' ? 'satellite-variant' : 'map'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Side Controls */}
      <View style={styles.sideControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnCurrentLocation}>
          <Icon name="crosshairs-gps" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={centerOnDestination}>
          <Icon name="home-map-marker" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={callCustomer}>
          <Icon name="phone" size={24} color={theme.colors.success} />
        </TouchableOpacity>
      </View>

      {/* Navigation Info Panel */}
      <View style={styles.navigationPanel}>
        <View style={styles.navigationInfo}>
          <View style={styles.navigationStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{navigationInfo.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{navigationInfo.duration}</Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
          </View>

          {navigationInfo.nextTurn && (
            <View style={styles.nextTurnContainer}>
              <Icon name="navigation" size={20} color={theme.colors.primary} />
              <Text style={styles.nextTurnText}>{navigationInfo.nextTurn}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isNavigating ? (
            <TouchableOpacity style={styles.startNavigationButton} onPress={startNavigation}>
              <Icon name="navigation" size={24} color={theme.colors.surface} />
              <Text style={styles.startNavigationText}>Start Navigation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.arrivedButton} onPress={markArrived}>
              <Icon name="map-marker-check" size={24} color={theme.colors.surface} />
              <Text style={styles.arrivedText}>I've Arrived</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addressContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  mapTypeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    top: screenHeight * 0.3,
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationInfo: {
    marginBottom: 20,
  },
  navigationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.backdrop,
    marginHorizontal: 20,
  },
  nextTurnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextTurnText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  startNavigationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startNavigationText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  arrivedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    borderRadius: 12,
  },
  arrivedText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});

export default NavigationScreen;