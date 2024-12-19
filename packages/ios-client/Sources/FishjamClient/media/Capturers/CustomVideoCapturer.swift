import WebRTC
import Vision
import CoreImage.CIFilterBuiltins

class CustomVideoCapturer: RTCCameraVideoCapturer {
    private var videoDataOutput: AVCaptureVideoDataOutput?
    private var rtcCameraCapturer: RTCCameraVideoCapturer?
    
    private let requestHandler = VNSequenceRequestHandler()
    private var segmentationRequest = VNGeneratePersonSegmentationRequest()
    private let processingQueue = DispatchQueue(label: "com.example.imageProcessing", qos: .userInteractive)

    override init(delegate: (any RTCVideoCapturerDelegate)?) {
    
        super.init(delegate: delegate, captureSession: AVCaptureSession())
        setupCaptureSession()
    }
    
    private func setupCaptureSession() {
        let session = captureSession
        
        // Configure capture session
        session.beginConfiguration()
        
        // Setup video input
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
              let videoInput = try? AVCaptureDeviceInput(device: camera),
              session.canAddInput(videoInput) else {
            return
        }
        session.addInput(videoInput)
        
        // Setup video output
        let videoOutput = AVCaptureVideoDataOutput()
        videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "video.processing.queue"))
        if session.canAddOutput(videoOutput) {
            session.addOutput(videoOutput)
        }
        
        session.commitConfiguration()
        self.videoDataOutput = videoOutput
        
        rtcCameraCapturer = RTCCameraVideoCapturer(delegate: delegate, captureSession: session)
        
        segmentationRequest = VNGeneratePersonSegmentationRequest()
        segmentationRequest.qualityLevel = .balanced
        segmentationRequest.outputPixelFormat = kCVPixelFormatType_OneComponent8
    }
    
    private func processVideoFrame(_ framePixelBuffer: CVPixelBuffer) {
        // Perform the requests on the pixel buffer that contains the video frame.
        try? requestHandler.perform([segmentationRequest],
                                    on: framePixelBuffer,
                                    orientation: .right)
        
        // Get the pixel buffer that contains the mask image.
        guard let maskPixelBuffer =
                segmentationRequest.results?.first?.pixelBuffer else { return }
        
        // Process the images.
        blend(original: framePixelBuffer, mask: maskPixelBuffer)
    }
    
    private func blend(original framePixelBuffer: CVPixelBuffer,
                       mask maskPixelBuffer: CVPixelBuffer) {
        
        
        // Create CIImage objects for the video frame and the segmentation mask.
        let originalImage = CIImage(cvPixelBuffer: framePixelBuffer).oriented(.right)
        var maskImage = CIImage(cvPixelBuffer: maskPixelBuffer)
        
        // Scale the mask image to fit the bounds of the video frame.
        let scaleX = originalImage.extent.width / maskImage.extent.width
        let scaleY = originalImage.extent.height / maskImage.extent.height
        maskImage = maskImage.transformed(by: .init(scaleX: scaleX, y: scaleY))
        
        // Ensure mask covers the entire frame
        maskImage = maskImage.cropped(to: originalImage.extent)
        
        // Create a blurred background image, cropped to exact frame dimensions
        let blurRadius = 20.0
        let backgroundImage = originalImage
            .applyingGaussianBlur(sigma: blurRadius)
            .cropped(to: originalImage.extent)
        
        // Create and configure blend filter
        let blendFilter = CIFilter.blendWithRedMask()
        blendFilter.inputImage = originalImage.cropped(to: originalImage.extent)
        blendFilter.backgroundImage = backgroundImage
        blendFilter.maskImage = maskImage
        
        // Ensure final output is cropped to exact frame dimensions
        guard let outputImage = blendFilter.outputImage?
             .cropped(to: originalImage.extent)
             .oriented(.left) else { return }
        
        let context = CIContext(options: nil)
        
        // Lock the buffer for writing
        CVPixelBufferLockBaseAddress(framePixelBuffer, CVPixelBufferLockFlags(rawValue: 0))
        
        // Render the processed image back to the original buffer
        context.render(outputImage, to: framePixelBuffer)
        
        // Unlock the buffer
        CVPixelBufferUnlockBaseAddress(framePixelBuffer, CVPixelBufferLockFlags(rawValue: 0))
    }
}

extension CustomVideoCapturer: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let rtcCameraCapturerDelegate = self.rtcCameraCapturer as? AVCaptureVideoDataOutputSampleBufferDelegate else {
            return
        }
        
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            rtcCameraCapturerDelegate.captureOutput?(output, didOutput: sampleBuffer, from: connection)
            return
        }
        
        processingQueue.async {
            self.processVideoFrame(pixelBuffer)
            
            rtcCameraCapturerDelegate.captureOutput?(output, didOutput: sampleBuffer, from: connection)
        }
    }
}
