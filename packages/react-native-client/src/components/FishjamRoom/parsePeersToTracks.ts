import { PeerWithTracks } from '../../hooks/usePeers';
import { GridTrack } from './GridTrackItem';

const createGridTracksFromPeer = (peer: PeerWithTracks): GridTrack[] => {
  const tracks: GridTrack[] = [];

  if (peer.cameraTrack && peer.cameraTrack.isActive) {
    tracks.push({
      track: peer.cameraTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
    });
  }

  if (peer.screenShareVideoTrack && peer.screenShareVideoTrack.isActive) {
    tracks.push({
      track: peer.screenShareVideoTrack,
      peerId: peer.id,
      isLocal: peer.isLocal,
      isVadActive: peer.screenShareAudioTrack?.vadStatus === 'speech',
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
    });
  }

  return tracks;
};

export const parsePeersToTracks = (
  localPeer: PeerWithTracks | null,
  remotePeers: PeerWithTracks[],
): GridTrack[] => {
  return [
    ...(localPeer ? createGridTracksFromPeer(localPeer) : []),
    ...remotePeers.flatMap(createGridTracksFromPeer),
  ];
};
