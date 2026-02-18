/**
 * Happy Homes How It Works Section Component
 * 
 * 3-step process section matching the web UI design
 * showing users how to use the service platform.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { theme, APP_CONSTANTS } from '@happyhomes/shared';

const { width: screenWidth } = Dimensions.get('window');

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface HowItWorksSectionProps {
  /** Array of process steps */
  steps?: ProcessStep[];
  
  /** Section title */
  title?: string;
  
  /** Section subtitle */
  subtitle?: string;
  
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Background variant */
  variant?: 'default' | 'primary' | 'light';
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  steps = APP_CONSTANTS.HOW_IT_WORKS,
  title = 'How It Works',
  subtitle = 'Get your service in 3 simple steps',
  orientation = 'vertical',
  containerStyle,
  variant = 'default',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary[500];
      case 'light':
        return theme.colors.background.secondary;
      case 'default':
      default:
        return theme.colors.background.primary;
    }
  };

  const getTextColor = (type: 'primary' | 'secondary') => {
    if (variant === 'primary') {
      return type === 'primary' ? theme.colors.white : 'rgba(255, 255, 255, 0.9)';
    }
    return type === 'primary' ? theme.colors.text.primary : theme.colors.text.secondary;
  };

  const renderVerticalStep = ({ item: step, index }: { item: ProcessStep; index: number }) => {
    const isLast = index === steps.length - 1;
    
    return (
      <View
        style={{
          flexDirection: 'row',
          marginBottom: isLast ? 0 : theme.spacing[8],
        }}
      >
        {/* Step Indicator */}
        <View style={{ alignItems: 'center', marginRight: theme.spacing[4] }}>
          {/* Step Number Circle */}
          <View
            style={{
              width: 60,
              height: 60,
              backgroundColor: variant === 'primary' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : theme.colors.primary[100],
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing[2],
              ...theme.shadows.md,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                color: variant === 'primary' ? theme.colors.white : theme.colors.primary[600],
              }}
            >
              {step.icon}
            </Text>
          </View>

          {/* Step Number Badge */}
          <View
            style={{
              width: 24,
              height: 24,
              backgroundColor: theme.colors.primary[500],
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: -6,
              right: -6,
            }}
          >
            <Text
              style={[
                theme.typography.caption.sm,
                {
                  color: theme.colors.white,
                  fontWeight: '700',
                },
              ]}
            >
              {step.step}
            </Text>
          </View>

          {/* Connecting Line */}
          {!isLast && (
            <View
              style={{
                width: 2,
                height: 40,
                backgroundColor: variant === 'primary' 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : theme.colors.primary[200],
                marginTop: theme.spacing[2],
              }}
            />
          )}
        </View>

        {/* Step Content */}
        <View style={{ flex: 1, paddingTop: theme.spacing[2] }}>
          <Text
            style={[
              theme.typography.heading.h5,
              {
                color: getTextColor('primary'),
                marginBottom: theme.spacing[2],
              },
            ]}
          >
            {step.title}
          </Text>

          <Text
            style={[
              theme.typography.body.base,
              {
                color: getTextColor('secondary'),
                lineHeight: theme.typography.body.base.lineHeight * 1.3,
              },
            ]}
          >
            {step.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderHorizontalStep = ({ item: step }: { item: ProcessStep }) => (
    <View
      style={{
        alignItems: 'center',
        width: screenWidth * 0.8,
        marginRight: theme.spacing[6],
      }}
    >
      {/* Step Icon */}
      <View
        style={{
          width: 80,
          height: 80,
          backgroundColor: variant === 'primary' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : theme.colors.primary[100],
          borderRadius: theme.borderRadius['2xl'],
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing[4],
          ...theme.shadows.md,
        }}
      >
        <Text style={{ fontSize: 40 }}>{step.icon}</Text>
      </View>

      {/* Step Number */}
      <View
        style={{
          width: 32,
          height: 32,
          backgroundColor: theme.colors.primary[500],
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing[3],
        }}
      >
        <Text
          style={[
            theme.typography.label.base,
            {
              color: theme.colors.white,
              fontWeight: '700',
            },
          ]}
        >
          {step.step}
        </Text>
      </View>

      {/* Step Content */}
      <View style={{ alignItems: 'center' }}>
        <Text
          style={[
            theme.typography.heading.h6,
            {
              color: getTextColor('primary'),
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            },
          ]}
        >
          {step.title}
        </Text>

        <Text
          style={[
            theme.typography.body.sm,
            {
              color: getTextColor('secondary'),
              textAlign: 'center',
              lineHeight: theme.typography.body.sm.lineHeight * 1.4,
            },
          ]}
        >
          {step.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: theme.semanticSpacing.sectionSpacing.lg,
        },
        containerStyle,
      ]}
    >
      {/* Section Header */}
      {title && (
        <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md, marginBottom: theme.spacing[8] }}>
          <Text
            style={[
              theme.typography.heading.h2,
              {
                color: getTextColor('primary'),
                textAlign: 'center',
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            {title}
          </Text>
          
          {subtitle && (
            <Text
              style={[
                theme.typography.body.base,
                {
                  color: getTextColor('secondary'),
                  textAlign: 'center',
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Steps Content */}
      {orientation === 'vertical' ? (
        <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md }}>
          <FlatList
            data={steps}
            renderItem={renderVerticalStep}
            keyExtractor={(item) => item.step.toString()}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <FlatList
          data={steps}
          renderItem={renderHorizontalStep}
          keyExtractor={(item) => item.step.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.semanticSpacing.containerPadding.md,
          }}
        />
      )}
    </View>
  );
};

// Compact Steps Indicator (for progress tracking)
export interface StepsIndicatorProps {
  /** Current step (1-indexed) */
  currentStep: number;
  
  /** Total number of steps */
  totalSteps?: number;
  
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Show step labels */
  showLabels?: boolean;
  
  /** Step labels */
  labels?: string[];
}

export const StepsIndicator: React.FC<StepsIndicatorProps> = ({
  currentStep,
  totalSteps = 3,
  containerStyle,
  showLabels = false,
  labels = ['Choose', 'Book', 'Complete'],
}) => {
  const renderStepDot = (stepNumber: number, index: number) => {
    const isActive = stepNumber <= currentStep;
    const isLast = index === totalSteps - 1;
    
    return (
      <View key={stepNumber} style={{ alignItems: 'center', flex: 1 }}>
        {/* Step Circle */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isActive ? theme.colors.primary[500] : theme.colors.secondary[200],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: showLabels ? theme.spacing[2] : 0,
          }}
        >
          {isActive ? (
            <Text
              style={[
                theme.typography.label.sm,
                {
                  color: theme.colors.white,
                  fontWeight: '600',
                },
              ]}
            >
              ✓
            </Text>
          ) : (
            <Text
              style={[
                theme.typography.label.sm,
                {
                  color: theme.colors.text.muted,
                  fontWeight: '600',
                },
              ]}
            >
              {stepNumber}
            </Text>
          )}
        </View>

        {/* Step Label */}
        {showLabels && labels[index] && (
          <Text
            style={[
              theme.typography.caption.sm,
              {
                color: isActive ? theme.colors.primary[600] : theme.colors.text.muted,
                textAlign: 'center',
              },
            ]}
          >
            {labels[index]}
          </Text>
        )}
      </View>
    );
  };

  const renderConnector = (index: number) => {
    const isActive = index + 1 < currentStep;
    
    return (
      <View
        key={`connector-${index}`}
        style={{
          height: 2,
          backgroundColor: isActive ? theme.colors.primary[500] : theme.colors.secondary[200],
          marginTop: 15,
          flex: 1,
        }}
      />
    );
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        },
        containerStyle,
      ]}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isLast = index === totalSteps - 1;
        
        return (
          <React.Fragment key={stepNumber}>
            {renderStepDot(stepNumber, index)}
            {!isLast && renderConnector(index)}
          </React.Fragment>
        );
      })}
    </View>
  );
};

export default HowItWorksSection;