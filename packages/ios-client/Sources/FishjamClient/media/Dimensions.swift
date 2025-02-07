import CoreMedia
import Foundation

public struct Dimensions {
    public static let aspect16By9 = 16.0 / 9.0
    public static let aspect4By3 = 4.0 / 3.0

    private var dimensions: CMVideoDimensions

    public var width: Int32 { dimensions.width }
    public var height: Int32 { dimensions.height }

    public init(width: Int32, height: Int32) {
        self.dimensions = CMVideoDimensions(width: width, height: height)
    }

    public init(_ dimensions: CMVideoDimensions) {
        self.dimensions = dimensions
    }

    /// Returns new struct with swapped height and width.
    public var flipped: Dimensions {
        Dimensions(width: height, height: width)
    }
    
    public func toDict() -> [String: Int32] {
        [
            "width": width,
            "height": height
        ]
    }
}

extension Dimensions: Equatable {
    public static func == (lhs: Dimensions, rhs: Dimensions) -> Bool {
        lhs.width == rhs.width && lhs.height == rhs.height
    }
}

extension Optional where Wrapped == Dimensions {
    public func toDict() -> [String: Int32] {
        self?.toDict() ?? [
            "width": 0,
            "height": 0
        ]
    }
}