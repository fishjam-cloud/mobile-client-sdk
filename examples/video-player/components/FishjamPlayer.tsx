import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { WhepClientView } from "react-native-whip-whep";
import FishjamPlayerError from "./FishjamPlayerError";

interface FishjamPlayerProps {
  isLandscape: boolean;
  toggleOverlay: () => void;
  hasErrors?: boolean;
  restart?: () => Promise<void>;
  isReconnecting?: boolean;
}

const FishjamPlayer = ({
  isLandscape,
  toggleOverlay,
  hasErrors,
  restart,
  isReconnecting,
}: FishjamPlayerProps) => {
  const styles = useMemo(() => createStyles(isLandscape), [isLandscape]);

  return (
    <Pressable
      style={styles.playerContentContainer}
      onPress={isLandscape ? toggleOverlay : undefined}
    >
      <View style={styles.playerWhepView}>
        {(!hasErrors || isReconnecting) && (
          <ActivityIndicator
            style={styles.playerLoader}
            size="small"
            color="white"
          />
        )}
        <WhepClientView style={styles.playerWhepClientView} />

        {hasErrors && <FishjamPlayerError restart={restart} />}
      </View>
    </Pressable>
  );
};

export default FishjamPlayer;

const createStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    playerLogo: {
      position: "absolute",
      width: 100,
      height: 30,
      bottom: 20,
      right: 50,
      opacity: 0.3,
    },
    playerWhepClientView: {
      flex: 1,
    },
    playerContentContainer: {
      flex: 1,
      justifyContent: isLandscape ? "center" : "flex-start",
      alignItems: "center",
    },
    playerWhepView: {
      width: "100%",
      height: isLandscape ? "100%" : undefined,
      aspectRatio: 16 / 9,
      backgroundColor: "black",
    },
    playerLoader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
  });
