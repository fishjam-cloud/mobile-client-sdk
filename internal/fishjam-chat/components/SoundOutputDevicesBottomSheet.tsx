import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import SoundOutputDevicesSection from './SoundOutputDevicesSection';
import { soundOutputDevicesLabels } from '../types/ComponentLabels';

const { OUTPUT_DEVICES_BOTTOM_SHEET } = soundOutputDevicesLabels;

export default function SoundOutputDevicesBottomSheet({
  bottomSheetRef,
}: {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}) {
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);

  const handleSheetChanges = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      enablePanDownToClose
      index={bottomSheetIndex}
      snapPoints={[300]}
      backgroundStyle={styles.bottomSheetWrapper}>
      <BottomSheetView accessibilityLabel={OUTPUT_DEVICES_BOTTOM_SHEET}>
        <SoundOutputDevicesSection />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: 'white',
  },
});
