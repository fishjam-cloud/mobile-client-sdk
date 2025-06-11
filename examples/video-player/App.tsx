import { StyleSheet, View } from "react-native";
import { useLivestream } from "./hooks/useLivestream";
import FishjamPlayerControlsOverlay from "./components/FishjamPlayerControlsOverlay";
import { useOrientation } from "./hooks/useOrientation";
import { useOverlayState } from "./hooks/useOverlayState";
import { FishjamPlayer } from "./components/FishjamPlayer";

const App = () => {
  const { isReconnecting, hasErrors, restart } = useLivestream();
  const { isLandscape, toggleOrientation } = useOrientation();
  const { toggleOverlay, isOverlayVisible } = useOverlayState(isLandscape);

  return (
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
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  whepClientView: {
    flex: 1,
  },
});
