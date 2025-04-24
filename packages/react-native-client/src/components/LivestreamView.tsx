import { CSSProperties } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WhepClientView } from 'react-native-whip-whep';

export type LivestreamViewProps = {
  style?: StyleProp<ViewStyle>;
};

export const LivestreamView = ({ style }: LivestreamViewProps) => (
  <WhepClientView style={style as CSSProperties} />
);
