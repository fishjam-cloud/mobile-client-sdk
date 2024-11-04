import { PeerWithTracks } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import { GridTrack } from './GridTrackItem';
import { PeerMetadata } from '../../types/metadata';

const createGridTracksFromPeer = (
  peer: PeerWithTracks<PeerMetadata>,
): GridTrack[] => {
  const tracks: GridTrack[] = [];

  if (peer.cameraTrack) {
    tracks.push({
      ...peer.cameraTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      userName: peer.metadata.peer.displayName,
      isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
    });
  }

  if (peer.screenShareVideoTrack) {
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
    ...(localPeer ? createGridTracksFromPeer(localPeer) : []),
    ...remotePeers.flatMap(createGridTracksFromPeer),
  ];
};
