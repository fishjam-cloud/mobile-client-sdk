import { URL } from 'react-native-url-polyfill';

/**
 * Get Fishjam URL and Peer Token from Room Manager service.
 * Note that this will work only on Staging environments.
 * For production, you have to implement your own service to retrieve url and token
 *
 * https://docs.fishjam.io/room-manager
 */
export async function joinRoomWithRoomManager(
  roomManagerUrl: string,
  roomName: string,
  peerName: string,
) {
  const url = new URL(roomManagerUrl);
  url.searchParams.set('roomName', roomName);
  url.searchParams.set('peerName', peerName);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const responseText = await response.text();
    console.warn(
      'get_fishjam_failed',
      `statusCode=${response.status}`,
      `message=${responseText}`,
    );
    throw new Error(responseText);
  }
  const tokenData = (await response.json()) as {
    url: string;
    peerToken: string;
  };

  return {
    fishjamUrl: tokenData.url,
    token: tokenData.peerToken,
  };
}
