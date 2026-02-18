import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  lastUpdate: string;
}

export const HelpSupportScreen = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  // Mock data
  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I accept or decline job assignments?',
      answer: 'You can accept or decline jobs from the Jobs tab. Tap on a job to view details, then use the Accept or Decline buttons. You have 30 minutes to respond to new job assignments.',
      category: 'jobs',
    },
    {
      id: '2',
      question: 'When will I receive payment for completed jobs?',
      answer: 'Payments are processed within 24-48 hours after job completion and customer approval. You can view your earnings in the Earnings tab and withdraw funds to your bank account.',
      category: 'payments',
    },
    {
      id: '3',
      question: 'How do I update my availability?',
      answer: 'Go to Profile > Availability Settings to set your working hours, service radius, and availability preferences. You can also quickly toggle availability from the Schedule screen.',
      category: 'schedule',
    },
    {
      id: '4',
      question: 'What should I do if I encounter an issue during a job?',
      answer: 'Use the Report Issue feature in the job details screen. For safety emergencies, call 911 immediately. For urgent support, use the emergency contact button in the app.',
      category: 'safety',
    },
    {
      id: '5',
      question: 'How do I contact a customer?',
      answer: 'From the job details screen, tap on Customer Info to view contact details. You can call, text, or email the customer directly from the app.',
      category: 'communication',
    },
    {
      id: '6',
      question: 'Can I cancel a job after accepting it?',
      answer: 'Jobs should only be cancelled in emergency situations. Use the Report Issue feature if you cannot complete a job. Frequent cancellations may affect your account standing.',
      category: 'jobs',
    },
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: 'TK-2024-001',
      subject: 'Payment not received for job #12345',
      category: 'payment',
      status: 'in_progress',
      createdAt: '2024-01-15T10:30:00Z',
      lastUpdate: '2024-01-16T14:20:00Z',
    },
    {
      id: 'TK-2024-002',
      subject: 'Unable to upload photos',
      category: 'technical',
      status: 'resolved',
      createdAt: '2024-01-12T09:15:00Z',
      lastUpdate: '2024-01-12T16:45:00Z',
    },
  ];

  const contactOptions = [
    {
      id: 'phone',
      title: 'Call Support',
      description: 'Speak with a support agent',
      icon: 'phone',
      action: () => Linking.openURL('tel:+15551234567'),
      available: '24/7 for emergencies\n9 AM - 6 PM for general support',
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: 'chat',
      action: () => Alert.alert('Live Chat', 'Live chat feature would be implemented here'),
      available: '9 AM - 9 PM PST',
    },
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send us an email',
      icon: 'email',
      action: () => Linking.openURL('mailto:support@happyhomes.com'),
      available: 'We respond within 24 hours',
    },
    {
      id: 'ticket',
      title: 'Submit Ticket',
      description: 'Create a support ticket',
      icon: 'ticket',
      action: () => setShowContactForm(true),
      available: 'Track your request',
    },
  ];

  const emergencyContacts = [
    {
      title: 'Emergency Hotline',
      subtitle: 'Life-threatening emergencies',
      phone: '911',
      icon: 'alert-circle',
      color: theme.colors.error,
    },
    {
      title: 'Safety Support',
      subtitle: 'Urgent safety concerns',
      phone: '+1 (555) 911-SAFE',
      icon: 'shield-alert',
      color: theme.colors.warning,
    },
    {
      title: 'Technical Emergency',
      subtitle: 'Critical app issues',
      phone: '+1 (555) 123-TECH',
      icon: 'wrench',
      color: theme.colors.primary,
    },
  ];

  const faqCategories = [
    { key: 'all', label: 'All Topics' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'payments', label: 'Payments' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'safety', label: 'Safety' },
    { key: 'communication', label: 'Communication' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleCall = (phone: string) => {
    Alert.alert(
      'Make Call',
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const submitTicket = () => {
    if (!contactForm.category || !contactForm.subject || !contactForm.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Submit Ticket',
      'Submit your support request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            console.log('Submitting support ticket:', contactForm);
            setShowContactForm(false);
            setContactForm({
              category: '',
              subject: '',
              message: '',
              priority: 'medium',
            });
            Alert.alert('Success', 'Your support ticket has been submitted. You will receive a confirmation email shortly.');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return theme.colors.primary;
      case 'in_progress':
        return theme.colors.warning;
      case 'resolved':
        return theme.colors.success;
      case 'closed':
        return theme.colors.disabled;
      default:
        return theme.colors.disabled;
    }
  };

  const ContactFormModal = () => (
    <Modal visible={showContactForm} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowContactForm(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Contact Support</Text>
          <TouchableOpacity onPress={submitTicket}>
            <Text style={styles.modalSubmit}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Category *</Text>
            <View style={styles.categoryButtons}>
              {['technical', 'payment', 'safety', 'general'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    contactForm.category === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setContactForm(prev => ({ ...prev, category }))}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      contactForm.category === category && styles.categoryButtonTextActive,
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {[
                { key: 'low', label: 'Low', color: theme.colors.success },
                { key: 'medium', label: 'Medium', color: theme.colors.warning },
                { key: 'high', label: 'High', color: theme.colors.error },
                { key: 'urgent', label: 'Urgent', color: theme.colors.error },
              ].map((priority) => (
                <TouchableOpacity
                  key={priority.key}
                  style={[
                    styles.priorityButton,
                    contactForm.priority === priority.key && {
                      backgroundColor: priority.color + '20',
                      borderColor: priority.color,
                    },
                  ]}
                  onPress={() => setContactForm(prev => ({ ...prev, priority: priority.key as any }))}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      contactForm.priority === priority.key && { color: priority.color },
                    ]}
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Subject *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief description of your issue"
              value={contactForm.subject}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Message *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Please provide as much detail as possible about your issue..."
              value={contactForm.message}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formNote}>
            <Icon name="information" size={20} color={theme.colors.primary} />
            <Text style={styles.formNoteText}>
              For urgent issues, please call our support hotline. We typically respond to tickets within 24 hours.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Emergency Contacts */}
      <View style={styles.emergencySection}>
        <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
        {emergencyContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.emergencyCard, { borderLeftColor: contact.color }]}
            onPress={() => handleCall(contact.phone)}
          >
            <View style={[styles.emergencyIcon, { backgroundColor: contact.color + '20' }]}>
              <Icon name={contact.icon} size={24} color={contact.color} />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyContactTitle}>{contact.title}</Text>
              <Text style={styles.emergencySubtitle}>{contact.subtitle}</Text>
              <Text style={styles.emergencyPhone}>{contact.phone}</Text>
            </View>
            <Icon name="phone" size={20} color={contact.color} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <View style={styles.contactGrid}>
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.contactCard}
              onPress={option.action}
            >
              <View style={styles.contactIconContainer}>
                <Icon name={option.icon} size={28} color={theme.colors.primary} />
              </View>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactDescription}>{option.description}</Text>
              <Text style={styles.contactAvailable}>{option.available}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Support Tickets */}
      {supportTickets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Support Tickets</Text>
          {supportTickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketId}>{ticket.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                  <Text style={styles.statusText}>{ticket.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <View style={styles.ticketMeta}>
                <Text style={styles.ticketDate}>
                  Created: {new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.ticketDate}>
                  Updated: {new Date(ticket.lastUpdate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          {faqCategories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.filterButton,
                selectedCategory === category.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === category.key && styles.filterButtonTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ Items */}
        {filteredFAQs.map((faq) => (
          <View key={faq.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
            >
              <Text style={styles.faqQuestionText}>{faq.question}</Text>
              <Icon
                name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.disabled}
              />
            </TouchableOpacity>
            {expandedFAQ === faq.id && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Additional Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Resources</Text>
        
        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => Alert.alert('Training Materials', 'Training resources would open here')}
        >
          <Icon name="school" size={24} color={theme.colors.primary} />
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Training Materials</Text>
            <Text style={styles.resourceDescription}>Video tutorials and guides</Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.disabled} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => Alert.alert('Community Forum', 'Community forum would open here')}
        >
          <Icon name="forum" size={24} color={theme.colors.primary} />
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Community Forum</Text>
            <Text style={styles.resourceDescription}>Connect with other engineers</Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.disabled} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => Linking.openURL('https://happyhomes.com/engineer-handbook')}
        >
          <Icon name="book-open" size={24} color={theme.colors.primary} />
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Engineer Handbook</Text>
            <Text style={styles.resourceDescription}>Complete guide and policies</Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.disabled} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => Alert.alert('System Status', 'System status page would open here')}
        >
          <Icon name="server" size={24} color={theme.colors.success} />
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>System Status</Text>
            <Text style={styles.resourceDescription}>All systems operational</Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.disabled} />
        </TouchableOpacity>
      </View>

      {/* App Information */}
      <View style={styles.appInfoSection}>
        <Text style={styles.appInfoTitle}>Happy Homes Engineer App</Text>
        <Text style={styles.appInfoVersion}>Version 1.0.0 (Build 123)</Text>
        <Text style={styles.appInfoCopyright}>© 2024 Happy Homes. All rights reserved.</Text>
      </View>

      <ContactFormModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  emergencySection: {
    backgroundColor: theme.colors.error + '10',
    padding: 20,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginBottom: 4,
  },
  emergencyPhone: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 20,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  contactCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginBottom: 8,
    textAlign: 'center',
  },
  contactAvailable: {
    fontSize: 10,
    color: theme.colors.disabled,
    textAlign: 'center',
    lineHeight: 14,
  },
  ticketCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketDate: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  categoryFilter: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: theme.colors.surface,
  },
  faqItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backdrop,
  },
  faqAnswerText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  appInfoSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.colors.surface,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginBottom: 8,
  },
  appInfoCopyright: {
    fontSize: 10,
    color: theme.colors.disabled,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  modalCancel: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalSubmit: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 25,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 120,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryButtonTextActive: {
    color: theme.colors.surface,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  formNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  formNoteText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default HelpSupportScreen;