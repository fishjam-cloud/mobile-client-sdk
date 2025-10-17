import ExpoModulesCore

@MainActor
class PipContainerView: ExpoView {
    private var pipManager: PictureInPictureManager!
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        pipManager = PictureInPictureManager(
            sourceView: self,
            eventEmitter: { event in
                RNFishjamClient.sendEvent?(event)
            },
            fishjamClient: RNFishjamClient.fishjamClient
        )
    }
    
    var startAutomatically: Bool = true {
        didSet {
            pipManager.setStartAutomatically(startAutomatically)
        }
    }
    
    var stopAutomatically: Bool = true {
        didSet {
            pipManager.setStopAutomatically(stopAutomatically)
        }
    }
    
    var allowsCameraInBackground: Bool = false {
        didSet {
            pipManager.setAllowsCameraWhileInPictureInPicture(allowsCameraInBackground)
        }
    }
    
    var primaryPlaceholderText: String = "No camera" {
        didSet {
            pipManager.primaryPlaceholderText = primaryPlaceholderText
        }
    }
    
    var secondaryPlaceholderText: String = "No active speaker" {
        didSet {
            pipManager.secondaryPlaceholderText = secondaryPlaceholderText
        }
    }
    
    func startPictureInPicture() {
        pipManager.start()
    }
    
    func stopPictureInPicture() {
        pipManager.stop()
    }
}

