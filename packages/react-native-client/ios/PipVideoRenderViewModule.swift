import ExpoModulesCore

public class PipVideoRenderViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PipVideoRenderViewModule")

        View(PipVideoRenderView.self) {
            Prop("startAutomatically") { (view: PipVideoRenderView, value: Bool) in
                Task { @MainActor in
                    view.startAutomatically = value
                }
            }
            
            Prop("stopAutomatically") { (view: PipVideoRenderView, value: Bool) in
                Task { @MainActor in
                    view.stopAutomatically = value
                }
            }
            
            Prop("allowsCameraInBackground") { (view: PipVideoRenderView, value: Bool) in
                Task { @MainActor in
                    view.allowsCameraInBackground = value
                }
            }
            
            AsyncFunction("setPictureInPictureActiveTrackId") { (view: PipVideoRenderView, trackId: String) in
                await view.setPipActive(trackId: trackId)
            }
            
            AsyncFunction("startPictureInPicture") { (view: PipVideoRenderView) in
                await view.startPictureInPicture()
            }
            
            AsyncFunction("stopPictureInPicture") { (view: PipVideoRenderView) in
                await view.stopPictureInPicture()
            }
        }
    }
}
