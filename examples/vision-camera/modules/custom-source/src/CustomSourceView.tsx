import { requireNativeView } from 'expo';
import * as React from 'react';

import { CustomSourceViewProps } from './CustomSource.types';

const NativeView: React.ComponentType<CustomSourceViewProps> =
  requireNativeView('CustomSource');

export default function CustomSourceView(props: CustomSourceViewProps) {
  return <NativeView {...props} />;
}
