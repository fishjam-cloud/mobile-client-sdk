package com.fishjamcloud.client.models

enum class AuthError(
  val error: String
) {
  MISSING_TOKEN("missing token"),
  INVALID_TOKEN("invalid token"),
  EXPIRED_TOKEN("expired token"),
  ROOM_NOT_FOUND("room not found"),
  PEER_NOT_FOUND("peer not found"),
  PEER_CONNECTED("peer already connected");

  companion object {
    fun isAuthError(error: String): Boolean = values().firstOrNull { v -> v.error == error } != null

    fun fromString(error: String): AuthError = values().first { v -> v.error == error }
  }
}
