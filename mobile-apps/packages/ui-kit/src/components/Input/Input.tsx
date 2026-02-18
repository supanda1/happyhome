/**
 * Happy Homes Input Component
 * 
 * Form input components matching the web UI styling
 * with proper validation states and mobile optimizations.
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
  KeyboardTypeOptions,
} from 'react-native';
import { theme } from '@happyhomes/shared';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Input size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /** Input variant */
  variant?: 'default' | 'filled' | 'outlined';
  
  /** Show required indicator */
  required?: boolean;
  
  /** Left icon */
  leftIcon?: React.ReactNode;
  
  /** Right icon */
  rightIcon?: React.ReactNode;
  
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Custom input style */
  inputStyle?: TextStyle;
  
  /** Custom label style */
  labelStyle?: TextStyle;
  
  /** Show/hide password toggle for password inputs */
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'outlined',
  required = false,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  showPasswordToggle = false,
  secureTextEntry,
  disabled = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing[4],
    };

    return baseStyle;
  };

  const getInputContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      minHeight: getHeightForSize(),
      paddingHorizontal: getPaddingForSize(),
    };

    // Variant-specific styles
    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          borderBottomWidth: 2,
          borderBottomColor: error 
            ? theme.colors.danger[500]
            : isFocused 
            ? theme.colors.primary[500]
            : theme.colors.border.light,
          backgroundColor: 'transparent',
          borderRadius: 0,
          paddingHorizontal: 0,
        };

      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: error 
            ? theme.colors.danger[500]
            : isFocused 
            ? theme.colors.primary[500]
            : 'transparent',
        };

      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface.primary,
          borderWidth: 1,
          borderColor: error 
            ? theme.colors.danger[500]
            : isFocused 
            ? theme.colors.primary[500]
            : theme.colors.border.light,
        };

      default:
        return baseStyle;
    }
  };

  const getInputStyles = (): TextStyle => {
    return {
      flex: 1,
      ...getTypographyForSize(),
      color: theme.colors.text.primary,
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getLabelStyles = (): TextStyle => {
    return {
      ...theme.typography.label.base,
      color: error 
        ? theme.colors.danger[600]
        : theme.colors.text.secondary,
      marginBottom: theme.spacing[2],
    };
  };

  const getHeightForSize = (): number => {
    switch (size) {
      case 'xs': return theme.sizing.input.xs;
      case 'sm': return theme.sizing.input.sm;
      case 'md': return theme.sizing.input.md;
      case 'lg': return theme.sizing.input.lg;
      default: return theme.sizing.input.md;
    }
  };

  const getPaddingForSize = (): number => {
    switch (size) {
      case 'xs': return theme.semanticSpacing.inputPadding.xs.horizontal;
      case 'sm': return theme.semanticSpacing.inputPadding.sm.horizontal;
      case 'md': return theme.semanticSpacing.inputPadding.md.horizontal;
      case 'lg': return theme.semanticSpacing.inputPadding.lg.horizontal;
      default: return theme.semanticSpacing.inputPadding.md.horizontal;
    }
  };

  const getTypographyForSize = () => {
    switch (size) {
      case 'xs':
      case 'sm':
        return theme.typography.body.sm;
      case 'md':
        return theme.typography.body.base;
      case 'lg':
        return theme.typography.body.lg;
      default:
        return theme.typography.body.base;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur();
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const containerStyles = getContainerStyles();
  const inputContainerStyles = getInputContainerStyles();
  const inputStyles = getInputStyles();
  const labelStyles = getLabelStyles();

  return (
    <View style={[containerStyles, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[labelStyles, labelStyle]}>
          {label}
          {required && <Text style={{ color: theme.colors.danger[500] }}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View 
        style={[
          inputContainerStyles, 
          { opacity: disabled ? 0.6 : 1 }
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={{ marginRight: theme.spacing[3] }}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          ref={ref}
          style={[inputStyles, inputStyle]}
          placeholderTextColor={theme.colors.text.muted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          {...props}
        />

        {/* Password Toggle */}
        {showPasswordToggle && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility}
            style={{ marginLeft: theme.spacing[3] }}
          >
            <Text style={{ color: theme.colors.primary[500] }}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {rightIcon && !showPasswordToggle && (
          <View style={{ marginLeft: theme.spacing[3] }}>
            {rightIcon}
          </View>
        )}
      </View>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <Text
          style={[
            theme.typography.caption.sm,
            {
              color: error ? theme.colors.danger[600] : theme.colors.text.muted,
              marginTop: theme.spacing[1],
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

// Phone Number Input (specialized component)
export interface PhoneInputProps extends Omit<InputProps, 'keyboardType'> {
  /** Country code */
  countryCode?: string;
  
  /** Show country selector */
  showCountrySelector?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode = '+91',
  showCountrySelector = true,
  ...props
}) => {
  return (
    <Input
      {...props}
      keyboardType="phone-pad"
      leftIcon={
        showCountrySelector ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[theme.typography.body.base, { color: theme.colors.text.secondary }]}>
              {countryCode}
            </Text>
            <View 
              style={{
                width: 1,
                height: 20,
                backgroundColor: theme.colors.border.light,
                marginLeft: theme.spacing[2],
              }}
            />
          </View>
        ) : undefined
      }
    />
  );
};

// Search Input (specialized component)
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  /** Show search icon */
  showSearchIcon?: boolean;
  
  /** Show clear button when text exists */
  showClearButton?: boolean;
  
  /** Clear button callback */
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  showSearchIcon = true,
  showClearButton = true,
  onClear,
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleClear = () => {
    if (value === undefined) {
      setInternalValue('');
    }
    if (onClear) {
      onClear();
    }
  };

  const handleChangeText = (text: string) => {
    if (value === undefined) {
      setInternalValue(text);
    }
    if (props.onChangeText) {
      props.onChangeText(text);
    }
  };

  return (
    <Input
      {...props}
      value={currentValue}
      onChangeText={handleChangeText}
      leftIcon={showSearchIcon ? (
        <Text style={{ color: theme.colors.text.muted }}>🔍</Text>
      ) : undefined}
      rightIcon={showClearButton && currentValue ? (
        <TouchableOpacity onPress={handleClear}>
          <Text style={{ color: theme.colors.text.muted }}>✕</Text>
        </TouchableOpacity>
      ) : undefined}
      placeholder={props.placeholder || 'Search...'}
    />
  );
};

export default Input;