import {
  APP_ID,
  DEFAULT_PEER_NAME,
  DEFAULT_ROOM_NAME,
} from "../config/appConfig";

export async function getRoomDetails(
  roomName: string = DEFAULT_ROOM_NAME,
  peerName: string = DEFAULT_PEER_NAME,
) {
  const response = await fetch(
    `https://fishjam.io/api/v1/connect/${APP_ID}/room-manager?roomName=${roomName}&peerName=${peerName}`,
  );
  const { url, peerToken } = await response.json();
  return { url, peerToken };
}
