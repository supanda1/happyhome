/**
 * Date Time Selection Step
 * Second step of booking flow - select appointment date and time
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, Card, theme } from '@household-services/ui-kit';
import { format, addDays, startOfDay } from 'date-fns';

interface Props {
  bookingData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const DateTimeSelectionStep: React.FC<Props> = ({
  bookingData,
  onNext,
  isLoading,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Generate next 7 days
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));
  
  // Available time slots
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      onNext({
        selectedDate: selectedDate.toISOString(),
        selectedTime,
      });
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: theme.spacing[4], flex: 1 }}>
        <Text style={[
          theme.typography.heading.h3,
          { color: theme.colors.gray[900], marginBottom: theme.spacing[6] }
        ]}>
          When would you like us to come?
        </Text>

        {/* Date Selection */}
        <View style={{ marginBottom: theme.spacing[6] }}>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
          ]}>
            Select Date
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', paddingRight: theme.spacing[4] }}>
              {availableDates.map((date, index) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedDate(date)}
                    style={{
                      backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.white,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[300],
                      borderRadius: 8,
                      padding: theme.spacing[3],
                      marginRight: theme.spacing[3],
                      minWidth: 80,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={[
                      theme.typography.body.sm,
                      {
                        color: isSelected ? theme.colors.white : theme.colors.gray[600],
                        fontWeight: '600',
                      }
                    ]}>
                      {format(date, 'EEE')}
                    </Text>
                    <Text style={[
                      theme.typography.body.lg,
                      {
                        color: isSelected ? theme.colors.white : theme.colors.gray[900],
                        fontWeight: 'bold',
                      }
                    ]}>
                      {format(date, 'dd')}
                    </Text>
                    <Text style={[
                      theme.typography.body.xs,
                      {
                        color: isSelected ? theme.colors.white : theme.colors.gray[600],
                      }
                    ]}>
                      {format(date, 'MMM')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View>
          <Text style={[
            theme.typography.heading.h4,
            { color: theme.colors.gray[900], marginBottom: theme.spacing[3] }
          ]}>
            Select Time
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -theme.spacing[2],
          }}>
            {timeSlots.map((time, index) => {
              const isSelected = selectedTime === time;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedTime(time)}
                  style={{
                    backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.white,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[300],
                    borderRadius: 8,
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[4],
                    margin: theme.spacing[2],
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <Text style={[
                    theme.typography.body.base,
                    {
                      color: isSelected ? theme.colors.white : theme.colors.gray[900],
                      fontWeight: '600',
                    }
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={{
        padding: theme.spacing[4],
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
      }}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime || isLoading}
        >
          Continue to Address
        </Button>
      </View>
    </ScrollView>
  );
};

export default DateTimeSelectionStep;