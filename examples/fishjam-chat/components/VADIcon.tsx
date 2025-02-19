import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { AdditionalColors } from '../utils/Colors';

export default function VADIcon() {
  return (
    <MaterialCommunityIcons
      name="microphone"
      size={25}
      color={AdditionalColors.white}
    />
  );
}
