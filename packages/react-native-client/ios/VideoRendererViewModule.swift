import ExpoModulesCore

public class VideoRendererViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("VideoRendererViewModule")

        View(VideoRendererView.self) {
            Prop("trackId") { (view, trackId) in
                view.trackId = trackId
            }

            Prop("videoLayout") { (view, videoLayout) in
                view.videoLayout = videoLayout
            }

            Prop("shouldRenderIfNotVisible") { (view, shouldRenderIfNotVisible) in
                view.checkVisibilityTimeInterval = shouldRenderIfNotVisible ? nil : 1
            }
        }
    }
}
