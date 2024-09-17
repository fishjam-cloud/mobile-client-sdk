package io.fishjam.reactnative

import com.fishjamcloud.client.models.TrackEncoding

internal fun String.toTrackEncoding(): TrackEncoding =
  when (this) {
    "l" -> TrackEncoding.L
    "m" -> TrackEncoding.M
    "h" -> TrackEncoding.H
    else -> throw IllegalArgumentException("Invalid encoding specified: $this")
  }
