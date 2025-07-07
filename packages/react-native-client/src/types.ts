/**
 * `FILL` or `FIT` - it works just like RN Image component. `FILL` fills the whole view
 * with video and it may cut some parts of the video. `FIT` scales the video so the whole
 * video is visible, but it may leave some empty space in the view.
 */
export type VideoLayout = 'FILL' | 'FIT';

/**
 * A type describing simulcast configuration.
 *
 * At the moment, simulcast track is initialized in three versions - low, medium and high.
 * High resolution is the original track resolution, while medium and low resolutions are
 * the original track resolution scaled down by 2 and 4 respectively.
 */
export type SimulcastConfig = {
  /**
   * whether to simulcast track or not. By default simulcast is disabled.
   */
  enabled: boolean;
};

export type TrackMetadata = {
  active: boolean;
  type: 'microphone' | 'camera' | 'screenShareVideo' | 'screenShareAudio';
};

export type GenericMetadata = Record<string, unknown>;

// branded types are useful for restricting where given value can be passed
declare const brand: unique symbol;
/**
 * Branded type
 */
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type RoomType = 'conference' | 'audio-only' | 'livestream';
