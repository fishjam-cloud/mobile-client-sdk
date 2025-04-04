import { useFrameProcessor } from "react-native-vision-camera";
import { sendFrame } from "../utils/frameUtils";
import { useEffect } from "react";
import WebrtcSourceModule from "../modules/webrtc-source/src/WebrtcSourceModule";

export function useWebrtcFrameProcessor(isPeerConnected: boolean) {
  useEffect(() => {
    if (isPeerConnected) {
      WebrtcSourceModule.createVisionCameraTrack();
    }
    return () => {
      WebrtcSourceModule.removeVisionCameraTrack();
    };
  }, [isPeerConnected]);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (isPeerConnected) {
        sendFrame(frame);
      }
    },
    [isPeerConnected],
  );

  return frameProcessor;
}
