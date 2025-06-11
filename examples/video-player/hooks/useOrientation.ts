import { Platform, useWindowDimensions } from "react-native";
import { DeviceMotion, DeviceMotionOrientation } from "expo-sensors";
import { useCallback, useEffect, useRef } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

export const useOrientation = () => {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  const prevOrientation = useRef<DeviceMotionOrientation>(
    DeviceMotionOrientation.Portrait,
  );

  const calculateOrientationAndroid = (
    beta: number,
    gamma: number,
  ): DeviceMotionOrientation => {
    const betaAbs = Math.abs(beta);
    const gammaAbs = Math.abs(gamma);

    const isPortrait = betaAbs > gammaAbs;
    return isPortrait
      ? DeviceMotionOrientation.Portrait
      : DeviceMotionOrientation.RightLandscape;
  };

  useEffect(() => {
    const subscription = DeviceMotion.addListener(
      async ({ rotation, orientation }) => {
        if (!rotation) {
          return;
        }

        const { beta, gamma } = rotation;

        // On Android only UI orientation is returned so we need to calculate it from the device rotation
        const newOrientation =
          Platform.OS === "android"
            ? calculateOrientationAndroid(beta, gamma)
            : (orientation as DeviceMotionOrientation);

        if (prevOrientation.current === newOrientation) {
          return;
        }

        prevOrientation.current = newOrientation;

        const isNewLandscape =
          newOrientation === DeviceMotionOrientation.RightLandscape ||
          newOrientation === DeviceMotionOrientation.LeftLandscape;

        await ScreenOrientation.unlockAsync();
        await ScreenOrientation.lockAsync(
          isNewLandscape
            ? ScreenOrientation.OrientationLock.LANDSCAPE
            : ScreenOrientation.OrientationLock.PORTRAIT,
        );

        // navigation.setOptions({
        //   orientation:
        //     newOrientation === DeviceMotionOrientation.Portrait
        //       ? "portrait"
        //       : "landscape",
        // });
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isLandscape]);

  const toggleOrientation = useCallback(async () => {
    await ScreenOrientation.unlockAsync();
    await ScreenOrientation.lockAsync(
      isLandscape
        ? ScreenOrientation.OrientationLock.PORTRAIT
        : ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    // navigation.setOptions({
    //   orientation: isLandscape ? "portrait" : "landscape",
    // });
  }, [isLandscape]);

  return {
    isLandscape,
    toggleOrientation,
  };
};
