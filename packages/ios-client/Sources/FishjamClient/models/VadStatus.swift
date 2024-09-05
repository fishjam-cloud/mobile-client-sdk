/**
 * Type describing Voice Activity Detection statuses.
 *
 * - speech - voice activity has been detected
 * - silence - lack of voice activity has been detected
 */
public enum VadStatus: String {
    case speech
    case silence
}
