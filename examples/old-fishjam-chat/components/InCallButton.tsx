import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  type GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

import type AccessibilityLabel from '../types/AccessibilityLabel';
import { AdditionalColors, BrandColors } from '../utils/Colors';

const IconSize = 25;

type ButtonTypeName = 'primary' | 'disconnect';

type InCallButtonProps = {
  type?: ButtonTypeName;
  onPress: (event: GestureResponderEvent) => void;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
} & AccessibilityLabel;

export default function InCallButton({
  type = 'primary',
  onPress,
  iconName,
  accessibilityLabel,
}: InCallButtonProps) {
  const stylesForButtonType = [
    InCallButtonStyles.common,
    type === 'primary'
      ? InCallButtonStyles.primary
      : InCallButtonStyles.disconnect,
  ];
  const buttonColor =
    type === 'primary' ? BrandColors.darkBlue100 : AdditionalColors.white;

  return (
    <TouchableHighlight
      onPress={onPress}
      style={InCallButtonStyles.common}
      accessibilityLabel={accessibilityLabel}>
      <View style={stylesForButtonType}>
        <MaterialCommunityIcons
          name={iconName}
          size={IconSize}
          color={buttonColor}
        />
      </View>
    </TouchableHighlight>
  );
}

const InCallButtonStyles = StyleSheet.create({
  common: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    borderWidth: 1,
    borderColor: BrandColors.darkBlue80,
    borderStyle: 'solid',
    backgroundColor: AdditionalColors.white,
  },
  disconnect: {
    backgroundColor: AdditionalColors.red80,
  },
});
