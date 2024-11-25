// DO NOT EDIT.
// swift-format-ignore-file
//
// Generated by the Swift generator plugin for the protocol buffer compiler.
// Source: fishjam/media_events/peer/peer.proto
//
// For information on using the generated types, please see the documentation:
//   https://github.com/apple/swift-protobuf/

import Foundation
import SwiftProtobuf

// If the compiler emits an error on this type, it is because this file
// was generated by a version of the `protoc` Swift plug-in that is
// incompatible with the version of SwiftProtobuf to which you are linking.
// Please ensure that you are building against the same version of the API
// that was used to generate this file.
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

/// Defines any type of message sent from Peer to Membrane RTC Engine
public struct Fishjam_MediaEvents_Peer_MediaEvent {
  // SwiftProtobuf.Message conformance is added in an extension below. See the
  // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
  // methods supported on all messages.

  public var content: Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content? = nil

  public var connect: Fishjam_MediaEvents_Peer_MediaEvent.Connect {
    get {
      if case .connect(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.Connect()
    }
    set {content = .connect(newValue)}
  }

  public var disconnect: Fishjam_MediaEvents_Peer_MediaEvent.Disconnect {
    get {
      if case .disconnect(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.Disconnect()
    }
    set {content = .disconnect(newValue)}
  }

  public var updateEndpointMetadata: Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata {
    get {
      if case .updateEndpointMetadata(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata()
    }
    set {content = .updateEndpointMetadata(newValue)}
  }

  public var updateTrackMetadata: Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata {
    get {
      if case .updateTrackMetadata(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata()
    }
    set {content = .updateTrackMetadata(newValue)}
  }

  public var renegotiateTracks: Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks {
    get {
      if case .renegotiateTracks(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks()
    }
    set {content = .renegotiateTracks(newValue)}
  }

  public var candidate: Fishjam_MediaEvents_Candidate {
    get {
      if case .candidate(let v)? = content {return v}
      return Fishjam_MediaEvents_Candidate()
    }
    set {content = .candidate(newValue)}
  }

  public var sdpOffer: Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer {
    get {
      if case .sdpOffer(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer()
    }
    set {content = .sdpOffer(newValue)}
  }

  public var trackBitrates: Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates {
    get {
      if case .trackBitrates(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates()
    }
    set {content = .trackBitrates(newValue)}
  }

  public var enableTrackVariant: Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant {
    get {
      if case .enableTrackVariant(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant()
    }
    set {content = .enableTrackVariant(newValue)}
  }

  public var disableTrackVariant: Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant {
    get {
      if case .disableTrackVariant(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant()
    }
    set {content = .disableTrackVariant(newValue)}
  }

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public enum OneOf_Content: Equatable {
    case connect(Fishjam_MediaEvents_Peer_MediaEvent.Connect)
    case disconnect(Fishjam_MediaEvents_Peer_MediaEvent.Disconnect)
    case updateEndpointMetadata(Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata)
    case updateTrackMetadata(Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata)
    case renegotiateTracks(Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks)
    case candidate(Fishjam_MediaEvents_Candidate)
    case sdpOffer(Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer)
    case trackBitrates(Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates)
    case enableTrackVariant(Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant)
    case disableTrackVariant(Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant)

  #if !swift(>=4.1)
    public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content, rhs: Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content) -> Bool {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch (lhs, rhs) {
      case (.connect, .connect): return {
        guard case .connect(let l) = lhs, case .connect(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.disconnect, .disconnect): return {
        guard case .disconnect(let l) = lhs, case .disconnect(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.updateEndpointMetadata, .updateEndpointMetadata): return {
        guard case .updateEndpointMetadata(let l) = lhs, case .updateEndpointMetadata(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.updateTrackMetadata, .updateTrackMetadata): return {
        guard case .updateTrackMetadata(let l) = lhs, case .updateTrackMetadata(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.renegotiateTracks, .renegotiateTracks): return {
        guard case .renegotiateTracks(let l) = lhs, case .renegotiateTracks(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.candidate, .candidate): return {
        guard case .candidate(let l) = lhs, case .candidate(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.sdpOffer, .sdpOffer): return {
        guard case .sdpOffer(let l) = lhs, case .sdpOffer(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.trackBitrates, .trackBitrates): return {
        guard case .trackBitrates(let l) = lhs, case .trackBitrates(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.enableTrackVariant, .enableTrackVariant): return {
        guard case .enableTrackVariant(let l) = lhs, case .enableTrackVariant(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.disableTrackVariant, .disableTrackVariant): return {
        guard case .disableTrackVariant(let l) = lhs, case .disableTrackVariant(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      default: return false
      }
    }
  #endif
  }

  public struct VariantBitrate {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var variant: Fishjam_MediaEvents_Variant = .unspecified

    public var bitrate: Int32 = 0

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when a peer wants to join WebRTC Endpoint.
  public struct Connect {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var metadataJson: String = String()

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when a peer disconnects from WebRTC Endpoint.
  public struct Disconnect {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when a peer wants to update its metadata
  public struct UpdateEndpointMetadata {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var metadataJson: String = String()

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when a peer wants to update its track's metadata
  public struct UpdateTrackMetadata {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var trackID: String = String()

    public var metadataJson: String = String()

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when peer wants to renegatiate connection due to adding a track or removing a track
  public struct RenegotiateTracks {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent as a response to `offerData` media event during renegotiation
  /// Maps contain only information about current peer's `sendonly` tracks.
  /// The "mid" is an identifier used to associate an RTP packet with an MLine from the SDP offer/answer.
  public struct SdpOffer {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var sdpOffer: String = String()

    public var trackIDToMetadataJson: Dictionary<String,String> = [:]

    /// Maps track_id to its bitrate. The track_id in the TrackBitrates message is ignored (we use the map key), so it can be ommited.
    public var trackIDToBitrates: Dictionary<String,Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates> = [:]

    public var midToTrackID: Dictionary<String,String> = [:]

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when Peer wants to update its track's bitrate
  public struct TrackBitrates {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var trackID: String = String()

    /// Bitrate of each variant. For non-simulcast tracks use VARIANT_UNSPECIFIED.
    public var variantBitrates: [Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate] = []

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when client disables one of the track variants
  public struct DisableTrackVariant {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var trackID: String = String()

    public var variant: Fishjam_MediaEvents_Variant = .unspecified

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  /// Sent when client enables one of the track variants
  public struct EnableTrackVariant {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    public var trackID: String = String()

    public var variant: Fishjam_MediaEvents_Variant = .unspecified

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Fishjam_MediaEvents_Peer_MediaEvent: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.Connect: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.Disconnect: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant: @unchecked Sendable {}
extension Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant: @unchecked Sendable {}
#endif  // swift(>=5.5) && canImport(_Concurrency)

// MARK: - Code below here is support for the SwiftProtobuf runtime.

fileprivate let _protobuf_package = "fishjam.media_events.peer"

extension Fishjam_MediaEvents_Peer_MediaEvent: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".MediaEvent"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "connect"),
    2: .same(proto: "disconnect"),
    3: .standard(proto: "update_endpoint_metadata"),
    4: .standard(proto: "update_track_metadata"),
    5: .standard(proto: "renegotiate_tracks"),
    6: .same(proto: "candidate"),
    7: .standard(proto: "sdp_offer"),
    8: .standard(proto: "track_bitrates"),
    9: .standard(proto: "enable_track_variant"),
    10: .standard(proto: "disable_track_variant"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.Connect?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .connect(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .connect(v)
        }
      }()
      case 2: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.Disconnect?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .disconnect(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .disconnect(v)
        }
      }()
      case 3: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .updateEndpointMetadata(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .updateEndpointMetadata(v)
        }
      }()
      case 4: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .updateTrackMetadata(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .updateTrackMetadata(v)
        }
      }()
      case 5: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .renegotiateTracks(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .renegotiateTracks(v)
        }
      }()
      case 6: try {
        var v: Fishjam_MediaEvents_Candidate?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .candidate(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .candidate(v)
        }
      }()
      case 7: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .sdpOffer(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .sdpOffer(v)
        }
      }()
      case 8: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .trackBitrates(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .trackBitrates(v)
        }
      }()
      case 9: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .enableTrackVariant(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .enableTrackVariant(v)
        }
      }()
      case 10: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .disableTrackVariant(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .disableTrackVariant(v)
        }
      }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    // The use of inline closures is to circumvent an issue where the compiler
    // allocates stack space for every if/case branch local when no optimizations
    // are enabled. https://github.com/apple/swift-protobuf/issues/1034 and
    // https://github.com/apple/swift-protobuf/issues/1182
    switch self.content {
    case .connect?: try {
      guard case .connect(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 1)
    }()
    case .disconnect?: try {
      guard case .disconnect(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 2)
    }()
    case .updateEndpointMetadata?: try {
      guard case .updateEndpointMetadata(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 3)
    }()
    case .updateTrackMetadata?: try {
      guard case .updateTrackMetadata(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 4)
    }()
    case .renegotiateTracks?: try {
      guard case .renegotiateTracks(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 5)
    }()
    case .candidate?: try {
      guard case .candidate(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 6)
    }()
    case .sdpOffer?: try {
      guard case .sdpOffer(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 7)
    }()
    case .trackBitrates?: try {
      guard case .trackBitrates(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 8)
    }()
    case .enableTrackVariant?: try {
      guard case .enableTrackVariant(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 9)
    }()
    case .disableTrackVariant?: try {
      guard case .disableTrackVariant(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 10)
    }()
    case nil: break
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent, rhs: Fishjam_MediaEvents_Peer_MediaEvent) -> Bool {
    if lhs.content != rhs.content {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".VariantBitrate"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "variant"),
    2: .same(proto: "bitrate"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularEnumField(value: &self.variant) }()
      case 2: try { try decoder.decodeSingularInt32Field(value: &self.bitrate) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if self.variant != .unspecified {
      try visitor.visitSingularEnumField(value: self.variant, fieldNumber: 1)
    }
    if self.bitrate != 0 {
      try visitor.visitSingularInt32Field(value: self.bitrate, fieldNumber: 2)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate, rhs: Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate) -> Bool {
    if lhs.variant != rhs.variant {return false}
    if lhs.bitrate != rhs.bitrate {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.Connect: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".Connect"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "metadata_json"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.metadataJson) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.metadataJson.isEmpty {
      try visitor.visitSingularStringField(value: self.metadataJson, fieldNumber: 1)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.Connect, rhs: Fishjam_MediaEvents_Peer_MediaEvent.Connect) -> Bool {
    if lhs.metadataJson != rhs.metadataJson {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.Disconnect: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".Disconnect"
  public static let _protobuf_nameMap = SwiftProtobuf._NameMap()

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let _ = try decoder.nextFieldNumber() {
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.Disconnect, rhs: Fishjam_MediaEvents_Peer_MediaEvent.Disconnect) -> Bool {
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".UpdateEndpointMetadata"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "metadata_json"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.metadataJson) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.metadataJson.isEmpty {
      try visitor.visitSingularStringField(value: self.metadataJson, fieldNumber: 1)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata, rhs: Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata) -> Bool {
    if lhs.metadataJson != rhs.metadataJson {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".UpdateTrackMetadata"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "track_id"),
    2: .standard(proto: "metadata_json"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.trackID) }()
      case 2: try { try decoder.decodeSingularStringField(value: &self.metadataJson) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.trackID.isEmpty {
      try visitor.visitSingularStringField(value: self.trackID, fieldNumber: 1)
    }
    if !self.metadataJson.isEmpty {
      try visitor.visitSingularStringField(value: self.metadataJson, fieldNumber: 2)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata, rhs: Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata) -> Bool {
    if lhs.trackID != rhs.trackID {return false}
    if lhs.metadataJson != rhs.metadataJson {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".RenegotiateTracks"
  public static let _protobuf_nameMap = SwiftProtobuf._NameMap()

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let _ = try decoder.nextFieldNumber() {
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks, rhs: Fishjam_MediaEvents_Peer_MediaEvent.RenegotiateTracks) -> Bool {
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".SdpOffer"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "sdp_offer"),
    2: .standard(proto: "track_id_to_metadata_json"),
    3: .standard(proto: "track_id_to_bitrates"),
    4: .standard(proto: "mid_to_track_id"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.sdpOffer) }()
      case 2: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString,SwiftProtobuf.ProtobufString>.self, value: &self.trackIDToMetadataJson) }()
      case 3: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.ProtobufString,Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates>.self, value: &self.trackIDToBitrates) }()
      case 4: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString,SwiftProtobuf.ProtobufString>.self, value: &self.midToTrackID) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.sdpOffer.isEmpty {
      try visitor.visitSingularStringField(value: self.sdpOffer, fieldNumber: 1)
    }
    if !self.trackIDToMetadataJson.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString,SwiftProtobuf.ProtobufString>.self, value: self.trackIDToMetadataJson, fieldNumber: 2)
    }
    if !self.trackIDToBitrates.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.ProtobufString,Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates>.self, value: self.trackIDToBitrates, fieldNumber: 3)
    }
    if !self.midToTrackID.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString,SwiftProtobuf.ProtobufString>.self, value: self.midToTrackID, fieldNumber: 4)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer, rhs: Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer) -> Bool {
    if lhs.sdpOffer != rhs.sdpOffer {return false}
    if lhs.trackIDToMetadataJson != rhs.trackIDToMetadataJson {return false}
    if lhs.trackIDToBitrates != rhs.trackIDToBitrates {return false}
    if lhs.midToTrackID != rhs.midToTrackID {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".TrackBitrates"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "track_id"),
    2: .standard(proto: "variant_bitrates"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.trackID) }()
      case 2: try { try decoder.decodeRepeatedMessageField(value: &self.variantBitrates) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.trackID.isEmpty {
      try visitor.visitSingularStringField(value: self.trackID, fieldNumber: 1)
    }
    if !self.variantBitrates.isEmpty {
      try visitor.visitRepeatedMessageField(value: self.variantBitrates, fieldNumber: 2)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates, rhs: Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates) -> Bool {
    if lhs.trackID != rhs.trackID {return false}
    if lhs.variantBitrates != rhs.variantBitrates {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".DisableTrackVariant"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "track_id"),
    2: .same(proto: "variant"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.trackID) }()
      case 2: try { try decoder.decodeSingularEnumField(value: &self.variant) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.trackID.isEmpty {
      try visitor.visitSingularStringField(value: self.trackID, fieldNumber: 1)
    }
    if self.variant != .unspecified {
      try visitor.visitSingularEnumField(value: self.variant, fieldNumber: 2)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant, rhs: Fishjam_MediaEvents_Peer_MediaEvent.DisableTrackVariant) -> Bool {
    if lhs.trackID != rhs.trackID {return false}
    if lhs.variant != rhs.variant {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = Fishjam_MediaEvents_Peer_MediaEvent.protoMessageName + ".EnableTrackVariant"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .standard(proto: "track_id"),
    2: .same(proto: "variant"),
  ]

  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.trackID) }()
      case 2: try { try decoder.decodeSingularEnumField(value: &self.variant) }()
      default: break
      }
    }
  }

  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.trackID.isEmpty {
      try visitor.visitSingularStringField(value: self.trackID, fieldNumber: 1)
    }
    if self.variant != .unspecified {
      try visitor.visitSingularEnumField(value: self.variant, fieldNumber: 2)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  public static func ==(lhs: Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant, rhs: Fishjam_MediaEvents_Peer_MediaEvent.EnableTrackVariant) -> Bool {
    if lhs.trackID != rhs.trackID {return false}
    if lhs.variant != rhs.variant {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}
