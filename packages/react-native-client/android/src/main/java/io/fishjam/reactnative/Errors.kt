package io.fishjam.reactnative

import com.fishjamcloud.client.models.AuthError
import expo.modules.kotlin.exception.CodedException

class JoinError(
  metadata: Any
) : CodedException(message = "Join error: $metadata")

class ConnectionError(
  reason: AuthError
) : CodedException(message = "Connection error: ${reason.error}")

class MissingScreenSharePermission : CodedException(message = "No permission to start screen share.")

class ClientNotConnectedError : CodedException(message = "Client not connected to server yet. Make sure to call connect() first!")

class NoLocalVideoTrackError : CodedException(message = "No local video track. Make sure to call connect() first!")

class NoLocalAudioTrackError : CodedException(message = "No local audio track. Make sure to call connect() first!")

class NoScreenShareTrackError : CodedException(message = "No local screen share track. Make sure to toggle screen share on first!")

class SocketClosedError(
  code: Int,
  reason: String
) : CodedException(message = "Socket was closed with code = $code and reason = $reason")

class SocketError(
  message: String
) : CodedException(message = "Socket error: $message")
