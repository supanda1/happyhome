import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { theme } from '../../config/theme';

interface WorkSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  status: 'active' | 'paused' | 'completed';
  notes: string;
}

interface JobDetails {
  id: string;
  title: string;
  customerName: string;
  address: string;
  estimatedDuration: number;
  startTime: string;
  description: string;
  customerNotes?: string;
}

export const WorkTrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params as { jobId: string };

  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [totalWorkTime, setTotalWorkTime] = useState(0);

  // Mock job data - replace with real data
  const jobDetails: JobDetails = {
    id: jobId,
    title: 'Kitchen Deep Clean',
    customerName: 'Sarah Johnson',
    address: '123 Oak Street, Downtown',
    estimatedDuration: 180, // 3 hours in minutes
    startTime: '02:00 PM',
    description: 'Complete kitchen cleaning including appliances, countertops, and floors',
    customerNotes: 'Please be careful with the antique dishes in the cabinet',
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentSession) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentSession]);

  // Calculate total work time
  useEffect(() => {
    const completed = workSessions.filter(s => s.status === 'completed');
    const total = completed.reduce((sum, session) => sum + session.duration, 0);
    const current = currentSession && isRunning ? Math.floor(timer / 60) : 0;
    setTotalWorkTime(total + current);
  }, [workSessions, timer, currentSession, isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const startWork = () => {
    const newSession: WorkSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      duration: 0,
      status: 'active',
      notes: '',
    };
    
    setCurrentSession(newSession);
    setIsRunning(true);
    setTimer(0);
  };

  const pauseWork = () => {
    if (currentSession) {
      setIsRunning(false);
      setShowBreakModal(true);
    }
  };

  const resumeWork = () => {
    setIsRunning(true);
    setShowBreakModal(false);
  };

  const stopWork = () => {
    if (currentSession) {
      const completedSession: WorkSession = {
        ...currentSession,
        endTime: new Date(),
        duration: Math.floor(timer / 60),
        status: 'completed',
      };
      
      setWorkSessions(prev => [...prev, completedSession]);
      setCurrentSession(null);
      setIsRunning(false);
      setTimer(0);
      setShowBreakModal(false);
    }
  };

  const completeJob = () => {
    if (isRunning) {
      stopWork();
    }
    
    Alert.alert(
      'Complete Job',
      'Are you ready to complete this job? This will stop time tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => navigation.navigate('CompletionForm' as never, { jobId } as never),
        },
      ]
    );
  };

  const reportIssue = () => {
    navigation.navigate('IssueReporting' as never, { jobId } as never);
  };

  const takePhoto = () => {
    navigation.navigate('PhotoCapture' as never, { 
      jobId, 
      type: isRunning ? 'during' : 'before' 
    } as never);
  };

  const contactCustomer = () => {
    navigation.navigate('CustomerInfo' as never, { jobId } as never);
  };

  const getProgress = () => {
    return Math.min((totalWorkTime / jobDetails.estimatedDuration) * 100, 100);
  };

  const BreakModal = () => (
    <Modal
      visible={showBreakModal}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Icon name="pause-circle" size={48} color={theme.colors.warning} />
          <Text style={styles.modalTitle}>Work Paused</Text>
          <Text style={styles.modalSubtitle}>
            Take a break! Tap resume when you're ready to continue.
          </Text>
          
          <View style={styles.modalTimer}>
            <Text style={styles.modalTimerText}>{formatTime(timer)}</Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.resumeButton]} 
              onPress={resumeWork}
            >
              <Icon name="play" size={20} color={theme.colors.surface} />
              <Text style={styles.resumeButtonText}>Resume Work</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.stopButton]} 
              onPress={stopWork}
            >
              <Icon name="stop" size={20} color={theme.colors.error} />
              <Text style={styles.stopButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{jobDetails.title}</Text>
        <Text style={styles.customerName}>{jobDetails.customerName}</Text>
        <Text style={styles.jobAddress}>{jobDetails.address}</Text>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <View style={styles.timerDisplay}>
          <Text style={styles.timerLabel}>Current Session</Text>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <Text style={styles.timerStatus}>
            {isRunning ? 'Active' : currentSession ? 'Paused' : 'Not Started'}
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Job Progress</Text>
            <Text style={styles.progressText}>{Math.round(getProgress())}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${getProgress()}%` }]} 
            />
          </View>
          <Text style={styles.progressTime}>
            {formatDuration(totalWorkTime)} of {formatDuration(jobDetails.estimatedDuration)}
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!currentSession ? (
          <TouchableOpacity style={styles.startButton} onPress={startWork}>
            <Icon name="play" size={24} color={theme.colors.surface} />
            <Text style={styles.startButtonText}>Start Work</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]} 
              onPress={pauseWork}
            >
              <Icon name="pause" size={20} color={theme.colors.surface} />
              <Text style={styles.controlButtonText}>Pause</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={stopWork}
            >
              <Icon name="stop" size={20} color={theme.colors.surface} />
              <Text style={styles.controlButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Icon name="camera" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={contactCustomer}>
            <Icon name="phone" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={reportIssue}>
            <Icon name="alert-circle" size={24} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Work Sessions History */}
      {workSessions.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Work Sessions</Text>
          {workSessions.map((session, index) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionNumber}>Session {index + 1}</Text>
                <Text style={styles.sessionTime}>
                  {session.startTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {session.endTime && ` - ${session.endTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}`}
                </Text>
              </View>
              <Text style={styles.sessionDuration}>
                {formatDuration(session.duration)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Complete Job Button */}
      <TouchableOpacity style={styles.completeButton} onPress={completeJob}>
        <Icon name="check-circle" size={24} color={theme.colors.surface} />
        <Text style={styles.completeButtonText}>Complete Job</Text>
      </TouchableOpacity>

      <BreakModal />
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
  jobHeader: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  jobAddress: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
  timerContainer: {
    backgroundColor: theme.colors.surface,
    margin: 15,
    borderRadius: 16,
    padding: 20,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  timerStatus: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.backdrop,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  progressTime: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeControls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  pauseButton: {
    backgroundColor: theme.colors.warning,
  },
  stopButton: {
    backgroundColor: theme.colors.error,
  },
  controlButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionsContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  historyContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sessionTime: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 15,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.disabled,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalTimer: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  modalTimerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  resumeButton: {
    backgroundColor: theme.colors.success,
  },
  resumeButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default WorkTrackingScreen;