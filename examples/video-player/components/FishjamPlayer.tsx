import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WhepClientView } from "react-native-whip-whep";

interface FishjamPlayerProps {
  isLandscape: boolean;
  toggleOverlay: () => void;
  hasErrors?: boolean;
  restart?: () => Promise<void>;
  isReconnecting?: boolean;
}

export function FishjamPlayer({
  isLandscape,
  toggleOverlay,
  hasErrors,
  restart,
  isReconnecting,
}: FishjamPlayerProps) {
  const dynamicStyles = useMemo(
    () => createDynamicStyles(isLandscape),
    [isLandscape],
  );

  return (
    <Pressable
      style={dynamicStyles.contentContainer}
      onPress={isLandscape ? toggleOverlay : undefined}
    >
      <View style={dynamicStyles.whepView}>
        {!hasErrors && (
          <ActivityIndicator style={styles.loader} size="small" color="white" />
        )}
        <WhepClientView style={styles.whepClientView} />
        {isReconnecting && (
          <ActivityIndicator style={styles.loader} size="small" color="white" />
        )}
        {hasErrors && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {"Looks like your broadcast is not available.\nTry again."}
            </Text>
            <Pressable style={styles.restartButton} onPress={restart}>
              <Text style={styles.restartButtonText}>Restart</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const createDynamicStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1,
      justifyContent: isLandscape ? "center" : "flex-start",
      alignItems: "center",
    },
    whepView: {
      width: "100%",
      height: isLandscape ? "100%" : undefined,
      aspectRatio: 16 / 9,
      backgroundColor: "black",
    },
  });

const styles = StyleSheet.create({
  logo: {
    position: "absolute",
    width: 100,
    height: 30,
    bottom: 20,
    right: 50,
    opacity: 0.3,
  },
  whepClientView: {
    flex: 1,
  },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  restartButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
    alignItems: "center",
  },
  restartButtonText: {
    color: "#3498DB",
    fontWeight: "bold",
  },
  errorContainer: {
    position: "absolute",
    marginHorizontal: 44,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 24,
  },
});
