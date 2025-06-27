import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  AudioOutputDevice,
  AudioOutputDeviceType,
  useAudioSettings,
} from '@fishjam-cloud/react-native-client';
import React from 'react';
import {
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import { soundOutputDevicesLabels } from '../types/ComponentLabels';
import { TextColors } from '../utils/Colors';

const { TITLE_TEXT, OUTPUT_DEVICE_BUTTON } = soundOutputDevicesLabels;

function SoundOutputDeviceTile({
  item,
  selected,
  selectOutputAudioDevice,
  accessibilityLabel,
}: {
  item: AudioOutputDevice;
  selected: AudioOutputDevice | undefined;
  selectOutputAudioDevice: (device: AudioOutputDeviceType) => Promise<void>;
  accessibilityLabel?: string | undefined;
}) {
  const isSelected =
    item.type === selected?.type && item.name === selected.name;

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      onPress={async () => {
        await selectOutputAudioDevice(item.type);
      }}>
      <View style={styles.tile}>
        <Text
          style={isSelected ? styles.selectedDevice : styles.unselectedDevice}>
          {item.name}
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

export default function SoundOutputDevicesSection() {
  const audioSettings = useAudioSettings();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title} accessibilityLabel={TITLE_TEXT}>
        Select output audio device
      </Text>
      <FlatList
        data={audioSettings.availableDevices}
        renderItem={(item) => (
          <SoundOutputDeviceTile
            item={item.item}
            selected={audioSettings.selectedAudioOutputDevice ?? undefined}
            selectOutputAudioDevice={audioSettings.selectOutputAudioDevice}
            accessibilityLabel={OUTPUT_DEVICE_BUTTON + item.index}
          />
        )}
        keyExtractor={(item: AudioOutputDevice) => item.name + item.type}
      />
    </View>
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
  unselectedDevice: {
    padding: 14,
    fontSize: 16,
    color: TextColors.additionalLightText,
  },
  selectedDevice: {
    padding: 12,
    fontSize: 16,
    color: TextColors.description,
  },
  selectedIconStyle: {
    padding: 8,
  },
});
