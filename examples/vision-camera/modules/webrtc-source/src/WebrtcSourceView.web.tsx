import * as React from 'react';

import { WebrtcSourceViewProps } from './WebrtcSource.types';

export default function WebrtcSourceView(props: WebrtcSourceViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
