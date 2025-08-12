import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LivestreamViewer } from '@fishjam-cloud/react-native-client';

interface FishjamPlayerProps {
  isLandscape: boolean;
  pictureInPicture?: boolean;
}

const PIP_SIZE = {
  width: 1920,
  height: 1080,
};

const FishjamPlayer = ({
  isLandscape,
  pictureInPicture,
}: FishjamPlayerProps) => {
  const styles = useMemo(() => createStyles(isLandscape), [isLandscape]);

  return (
    <View style={styles.playerContentContainer}>
      <View style={styles.playerWhepView}>
        <LivestreamViewer
          style={styles.playerWhepClientView}
          pipEnabled={pictureInPicture}
          autoStartPip={pictureInPicture}
          autoStopPip={pictureInPicture}
          pipSize={PIP_SIZE}
        />
      </View>
    </View>
  );
};

export default FishjamPlayer;

const createStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    playerWhepClientView: {
      flex: 1,
    },
    playerContentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerWhepView: {
      width: '100%',
      height: isLandscape ? '100%' : undefined,
      aspectRatio: isLandscape ? undefined : 16 / 9,
      backgroundColor: 'black',
    },
    playerLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
