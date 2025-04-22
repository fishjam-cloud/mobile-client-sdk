import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RoomType, ROOM_TYPE_LABELS } from '../utils/roomManager';
import { TextColors, BrandColors } from '../utils/Colors';

interface RoomTypeSelectorProps {
  selectedType: RoomType;
  onOpenSelector: () => void;
}

export default function RoomTypeSelector({
  selectedType,
  onOpenSelector,
}: RoomTypeSelectorProps) {
  return (
    <TouchableOpacity
      style={styles.roomTypeSelectorButton}
      onPress={onOpenSelector}>
      <Text style={styles.roomTypeLabel}>Room Type</Text>
      <Text style={styles.roomTypeValue}>{ROOM_TYPE_LABELS[selectedType]}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  roomTypeSelectorButton: {
    backgroundColor: 'white',
    borderRadius: 40,
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: BrandColors.darkBlue100,
    height: 56,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  roomTypeLabel: {
    color: TextColors.additionalLightText,
    fontSize: 16,
  },
  roomTypeValue: {
    color: TextColors.darkText,
    fontSize: 16,
    fontWeight: '500',
  },
});
