/**
 * `FILL` or `FIT` - it works just like RN Image component. `FILL` fills the whole view
 * with video and it may cut some parts of the video. `FIT` scales the video so the whole
 * video is visible, but it may leave some empty space in the view.
 * @category Components
 */
export type VideoLayout = 'FILL' | 'FIT';

export type TrackEncoding = 'l' | 'm' | 'h';

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
  /**
   *  list of active encodings. Encoding can be one of `"h"` (original encoding), `"m"` (scaled down x2), `"l"` (scaled down x4).
   */
  activeEncodings: TrackEncoding[];
};

/**
 * Type describing maximal bandwidth that can be used, in kbps. 0 is interpreted as unlimited bandwidth.
 */
export type BandwidthLimit = number;

/**
 * Type describing bandwidth limit for simulcast track. It is a mapping `encoding -> BandwidthLimit`. If encoding isn't present in this mapping,
 * it will be assumed that this particular encoding shouldn't have any bandwidth limit.
 */
export type SimulcastBandwidthLimit = Record<TrackEncoding, BandwidthLimit>;

/**
 * A type describing bandwidth limitation of a track, including simulcast and non-simulcast tracks. Can be `BandwidthLimit` or `SimulcastBandwidthLimit`.
 */
export type TrackBandwidthLimit = BandwidthLimit | SimulcastBandwidthLimit;

export type TrackMetadata = {
  active: boolean;
  type: 'audio' | 'camera' | 'screensharing';
};

export type GenericMetadata = Record<string, unknown>;

// branded types are useful for restricting where given value can be passed
declare const brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

/**
 * Enum used to set the foreground service types identifying the work done by the service.
 * See Android's [foreground service types](https://developer.android.com/develop/background-work/services/fg-service-types) documentation.
 */
export enum AndroidForegroundServiceType {
  FOREGROUND_SERVICE_TYPE_CAMERA = 64,
  FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION = 32,
  FOREGROUND_SERVICE_TYPE_MICROPHONE = 128,
}

/**
 * A type representing the options required for configuring the foreground service.
 *
 * @param channelId The id of the channel. Must be unique per package.
 * @param channelName The user visible name of the channel.
 * @param notificationTitle The title (first row) of the notification, in a standard notification.
 * @param notificationContent The text (second row) of the notification, in a standard notification.
 * @param foregroundServiceTypes The type of foreground service to launch.
 */
export type ForegroundServiceOptions = {
  channelId: string;
  channelName: string;
  notificationTitle: string;
  notificationContent: string;
  foregroundServiceTypes: AndroidForegroundServiceType[];
};
