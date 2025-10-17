import ExpoModulesCore

public class PipContainerViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PipContainerViewModule")

        View(PipContainerView.self) {
            Prop("startAutomatically") { (view: PipContainerView, value: Bool) in
                Task { @MainActor in
                    view.startAutomatically = value
                }
            }
            
            Prop("stopAutomatically") { (view: PipContainerView, value: Bool) in
                Task { @MainActor in
                    view.stopAutomatically = value
                }
            }
            
            Prop("allowsCameraInBackground") { (view: PipContainerView, value: Bool) in
                Task { @MainActor in
                    view.allowsCameraInBackground = value
                }
            }
            
            Prop("primaryPlaceholderText") { (view: PipContainerView, value: String) in
                Task { @MainActor in
                    view.primaryPlaceholderText = value
                }
            }
            
            Prop("secondaryPlaceholderText") { (view: PipContainerView, value: String) in
                Task { @MainActor in
                    view.secondaryPlaceholderText = value
                }
            }
            
            AsyncFunction("startPictureInPicture") { (view: PipContainerView) in
                await view.startPictureInPicture()
            }
            
            AsyncFunction("stopPictureInPicture") { (view: PipContainerView) in
                await view.stopPictureInPicture()
            }
        }
    }
}

