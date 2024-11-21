public struct AnyJson: Codable {
    private var store: [String: Any]

    public init(_ dict: [String: Any] = [:]) {
        self.store = dict
    }

    public subscript(key: String) -> Any? {
        get { store[key] }
        set { store[key] = newValue }
    }

    public var keys: Dictionary<String, Any>.Keys {
        store.keys
    }

    // MARK: Decoding

    public init(from string: String) throws {
        let data = Data(string.utf8)
        let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] ?? [:]
        self.store = json
    }

    public init(from decoder: Decoder) throws {
        var container = try decoder.container(keyedBy: JSONCodingKey.self)
        self.store = try Self.decodeDictionary(from: &container)
    }

    static func decodeDictionary(from container: inout KeyedDecodingContainer<JSONCodingKey>) throws
        -> [String: Any]
    {
        var dict = [String: Any]()
        for key in container.allKeys {
            let value = try decode(from: &container, forKey: key)
            dict[key.stringValue] = value
        }
        return dict
    }

    static func decodeArray(from container: inout UnkeyedDecodingContainer) throws -> [Any] {
        var arr: [Any] = []
        while !container.isAtEnd {
            let value = try decode(from: &container)
            arr.append(value)
        }
        return arr
    }

    static func decode(
        from container: inout KeyedDecodingContainer<JSONCodingKey>, forKey key: JSONCodingKey
    ) throws -> Any {
        if let value = try? container.decode(Bool.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(Int.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(Double.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(String.self, forKey: key) {
            return value
        }
        if let value = try? container.decodeNil(forKey: key) {
            if value { return Optional<Any>.none as Any }
        }
        if var container = try? container.nestedUnkeyedContainer(forKey: key) {
            return try decodeArray(from: &container)
        }
        if var container = try? container.nestedContainer(keyedBy: JSONCodingKey.self, forKey: key) {
            return try decodeDictionary(from: &container)
        }
        throw DecodingError.typeMismatch(
            AnyJson.self,
            .init(
                codingPath: container.codingPath,
                debugDescription: "Couldn't parse object to Metadata: unknown type!"))
    }

    static func decode(from container: inout UnkeyedDecodingContainer) throws -> Any {
        if let value = try? container.decode(Bool.self) {
            return value
        }
        if let value = try? container.decode(Int.self) {
            return value
        }
        if let value = try? container.decode(Double.self) {
            return value
        }
        if let value = try? container.decode(String.self) {
            return value
        }
        if let value = try? container.decodeNil() {
            if value { return Optional<Any>.none as Any }
        }
        if var container = try? container.nestedUnkeyedContainer() {
            return try decodeArray(from: &container)
        }
        if var container = try? container.nestedContainer(keyedBy: JSONCodingKey.self) {
            return try decodeDictionary(from: &container)
        }
        throw DecodingError.typeMismatch(
            AnyJson.self,
            .init(
                codingPath: container.codingPath,
                debugDescription: "Couldn't parse object to Metadata: decoding from container failed"))
    }

    // MARK: Encoding

    public func encode(to encoder: Swift.Encoder) throws {
        var container = encoder.container(keyedBy: JSONCodingKey.self)
        try Self.encode(to: &container, dictionary: store)
    }

    static func encode(
        to container: inout KeyedEncodingContainer<JSONCodingKey>, dictionary: [String: Any]
    ) throws {
        for (key, value) in dictionary {
            let key = JSONCodingKey(stringValue: key)!
            if let value = value as? Bool {
                try container.encode(value, forKey: key)
            } else if let value = value as? Int {
                try container.encode(value, forKey: key)
            } else if let value = value as? Int16 {
                try container.encode(value, forKey: key)
            } else if let value = value as? Int32 {
                try container.encode(value, forKey: key)
            } else if let value = value as? Int64 {
                try container.encode(value, forKey: key)
            } else if let value = value as? Double {
                try container.encode(value, forKey: key)
            } else if let value = value as? String {
                try container.encode(value, forKey: key)
            } else if let value = value as? [Any] {
                var container = container.nestedUnkeyedContainer(forKey: key)
                try encode(to: &container, array: value)
            } else if let value = value as? [String: Any] {
                var container = container.nestedContainer(keyedBy: JSONCodingKey.self, forKey: key)
                try encode(to: &container, dictionary: value)
            } else if let value = value as? AnyJson {
                var container = container.nestedContainer(keyedBy: JSONCodingKey.self, forKey: key)
                try encode(to: &container, dictionary: value.store)
            } else {
                if case Optional<Any>.none = value {
                    try container.encodeNil(forKey: key)
                } else {
                    throw DecodingError.typeMismatch(
                        AnyJson.self,
                        .init(
                            codingPath: container.codingPath,
                            debugDescription:
                                "Couldn't parse object to Metadata: unexpected type to encode: \(String(describing: value))"
                        ))
                }
            }
        }
    }

    static func encode(to container: inout UnkeyedEncodingContainer, array: [Any]) throws {
        for value in array {
            if let value = value as? Bool {
                try container.encode(value)
            } else if let value = value as? Int {
                try container.encode(value)
            } else if let value = value as? Int32 {
                try container.encode(value)
            } else if let value = value as? Int64 {
                try container.encode(value)
            } else if let value = value as? Int16 {
                try container.encode(value)
            } else if let value = value as? Double {
                try container.encode(value)
            } else if let value = value as? String {
                try container.encode(value)
            } else if let value = value as? [Any] {
                var container = container.nestedUnkeyedContainer()
                try encode(to: &container, array: value)
            } else if let value = value as? [String: Any] {
                var container = container.nestedContainer(keyedBy: JSONCodingKey.self)
                try encode(to: &container, dictionary: value)
            } else {
                if case Optional<Any>.none = value {
                    try container.encodeNil()
                } else {
                    throw DecodingError.typeMismatch(
                        AnyJson.self,
                        .init(
                            codingPath: container.codingPath,
                            debugDescription:
                                "Couldn't parse object to Metadata: unexpected type to encode: \(String(describing: value))"
                        ))
                }
            }
        }
    }

    static func encode(to container: inout SingleValueEncodingContainer, value: Any) throws {
        if let value = value as? Bool {
            try container.encode(value)
        } else if let value = value as? Int {
            try container.encode(value)
        } else if let value = value as? Int32 {
            try container.encode(value)
        } else if let value = value as? Int64 {
            try container.encode(value)
        } else if let value = value as? Int16 {
            try container.encode(value)
        } else if let value = value as? Double {
            try container.encode(value)
        } else if let value = value as? String {
            try container.encode(value)
        } else {
            if case Optional<Any>.none = value {
                try container.encodeNil()
            } else {
                throw DecodingError.typeMismatch(
                    AnyJson.self,
                    .init(
                        codingPath: container.codingPath,
                        debugDescription:
                            "Couldn't parse object to Metadata: unexpected type to encode: \(String(describing: value))"
                    ))
            }
        }
    }

    // MARK: Coding keys

    class JSONCodingKey: CodingKey {
        let key: String
        required init?(intValue: Int) { return nil }
        required init?(stringValue: String) { key = stringValue }
        var intValue: Int? { return nil }
        var stringValue: String { return key }
    }
}

extension String {
    func toAnyJson() throws -> AnyJson {
        return try AnyJson(from: self)
    }

    func toAnyJson() -> AnyJson? {
        return try? AnyJson(from: self)
    }
}
