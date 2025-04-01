import * as React from 'react';

import { CustomSourceViewProps } from './CustomSource.types';

export default function CustomSourceView(props: CustomSourceViewProps) {
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
