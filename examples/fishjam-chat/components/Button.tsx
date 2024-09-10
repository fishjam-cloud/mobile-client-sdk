import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Typo from './Typo';
import type AccessibilityLabel from '../types/AccessibilityLabel';
import { AdditionalColors, BrandColors, TextColors } from '../utils/Colors';

type StandardButtonTypeName = 'primary' | 'danger' | 'secondary';

type StandardButtonProps = {
  type?: StandardButtonTypeName;
  disabled?: boolean;
  onPress: () => void;
  title: string;
} & AccessibilityLabel;

function getBackgroundColorStyle(
  buttonType: StandardButtonTypeName,
  isDisabled: boolean,
) {
  if (isDisabled) {
    return StandardButtonStyles.disabled;
  }
  switch (buttonType) {
    case 'primary':
      return StandardButtonStyles.primary;
    case 'danger':
      return StandardButtonStyles.danger;
    case 'secondary':
      return StandardButtonStyles.secondary;
  }
}

function getTextColorForButtonType(
  buttonType: StandardButtonTypeName,
  isDisabled: boolean,
) {
  if (isDisabled) {
    return TextColors.white;
  }
  switch (buttonType) {
    case 'primary':
      return TextColors.white;
    case 'danger':
      return TextColors.white;
    case 'secondary':
      return TextColors.darkText;
  }
}

export default function Button({
  type = 'primary',
  disabled = false,
  accessibilityLabel,
  onPress,
  title,
}: StandardButtonProps) {
  const stylesForButtonType = [
    StandardButtonStyles.common,
    getBackgroundColorStyle(type, disabled),
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}>
      <View style={stylesForButtonType}>
        <Typo
          variant="button"
          color={getTextColorForButtonType(type, disabled)}>
          {title}
        </Typo>
      </View>
    </TouchableOpacity>
  );
}

const StandardButtonStyles = StyleSheet.create({
  common: {
    width: '100%',
    height: 56,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  primary: {
    backgroundColor: BrandColors.darkBlue100,
  },
  danger: {
    backgroundColor: AdditionalColors.red100,
  },
  secondary: {
    backgroundColor: AdditionalColors.white,
  },
  disabled: {
    backgroundColor: AdditionalColors.grey60,
  },
});
