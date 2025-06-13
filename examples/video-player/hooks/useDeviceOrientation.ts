import * as ScreenOrientation from 'expo-screen-orientation';

import { useEffect, useState } from 'react';

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>(
    ScreenOrientation.Orientation.UNKNOWN,
  );

  const isLandscape =
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

  const isPortrait =
    orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN ||
    orientation === ScreenOrientation.Orientation.PORTRAIT_UP;

  useEffect(() => {
    const getOrientation = async () => {
      try {
        const initialOrientation =
          await ScreenOrientation.getOrientationAsync();
        setOrientation(initialOrientation);
      } catch (error) {
        console.error('Failed to get initial screen orientation', error);
      }
    };

    getOrientation();

    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      },
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return { orientation, isLandscape, isPortrait };
};
