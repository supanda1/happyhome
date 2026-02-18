import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { theme } from '../../config/theme';

interface BankAccount {
  id: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  isVerified: boolean;
  isPrimary: boolean;
}

interface PaymentSettings {
  autoWithdrawal: boolean;
  withdrawalThreshold: number;
  withdrawalFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  withdrawalDay?: string; // for weekly/monthly
  instantPayEnabled: boolean;
  instantPayFeeAccepted: boolean;
  taxDocuments: boolean;
  directDeposit: boolean;
}

interface TaxInfo {
  ein?: string;
  ssn?: string;
  businessName?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export const PaymentSettingsScreen = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      accountType: 'checking',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      routingNumber: '021000021',
      accountHolderName: 'John Martinez',
      isVerified: true,
      isPrimary: true,
    },
  ]);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    autoWithdrawal: true,
    withdrawalThreshold: 100,
    withdrawalFrequency: 'weekly',
    withdrawalDay: 'Friday',
    instantPayEnabled: false,
    instantPayFeeAccepted: false,
    taxDocuments: true,
    directDeposit: true,
  });

  const [taxInfo] = useState<TaxInfo>({
    ssn: '***-**-****',
    address: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
    },
  });

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountType: 'checking' as 'checking' | 'savings',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
  });

  const updatePaymentSetting = (key: keyof PaymentSettings, value: any) => {
    setPaymentSettings(prev => ({ ...prev, [key]: value }));
  };

  const addBankAccount = () => {
    if (!newAccount.bankName || !newAccount.accountNumber || !newAccount.routingNumber || !newAccount.accountHolderName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const account: BankAccount = {
      id: Date.now().toString(),
      ...newAccount,
      accountNumber: `****${newAccount.accountNumber.slice(-4)}`, // Mask for display
      isVerified: false,
      isPrimary: bankAccounts.length === 0,
    };

    setBankAccounts(prev => [...prev, account]);
    setNewAccount({
      accountType: 'checking',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
    });
    setShowAddAccount(false);

    Alert.alert('Success', 'Bank account added successfully. It will be verified within 1-2 business days.');
  };

  const removeAccount = (accountId: string) => {
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (account?.isPrimary && bankAccounts.length > 1) {
      Alert.alert('Error', 'Please set another account as primary before removing this one');
      return;
    }

    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
          },
        },
      ]
    );
  };

  const setPrimaryAccount = (accountId: string) => {
    setBankAccounts(prev =>
      prev.map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId,
      }))
    );
  };

  const verifyAccount = (accountId: string) => {
    Alert.alert(
      'Verify Account',
      'We will make two small deposits to verify this account. This process takes 1-2 business days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Verification',
          onPress: () => {
            console.log('Starting account verification for:', accountId);
            Alert.alert('Verification Started', 'We\'ll notify you when the test deposits are available.');
          },
        },
      ]
    );
  };

  const withdrawEarnings = () => {
    const primaryAccount = bankAccounts.find(acc => acc.isPrimary);
    if (!primaryAccount) {
      Alert.alert('Error', 'Please add and verify a bank account first');
      return;
    }

    if (!primaryAccount.isVerified) {
      Alert.alert('Error', 'Please verify your bank account before withdrawing funds');
      return;
    }

    Alert.alert(
      'Withdraw Earnings',
      `Withdraw available earnings to ${primaryAccount.bankName} account ending in ${primaryAccount.accountNumber.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            console.log('Processing withdrawal to account:', primaryAccount.id);
            Alert.alert('Success', 'Withdrawal initiated. Funds will be transferred within 1-2 business days.');
          },
        },
      ]
    );
  };

  const downloadTaxDocument = (type: string) => {
    Alert.alert(
      'Download Tax Document',
      `Download ${type} for tax year 2023?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            console.log('Downloading tax document:', type);
            Alert.alert('Success', 'Tax document has been downloaded to your device.');
          },
        },
      ]
    );
  };

  const saveSettings = () => {
    Alert.alert(
      'Save Settings',
      'Save payment preferences?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            console.log('Saving payment settings:', paymentSettings);
            Alert.alert('Success', 'Payment settings saved successfully');
          },
        },
      ]
    );
  };

  const AddAccountModal = () => (
    <Modal visible={showAddAccount} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddAccount(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Bank Account</Text>
          <TouchableOpacity onPress={addBankAccount}>
            <Text style={styles.modalSave}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Account Type</Text>
            <View style={styles.accountTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  newAccount.accountType === 'checking' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setNewAccount(prev => ({ ...prev, accountType: 'checking' }))}
              >
                <Text
                  style={[
                    styles.accountTypeButtonText,
                    newAccount.accountType === 'checking' && styles.accountTypeButtonTextActive,
                  ]}
                >
                  Checking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  newAccount.accountType === 'savings' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setNewAccount(prev => ({ ...prev, accountType: 'savings' }))}
              >
                <Text
                  style={[
                    styles.accountTypeButtonText,
                    newAccount.accountType === 'savings' && styles.accountTypeButtonTextActive,
                  ]}
                >
                  Savings
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter bank name"
              value={newAccount.bankName}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, bankName: text }))}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Full name on account"
              value={newAccount.accountHolderName}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, accountHolderName: text }))}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter account number"
              value={newAccount.accountNumber}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, accountNumber: text }))}
              keyboardType="numeric"
              secureTextEntry
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Routing Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="9-digit routing number"
              value={newAccount.routingNumber}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, routingNumber: text }))}
              keyboardType="numeric"
              maxLength={9}
            />
          </View>

          <View style={styles.securityNote}>
            <Icon name="shield-check" size={20} color={theme.colors.success} />
            <Text style={styles.securityNoteText}>
              Your banking information is encrypted and secure. We use bank-level security to protect your data.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Current Balance */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Available Earnings</Text>
        <Text style={styles.balanceAmount}>$245.75</Text>
        <TouchableOpacity style={styles.withdrawButton} onPress={withdrawEarnings}>
          <Icon name="bank-transfer-out" size={20} color={theme.colors.surface} />
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Bank Accounts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bank Accounts</Text>
          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => setShowAddAccount(true)}
          >
            <Icon name="plus" size={20} color={theme.colors.primary} />
            <Text style={styles.addAccountText}>Add Account</Text>
          </TouchableOpacity>
        </View>

        {bankAccounts.map((account) => (
          <View key={account.id} style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountBank}>{account.bankName}</Text>
                <Text style={styles.accountDetails}>
                  {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} ••{account.accountNumber}
                </Text>
                <Text style={styles.accountHolder}>{account.accountHolderName}</Text>
              </View>
              
              <View style={styles.accountBadges}>
                {account.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
                <View style={[
                  styles.verifiedBadge,
                  { backgroundColor: account.isVerified ? theme.colors.success : theme.colors.warning }
                ]}>
                  <Icon
                    name={account.isVerified ? 'check-circle' : 'clock'}
                    size={12}
                    color={theme.colors.surface}
                  />
                  <Text style={styles.verifiedBadgeText}>
                    {account.isVerified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.accountActions}>
              {!account.isVerified && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={() => verifyAccount(account.id)}
                >
                  <Text style={styles.verifyButtonText}>Verify Account</Text>
                </TouchableOpacity>
              )}
              
              {!account.isPrimary && account.isVerified && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setPrimaryAccount(account.id)}
                >
                  <Text style={styles.primaryButtonText}>Set as Primary</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAccount(account.id)}
              >
                <Icon name="close" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Automatic Withdrawal Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatic Withdrawals</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Auto-Withdrawal</Text>
            <Text style={styles.settingDescription}>
              Automatically transfer earnings to your bank account
            </Text>
          </View>
          <Switch
            value={paymentSettings.autoWithdrawal}
            onValueChange={(value) => updatePaymentSetting('autoWithdrawal', value)}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.success + '30' }}
            thumbColor={paymentSettings.autoWithdrawal ? theme.colors.success : theme.colors.surface}
          />
        </View>

        {paymentSettings.autoWithdrawal && (
          <>
            <View style={styles.thresholdRow}>
              <Text style={styles.settingLabel}>Withdrawal Threshold</Text>
              <View style={styles.thresholdControls}>
                <TouchableOpacity
                  style={styles.thresholdButton}
                  onPress={() =>
                    updatePaymentSetting('withdrawalThreshold', Math.max(25, paymentSettings.withdrawalThreshold - 25))
                  }
                >
                  <Icon name="minus" size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.thresholdValue}>${paymentSettings.withdrawalThreshold}</Text>
                <TouchableOpacity
                  style={styles.thresholdButton}
                  onPress={() =>
                    updatePaymentSetting('withdrawalThreshold', Math.min(500, paymentSettings.withdrawalThreshold + 25))
                  }
                >
                  <Icon name="plus" size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.frequencyRow}>
              <Text style={styles.settingLabel}>Withdrawal Frequency</Text>
              <View style={styles.frequencyButtons}>
                {['daily', 'weekly', 'biweekly', 'monthly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      paymentSettings.withdrawalFrequency === freq && styles.frequencyButtonActive,
                    ]}
                    onPress={() => updatePaymentSetting('withdrawalFrequency', freq)}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        paymentSettings.withdrawalFrequency === freq && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Instant Pay */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instant Pay</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Instant Pay</Text>
            <Text style={styles.settingDescription}>
              Get paid immediately after job completion (2.5% fee applies)
            </Text>
          </View>
          <Switch
            value={paymentSettings.instantPayEnabled}
            onValueChange={(value) => updatePaymentSetting('instantPayEnabled', value)}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary + '30' }}
            thumbColor={paymentSettings.instantPayEnabled ? theme.colors.primary : theme.colors.surface}
          />
        </View>

        {paymentSettings.instantPayEnabled && (
          <View style={styles.feeNotice}>
            <Icon name="information" size={20} color={theme.colors.warning} />
            <Text style={styles.feeNoticeText}>
              Instant Pay charges a 2.5% fee per transaction. Standard transfers (1-2 business days) are free.
            </Text>
          </View>
        )}
      </View>

      {/* Tax Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax Information</Text>

        <View style={styles.taxInfoCard}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>SSN/EIN:</Text>
            <Text style={styles.taxValue}>{taxInfo.ssn || taxInfo.ein}</Text>
          </View>
          
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Address:</Text>
            <View>
              <Text style={styles.taxValue}>{taxInfo.address.street}</Text>
              <Text style={styles.taxValue}>
                {taxInfo.address.city}, {taxInfo.address.state} {taxInfo.address.zipCode}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.updateTaxButton}>
            <Text style={styles.updateTaxButtonText}>Update Tax Information</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taxDocuments}>
          <Text style={styles.taxDocumentsTitle}>Tax Documents</Text>
          
          <TouchableOpacity
            style={styles.documentRow}
            onPress={() => downloadTaxDocument('1099-NEC')}
          >
            <View style={styles.documentInfo}>
              <Icon name="file-document" size={24} color={theme.colors.primary} />
              <Text style={styles.documentName}>2023 Form 1099-NEC</Text>
            </View>
            <Icon name="download" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.documentRow}
            onPress={() => downloadTaxDocument('Annual Summary')}
          >
            <View style={styles.documentInfo}>
              <Icon name="file-chart" size={24} color={theme.colors.primary} />
              <Text style={styles.documentName}>2023 Annual Summary</Text>
            </View>
            <Icon name="download" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Icon name="check" size={20} color={theme.colors.surface} />
        <Text style={styles.saveButtonText}>Save Payment Settings</Text>
      </TouchableOpacity>

      <AddAccountModal />
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
  balanceSection: {
    backgroundColor: theme.colors.success + '10',
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.success + '30',
  },
  balanceLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 20,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  withdrawButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: 10,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAccountText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  accountCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountBank: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    color: theme.colors.disabled,
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  accountBadges: {
    alignItems: 'flex-end',
  },
  primaryBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  primaryBadgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  accountActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifyButton: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.disabled,
    lineHeight: 16,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.backdrop,
  },
  thresholdControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 15,
    minWidth: 60,
    textAlign: 'center',
  },
  frequencyRow: {
    paddingVertical: 15,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
  },
  frequencyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: theme.colors.surface,
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  feeNoticeText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  taxInfoCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.disabled,
  },
  taxValue: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'right',
  },
  updateTaxButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  updateTaxButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  taxDocuments: {
    marginTop: 10,
  },
  taxDocumentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
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
  modalSave: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.backdrop,
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  accountTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  accountTypeButtonTextActive: {
    color: theme.colors.surface,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.success + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  securityNoteText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default PaymentSettingsScreen;