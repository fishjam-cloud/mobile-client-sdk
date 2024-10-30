import {
  AudioTrack,
  PeerWithTracks,
  VideoTrack,
} from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import { GridTrack } from './GridTrackItem';
import { PeerMetadata } from '../../types/metadata';

const createGridTrackFromPeer = <
  T extends PeerWithTracks<PeerMetadata>,
  VideoTrackKey extends keyof T,
  AudioTrackKey extends keyof T,
>(
  peer: T,
  videoTrack?: T[VideoTrackKey] & VideoTrack,
  audioTrack?: T[AudioTrackKey] & AudioTrack,
): GridTrack => {
  return {
    ...videoTrack,
    peerId: peer.id,
    isLocal: peer.isLocal,
    userName: peer.metadata.peer.displayName,
    isVadActive: audioTrack?.vadStatus === 'speech',
  };
};

const createGridTrackFromPeer = (
  peer: PeerWithTracks<PeerMetadata>,
): GridTrack[] => {
  const tracks: GridTrack[] = [];

  createGridTrackFromPeer(peer, peer.cameraTrack, peer.microphoneTrack);

  if (peer.cameraTrack && peer.cameraTrack.isActive) {
    tracks.push({
      ...peer.cameraTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.peer.displayName,
      isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
    });
  }

  if (peer.screenShareVideoTrack && peer.screenShareVideoTrack.isActive) {
    tracks.push({
      ...peer.screenShareVideoTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.peer.displayName,
      isVadActive: peer.screenShareAudioTrack?.vadStatus === 'speech',
    });
  }

  return tracks;
};

export const parsePeersToTracks = (
  localPeer: PeerWithTracks<PeerMetadata> | null,
  remotePeers: PeerWithTracks<PeerMetadata>[],
): GridTrack[] => {
  return [
    ...(localPeer ? createGridTrackFromPeer(localPeer) : []),
    ...remotePeers.flatMap(createGridTrackFromPeer),
  ];
};
