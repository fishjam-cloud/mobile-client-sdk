import FishjamCloudClient
import Foundation

public class RNFishjamProxy {
    static public func add(customSource: CustomSource) async throws {
      try await RNFishjamClient.add(customSource: customSource)
    }

    static public func remove(customSource: CustomSource) {
      RNFishjamClient.remove(customSource: customSource)
    }
}
