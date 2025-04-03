import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevice,
} from "react-native-vision-camera";

export default function App() {
  const device = useCameraDevice("back");

  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>("not-determined");

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();

      setCameraPermissionStatus(permission);
    };
    requestCameraPermission();
  });

  if (device && cameraPermissionStatus === "granted") {
    return (
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
    );
  }
  return null;
}
