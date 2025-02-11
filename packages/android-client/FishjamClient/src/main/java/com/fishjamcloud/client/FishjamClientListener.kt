package com.fishjamcloud.client

import com.fishjamcloud.client.media.Track
import com.fishjamcloud.client.models.AuthError
import com.fishjamcloud.client.models.Peer
import timber.log.Timber

interface FishjamClientListener : ReconnectionManagerListener {
  /**
   * Emitted when the websocket connection is closed
   */
  fun onSocketClose(
    code: Int,
    reason: String
  ) {
    Timber.i("Socket was closed with code $code reason: $reason")
  }

  /**
   * Emitted when occurs an error in the websocket connection
   */
  fun onSocketError(t: Throwable) {
    Timber.w("Socket error:", t)
  }

  /**
   * Emitted when authentication fails
   */
  fun onAuthError(reason: AuthError)

  /**
   * Emitted when local user is connected to fishjam.
   */
  fun onJoined(
    peerID: String,
    peersInRoom: MutableMap<String, Peer>
  )

  /**
   * Emitted when there was an error while connecting to the fishjam.
   */
  fun onJoinError(metadata: Any)

  /**
   * Emitted when the connection is closed
   */
  fun onDisconnected() {
    Timber.i("Client disconnected")
  }

  /**
   * Called each time new peer joins the room.
   */
  fun onPeerJoined(peer: Peer)

  /**
   * Called each time peer leaves the room.
   */
  fun onPeerLeft(peer: Peer)

  /**
   * Called each time peer has its metadata updated.
   */
  fun onPeerUpdated(peer: Peer)

  /**
   * Called when data in a new track arrives.
   *
   * This callback is always called after {@link FishjamClientListener.onTrackAdded}.
   * It informs user that data related to the given track arrives and can be played or displayed.
   */
  fun onTrackReady(track: Track)

  /**
   * Called each time the peer which was already in the room, adds new track. Fields track and stream will be set to null.
   * These fields will be set to non-null value in {@link FishjamClientListener.onTrackReady}
   */
  fun onTrackAdded(track: Track) {
    Timber.i("Track ${track.id()} added")
  }

  /**
   * Called when some track will no longer be sent.
   *
   * It will also be called before {@link FishjamClientListener.onPeerLeft} for each track of this peer.
   */
  fun onTrackRemoved(track: Track)

  /**
   * Called each time peer has its track metadata updated.
   */
  fun onTrackUpdated(track: Track) {
    Timber.i("Track ${track.id()} updated")
  }

  /**
   * Called every time the server estimates client's bandwidth.
   *
   * @param estimation - client's available incoming bitrate estimated
   * by the server. It's measured in bits per second.
   */
  fun onBandwidthEstimationChanged(estimation: Long) {
    Timber.i("Bandwidth estimation changed: $estimation")
  }

  /**
   * Called when incompatible tracks are detected.
   * This usually means that codecs are not supported by the receiver.
   */
  fun onIncompatibleTracksDetected()
}
