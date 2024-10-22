import AVKit
import FishjamCloudClient

public typealias LocalCamera = [String: Any]

extension AVCaptureDevice {
    func toLocalCamera() -> LocalCamera {
        let facingDirection =
            switch position {
            case .front: "front"
            case .back: "back"
            default: "unspecified"
            }
        return [
            "id": uniqueID,
            "name": localizedName,
            "facingDirection": facingDirection,
        ]
    }
}
