import Foundation
import FishjamCloudClient
import os.log
import ReplayKit
import WebRTC


/// App Group used by the extension to exchange buffers with the target application
let appGroup = "group.com.fishjam.reactnativefishjam"

let logger = OSLog(subsystem: "org.fishjamdev.fishjamclientexample.ScreenBroadcast", category: "Broadcaster")

/// An example `SampleHandler` utilizing `BroadcastSampleSource` from `MembraneRTC` sending broadcast samples and necessary notification enabling device's screencast.
class ScreenBroadcast: RPBroadcastSampleHandler {
  let broadcastSource = BroadcastSampleSource(appGroup: appGroup)
  var started: Bool = false


  override func broadcastStarted(withSetupInfo _: [String: NSObject]?) {
    print("Before connect")

    started = broadcastSource.connect()

    os_log("After connect", log: logger, type: .error)


    guard started else {
      os_log("failed to connect with ipc server", log: logger, type: .error)

      super.finishBroadcastWithError(NSError(domain: "", code: 0, userInfo: nil))

      return
    }

    os_log("Before started", log: logger, type: .error)

    broadcastSource.started()

    os_log("After started", log: logger, type: .error)

  }

  override func broadcastPaused() {
    os_log("Before paused", log: logger, type: .error)

    broadcastSource.paused()

    os_log("After paused", log: logger, type: .error)

  }

  override func broadcastResumed() {
    os_log("Before reasumed", log: logger, type: .error)

    broadcastSource.resumed()

    os_log("After reasumed", log: logger, type: .error)

  }

  override func broadcastFinished() {
    os_log("Before finished", log: logger, type: .error)

    broadcastSource.finished()

    os_log("After finished", log: logger, type: .error)

  }

  override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
    guard started else {
      return
    }

    broadcastSource.processFrame(sampleBuffer: sampleBuffer, ofType: sampleBufferType)
  }
}
