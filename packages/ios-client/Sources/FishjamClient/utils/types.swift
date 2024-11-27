import SwiftProtobuf

public typealias Metadata = AnyJson
public typealias Payload = AnyJson
public typealias SerializedMediaEvent = String

extension [String: Any] {
    public func toMetadata() -> Metadata {
        var res: Metadata = .init()
        self.forEach { entry in
            res[entry.key] = entry.value
        }
        return res
    }
}

extension AnyJson {
    public func toDict() -> [String: Any] {
        var res: [String: Any] = [:]
        self.keys.forEach { key in
            res[key] = self[key]
        }
        return res
    }
}

public struct JsonEncodingError: Error {}

extension Encodable {

    public func toJsonString() throws -> String {
        if let json = String(data: try JSONEncoder().encode(self), encoding: .utf8) {
            return json
        }
        throw JsonEncodingError()
    }

    var toJsonStringOrEmpty: String {
        do {
            return try self.toJsonString()
        } catch {
            sdkLogger.log(level: .error, "Unable to encode metadata")
            return "{}"
        }
    }
}

extension [String: Metadata] {
    public func toDictionaryJson() -> [String: String] {
        return mapValues { val in
            val.toJsonStringOrEmpty
        }
    }
}
