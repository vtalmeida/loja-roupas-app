import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const Button = ({ title, onPress, variant = 'primary', style, textStyle, disabled = false }) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primary: {
    backgroundColor: '#2E86AB',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondary: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  secondaryText: {
    color: '#2E86AB',
  },
  success: {
    backgroundColor: '#28A745',
  },
  successText: {
    color: '#FFFFFF',
  },
  danger: {
    backgroundColor: '#DC3545',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabled: {
    backgroundColor: '#6C757D',
    opacity: 0.6,
  },
  disabledText: {
    color: '#FFFFFF',
  },
});

export default Button;

