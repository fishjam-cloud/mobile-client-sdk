public typealias Metadata = AnyJson
public typealias Payload = AnyJson
public typealias SerializedMediaEvent = String


public extension [String: Any] {
    func toMetadata() -> Metadata {
        var res: Metadata = .init()
        self.forEach { entry in
            res[entry.key] = entry.value
        }
        return res
    }
}

public extension AnyJson {
    func toDict() -> [String: Any] {
        var res: [String: Any] = [:]
        self.keys.forEach { key in
            res[key] = self[key]
        }
        return res
    }
}
