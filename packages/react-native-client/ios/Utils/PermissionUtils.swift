import AVFoundation

class PermissionUtils {
    static var isCameraAuthorized: Bool {
        get async {
            await requestAccessIfNeeded(for: .video)
        }
    }
    
    static var isMicrophoneAuthorized: Bool {
        get async {
            await requestAccessIfNeeded(for: .audio)
        }
    }
    
    private static func requestAccessIfNeeded(for mediaType: AVMediaType) async -> Bool {
        let status = AVCaptureDevice.authorizationStatus(for: mediaType)
        
        var isAuthorized = status == .authorized
        if status == .notDetermined {
            isAuthorized = await AVCaptureDevice.requestAccess(for: mediaType)
        }
        
        return isAuthorized
    }
}
