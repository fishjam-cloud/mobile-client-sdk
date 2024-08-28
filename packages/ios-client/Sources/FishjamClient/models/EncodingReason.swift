/**
 * Type describing possible reasons of currently selected encoding.
 * - other - the exact reason couldn't be determined
 * - encoding_inactive - previously selected encoding became inactive
 * - low_bandwidth - there is no longer enough bandwidth to maintain previously selected encoding
 */
public enum EncodingReason: String {
    case other
    case encoding_inactive
    case low_bandwidth
}
