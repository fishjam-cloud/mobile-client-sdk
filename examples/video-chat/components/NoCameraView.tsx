import React from 'react';
import { View, StyleSheet } from 'react-native';

import Typo from './Typo';
import type AccessibilityLabel from '../types/AccessibilityLabel';
import { BrandColors } from '../utils/Colors';

type NoCameraViewProps = {
  username?: string;
  isSmallTile?: boolean;
} & AccessibilityLabel;

export default function NoCameraView({
  username = '',
  isSmallTile = false,
  accessibilityLabel,
}: NoCameraViewProps) {
  return (
    <View
      style={styles.noCameraBackground}
      accessibilityLabel={accessibilityLabel}>
      <View
        style={[
          styles.noCameraContent,
          isSmallTile ? styles.smallContent : styles.bigContent,
        ]}>
        <Typo variant="h5" color={BrandColors.darkBlue80}>
          {username}
        </Typo>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noCameraBackground: {
    backgroundColor: BrandColors.seaBlue20,
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCameraContent: {
    borderRadius: 5000,
    borderColor: BrandColors.darkBlue60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigContent: {
    width: 132,
    height: 132,
  },
  smallContent: {
    width: 75,
    height: 75,
  },
});
