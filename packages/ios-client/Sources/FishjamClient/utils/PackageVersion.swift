import Foundation

/// Utility for accessing the SDK package version
public struct PackageVersion {
    /// Gets the SDK version from the package.json file
    /// - Returns: The version string in format "mobile-X.Y.Z"
    public static func getSdkVersion() -> String {
        guard let url = Bundle.main.url(forResource: "package", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let jsonResult = try? JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed) as? [String: AnyObject],
              let version = jsonResult["version"] as? String else {
            sdkLogger.warning("Failed to read package version, using fallback")
            return "mobile-unknown"
        }
        return "mobile-\(version)"
    }
    
    /// Gets the raw version number without the "mobile-" prefix
    /// - Returns: The raw version string (e.g., "1.2.3")
    public static func getRawVersion() -> String {
        guard let url = Bundle.main.url(forResource: "package", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let jsonResult = try? JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed) as? [String: AnyObject],
              let version = jsonResult["version"] as? String else {
            return "unknown"
        }
        return version
    }
}

