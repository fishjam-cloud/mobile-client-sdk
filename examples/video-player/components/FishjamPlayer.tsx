import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WhepClientView } from 'react-native-whip-whep';
import FishjamPlayerError from './FishjamPlayerError';

interface FishjamPlayerProps {
  isLandscape: boolean;
  hasErrors?: boolean;
  restart?: () => Promise<void>;
  isReconnecting?: boolean;
  pictureInPicture?: boolean;
}

const FishjamPlayer = ({
  isLandscape,
  hasErrors,
  restart,
  isReconnecting,
}: FishjamPlayerProps) => {
  const styles = useMemo(() => createStyles(isLandscape), [isLandscape]);

  return (
    <View style={styles.playerContentContainer}>
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
