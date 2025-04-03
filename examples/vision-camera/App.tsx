import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
  Camera,
  CameraPermissionStatus,
  Frame,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from "react-native-vision-camera";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("sendFrame", {});

export function sendFrame(frame: Frame) {
  "worklet";
  if (plugin === null)
    throw new Error('Failed to load Frame Processor Plugin "scanFaces"!');
  return plugin!.call(frame);
}

export default function App() {
  const device = useCameraDevice("back");

  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>("not-determined");

  console.log({ cameraPermissionStatus });

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();

      setCameraPermissionStatus(permission);
    };
    requestCameraPermission();
  });

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    sendFrame(frame);
  }, []);

  if (device && cameraPermissionStatus === "granted") {
    return (
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
    );
  }
  return null;
}
