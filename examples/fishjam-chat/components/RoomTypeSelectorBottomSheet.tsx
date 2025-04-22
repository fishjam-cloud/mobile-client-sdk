import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RoomType, ROOM_TYPE_LABELS } from '../utils/roomManager';
import { TextColors, BrandColors } from '../utils/Colors';

interface RoomTypeTileProps {
  type: RoomType;
  label: string;
  selected: RoomType;
  onSelect: (type: RoomType) => void;
  accessibilityLabel?: string;
}

function RoomTypeTile({
  type,
  label,
  selected,
  onSelect,
  accessibilityLabel,
}: RoomTypeTileProps) {
  const isSelected = type === selected;

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      onPress={() => onSelect(type)}>
      <View style={styles.tile}>
        <Text style={isSelected ? styles.selectedType : styles.unselectedType}>
          {label}
        </Text>
        {isSelected ? (
          <MaterialCommunityIcons
            name="checkbox-marked-circle"
            size={32}
            color={TextColors.description}
            style={styles.selectedIconStyle}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function RoomTypeSelectorBottomSheet({
  bottomSheetRef,
  selectedType,
  onSelectType,
}: {
  bottomSheetRef: React.RefObject<BottomSheet>;
  selectedType: RoomType;
  onSelectType: (type: RoomType) => void;
}) {
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
  const roomTypes = Object.entries(ROOM_TYPE_LABELS).map(([type, label]) => ({
    type: type as RoomType,
    label,
  }));

  const handleSheetChanges = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  const handleSelectType = (type: RoomType) => {
    onSelectType(type);
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      enablePanDownToClose
      index={bottomSheetIndex}
      snapPoints={[300]}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.bottomSheetWrapper}>
      <BottomSheetView accessibilityLabel="ROOM_TYPE_BOTTOM_SHEET">
        <View style={styles.wrapper}>
          <Text style={styles.title}>Select Room Type</Text>
          <FlatList
            data={roomTypes}
            renderItem={({ item, index }) => (
              <RoomTypeTile
                type={item.type}
                label={item.label}
                selected={selectedType}
                onSelect={handleSelectType}
                accessibilityLabel={`ROOM_TYPE_BUTTON_${index}`}
              />
            )}
            keyExtractor={(item) => item.type}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 10,
  },
  title: {
    color: 'black',
    fontSize: 20,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  tile: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unselectedType: {
    padding: 14,
    fontSize: 16,
    color: TextColors.additionalLightText,
  },
  selectedType: {
    padding: 12,
    fontSize: 16,
    color: TextColors.description,
  },
  selectedIconStyle: {
    padding: 8,
  },
  bottomSheetWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: BrandColors.seaBlue80,
    width: 50,
  },
});
