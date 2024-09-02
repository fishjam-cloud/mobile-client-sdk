//Probably delete this file
import SwiftUI
import UIKit

internal class SwiftUIVideViewReceiver: VideoViewDelegate {
    @Binding var dimensions: Dimensions?

    init(dimensions: Binding<Dimensions?> = .constant(nil)) {
        _dimensions = dimensions
    }

    func didChange(dimensions: Dimensions) {
        DispatchQueue.main.async {
            self.dimensions = dimensions
        }
    }
}

/// A SwiftUI component wrapping underneath a `VideoView`.
public struct SwiftUIVideoView: UIViewRepresentable {
    let track: VideoTrack
    let layout: VideoView.Layout
    let mirror: Bool

    @Binding var dimensions: Dimensions?

    let receiverDelegate: SwiftUIVideViewReceiver

    public init(
        _ track: VideoTrack, layout: VideoView.Layout = .fill, mirror: Bool = false,
        dimensions: Binding<Dimensions?> = .constant(nil)
    ) {
        self.track = track
        self.layout = layout
        self.mirror = mirror
        _dimensions = dimensions

        receiverDelegate = SwiftUIVideViewReceiver(dimensions: dimensions)
    }

    public func makeUIView(context: Context) -> VideoView {
        let view = VideoView()
        view.delegate = receiverDelegate

        updateUIView(view, context: context)
        return view
    }

    public func updateUIView(_ videoView: VideoView, context _: Context) {
        if videoView.track != track {
            videoView.track = track
        }
        videoView.layout = layout
        videoView.mirror = mirror

        videoView.delegate = receiverDelegate
    }

    public static func dismantleUIView(_ videoView: VideoView, coordinator _: ()) {
        videoView.track = nil
    }
}
