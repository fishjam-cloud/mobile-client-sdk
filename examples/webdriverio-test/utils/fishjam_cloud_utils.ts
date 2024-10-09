import {
  AddPeerRequest,
  Configuration,
  ConfigurationParameters,
  RoomApiFp,
} from '@fishjam-cloud/fishjam-openapi';

const getWebsocketUrl = (host: string, secure: boolean = false) =>
  `${secure ? 'wss' : 'ws'}://${host}`;

const getHttpUrl = (host: string, secure: boolean = false) =>
  `${secure ? 'https' : 'http'}://${host}`;

const configParam: ConfigurationParameters = {
  accessToken: 'development',
  basePath: getHttpUrl(process.env.FISHJAM_HOST_SERVER as string),
};

const config = new Configuration(configParam);

export const createFishjamRoom = async () => {
  const { createRoom } = RoomApiFp(config);
  const createRoomFunction = await createRoom();
  try {
    const response = await createRoomFunction();
    return response.data.data.room;
  } catch (e) {
    console.log(e);
  }
};
export const addPeerToRoom = async (
  roomId: string,
  enableSimulcast: boolean = true,
) => {
  const { addPeer } = RoomApiFp(config);
  const addPeerRequest: AddPeerRequest = {
    type: 'webrtc',
    options: { enableSimulcast },
  };
  const addPeerFunction = await addPeer(roomId, addPeerRequest);
  try {
    const response = await addPeerFunction();
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

export { getWebsocketUrl };
