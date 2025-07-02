import { PeerWithTracks } from '@fishjam-cloud/react-native-client';
import { URL } from 'react-native-url-polyfill';
import { GridTrack } from '../types';

/**
 * Get Fishjam URL and Peer Token from Room Manager service.
 * Note that this will work only on Staging environments.
 * For production, you have to implement your own service to retrieve url and token
 *
 * https://docs.fishjam.io/room-manager
 */
export const joinRoomWithRoomManager = async (
  roomManagerUrl: string,
  roomName: string,
  peerName: string,
) => {
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
};

const createGridTracksFromPeer = (peer: PeerWithTracks): GridTrack[] => {
  const tracks: GridTrack[] = [];

  if (peer.cameraTrack && peer.cameraTrack.isActive) {
    tracks.push({
      track: peer.cameraTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
      aspectRatio: peer.cameraTrack.aspectRatio,
    });
  }

  if (peer.screenShareVideoTrack && peer.screenShareVideoTrack.isActive) {
    tracks.push({
      track: peer.screenShareVideoTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      isVadActive: peer.screenShareAudioTrack?.vadStatus === 'speech',
      aspectRatio: peer.screenShareVideoTrack.aspectRatio,
    });
  }

  if (tracks.length === 0) {
    tracks.push({
      track: null,
      peerId: peer.id,
      isLocal: peer.isLocal,
      isVadActive:
        peer.microphoneTrack?.vadStatus === 'speech' ||
        peer.screenShareAudioTrack?.vadStatus === 'speech',
      aspectRatio: null,
    });
  }

  return tracks;
};

export const parsePeersToTracks = (
  localPeer: PeerWithTracks | null,
  remotePeers: PeerWithTracks[],
): GridTrack[] => [
  ...(localPeer ? createGridTracksFromPeer(localPeer) : []),
  ...remotePeers.flatMap(createGridTracksFromPeer),
];
