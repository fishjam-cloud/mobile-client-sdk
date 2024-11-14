// DO NOT EDIT.
// swift-format-ignore-file
//
// Generated by the Swift generator plugin for the protocol buffer compiler.
// Source: fishjam/peer_notifications.proto
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

/// Defines any type of message sent between FJ and a peer
struct Fishjam_PeerMessage {
  // SwiftProtobuf.Message conformance is added in an extension below. See the
  // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
  // methods supported on all messages.

  var content: Fishjam_PeerMessage.OneOf_Content? = nil

  var authenticated: Fishjam_PeerMessage.Authenticated {
    get {
      if case .authenticated(let v)? = content {return v}
      return Fishjam_PeerMessage.Authenticated()
    }
    set {content = .authenticated(newValue)}
  }

  var authRequest: Fishjam_PeerMessage.AuthRequest {
    get {
      if case .authRequest(let v)? = content {return v}
      return Fishjam_PeerMessage.AuthRequest()
    }
    set {content = .authRequest(newValue)}
  }

  var mediaEvent: Fishjam_PeerMessage.MediaEvent {
    get {
      if case .mediaEvent(let v)? = content {return v}
      return Fishjam_PeerMessage.MediaEvent()
    }
    set {content = .mediaEvent(newValue)}
  }

  var rtcStatsReport: Fishjam_PeerMessage.RTCStatsReport {
    get {
      if case .rtcStatsReport(let v)? = content {return v}
      return Fishjam_PeerMessage.RTCStatsReport()
    }
    set {content = .rtcStatsReport(newValue)}
  }

  var peerMediaEvent: Fishjam_MediaEvents_Peer_MediaEvent {
    get {
      if case .peerMediaEvent(let v)? = content {return v}
      return Fishjam_MediaEvents_Peer_MediaEvent()
    }
    set {content = .peerMediaEvent(newValue)}
  }

  var serverMediaEvent: Fishjam_MediaEvents_Server_MediaEvent {
    get {
      if case .serverMediaEvent(let v)? = content {return v}
      return Fishjam_MediaEvents_Server_MediaEvent()
    }
    set {content = .serverMediaEvent(newValue)}
  }

  var unknownFields = SwiftProtobuf.UnknownStorage()

  enum OneOf_Content: Equatable {
    case authenticated(Fishjam_PeerMessage.Authenticated)
    case authRequest(Fishjam_PeerMessage.AuthRequest)
    case mediaEvent(Fishjam_PeerMessage.MediaEvent)
    case rtcStatsReport(Fishjam_PeerMessage.RTCStatsReport)
    case peerMediaEvent(Fishjam_MediaEvents_Peer_MediaEvent)
    case serverMediaEvent(Fishjam_MediaEvents_Server_MediaEvent)

  #if !swift(>=4.1)
    static func ==(lhs: Fishjam_PeerMessage.OneOf_Content, rhs: Fishjam_PeerMessage.OneOf_Content) -> Bool {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch (lhs, rhs) {
      case (.authenticated, .authenticated): return {
        guard case .authenticated(let l) = lhs, case .authenticated(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.authRequest, .authRequest): return {
        guard case .authRequest(let l) = lhs, case .authRequest(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.mediaEvent, .mediaEvent): return {
        guard case .mediaEvent(let l) = lhs, case .mediaEvent(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.rtcStatsReport, .rtcStatsReport): return {
        guard case .rtcStatsReport(let l) = lhs, case .rtcStatsReport(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.peerMediaEvent, .peerMediaEvent): return {
        guard case .peerMediaEvent(let l) = lhs, case .peerMediaEvent(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.serverMediaEvent, .serverMediaEvent): return {
        guard case .serverMediaEvent(let l) = lhs, case .serverMediaEvent(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      default: return false
      }
    }
  #endif
  }

  /// Response sent by FJ, confirming successfull authentication
  struct Authenticated {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    var unknownFields = SwiftProtobuf.UnknownStorage()

    init() {}
  }

  /// Request sent by peer, to authenticate to FJ server
  struct AuthRequest {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    var token: String = String()

    var sdkVersion: String = String()

    var unknownFields = SwiftProtobuf.UnknownStorage()

    init() {}
  }

  /// PeerConnection stats sent by peer
  /// https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport#the_statistic_types
  struct RTCStatsReport {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    var data: String = String()

    var unknownFields = SwiftProtobuf.UnknownStorage()

    init() {}
  }

  /// Any type of WebRTC messages passed betweend FJ and peer
  struct MediaEvent {
    // SwiftProtobuf.Message conformance is added in an extension below. See the
    // `Message` and `Message+*Additions` files in the SwiftProtobuf library for
    // methods supported on all messages.

    var data: String = String()

    var unknownFields = SwiftProtobuf.UnknownStorage()

    init() {}
  }

  init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Fishjam_PeerMessage: @unchecked Sendable {}
extension Fishjam_PeerMessage.OneOf_Content: @unchecked Sendable {}
extension Fishjam_PeerMessage.Authenticated: @unchecked Sendable {}
extension Fishjam_PeerMessage.AuthRequest: @unchecked Sendable {}
extension Fishjam_PeerMessage.RTCStatsReport: @unchecked Sendable {}
extension Fishjam_PeerMessage.MediaEvent: @unchecked Sendable {}
#endif  // swift(>=5.5) && canImport(_Concurrency)

// MARK: - Code below here is support for the SwiftProtobuf runtime.

fileprivate let _protobuf_package = "fishjam"

extension Fishjam_PeerMessage: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  static let protoMessageName: String = _protobuf_package + ".PeerMessage"
  static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "authenticated"),
    2: .standard(proto: "auth_request"),
    3: .standard(proto: "media_event"),
    4: .standard(proto: "rtc_stats_report"),
    5: .standard(proto: "peer_media_event"),
    6: .standard(proto: "server_media_event"),
  ]

  mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try {
        var v: Fishjam_PeerMessage.Authenticated?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .authenticated(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .authenticated(v)
        }
      }()
      case 2: try {
        var v: Fishjam_PeerMessage.AuthRequest?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .authRequest(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .authRequest(v)
        }
      }()
      case 3: try {
        var v: Fishjam_PeerMessage.MediaEvent?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .mediaEvent(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .mediaEvent(v)
        }
      }()
      case 4: try {
        var v: Fishjam_PeerMessage.RTCStatsReport?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .rtcStatsReport(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .rtcStatsReport(v)
        }
      }()
      case 5: try {
        var v: Fishjam_MediaEvents_Peer_MediaEvent?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .peerMediaEvent(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .peerMediaEvent(v)
        }
      }()
      case 6: try {
        var v: Fishjam_MediaEvents_Server_MediaEvent?
        var hadOneofValue = false
        if let current = self.content {
          hadOneofValue = true
          if case .serverMediaEvent(let m) = current {v = m}
        }
        try decoder.decodeSingularMessageField(value: &v)
        if let v = v {
          if hadOneofValue {try decoder.handleConflictingOneOf()}
          self.content = .serverMediaEvent(v)
        }
      }()
      default: break
      }
    }
  }

  func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    // The use of inline closures is to circumvent an issue where the compiler
    // allocates stack space for every if/case branch local when no optimizations
    // are enabled. https://github.com/apple/swift-protobuf/issues/1034 and
    // https://github.com/apple/swift-protobuf/issues/1182
    switch self.content {
    case .authenticated?: try {
      guard case .authenticated(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 1)
    }()
    case .authRequest?: try {
      guard case .authRequest(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 2)
    }()
    case .mediaEvent?: try {
      guard case .mediaEvent(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 3)
    }()
    case .rtcStatsReport?: try {
      guard case .rtcStatsReport(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 4)
    }()
    case .peerMediaEvent?: try {
      guard case .peerMediaEvent(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 5)
    }()
    case .serverMediaEvent?: try {
      guard case .serverMediaEvent(let v)? = self.content else { preconditionFailure() }
      try visitor.visitSingularMessageField(value: v, fieldNumber: 6)
    }()
    case nil: break
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  static func ==(lhs: Fishjam_PeerMessage, rhs: Fishjam_PeerMessage) -> Bool {
    if lhs.content != rhs.content {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_PeerMessage.Authenticated: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  static let protoMessageName: String = Fishjam_PeerMessage.protoMessageName + ".Authenticated"
  static let _protobuf_nameMap = SwiftProtobuf._NameMap()

  mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let _ = try decoder.nextFieldNumber() {
    }
  }

  func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try unknownFields.traverse(visitor: &visitor)
  }

  static func ==(lhs: Fishjam_PeerMessage.Authenticated, rhs: Fishjam_PeerMessage.Authenticated) -> Bool {
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_PeerMessage.AuthRequest: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  static let protoMessageName: String = Fishjam_PeerMessage.protoMessageName + ".AuthRequest"
  static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "token"),
    2: .standard(proto: "sdk_version"),
  ]

  mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.token) }()
      case 2: try { try decoder.decodeSingularStringField(value: &self.sdkVersion) }()
      default: break
      }
    }
  }

  func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.token.isEmpty {
      try visitor.visitSingularStringField(value: self.token, fieldNumber: 1)
    }
    if !self.sdkVersion.isEmpty {
      try visitor.visitSingularStringField(value: self.sdkVersion, fieldNumber: 2)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  static func ==(lhs: Fishjam_PeerMessage.AuthRequest, rhs: Fishjam_PeerMessage.AuthRequest) -> Bool {
    if lhs.token != rhs.token {return false}
    if lhs.sdkVersion != rhs.sdkVersion {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_PeerMessage.RTCStatsReport: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  static let protoMessageName: String = Fishjam_PeerMessage.protoMessageName + ".RTCStatsReport"
  static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "data"),
  ]

  mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.data) }()
      default: break
      }
    }
  }

  func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.data.isEmpty {
      try visitor.visitSingularStringField(value: self.data, fieldNumber: 1)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  static func ==(lhs: Fishjam_PeerMessage.RTCStatsReport, rhs: Fishjam_PeerMessage.RTCStatsReport) -> Bool {
    if lhs.data != rhs.data {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}

extension Fishjam_PeerMessage.MediaEvent: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase, SwiftProtobuf._ProtoNameProviding {
  static let protoMessageName: String = Fishjam_PeerMessage.protoMessageName + ".MediaEvent"
  static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "data"),
  ]

  mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      // The use of inline closures is to circumvent an issue where the compiler
      // allocates stack space for every case branch when no optimizations are
      // enabled. https://github.com/apple/swift-protobuf/issues/1034
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.data) }()
      default: break
      }
    }
  }

  func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.data.isEmpty {
      try visitor.visitSingularStringField(value: self.data, fieldNumber: 1)
    }
    try unknownFields.traverse(visitor: &visitor)
  }

  static func ==(lhs: Fishjam_PeerMessage.MediaEvent, rhs: Fishjam_PeerMessage.MediaEvent) -> Bool {
    if lhs.data != rhs.data {return false}
    if lhs.unknownFields != rhs.unknownFields {return false}
    return true
  }
}
