import { FishjamSandboxRoom } from '@fishjam-cloud/react-native-client';

export const ConnectWithFishjamRoom = () => (
  <FishjamSandboxRoom
    roomManagerUrl="https://room.fishjam.io/api/rooms"
    roomName="test-room"
    peerName="test-user"
  />
);
