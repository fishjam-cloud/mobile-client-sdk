import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { useOverlayAnimation } from "../hooks/useOverlayAnimation";
import { setStatusBarHidden } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";

interface FishjamControlsOverlayProps {
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
}: FishjamControlsOverlayProps) => {
  const navigation = useNavigation();

  const styles = useMemo(() => makeStyles(isLandscape), [isLandscape]);
  const { animatedStyles } = useOverlayAnimation(isVisible, isLandscape);

  const onClosePress = useCallback(() => {
    if (isLandscape) {
      toggleOrientation();
    }
  }, [isLandscape, toggleOrientation]);

  useEffect(() => {
    if (isLandscape) {
      setStatusBarHidden(true);
      navigation.setOptions({
        autoHideHomeIndicator: true,
      });
    }
    return () => {
      setStatusBarHidden(false);
      navigation.setOptions({
        autoHideHomeIndicator: false,
      });
    };
  }, [isLandscape, navigation]);

  return (
    <Animated.View style={[styles.controlsWrapper, animatedStyles]}>
      <LinearGradient colors={gradientColors} style={styles.controlsGradient}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={toggleOrientation}
            style={styles.controlsButton}
          >
            <Feather
              name={isLandscape ? "minimize-2" : "maximize-2"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          {isLandscape && (
            <TouchableOpacity
              onPress={onClosePress}
              style={styles.controlsButton}
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default FishjamPlayerControlsOverlay;

const makeStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    controlsWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
    controlsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: isLandscape ? 16 : 0,
    },
    controlsGradient: {
      height: 120,
      width: "100%",
    },
    controlsButton: {
      padding: 10,
    },
  });
