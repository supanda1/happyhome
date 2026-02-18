import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../../config/theme';

interface CapturedPhoto {
  id: string;
  uri: string;
  type: 'before' | 'after' | 'issue' | 'progress';
  timestamp: Date;
  notes?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PhotoCaptureScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId, type } = route.params as { jobId: string; type: 'before' | 'after' | 'issue' | 'progress' };
  
  const cameraRef = useRef<Camera>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [photoNotes, setPhotoNotes] = useState('');
  const [flashMode, setFlashMode] = useState(FlashMode.auto);
  const [cameraType, setCameraType] = useState(CameraType.back);

  // Mock existing photos - replace with real data
  useEffect(() => {
    const mockPhotos: CapturedPhoto[] = [
      {
        id: '1',
        uri: 'https://via.placeholder.com/300x400.png?text=Before+Photo+1',
        type: 'before',
        timestamp: new Date('2024-01-15T10:30:00'),
        notes: 'Kitchen condition before cleaning',
      },
      {
        id: '2',
        uri: 'https://via.placeholder.com/300x400.png?text=Progress+Photo+1',
        type: 'progress',
        timestamp: new Date('2024-01-15T11:15:00'),
        notes: 'Halfway through cleaning process',
      },
    ];
    setCapturedPhotos(mockPhotos);
  }, []);

  const getPhotoTypeConfig = (photoType: string) => {
    switch (photoType) {
      case 'before':
        return {
          title: 'Before Photos',
          description: 'Document the initial condition',
          icon: 'camera-outline',
          color: theme.colors.primary,
        };
      case 'after':
        return {
          title: 'After Photos',
          description: 'Show the completed work',
          icon: 'camera-check',
          color: theme.colors.success,
        };
      case 'issue':
        return {
          title: 'Issue Documentation',
          description: 'Report problems or damage',
          icon: 'camera-alert',
          color: theme.colors.error,
        };
      case 'progress':
        return {
          title: 'Progress Photos',
          description: 'Show work in progress',
          icon: 'camera-timer',
          color: theme.colors.warning,
        };
      default:
        return {
          title: 'Photos',
          description: 'Capture photos',
          icon: 'camera',
          color: theme.colors.primary,
        };
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = { quality: 0.8, base64: false };
        const data = await cameraRef.current.takePictureAsync(options);
        
        const newPhoto: CapturedPhoto = {
          id: Date.now().toString(),
          uri: data.uri,
          type,
          timestamp: new Date(),
        };
        
        setCapturedPhotos(prev => [...prev, newPhoto]);
        setSelectedPhoto(newPhoto);
        setShowPreview(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    
    if (!result.canceled) {
      const asset = result.assets[0];
      const newPhoto: CapturedPhoto = {
        id: Date.now().toString(),
        uri: asset.uri,
        type,
        timestamp: new Date(),
      };
      
      setCapturedPhotos(prev => [...prev, newPhoto]);
      setSelectedPhoto(newPhoto);
      setShowPreview(true);
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
            setShowPreview(false);
            setSelectedPhoto(null);
          },
        },
      ]
    );
  };

  const savePhoto = () => {
    if (selectedPhoto) {
      const updatedPhoto = {
        ...selectedPhoto,
        notes: photoNotes,
      };
      
      setCapturedPhotos(prev =>
        prev.map(photo =>
          photo.id === selectedPhoto.id ? updatedPhoto : photo
        )
      );
      
      setShowPreview(false);
      setSelectedPhoto(null);
      setPhotoNotes('');
      
      Alert.alert('Success', 'Photo saved successfully');
    }
  };

  const toggleFlash = () => {
    setFlashMode(current => 
      current === FlashMode.auto
        ? FlashMode.on
        : current === FlashMode.on
        ? FlashMode.off
        : FlashMode.auto
    );
  };

  const toggleCamera = () => {
    setCameraType(current => 
      current === CameraType.back
        ? CameraType.front
        : CameraType.back
    );
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case FlashMode.on:
        return 'flash';
      case FlashMode.off:
        return 'flash-off';
      default:
        return 'flash-auto';
    }
  };

  const finishCapture = () => {
    if (capturedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please capture at least one photo before finishing.');
      return;
    }
    
    Alert.alert(
      'Finish Capture',
      `You have captured ${capturedPhotos.length} photo(s). Finish and return to job?`,
      [
        { text: 'Continue Capturing', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            // Save photos to job record
            console.log('Saving photos:', capturedPhotos);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const config = getPhotoTypeConfig(type);
  const filteredPhotos = capturedPhotos.filter(photo => photo.type === type);

  const PreviewModal = () => (
    <Modal visible={showPreview} animationType="slide">
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => setShowPreview(false)}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Photo Preview</Text>
          <TouchableOpacity onPress={() => selectedPhoto && deletePhoto(selectedPhoto.id)}>
            <Icon name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {selectedPhoto && (
          <ScrollView style={styles.previewContent}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} />
            
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Add Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Describe what this photo shows..."
                value={photoNotes}
                onChangeText={setPhotoNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.photoInfo}>
              <Text style={styles.photoInfoLabel}>Captured</Text>
              <Text style={styles.photoInfoText}>
                {selectedPhoto.timestamp.toLocaleString()}
              </Text>
            </View>
          </ScrollView>
        )}

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.previewButton, styles.retakeButton]}
            onPress={() => setShowPreview(false)}
          >
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.previewButton, styles.saveButton]}
            onPress={savePhoto}
          >
            <Text style={styles.saveButtonText}>Save Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        
        <View style={styles.typeIndicator}>
          <Icon name={config.icon} size={20} color={config.color} />
          <Text style={[styles.typeText, { color: config.color }]}>{config.title}</Text>
        </View>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <Icon name={getFlashIcon()} size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Photo Gallery */}
        <View style={styles.galleryContainer}>
          <Text style={styles.galleryTitle}>
            {config.title} ({filteredPhotos.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredPhotos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.thumbnailContainer}
                onPress={() => {
                  setSelectedPhoto(photo);
                  setPhotoNotes(photo.notes || '');
                  setShowPreview(true);
                }}
              >
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                {photo.notes && (
                  <Icon
                    name="note-text"
                    size={12}
                    color={theme.colors.primary}
                    style={styles.thumbnailNote}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Capture Controls */}
        <View style={styles.captureControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={selectFromGallery}>
            <Icon name="image" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.switchButton} onPress={toggleCamera}>
            <Icon name="camera-switch" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Text style={styles.instructionText}>{config.description}</Text>
          <TouchableOpacity style={styles.finishButton} onPress={finishCapture}>
            <Icon name="check" size={20} color={theme.colors.surface} />
            <Text style={styles.finishButtonText}>Finish ({filteredPhotos.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PreviewModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 15,
    paddingBottom: 40,
  },
  galleryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  galleryTitle: {
    fontSize: 14,
    color: theme.colors.surface,
    fontWeight: '600',
    marginBottom: 10,
  },
  thumbnailContainer: {
    marginRight: 10,
    position: 'relative',
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.disabled,
  },
  thumbnailNote: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  captureControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 12,
    color: theme.colors.surface,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.8,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  finishButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  previewContent: {
    flex: 1,
  },
  previewImage: {
    width: screenWidth,
    height: screenWidth * 1.33, // 4:3 aspect ratio
    backgroundColor: theme.colors.disabled,
  },
  notesSection: {
    padding: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 80,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photoInfoLabel: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  photoInfoText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
  },
});

export default PhotoCaptureScreen;