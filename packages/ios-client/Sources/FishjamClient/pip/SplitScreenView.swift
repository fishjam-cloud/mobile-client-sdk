import SwiftUI
import UIKit

class SplitScreenViewModel: ObservableObject {
    @Published var isPrimaryVideoVisible: Bool = false
    @Published var isSecondaryVideoVisible: Bool = false
    @Published var primaryPlaceholderText: String
    @Published var secondaryPlaceholderText: String?
    let isSecondaryContainerVisible: Bool = true

    init(
        primaryPlaceholderText: String = "No camera",
        secondaryPlaceholderText: String = "No active speaker"
    ) {
        self.primaryPlaceholderText = primaryPlaceholderText
        self.secondaryPlaceholderText = secondaryPlaceholderText
    }
}

struct SplitScreenView: View {
    let primarySampleView: SampleBufferVideoCallView
    let secondarySampleView: SampleBufferVideoCallView
    @ObservedObject var viewModel: SplitScreenViewModel

    var body: some View {
        HStack(spacing: 0) {
            VideoPreviewContainerView(
                sampleView: primarySampleView,
                isVideoVisible: $viewModel.isPrimaryVideoVisible,
                peerName: viewModel.primaryPlaceholderText
            )

            if viewModel.isSecondaryContainerVisible {
                VideoPreviewContainerView(
                    sampleView: secondarySampleView,
                    isVideoVisible: $viewModel.isSecondaryVideoVisible,
                    peerName: viewModel.secondaryPlaceholderText,
                    showPeerName: true
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct VideoPreviewContainerView: View {
    let sampleView: SampleBufferVideoCallView
    @Binding var isVideoVisible: Bool
    let peerName: String?
    var showPeerName: Bool = false

    var body: some View {
        ZStack {
            Text(peerName ?? "Unknown User")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .padding()

            if isVideoVisible {
                ZStack(alignment: .bottomTrailing) {
                    UIViewRepresentableWrapper(view: sampleView)
                    if showPeerName, let peerName {
                        Text(peerName)
                            .foregroundStyle(.white)
                            .font(.footnote)
                            .padding(5)
                            .frame(maxWidth: 80)
                            .lineLimit(1)
                            .background(Color.black.opacity(0.3))
                            .cornerRadius(5, corners: [.topLeft])
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
        .clipped()
    }
}

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    let radius: CGFloat
    let corners: UIRectCorner

    init(radius: CGFloat = .infinity, corners: UIRectCorner = .allCorners) {
        self.radius = radius
        self.corners = corners
    }

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

private struct UIViewRepresentableWrapper: UIViewRepresentable {
    let view: UIView

    func makeUIView(context: Context) -> UIView {
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
    }
}
