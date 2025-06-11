import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { useOverlayAnimation } from "../hooks/useOverlayAnimation";
import { setStatusBarHidden } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ControlsOverlayProps {
  isLandscape: boolean;
  isVisible: boolean;
  toggleOrientation: () => void;
}

const gradientColors: [string, string, ...string[]] = [
  "rgba(0, 0, 0, 0.4)",
  "rgba(0,0,0,0.2)",
  "transparent",
];

const FishjamPlayerControlsOverlay = ({
  isLandscape,
  isVisible,
  toggleOrientation,
}: ControlsOverlayProps) => {
  const insets = useSafeAreaInsets();
  const { animatedStyles } = useOverlayAnimation(isVisible, isLandscape);

  const onClosePress = useCallback(() => {
    if (isLandscape) {
      toggleOrientation();
    }
  }, [isLandscape, toggleOrientation]);

  useEffect(() => {
    if (isLandscape) {
      setStatusBarHidden(true);
    }
    return () => {
      setStatusBarHidden(true);
    };
  }, [isLandscape]);

  return (
    <Animated.View
      style={[styles.container, animatedStyles, { paddingTop: insets.top }]}
    >
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={toggleOrientation}>
            <Feather
              name={isLandscape ? "minimize-2" : "maximize-2"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClosePress}>
            <Feather name="x" size={24} color="white" style={{ opacity: 1 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default FishjamPlayerControlsOverlay;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gradient: {
    height: 120,
    width: "100%",
  },
});
