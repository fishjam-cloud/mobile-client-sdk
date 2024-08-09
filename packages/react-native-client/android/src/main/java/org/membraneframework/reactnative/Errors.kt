package org.membraneframework.reactnative

import com.fishjamcloud.client.models.AuthError
import expo.modules.kotlin.exception.CodedException

class JoinError(
  metadata: Any
) : CodedException(message = "Join error: $metadata")

class ConnectionError(
  reason: AuthError
) : CodedException(message = "Connection error: ${reason.error}")

class MissingScreencastPermission : CodedException(message = "No permission to start screencast, call handleScreencastPermission first.")

class ClientNotConnectedError : CodedException(message = "Client not connected to server yet. Make sure to call connect() first!")

class NoLocalVideoTrackError : CodedException(message = "No local video track. Make sure to call connect() first!")

class NoLocalAudioTrackError : CodedException(message = "No local audio track. Make sure to call connect() first!")

class NoScreencastTrackError : CodedException(message = "No local screencast track. Make sure to toggle screencast on first!")

class SocketClosedError(
  code: Int,
  reason: String
) : CodedException(message = "Socket was closed with code = $code and reason = $reason")

class SocketError(
  message: String
) : CodedException(message = "Socket error: $message")
