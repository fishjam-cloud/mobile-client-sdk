import { TrackEncoding } from '@fishjam-cloud/react-native-client';
import React from 'react';
import {
  type GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import AccessibilityLabel from '../types/AccessibilityLabel';
import { BrandColors } from '../utils/Colors';

type LetterButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  trackEncoding: TrackEncoding;
  selected: boolean;
} & AccessibilityLabel;

export default function LetterButton({
  onPress,
  trackEncoding,
  selected,
}: LetterButtonProps) {
  const stylesForText = selected
    ? LetterButtonStyles.textSelected
    : LetterButtonStyles.textUnselected;

  const stylesForButton = selected
    ? LetterButtonStyles.buttonSelected
    : LetterButtonStyles.buttonUnSelected;

  return (
    <TouchableHighlight
      onPress={onPress}
      style={[LetterButtonStyles.common, stylesForButton]}
      key={trackEncoding}>
      <View
        style={[
          LetterButtonStyles.common,
          LetterButtonStyles.button,
          stylesForButton,
        ]}>
        <Text style={[LetterButtonStyles.text, stylesForText]}>
          {trackEncoding.toUpperCase()}
        </Text>
      </View>
    </TouchableHighlight>
  );
}

const LetterButtonStyles = StyleSheet.create({
  common: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: BrandColors.darkBlue100,
  },
  buttonSelected: {
    backgroundColor: BrandColors.darkBlue100,
  },
  buttonUnSelected: {
    backgroundColor: BrandColors.darkBlue20,
  },
  text: {
    fontSize: 18,
  },
  textSelected: {
    color: BrandColors.darkBlue20,
  },
  textUnselected: {
    color: BrandColors.darkBlue100,
  },
});
