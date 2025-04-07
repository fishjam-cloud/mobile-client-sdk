import { requireNativeView } from 'expo';
import * as React from 'react';

import { WebrtcSourceViewProps } from './WebrtcSource.types';

const NativeView: React.ComponentType<WebrtcSourceViewProps> =
  requireNativeView('WebrtcSource');

export default function WebrtcSourceView(props: WebrtcSourceViewProps) {
  return <NativeView {...props} />;
}
