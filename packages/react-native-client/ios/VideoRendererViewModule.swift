import ExpoModulesCore

public class VideoRendererViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("VideoRendererViewModule")

        View(VideoRendererView.self) {
            Events("onDimensionsChanged")
            
            Prop("trackId") { (view, trackId) in
                view.trackId = trackId
            }

            Prop("videoLayout") { (view, videoLayout) in
                view.videoLayout = videoLayout
            }

            Prop("skipRenderOutsideVisibleArea") { (view, skipRenderOutsideVisibleArea) in
                view.checkVisibilityTimeInterval = skipRenderOutsideVisibleArea ? 1 : nil
            }
            
            AsyncFunction("getCurrentDimensions") { (renderView: VideoRendererView) -> [String: Int32] in
                [
                    "width": renderView.videoView.dimensions?.width ?? 0,
                    "height": renderView.videoView.dimensions?.height ?? 0
                ]
            }
        }
    }
}
