import { StyleSheet, View } from "react-native";
import { useLivestream } from "../hooks/useLivestream";
import FishjamPlayerControlsOverlay from "../components/FishjamPlayerControlsOverlay";
import { useOrientation } from "../hooks/useOrientation";
import { useOverlayState } from "../hooks/useOverlayState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import FishjamPlayer from "../components/FishjamPlayer";

const VideoPlayerScreen = () => {
  const { isReconnecting, hasErrors, restart } = useLivestream();
  const { isLandscape, toggleOrientation } = useOrientation();
  const { toggleOverlay, isOverlayVisible } = useOverlayState(isLandscape);

  const insets = useSafeAreaInsets();

  const styles = useMemo(() => createStyles(isLandscape), [isLandscape]);

  useEffect(() => {
    if (isLandscape) {
      activateKeepAwakeAsync();
    }

    return () => {
      deactivateKeepAwake();
    };
  }, [isLandscape]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: isLandscape ? 0 : insets.top,
        },
      ]}
    >
      <View style={styles.container}>
        <FishjamPlayer
          isLandscape={isLandscape}
          toggleOverlay={toggleOverlay}
          hasErrors={hasErrors}
          restart={restart}
          isReconnecting={isReconnecting}
        />
        <FishjamPlayerControlsOverlay
          isLandscape={isLandscape}
          isVisible={isOverlayVisible}
          toggleOrientation={toggleOrientation}
        />
      </View>
    </View>
  );
};

export default VideoPlayerScreen;

const createStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: "black",
      flex: isLandscape ? 1 : 0,
    },
    container: {
      flex: 1,
      position: "relative",
    },
    whepClientView: {
      flex: 1,
    },
  });
