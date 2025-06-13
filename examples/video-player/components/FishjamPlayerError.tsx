import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

interface FishjamPlayerErrorProps {
  restart?: () => Promise<void>;
}

const FishjamPlayerError = ({ restart }: FishjamPlayerErrorProps) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>
      {'Looks like your broadcast is not available.\nTry again.'}
    </Text>
    <Pressable style={styles.errorRestartButton} onPress={restart}>
      <Text style={styles.errorRestartButtonText}>Restart</Text>
    </Pressable>
  </View>
);

export default FishjamPlayerError;

const styles = StyleSheet.create({
  errorContainer: {
    position: 'absolute',
    marginHorizontal: 44,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorRestartButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  errorRestartButtonText: {
    color: '#3498DB',
    fontWeight: 'bold',
  },
});
