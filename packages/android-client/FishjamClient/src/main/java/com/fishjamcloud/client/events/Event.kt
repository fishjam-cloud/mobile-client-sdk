package com.fishjamcloud.client.events

import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.Payload
import com.fishjamcloud.client.models.SimulcastConfig
import com.google.gson.GsonBuilder
import com.google.gson.JsonParseException
import com.google.gson.ToNumberPolicy
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken
import timber.log.Timber

internal val gson = GsonBuilder().setObjectToNumberStrategy(ToNumberPolicy.LONG_OR_DOUBLE).create()

// convert a data class to a map
internal fun <T> T.serializeToMap(): Map<String, Any?> = convert()

internal fun String.serializeToMap(): Map<String, Any?> {
  return try {
    gson.fromJson(this, Map::class.java) as? Map<String, Any?> ?: emptyMap()
  } catch (e: JsonParseException) {
    Timber.e(e, "Failed to parse JSON string to map")
    emptyMap()
  }
}

// convert a map to a data class
internal inline fun <reified T> Map<String, Any?>.toDataClass(): T = convert()

// convert an object of type I to type O
internal inline fun <I, reified O> I.convert(): O {
  val json = gson.toJson(this)
  return gson.fromJson(json, object : TypeToken<O>() {}.type)
}

sealed class SendableEvent

data class Connect(
  val type: String,
  val data: Data
) : SendableEvent() {
  data class Data(
    val metadata: Metadata?
  )

  constructor(metadata: Metadata? = mapOf()) : this("connect", Data(metadata))
}

data class SdpOffer(
  val type: String,
  val data: Payload
) : SendableEvent() {
  constructor(sdp: String, trackIdToTrackMetadata: Map<String, Metadata?>, midToTrackId: Map<String, String>) :
    this(
      "custom",
      mapOf(
        "type" to "sdpOffer",
        "data" to
          mapOf(
            "sdpOffer" to
              mapOf(
                "type" to "offer",
                "sdp" to sdp
              ),
            "trackIdToTrackMetadata" to trackIdToTrackMetadata,
            "midToTrackId" to midToTrackId
          )
      )
    )
}

data class SdpAnswer2(
  val sdp: String,
  val type: String
)

data class LocalCandidate(
  val type: String,
  val data: Payload
) : SendableEvent() {
  constructor(candidate: String, sdpMLineIndex: Int, sdpMid: Int?, usernameFragment: String?) :
    this(
      "custom",
      mapOf(
        "type" to "candidate",
        "data" to
          mapOf(
            "candidate" to candidate,
            "sdpMLineIndex" to sdpMLineIndex,
            "sdpMid" to sdpMid,
            "usernameFragment" to usernameFragment
          )
      )
    )
}

data class RenegotiateTracks(
  val type: String,
  val data: Payload
) : SendableEvent() {
  constructor() :
    this(
      "custom",
      mapOf(
        "type" to "renegotiateTracks"
      )
    )
}

data class SelectEncoding(
  val type: String,
  val data: Payload
) : SendableEvent() {
  constructor(trackId: String, encoding: String) :
    this(
      "custom",
      mapOf(
        "type" to "setTargetTrackVariant",
        "data" to
          mapOf(
            "trackId" to trackId,
            "variant" to encoding
          )
      )
    )
}

data class UpdateEndpointMetadata(
  val type: String,
  val data: Data
) : SendableEvent() {
  data class Data(
    val metadata: Metadata?
  )

  constructor(metadata: Metadata? = mapOf()) : this("updatePeerMetadata", Data(metadata))
}

data class UpdateTrackMetadata(
  val type: String,
  val data: Data
) : SendableEvent() {
  data class Data(
    val trackId: String,
    val trackMetadata: Metadata?
  )

  constructor(trackId: String, trackMetadata: Metadata = mapOf()) : this(
    "updateTrackMetadata",
    Data(trackId, trackMetadata)
  )
}

data class Disconnect(
  val type: String
) : SendableEvent() {
  constructor() : this("disconnect")
}

enum class ReceivableEventType {
  @SerializedName("connected")
  Connected,

  @SerializedName("endpointAdded")
  EndpointAdded,

  @SerializedName("endpointUpdated")
  EndpointUpdated,

  @SerializedName("endpointRemoved")
  EndpointRemoved,

  @SerializedName("custom")
  Custom,

  @SerializedName("offerData")
  OfferData,

  @SerializedName("candidate")
  Candidate,

  @SerializedName("tracksAdded")
  TracksAdded,

  @SerializedName("tracksRemoved")
  TracksRemoved,

  @SerializedName("trackUpdated")
  TrackUpdated,

  @SerializedName("sdpAnswer")
  SdpAnswer,

  @SerializedName("encodingSwitched")
  EncodingSwitched,

  @SerializedName("vadNotification")
  VadNotification,

  @SerializedName("bandwidthEstimation")
  BandwidthEstimation
}

internal data class BaseReceivableEvent(
  val type: ReceivableEventType
)

sealed class ReceivableEvent {
  companion object {
    fun decode(payload: Payload): ReceivableEvent? {
      try {
        val eventBase: BaseReceivableEvent = payload.toDataClass()

        return when (eventBase.type) {
          ReceivableEventType.Connected ->
            payload.toDataClass<Connected>()

          ReceivableEventType.EndpointAdded ->
            payload.toDataClass<EndpointAdded>()

          ReceivableEventType.EndpointRemoved ->
            payload.toDataClass<EndpointRemoved>()

          ReceivableEventType.EndpointUpdated ->
            payload.toDataClass<EndpointUpdated>()

          ReceivableEventType.TracksAdded ->
            payload.toDataClass<TracksAdded>()

          ReceivableEventType.TracksRemoved ->
            payload.toDataClass<TracksRemoved>()

          ReceivableEventType.TrackUpdated ->
            payload.toDataClass<TrackUpdated>()

          ReceivableEventType.Custom -> {
            val customEventBase = payload.toDataClass<BaseCustomEvent>()

            return when (customEventBase.data.type) {
              ReceivableEventType.OfferData ->
                payload.toDataClass<CustomEvent<OfferData>>().data

              ReceivableEventType.Candidate ->
                payload.toDataClass<CustomEvent<RemoteCandidate>>().data

              ReceivableEventType.SdpAnswer ->
                payload.toDataClass<CustomEvent<SdpAnswer>>().data

              ReceivableEventType.EncodingSwitched ->
                payload.toDataClass<CustomEvent<EncodingSwitched>>().data

              ReceivableEventType.VadNotification ->
                payload.toDataClass<CustomEvent<VadNotification>>().data

              ReceivableEventType.BandwidthEstimation ->
                payload.toDataClass<CustomEvent<BandwidthEstimation>>().data

              else ->
                null
            }
          }

          else ->
            null
        }
      } catch (e: JsonParseException) {
        Timber.e(e)
        return null
      }
    }
  }
}

data class TrackData(
  val metadata: Metadata?,
  val simulcastConfig: SimulcastConfig?
)

data class Endpoint(
  val id: String,
  val type: String,
  val metadata: Metadata? = mapOf(),
  val tracks: Map<String, TrackData> = mapOf()
)

data class Connected(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val id: String,
    val otherEndpoints: List<Endpoint>
  )
}

data class EndpointAdded(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val id: String,
    val type: String,
    val metadata: Metadata?,
    val tracks: Map<String, TrackData>
  )
}

data class EndpointUpdated(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val id: String,
    val metadata: Metadata?
  )
}

data class EndpointRemoved(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val id: String,
    val reason: String
  )
}

data class OfferData(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class TurnServer(
    val username: String,
    val password: String,
    val serverAddr: String,
    val serverPort: UInt,
    val transport: String
  )

  data class Data(
    val integratedTurnServers: List<TurnServer>,
    val tracksTypes: Map<String, Int>
  )
}

data class TracksAdded(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val endpointId: String,
    val tracks: Map<String, TrackData>
  )
}

data class TracksRemoved(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val endpointId: String,
    val trackIds: List<String>
  )
}

data class TrackUpdated(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val endpointId: String,
    val trackId: String,
    val metadata: Metadata?
  )
}

data class SdpAnswer(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val type: String,
    val sdp: String,
    val midToTrackId: Map<String, String>
  )
}

data class RemoteCandidate(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val candidate: String,
    val sdpMLineIndex: Int,
    val sdpMid: Int?,
    val usernameFragment: String?
  )
}

data class EncodingSwitched(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val endpointId: String,
    val trackId: String,
    val encoding: String,
    val reason: String
  )
}

data class VadNotification(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val trackId: String,
    val status: String
  )
}

data class BandwidthEstimation(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val estimation: Double
  )
}

data class BaseCustomEvent(
  val type: ReceivableEventType,
  val data: Data
) : ReceivableEvent() {
  data class Data(
    val type: ReceivableEventType
  )
}

class CustomEvent<Event : ReceivableEvent>(
  val type: ReceivableEventType,
  val data: Event
)
