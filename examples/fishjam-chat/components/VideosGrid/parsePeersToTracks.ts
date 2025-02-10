import { PeerWithTracks } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import { GridTrack } from './GridTrackItem';
import { PeerMetadata } from '../../types/metadata';

const createGridTracksFromPeer = (
  peer: PeerWithTracks<PeerMetadata>,
): GridTrack[] => {
  const tracks: GridTrack[] = [];

  if (peer.cameraTrack && peer.cameraTrack.isActive) {
    tracks.push({
      ...peer.cameraTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.peer?.displayName,
      isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
      aspectRatio: peer.cameraTrack.aspectRatio,
    });
  }

  if (peer.screenShareVideoTrack && peer.screenShareVideoTrack.isActive) {
    tracks.push({
      ...peer.screenShareVideoTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.peer?.displayName,
      isVadActive: peer.screenShareAudioTrack?.vadStatus === 'speech',
      aspectRatio: peer.screenShareVideoTrack.aspectRatio,
    });
  }

  return tracks;
};

export const parsePeersToTracks = (
  localPeer: PeerWithTracks<PeerMetadata> | null,
  remotePeers: PeerWithTracks<PeerMetadata>[],
): GridTrack[] => [
  ...(localPeer ? createGridTracksFromPeer(localPeer) : []),
  ...remotePeers.flatMap(createGridTracksFromPeer),
];
