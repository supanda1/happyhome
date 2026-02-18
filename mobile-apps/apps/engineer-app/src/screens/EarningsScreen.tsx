import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';

import { theme } from '../config/theme';

interface EarningsData {
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  completedJobs: number;
  averageJobValue: number;
}

interface Transaction {
  id: string;
  type: 'job_completion' | 'bonus' | 'tip' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'processing';
}

const screenWidth = Dimensions.get('window').width;

export const EarningsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Mock data - replace with real data from store
  const earningsData: EarningsData = {
    totalEarnings: 2450.75,
    weeklyEarnings: 485.50,
    monthlyEarnings: 1940.25,
    pendingPayments: 125.00,
    completedJobs: 23,
    averageJobValue: 106.55,
  };

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'job_completion',
      amount: 85.00,
      description: 'Plumbing Repair - Sarah Johnson',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: '2',
      type: 'tip',
      amount: 15.00,
      description: 'Customer tip - Mike Chen',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: '3',
      type: 'job_completion',
      amount: 120.00,
      description: 'Kitchen Deep Clean - Lisa Wong',
      date: '2024-01-14',
      status: 'pending',
    },
    {
      id: '4',
      type: 'bonus',
      amount: 25.00,
      description: 'Weekly performance bonus',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: '5',
      type: 'withdrawal',
      amount: -200.00,
      description: 'Bank transfer to checking account',
      date: '2024-01-13',
      status: 'processing',
    },
  ];

  // Chart data
  const weeklyChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [65, 85, 120, 95, 75, 105, 140],
        color: (opacity = 1) => `rgba(255, 111, 97, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const serviceDistribution = [
    {
      name: 'Cleaning',
      population: 45,
      color: theme.colors.primary,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Plumbing',
      population: 25,
      color: theme.colors.success,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Electrical',
      population: 20,
      color: theme.colors.warning,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Other',
      population: 10,
      color: theme.colors.disabled,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'job_completion':
        return 'briefcase-check';
      case 'bonus':
        return 'star';
      case 'tip':
        return 'heart';
      case 'withdrawal':
        return 'bank-transfer-out';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount < 0) return theme.colors.error;
    switch (type) {
      case 'job_completion':
        return theme.colors.success;
      case 'bonus':
        return theme.colors.primary;
      case 'tip':
        return theme.colors.warning;
      default:
        return theme.colors.text;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'processing':
        return theme.colors.primary;
      default:
        return theme.colors.disabled;
    }
  };

  const formatAmount = (amount: number) => {
    return amount >= 0 ? `+$${amount.toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <TouchableOpacity style={styles.withdrawButton}>
          <Icon name="bank-transfer-out" size={20} color={theme.colors.surface} />
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Overview */}
      <View style={styles.overviewContainer}>
        <View style={styles.mainEarningsCard}>
          <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
          <Text style={styles.totalEarningsAmount}>${earningsData.totalEarnings.toFixed(2)}</Text>
          <View style={styles.earningsBreakdown}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>This Week</Text>
              <Text style={styles.earningsItemValue}>${earningsData.weeklyEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>This Month</Text>
              <Text style={styles.earningsItemValue}>${earningsData.monthlyEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="clock-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.statValue}>${earningsData.pendingPayments.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="briefcase-check" size={24} color={theme.colors.success} />
            <Text style={styles.statValue}>{earningsData.completedJobs}</Text>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="chart-line" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>${earningsData.averageJobValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg. Job Value</Text>
          </View>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Earnings</Text>
        <LineChart
          data={weeklyChartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 111, 97, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Service Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Earnings by Service Type</Text>
        <PieChart
          data={serviceDistribution}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute
        />
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(transaction.type, transaction.amount) + '20' },
                ]}
              >
                <Icon
                  name={getTransactionIcon(transaction.type)}
                  size={20}
                  color={getTransactionColor(transaction.type, transaction.amount)}
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: getTransactionColor(transaction.type, transaction.amount) },
                ]}
              >
                {formatAmount(transaction.amount)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                <Text style={styles.statusText}>{transaction.status}</Text>
              </View>
            </View>
          </View>
        ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  withdrawButtonText: {
    color: theme.colors.surface,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  overviewContainer: {
    padding: 20,
  },
  mainEarningsCard: {
    backgroundColor: theme.colors.success + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
    marginBottom: 15,
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  totalEarningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 15,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsItemLabel: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginBottom: 4,
  },
  earningsItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 4,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.disabled,
  },
  periodButtonTextActive: {
    color: theme.colors.surface,
  },
  chartContainer: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  transactionsContainer: {
    padding: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.disabled,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: theme.colors.surface,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default EarningsScreen;