/**
 * Orders Screen
 * Display user's order history and current bookings with tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { Button, Card, Badge, theme, Loading } from '@household-services/ui-kit';
import { useUserData, usePullToRefresh } from '@household-services/shared';
import { TabScreenProps } from '../types/navigation';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface Order {
  id: string;
  serviceName: string;
  serviceId: string;
  status: OrderStatus;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  currency: string;
  address: string;
  providerName?: string;
  providerPhone?: string;
  createdAt: string;
  completedAt?: string;
  rating?: number;
}

const ORDER_STATUSES: { [key in OrderStatus]: { label: string; color: string; icon: string } } = {
  pending: { label: 'Pending', color: 'warning', icon: 'clock-outline' },
  confirmed: { label: 'Confirmed', color: 'info', icon: 'check-circle-outline' },
  in_progress: { label: 'In Progress', color: 'primary', icon: 'account-wrench' },
  completed: { label: 'Completed', color: 'success', icon: 'check-all' },
  cancelled: { label: 'Cancelled', color: 'error', icon: 'close-circle-outline' },
};

export const OrdersScreen: React.FC<TabScreenProps<'Orders'>> = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  
  // Use sync hooks for data management
  const { orders, loading, error, refreshUserData } = useUserData();
  const { refreshing, onRefresh } = usePullToRefresh(['user-orders']);

  // Mock orders data for demonstration
  const mockOrders: Order[] = [
    {
      id: '1',
      serviceName: 'Plumbing Repair',
      serviceId: 'service-1',
      status: 'in_progress',
      scheduledDate: '2024-01-20',
      scheduledTime: '10:00 AM',
      totalAmount: 120,
      currency: 'USD',
      address: '123 Main St, City, State 12345',
      providerName: 'John Smith',
      providerPhone: '+1 (555) 123-4567',
      createdAt: '2024-01-18T10:00:00Z',
    },
    {
      id: '2',
      serviceName: 'House Cleaning',
      serviceId: 'service-2',
      status: 'completed',
      scheduledDate: '2024-01-15',
      scheduledTime: '2:00 PM',
      totalAmount: 85,
      currency: 'USD',
      address: '123 Main St, City, State 12345',
      providerName: 'Sarah Johnson',
      providerPhone: '+1 (555) 987-6543',
      createdAt: '2024-01-13T14:00:00Z',
      completedAt: '2024-01-15T16:30:00Z',
      rating: 5,
    },
    {
      id: '3',
      serviceName: 'Electrical Installation',
      serviceId: 'service-3',
      status: 'confirmed',
      scheduledDate: '2024-01-25',
      scheduledTime: '9:00 AM',
      totalAmount: 200,
      currency: 'USD',
      address: '456 Oak Ave, City, State 12345',
      createdAt: '2024-01-19T11:00:00Z',
    },
  ];

  // Use mock data if no real orders available
  const displayOrders = orders?.length ? orders : mockOrders;

  // Filter orders based on selected tab
  const filteredOrders = displayOrders.filter(order => {
    if (selectedTab === 'active') {
      return ['pending', 'confirmed', 'in_progress'].includes(order.status);
    } else {
      return ['completed', 'cancelled'].includes(order.status);
    }
  });

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderTracking', { orderId: order.id });
  };

  const handleRateService = (order: Order) => {
    navigation.navigate('ReviewService', { bookingId: order.id });
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refreshUserData()]);
  };

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const statusInfo = ORDER_STATUSES[order.status];
    const orderDate = new Date(order.scheduledDate);
    
    return (
      <TouchableOpacity
        onPress={() => handleOrderPress(order)}
        style={{ marginBottom: theme.spacing[4] }}
      >
        <Card
          style={{
            padding: theme.spacing[4],
            marginHorizontal: theme.spacing[4],
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing[3],
          }}>
            <View style={{ flex: 1 }}>
              <Text style={[
                theme.typography.body.lg,
                {
                  fontWeight: '600',
                  color: theme.colors.gray[900],
                  marginBottom: theme.spacing[1],
                }
              ]}>
                {order.serviceName}
              </Text>
              
              <Text style={[
                theme.typography.body.sm,
                {
                  color: theme.colors.gray[600],
                }
              ]}>
                Order #{order.id}
              </Text>
            </View>

            <Badge
              variant={statusInfo.color as any}
              size="sm"
              style={{ marginLeft: theme.spacing[2] }}
            >
              {statusInfo.label}
            </Badge>
          </View>

          {/* Service Details */}
          <View style={{ marginBottom: theme.spacing[3] }}>
            {/* Date and Time */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing[2],
            }}>
              <Icon
                name="calendar"
                size={16}
                color={theme.colors.gray[500]}
                style={{ marginRight: theme.spacing[2] }}
              />
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[700] }
              ]}>
                {format(orderDate, 'MMM dd, yyyy')} at {order.scheduledTime}
              </Text>
            </View>

            {/* Address */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: theme.spacing[2],
            }}>
              <Icon
                name="map-marker"
                size={16}
                color={theme.colors.gray[500]}
                style={{ marginRight: theme.spacing[2], marginTop: 2 }}
              />
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[700], flex: 1 }
              ]}>
                {order.address}
              </Text>
            </View>

            {/* Provider Info */}
            {order.providerName && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing[2],
              }}>
                <Icon
                  name="account"
                  size={16}
                  color={theme.colors.gray[500]}
                  style={{ marginRight: theme.spacing[2] }}
                />
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[700] }
                ]}>
                  {order.providerName}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: theme.spacing[3],
            borderTopWidth: 1,
            borderTopColor: theme.colors.gray[200],
          }}>
            {/* Price */}
            <Text style={[
              theme.typography.body.lg,
              {
                fontWeight: '700',
                color: theme.colors.primary[600],
              }
            ]}>
              ${order.totalAmount}
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {order.status === 'completed' && !order.rating && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleRateService(order)}
                  style={{
                    marginRight: theme.spacing[2],
                    paddingHorizontal: theme.spacing[3],
                  }}
                >
                  Rate Service
                </Button>
              )}
              
              <Icon
                name="chevron-right"
                size={20}
                color={theme.colors.gray[400]}
              />
            </View>
          </View>

          {/* Rating Display */}
          {order.rating && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: theme.spacing[2],
            }}>
              <Text style={[
                theme.typography.body.sm,
                { color: theme.colors.gray[600], marginRight: theme.spacing[2] }
              ]}>
                Your Rating:
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    size={14}
                    color={star <= order.rating! ? theme.colors.warning[500] : theme.colors.gray[300]}
                  />
                ))}
              </View>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && !displayOrders?.length) {
    return <Loading message="Loading your orders..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[3],
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
      }}>
        <Text style={[
          theme.typography.heading.h2,
          {
            color: theme.colors.gray[900],
            marginBottom: theme.spacing[4],
          }
        ]}>
          My Orders
        </Text>

        {/* Tab Selector */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.gray[100],
          borderRadius: 8,
          padding: 4,
        }}>
          <TouchableOpacity
            onPress={() => setSelectedTab('active')}
            style={{
              flex: 1,
              paddingVertical: theme.spacing[2],
              borderRadius: 6,
              backgroundColor: selectedTab === 'active' ? theme.colors.white : 'transparent',
            }}
          >
            <Text style={[
              theme.typography.body.base,
              {
                textAlign: 'center',
                fontWeight: '600',
                color: selectedTab === 'active' ? theme.colors.gray[900] : theme.colors.gray[600],
              }
            ]}>
              Active Orders
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSelectedTab('completed')}
            style={{
              flex: 1,
              paddingVertical: theme.spacing[2],
              borderRadius: 6,
              backgroundColor: selectedTab === 'completed' ? theme.colors.white : 'transparent',
            }}
          >
            <Text style={[
              theme.typography.body.base,
              {
                textAlign: 'center',
                fontWeight: '600',
                color: selectedTab === 'completed' ? theme.colors.gray[900] : theme.colors.gray[600],
              }
            ]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: theme.spacing[12],
            paddingHorizontal: theme.spacing[6],
          }}>
            <Icon
              name="clipboard-list-outline"
              size={48}
              color={theme.colors.gray[400]}
              style={{ marginBottom: theme.spacing[4] }}
            />
            <Text style={[
              theme.typography.heading.h4,
              {
                color: theme.colors.gray[600],
                textAlign: 'center',
                marginBottom: theme.spacing[2],
              }
            ]}>
              {selectedTab === 'active' ? 'No active orders' : 'No order history'}
            </Text>
            <Text style={[
              theme.typography.body.base,
              {
                color: theme.colors.gray[500],
                textAlign: 'center',
                marginBottom: theme.spacing[6],
              }
            ]}>
              {selectedTab === 'active' 
                ? 'Book a service to see your orders here'
                : 'Your completed orders will appear here'
              }
            </Text>
            
            {selectedTab === 'active' && (
              <Button
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('Services')}
              >
                Browse Services
              </Button>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;