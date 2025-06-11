import { Platform, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DeviceMotion, DeviceMotionOrientation } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";

export const useOrientation = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(width > height);
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

  const toggleOrientation = useCallback(async () => {
    navigation.setOptions({
      orientation: isLandscape ? "portrait" : "landscape",
    });
    setIsLandscape((prev) => !prev);
  }, [isLandscape, navigation]);

  useEffect(() => {
    const subscription = DeviceMotion.addListener(
      ({ rotation, orientation }) => {
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

        navigation.setOptions({
          orientation:
            newOrientation === DeviceMotionOrientation.Portrait
              ? "portrait"
              : "landscape",
        });
        setIsLandscape(newOrientation !== DeviceMotionOrientation.Portrait);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isLandscape, navigation]);

  return {
    isLandscape,
    toggleOrientation,
  };
};
