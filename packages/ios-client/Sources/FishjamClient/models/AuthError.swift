public enum AuthError: String, CaseIterable {
    case missing_token = "missing token"
    case invalid_token = "invalid token"
    case expired_token = "expired token"
    case room_not_found = "room not found"
    case peer_not_found = "peer not found"
    case peer_already_connected = "peer already connected"
}
