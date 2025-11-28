import { PeerWithTracks } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import { GridTrack } from './GridTrackItem';
import { PeerMetadata, ServerMetadata } from '../../types/metadata';

const createGridTracksFromPeer = (
  peer: PeerWithTracks<PeerMetadata, ServerMetadata>,
): GridTrack[] => {
  const tracks: GridTrack[] = [];

  if (peer.cameraTrack && peer.cameraTrack.isActive) {
    tracks.push({
      ...peer.cameraTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.server?.username,
      isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
      aspectRatio: peer.cameraTrack.aspectRatio,
    });
  }

  if (peer.screenShareVideoTrack && peer.screenShareVideoTrack.isActive) {
    tracks.push({
      ...peer.screenShareVideoTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.server?.username,
      isVadActive: peer.screenShareAudioTrack?.vadStatus === 'speech',
      aspectRatio: peer.screenShareVideoTrack.aspectRatio,
    });
  }

  return tracks;
};

export const parsePeersToTracks = (
  localPeer: PeerWithTracks<PeerMetadata, ServerMetadata> | null,
  remotePeers: PeerWithTracks<PeerMetadata, ServerMetadata>[],
): GridTrack[] => [
  ...(localPeer ? createGridTracksFromPeer(localPeer) : []),
  ...remotePeers.flatMap(createGridTracksFromPeer),
];
