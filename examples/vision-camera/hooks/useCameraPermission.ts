import { useEffect, useState } from "react";
import { Camera, CameraPermissionStatus } from "react-native-vision-camera";

export function useCameraPermission() {
  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>("not-determined");

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      setCameraPermissionStatus(permission);
    };
    requestCameraPermission();
  }, []);

  return cameraPermissionStatus;
}
