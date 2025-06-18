import { useFrameProcessor } from 'react-native-vision-camera';
import { sendFrame } from '../utils/frameUtils';
import { useEffect } from 'react';
import WebrtcSourceModule from '../modules/webrtc-source/src/WebrtcSourceModule';

export function useWebrtcFrameProcessor(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      WebrtcSourceModule.createVisionCameraTrack();
    }
    return () => {
      WebrtcSourceModule.removeVisionCameraTrack();
    };
  }, [enabled]);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (enabled) {
        sendFrame(frame);
      }
    },
    [enabled],
  );

  return frameProcessor;
}
