package io.fishjam.reactnative

import com.fishjamcloud.client.media.RemoteAudioTrack
import com.fishjamcloud.client.media.Track
import com.fishjamcloud.client.media.VideoTrack
import com.fishjamcloud.client.models.Peer
import fishjam.media_events.server.Server

class PipTrackSelector {
    companion object {
        private const val METADATA_TYPE = "type"
        private const val METADATA_CAMERA = "camera"
        private const val METADATA_DISPLAY_NAME = "displayName"
        private const val METADATA_NAME = "name"
    }

    fun findLocalCameraTrack(): VideoTrack? {
        val peers = RNFishjamClient.getAllPeers()
        val localEndpointId = RNFishjamClient.fishjamClient.getLocalEndpoint().id
        val localPeer = peers.find { it.id == localEndpointId } ?: return null

        return localPeer.tracks.values
            .filterIsInstance<VideoTrack>()
            .firstOrNull { track ->
                (track.metadata as? Map<*, *>)?.get(METADATA_TYPE) == METADATA_CAMERA
            }
    }

    fun findSecondaryRemoteTrack(currentTrackInfo: RemoteTrackInfo?): RemoteTrackInfo? {
        val peers = RNFishjamClient.getAllPeers()
        val localEndpointId = RNFishjamClient.fishjamClient.getLocalEndpoint().id
        val remotePeers = peers.filter { it.id != localEndpointId }

        if (remotePeers.isEmpty()) {
            return null
        }

        remotePeers.firstOrNull { it.hasActiveVoiceActivity() }?.let { activeSpeaker ->
            return activeSpeaker.toRemoteTrackInfo()
        }

        currentTrackInfo?.let { currentInfo ->
          val existingPeer = remotePeers.firstOrNull() { peer -> peer.hasTrack(currentInfo.videoTrack) }
            if (existingPeer != null) {
                return existingPeer.toRemoteTrackInfo()
            }
        }

        remotePeers.firstOrNull { it.hasVideoTrack() }?.let { peerWithVideo ->
            return peerWithVideo.toRemoteTrackInfo()
        }

        return null
    }
}

private fun Peer.hasActiveVoiceActivity(): Boolean {
    return tracks.values
        .filterIsInstance<RemoteAudioTrack>()
        .any { it.vadStatus == Server.MediaEvent.VadNotification.Status.STATUS_SPEECH }
}

private fun Peer.hasTrack(videoTrack: VideoTrack?): Boolean {
    return videoTrack != null && tracks.values.contains(videoTrack)
}

private fun Peer.hasVideoTrack(): Boolean {
    return tracks.values.any { it is VideoTrack }
}

private fun Peer.getDisplayName(): String {
    val displayName = metadata?.get("displayName") as? String
    val name = metadata?.get("name") as? String
    return displayName ?: name ?: id
}

private fun Track.getTrackActive(): Boolean {
  return metadata["isActive"] as? Boolean ?: (metadata["paused"] as? Boolean)?.not() ?: false
}

private fun Peer.toRemoteTrackInfo(): RemoteTrackInfo {
    val videoTrack = tracks.values.filterIsInstance<VideoTrack>().firstOrNull()
    return RemoteTrackInfo(
        videoTrack = videoTrack,
        displayName = getDisplayName(),
        videoTrackActive = videoTrack?.getTrackActive() ?: false
    )
}

