import { useEffect } from "react";
import {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  cancelAnimation,
} from "react-native-reanimated";

export const useOverlayAnimation = (
  isOverlayVisible: boolean,
  isLandscape: boolean,
) => {
  const fadeValue = useSharedValue(isLandscape ? 0 : 1);

  useEffect(() => {
    fadeValue.value = withTiming(isOverlayVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    return () => {
      cancelAnimation(fadeValue);
    };
  }, [isOverlayVisible, fadeValue]);

  useEffect(() => {
    if (!isLandscape) {
      fadeValue.value = withTiming(1, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    }
    return () => {
      cancelAnimation(fadeValue);
    };
  }, [isLandscape, fadeValue]);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  return {
    animatedStyles,
  };
};
