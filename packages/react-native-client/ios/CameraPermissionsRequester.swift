import ExpoModulesCore
import AVFoundation

let cameraKey = "NSCameraUsageDescription"
let microphoneKey = "NSMicrophoneUsageDescription"

protocol BaseCameraRequester {
  var mediaType: AVMediaType { get }
  func permissionWith(status systemStatus: AVAuthorizationStatus) -> [AnyHashable: Any]
  func permissions(for key: String, service: String) -> [AnyHashable: Any]
  func requestAccess(handler: @escaping (Bool) -> Void)
}

extension BaseCameraRequester {
  public func permissions(for key: String, service: String) -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus
    let description = Bundle.main.infoDictionary?[key] as? String

    if description != nil {
      systemStatus = AVCaptureDevice.authorizationStatus(for: mediaType)
    } else {
      RNFishjamClient.sendEvent?(EmitableEvent.warning(message: "Camera permission not granted."))
      systemStatus = .denied
    }

    return permissionWith(status: systemStatus)
  }

  public func permissionWith(status systemStatus: AVAuthorizationStatus) -> [AnyHashable: Any] {
    var status: EXPermissionStatus

    switch systemStatus {
    case .authorized:
      status = EXPermissionStatusGranted
    case .denied, .restricted:
      status = EXPermissionStatusDenied
    case .notDetermined:
      fallthrough
    @unknown default:
      status = EXPermissionStatusUndetermined
    }

    return [
      "status": status.rawValue
    ]
  }

  public func requestAccess(handler: @escaping (Bool) -> Void) {
    AVCaptureDevice.requestAccess(for: mediaType, completionHandler: handler)
  }
}

public class CameraOnlyPermissionRequester: NSObject, EXPermissionsRequester, BaseCameraRequester {
  let mediaType: AVMediaType = .video

  public static func permissionType() -> String {
    "camera"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    return permissions(for: cameraKey, service: "video")
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    requestAccess { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }
}

public class CameraPermissionRequester: NSObject, EXPermissionsRequester, BaseCameraRequester {
  let mediaType: AVMediaType = .video

  public static func permissionType() -> String {
    "camera"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var systemStatus: AVAuthorizationStatus

    let cameraUsuageDescription = Bundle.main.infoDictionary?[cameraKey] as? String
    let microphoneUsuageDescription = Bundle.main.infoDictionary?[microphoneKey] as? String

    if let cameraUsuageDescription, let microphoneUsuageDescription {
      systemStatus = AVCaptureDevice.authorizationStatus(for: mediaType)
    } else {
      RNFishjamClient.sendEvent?(EmitableEvent.warning(message: "Camera permission not granted."))
      systemStatus = .denied
    }

    return permissionWith(status: systemStatus)
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    requestAccess { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }
}

public class CameraMicrophonePermissionRequester: NSObject, EXPermissionsRequester, BaseCameraRequester {
  let mediaType: AVMediaType = .audio

  public static func permissionType() -> String {
    "microphone"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    return permissions(for: microphoneKey, service: "audio")
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    requestAccess { [weak self] _ in
      resolve(self?.getPermissions())
    }
  }
}
