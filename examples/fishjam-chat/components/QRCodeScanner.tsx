import { Camera, CameraView } from 'expo-camera';
import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import Button from './Button';

type Props = {
  onCodeScanned: (code: string) => void;
};

export default function QRCodeScanner({ onCodeScanned }: Props) {
  const [isBarcodeScannerVisible, setIsBarcodeScannerVisible] = useState(false);

  const onPress = async () => {
    if (isBarcodeScannerVisible) {
      setIsBarcodeScannerVisible(false);
      return;
    }
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setIsBarcodeScannerVisible(true);
    }
  };

  const onBarCodeScanned = useCallback<({ data }: { data: string }) => void>(
    ({ data }) => {
      onCodeScanned(data);
      setIsBarcodeScannerVisible(false);
    },
    [onCodeScanned],
  );

  return (
    <>
      <Modal
        visible={isBarcodeScannerVisible}
        onRequestClose={() => setIsBarcodeScannerVisible(false)}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.barcodeWrapper}>
          <CameraView
            onBarcodeScanned={onBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417'],
            }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </Modal>
      <Button onPress={onPress} title="Scan QR code" />
    </>
  );
}

const styles = StyleSheet.create({
  barcode: {
    flex: 1,
  },
  barcodeWrapper: {
    backgroundColor: 'black',
    flex: 1,
  },
});
