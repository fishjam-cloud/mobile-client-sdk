package com.fishjamcloud.client.events

import com.google.gson.GsonBuilder
import com.google.gson.JsonParseException
import timber.log.Timber

internal val gson = GsonBuilder().create()

internal fun String.serializeToMap(): Map<String, Any?> =
  try {
    gson.fromJson(this, Map::class.java) as Map<String, Any?>
  } catch (e: JsonParseException) {
    Timber.e(e, "Failed to parse JSON string to map")
    emptyMap()
  }
