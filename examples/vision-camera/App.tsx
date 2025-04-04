import { useConnection } from "@fishjam-cloud/react-native-client";
import { Text, View } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { JoinRoomButton } from "./components/JoinRoomButton";
import { useCameraPermission } from "./hooks/useCameraPermission";
import { useWebrtcFrameProcessor } from "./hooks/useVideoFrameProcessor";
import { useEffect } from "react";

export default function App() {
  const device = useCameraDevice("front");
  const cameraPermissionStatus = useCameraPermission();

  const { peerStatus, leaveRoom } = useConnection();
  const isPeerConnected = peerStatus === "connected";

  const frameProcessor = useWebrtcFrameProcessor(isPeerConnected);

  useEffect(() => leaveRoom, [leaveRoom]);

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
