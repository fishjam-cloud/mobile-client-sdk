import { PeerWithTracks } from '@fishjam-cloud/react-native-client';
import { URL } from 'react-native-url-polyfill';
import { GridTrack } from '../types';

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
