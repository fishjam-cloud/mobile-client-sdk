package com.fishjamcloud.client.events

import com.google.gson.JsonParseException
import timber.log.Timber
import com.google.gson.GsonBuilder

internal val gson = GsonBuilder().create()

internal fun String.serializeToMap(): Map<String, Any?> {
  return try {
    gson.fromJson(this, Map::class.java) as? Map<String, Any?> ?: emptyMap()
  } catch (e: JsonParseException) {
    Timber.e(e, "Failed to parse JSON string to map")
    emptyMap()
  }
}

data class SdpAnswer(
  val sdp: String,
  val type: String
)





