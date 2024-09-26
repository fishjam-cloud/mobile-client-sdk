/**
 * A record of the total time, in seconds,
 * that this stream has spent in each quality limitation state.
 * none: The resolution and/or framerate is not limited.
 * bandwidth: The resolution and/or framerate is primarily limited due to
 * congestion cues during bandwidth estimation.
 * Typical, congestion control algorithms use inter-arrival time,
 * round-trip time, packet or other congestion cues to perform bandwidth estimation.
 * cpu: The resolution and/or framerate is primarily limited due to CPU load.
 * other: The resolution and/or framerate is primarily limited
 * for a reason other than the above.
 */
export type QualityLimitationDurations = {
  bandwidth: number;
  cpu: number;
  none: number;
  other: number;
};

export type RTCOutboundStats = {
  'kind': string;
  'rid': string;
  'bytesSent': number;
  'targetBitrate': number;
  'packetsSent': number;
  'framesEncoded': number;
  'framesPerSecond': number;
  'frameWidth': number;
  'frameHeight': number;
  'qualityLimitationDurations': QualityLimitationDurations;
  'bytesSent/s': number;
  'packetsSent/s': number;
  'framesEncoded/s': number;
};

export type RTCInboundStats = {
  'kind': number;
  'jitter': number;
  'packetsLost': number;
  'packetsReceived': number;
  'bytesReceived': number;
  'framesReceived': number;
  'frameWidth': number;
  'frameHeight': number;
  'framesPerSecond': number;
  'framesDropped': number;
  'packetsLost/s': number;
  'packetsReceived/s': number;
  'bytesReceived/s': number;
  'framesReceived/s': number;
  'framesDropped/s': number;
};

export type RTCTrackStats = RTCOutboundStats | RTCInboundStats;

export type RTCStats = { [key: string]: RTCTrackStats };
