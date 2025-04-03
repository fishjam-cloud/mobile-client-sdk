import { useConnection } from "@fishjam-cloud/react-native-client";
import { useCallback, useEffect, useState } from "react";
import { Button, View } from "react-native";
import {
  Camera,
  CameraPermissionStatus,
  Frame,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from "react-native-vision-camera";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("sendFrame", {});

// Check https://cloud.fishjam.work/app/ for your app ID
const YOUR_APP_ID = "ea94930e3ffd47c490f5144c43d57340";

export function JoinRoomButton() {
  const { joinRoom, leaveRoom } = useConnection();

  useEffect(() => () => leaveRoom(), [leaveRoom]);

  const onPressJoin = useCallback(async () => {
    const data = await getRoomDetails("Room", "User");
    const { url, peerToken } = data;

    console.log({ data });
    console.log("received url: " + url);

    await joinRoom({ url, peerToken });

    console.log("joined room");
  }, [joinRoom]);

  return (
    <View style={{ flex: 1 }}>
      <Button onPress={onPressJoin} title="Join Room" />
    </View>
  );
}

async function getRoomDetails(roomName: string, peerName: string) {
  const response = await fetch(
    `https://room.fishjam.io/api/rooms?roomName=${roomName}&peerName=${peerName}`,
  );
  const { url, peerToken } = await response.json();
  return { url, peerToken };
}

export function sendFrame(frame: Frame) {
  "worklet";
  if (plugin === null)
    throw new Error('Failed to load Frame Processor Plugin "scanFaces"!');
  return plugin!.call(frame);
}

export default function App() {
  const device = useCameraDevice("back");

  const { peerStatus } = useConnection();

  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>("not-determined");

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();

      setCameraPermissionStatus(permission);
    };
    requestCameraPermission();
  });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (peerStatus === "connected") {
        sendFrame(frame);
      }
    },
    [peerStatus],
  );

  if (device && cameraPermissionStatus === "granted") {
    return (
      <View style={{ flex: 1 }}>
        <Camera
          style={{ flex: 4 }}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
        />
        <JoinRoomButton />
      </View>
    );
  }
  return null;
}
