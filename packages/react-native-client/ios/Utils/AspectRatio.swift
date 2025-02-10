import FishjamCloudClient

struct AspectRatio {
    let width: Int32
    let height: Int32

    static var zero: AspectRatio {
        AspectRatio()
    }

    private init() {
        width = 0
        height = 0
    }

    init(width: Int32, height: Int32) {
        if width <= 0 || height <= 0 {
            self = .zero
        } else {
            let divisor = AspectRatio.gcd(width, height)
            self.width = width / divisor
            self.height = height / divisor
        }
    }

    init(dimensions: Dimensions?) {
        if let dimensions = dimensions {
            self = AspectRatio(width: dimensions.width, height: dimensions.height)
        } else {
            self = AspectRatio(width: 0, height: 0)
        }
    }

    func toDict() -> [String: Int32] {
        [
            "width": width,
            "height": height,
        ]
    }

    private static func gcd(_ a: Int32, _ b: Int32) -> Int32 {
        return b == 0 ? a : gcd(b, a % b)
    }
}
