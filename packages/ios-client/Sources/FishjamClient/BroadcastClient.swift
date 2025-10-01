//
//  BroadcastClient.swift
//  Pods
//
//  Created by Milosz Filimowski on 02/10/2025.
//

import WebRTC
import Foundation

/// Data needed to initialize a broadcast screenshare
public struct ScreenshareData: Codable {
    public let localEndpoint: Endpoint
    public let metadata: Metadata
    public let videoParameters: VideoParameters
    
    public init(localEndpoint: Endpoint, metadata: Metadata, videoParameters: VideoParameters) {
        self.localEndpoint = localEndpoint
        self.metadata = metadata
        self.videoParameters = videoParameters
    }
}

/// Client for managing broadcast screenshare data sharing between the main app and broadcast extension
public class BroadcastClient {
    public var config: ConnectConfig?
    
    private static let screenshareDataKey = "FishjamScreenshareData"
    private static let broadcastExtensionConfigKey = "FishjamBroadcastExtensionConfig"
    
    /// Saves screenshare data to App Group UserDefaults for use by the broadcast extension
    /// - Parameters:
    ///   - data: The screenshare data to save
    ///   - appGroup: The App Group identifier shared between the app and extension
    /// - Returns: true if save was successful, false otherwise
    public static func saveScreenshareData(_ data: ScreenshareData, appGroup: String) -> Bool {
        guard let userDefaults = UserDefaults(suiteName: appGroup) else {
            sdkLogger.error("Failed to access UserDefaults for app group: \(appGroup)")
            return false
        }
        
        do {
            let encoder = JSONEncoder()
            let encoded = try encoder.encode(data)
            userDefaults.set(encoded, forKey: screenshareDataKey)
            userDefaults.synchronize()
            sdkLogger.info("Successfully saved screenshare data to app group")
            return true
        } catch {
            sdkLogger.error("Failed to encode screenshare data: \(error)")
            return false
        }
    }
    
    /// Loads screenshare data from App Group UserDefaults
    /// - Parameter appGroup: The App Group identifier shared between the app and extension
    /// - Returns: The screenshare data if available and valid, nil otherwise
    public static func loadScreenshareData(appGroup: String) -> ScreenshareData? {
        guard let userDefaults = UserDefaults(suiteName: appGroup) else {
            sdkLogger.error("Failed to access UserDefaults for app group: \(appGroup)")
            return nil
        }
        
        guard let encoded = userDefaults.data(forKey: screenshareDataKey) else {
            sdkLogger.warning("No screenshare data found in app group")
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            let data = try decoder.decode(ScreenshareData.self, from: encoded)
            sdkLogger.info("Successfully loaded screenshare data from app group")
            return data
        } catch {
            sdkLogger.error("Failed to decode screenshare data: \(error)")
            return nil
        }
    }
    
    /// Clears saved screenshare data from App Group UserDefaults
    /// - Parameter appGroup: The App Group identifier shared between the app and extension
    public static func clearScreenshareData(appGroup: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroup) else {
            sdkLogger.error("Failed to access UserDefaults for app group: \(appGroup)")
            return
        }
        
        userDefaults.removeObject(forKey: screenshareDataKey)
        userDefaults.synchronize()
        sdkLogger.info("Cleared screenshare data from app group")
    }
    
    // MARK: - BroadcastExtensionConfig methods
    
    /// Saves broadcast extension configuration to App Group UserDefaults
    /// This is the recommended approach - stores minimal connection info for the extension
    /// - Parameters:
    ///   - config: The broadcast extension configuration to save
    ///   - appGroup: The App Group identifier shared between the app and extension
    /// - Returns: true if save was successful, false otherwise
    public static func saveBroadcastExtensionConfig(_ config: BroadcastExtensionConfig, appGroup: String) -> Bool {
        guard let userDefaults = UserDefaults(suiteName: appGroup) else {
            sdkLogger.error("Failed to access UserDefaults for app group: \(appGroup)")
            return false
        }
        
        do {
            let encoder = JSONEncoder()
            let encoded = try encoder.encode(config)
            userDefaults.set(encoded, forKey: broadcastExtensionConfigKey)
            userDefaults.synchronize()
            sdkLogger.info("Successfully saved broadcast extension config to app group")
            return true
        } catch {
            sdkLogger.error("Failed to encode broadcast extension config: \(error)")
            return false
        }
    }
    
    /// Loads broadcast extension configuration from App Group UserDefaults
    /// - Parameter appGroup: The App Group identifier shared between the app and extension
    /// - Returns: The broadcast extension configuration if available and valid, nil otherwise
    public static func loadBroadcastExtensionConfig(appGroup: String) -> BroadcastExtensionConfig? {
        guard let userDefaults = UserDefaults(suiteName: appGroup) else {
            sdkLogger.error("Failed to access UserDefaults for app group: \(appGroup)")
            return nil
        }
        
        guard let encoded = userDefaults.data(forKey: broadcastExtensionConfigKey) else {
            sdkLogger.warning("No broadcast extension config found in app group")
            return nil
        }
        
        do {
            let decoder = JSONDecoder()
            let config = try decoder.decode(BroadcastExtensionConfig.self, from: encoded)
            sdkLogger.info("Successfully loaded broadcast extension config from app group")
            return config
        } catch {
            sdkLogger.error("Failed to decode broadcast extension config: \(error)")
            return nil
        }
    }
    
    /// Clears saved broadcast extension configuration from App Group UserDefaults
    /// - Parameter appGroup: The App Group identifier shared between the app and extension
    public static func clearBroadcastExtensionConfig(appGroup: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroup) else {
            sdkLogger.error("Failed to access UserDefaults for app group: \(appGroup)")
            return
        }
        
        userDefaults.removeObject(forKey: broadcastExtensionConfigKey)
        userDefaults.synchronize()
        sdkLogger.info("Cleared broadcast extension config from app group")
    }
}
