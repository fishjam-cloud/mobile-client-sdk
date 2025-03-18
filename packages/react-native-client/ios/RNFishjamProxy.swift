import FishjamCloudClient
import Foundation

public class RNFishjamProxy {
    static public func addCustomVideoSource(
        _ source: FishjamCustomSource, videoParameters: VideoParameters, metadata: Metadata
    ) async throws {
        try await RNFishjamClient.addCustomVideoSource(source, videoParameters: videoParameters, metadata: metadata)
    }

    static public func removeCustomVideoSource(_ source: FishjamCustomSource) {
        RNFishjamClient.removeCustomVideoSource(source)
    }
}
