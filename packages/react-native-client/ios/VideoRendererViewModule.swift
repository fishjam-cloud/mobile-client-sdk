import ExpoModulesCore

public class VideoRendererViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("VideoRendererViewModule")

        View(VideoRendererView.self) {
            Prop("trackId") { (view: VideoRendererView, prop: String) in
                view.trackId = prop
            }

            Prop("videoLayout") { (view: VideoRendererView, prop: String) in
                view.videoLayout = prop
            }

            Prop("alwaysRender") { (view: VideoRendererView, prop: Bool) in
                view.checkVisibilityTimeInterval = prop ? nil : 1
            }
        }
    }
}
