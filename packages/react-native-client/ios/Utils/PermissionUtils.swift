import AVFoundation

class PermissionUtils {
    static func requestCameraPermission() async -> Bool { await requestAccessIfNeeded(for: .video) }
    static func requestMicrophonePermission() async -> Bool { await requestAccessIfNeeded(for: .audio) }
    
    private static func requestAccessIfNeeded(for mediaType: AVMediaType) async -> Bool {
        let status = AVCaptureDevice.authorizationStatus(for: mediaType)
        
        var isAuthorized = status == .authorized
        if status == .notDetermined {
            isAuthorized = await AVCaptureDevice.requestAccess(for: mediaType)
        }
        
        return isAuthorized
    }
}
