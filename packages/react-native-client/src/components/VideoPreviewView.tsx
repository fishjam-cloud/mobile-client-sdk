import * as React from 'react';
import { View } from 'react-native';
import { usePeers } from '../hooks/usePeers';
import { VideoRendererProps, VideoRendererView } from './VideoRendererView';

export type VideoPreviewViewProps = Omit<VideoRendererProps, 'trackId'>;

/**
 * Render camera preview.
 * Allows to display camera preview before streaming is started
 *
 *
 * @category Components
 * @param {object} props
 */
export const VideoPreviewView = (props: VideoPreviewViewProps) => {
  const { localPeer } = usePeers();

  const cameraTrack = localPeer?.cameraTrack;

  if (!cameraTrack) {
    return <View style={props.style} />;
  }

  return <VideoRendererView {...props} trackId={cameraTrack.id} />;
};
