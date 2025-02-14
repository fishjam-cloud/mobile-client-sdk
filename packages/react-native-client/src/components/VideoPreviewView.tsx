import * as React from 'react';

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
 * @param {string} props.cameraId
 */
export const VideoPreviewView = (props: VideoPreviewViewProps) => {
  const { localPeer } = usePeers();

  const cameraTrack = localPeer?.cameraTrack;

  if (!cameraTrack) {
    return null;
  }

  return <VideoRendererView trackId={cameraTrack.id} {...props} />;
};
