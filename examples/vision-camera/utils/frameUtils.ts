import { Frame, VisionCameraProxy } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('sendFrame', {});

export function sendFrame(frame: Frame) {
  'worklet';
  if (!plugin) {
    throw new Error('Failed to load Frame Processor Plugin "sendFrame"!');
  } else {
    return plugin.call(frame);
  }
}
