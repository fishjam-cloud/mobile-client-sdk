import SwiftUI
import UIKit

class SplitScreenViewModel: ObservableObject {
    @Published var isPrimaryVideoVisible: Bool = false
    @Published var isSecondaryVideoVisible: Bool = false
    @Published var primaryPlaceholderText: String
    @Published var secondaryPlaceholderText: String
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
                isVideoVisible: viewModel.isPrimaryVideoVisible,
                placeholderText: viewModel.primaryPlaceholderText
            )

            if viewModel.isSecondaryContainerVisible {
                VideoPreviewContainerView(
                    sampleView: secondarySampleView,
                    isVideoVisible: viewModel.isSecondaryVideoVisible,
                    placeholderText: viewModel.secondaryPlaceholderText
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct VideoPreviewContainerView: View {
    let sampleView: SampleBufferVideoCallView
    let isVideoVisible: Bool
    let placeholderText: String

    var body: some View {
        ZStack {
            Text(placeholderText)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .padding()

            UIViewRepresentableWrapper(view: sampleView)
                .opacity(isVideoVisible ? 1.0 : 0.0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
        .clipped()
    }
}


fileprivate struct UIViewRepresentableWrapper: UIViewRepresentable {
    let view: UIView

    func makeUIView(context: Context) -> UIView {
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // Update if needed
    }
}
