import { useConnection } from "@fishjam-cloud/react-native-client";
import { useCallback, useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import {
  Camera,
  CameraPermissionStatus,
  Frame,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from "react-native-vision-camera";
import WebrtcSourceModule from "./modules/webrtc-source/src/WebrtcSourceModule";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("sendFrame", {});

// Visit https://fishjam.io/app/sandbox for your app ID
const YOUR_APP_ID = "";

export function JoinRoomButton() {
  const { joinRoom, leaveRoom, peerStatus } = useConnection();

  const onLeaveRoom = useCallback(() => {
    WebrtcSourceModule.removeVisionCameraTrack();
    leaveRoom();
  }, []);

  useEffect(
    () => () => {
      onLeaveRoom();
    },
    [],
  );

  const onPressJoin = useCallback(async () => {
    await WebrtcSourceModule.createVisionCameraTrack();

    console.log("joining");
    const data = await getRoomDetails("Room", "User");
    const { url, peerToken } = data;

    console.log({ data });
    console.log("received url: " + url);

    await joinRoom({ url, peerToken });

    console.log("joined room");
  }, [joinRoom]);

  return (
    <View style={{ flex: 1 }}>
      <Text>{peerStatus}</Text>
      {peerStatus === "idle" && (
        <Button onPress={onPressJoin} title="Join Room" />
      )}
      {peerStatus === "connected" && (
        <Button onPress={onLeaveRoom} color="red" title="Leave Room" />
      )}
    </View>
  );
}

async function getRoomDetails(roomName: string, peerName: string) {
  const response = await fetch(
    `https://fishjam.io/api/v1/connect/${YOUR_APP_ID}/room-manager?roomName=${roomName}&peerName=${peerName}`,
  );
  const { url, peerToken } = await response.json();
  return { url, peerToken };
}

export function sendFrame(frame: Frame) {
  "worklet";
  if (!plugin) {
    throw new Error('Failed to load Frame Processor Plugin "sendFrame"!');
  } else {
    return plugin.call(frame);
  }
}

export default function App() {
  const device = useCameraDevice("front");

  const { peerStatus } = useConnection();

  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>("not-determined");

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();

      setCameraPermissionStatus(permission);
    };
    requestCameraPermission();
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (peerStatus === "connected") {
        sendFrame(frame);
      }
    },
    [peerStatus],
  );

  if (cameraPermissionStatus !== "granted") {
    return <Text>Camera permission status is: {cameraPermissionStatus}</Text>;
  }

  if (device) {
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
