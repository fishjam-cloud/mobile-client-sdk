import os.log

let log = OSLog(subsystem: "com.swm.membranewebrtc", category: "ErrorHandling")

#if os(iOS)
    @available(iOS 12, *)
    extension RPSystemBroadcastPickerView {
        public static func show(
            for preferredExtension: String? = nil, showsMicrophoneButton: Bool = false
        ) {
            let view = RPSystemBroadcastPickerView()
            view.preferredExtension = preferredExtension
            view.showsMicrophoneButton = showsMicrophoneButton

            let selector = NSSelectorFromString("buttonPressed:")
            if view.responds(to: selector) {
                view.perform(selector, with: nil)
            }
        }
    }
#endif

extension [String: Any] {
    public func toMetadata() -> Metadata {
        var res: Metadata = .init()
        self.forEach { entry in
            res[entry.key] = entry.value
        }
        return res
    }
}

extension AnyJson {
    public func toDict() -> [String: Any] {
        var res: [String: Any] = [:]
        self.keys.forEach { key in
            res[key] = self[key]
        }
        return res
    }
}
