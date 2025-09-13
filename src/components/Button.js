import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.textPrimary,
  },
  secondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryText: {
    color: colors.primary,
  },
  success: {
    backgroundColor: colors.success,
  },
  successText: {
    color: colors.textPrimary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  dangerText: {
    color: colors.textPrimary,
  },
  disabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textPrimary,
  },
});

export default Button;

