import { useCallback } from 'react';

import { SimulcastConfig, TrackMetadata } from '../types';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { Platform } from 'react-native';
import { useFishjamEventState } from './internal/useFishjamEventState';

export type ScreenShareQuality = 'VGA' | 'HD5' | 'HD15' | 'FHD15' | 'FHD30';

export type ScreenShareOptions = {
  /**
   * Resolution + fps of screen share track, one of: `VGA`, `HD5`, `HD15`, `FHD15`, `FHD30`.
   * Note that quality might be worse than specified due to device capabilities, internet
   * connection etc.
   * @default `HD15`
   */
  quality: ScreenShareQuality;
};
export type ScreenShareOptionsInternal = {
  screenShareMetadata: TrackMetadata & { displayName?: string };
  /**
   * SimulcastConfig of a screen share track. By default simulcast is disabled.
   */
  simulcastConfig: SimulcastConfig;
};

const defaultSimulcastConfig = () =>
  ({
    enabled: false,
  }) satisfies SimulcastConfig;

let screenShareSimulcastConfig: SimulcastConfig = defaultSimulcastConfig();

/**
 * This hook can toggle screen sharing on/off and provides current screen share state.
 * @returns An object with functions to manage screen share.
 * @category Connection
 * @group Hooks
 */
export function useScreenShare() {
  const isScreenShareOn = useFishjamEventState(
    ReceivableEvents.IsScreenShareOn,
    RNFishjamClientModule.isScreenShareOn,
  );

  const simulcastConfig = useFishjamEventState(
    ReceivableEvents.SimulcastConfigUpdate,
    screenShareSimulcastConfig,
  );

  const handleScreenSharePermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      return await RNFishjamClientModule.handleScreenSharePermission();
    }
    return 'denied';
  }, []);

  /**
   * Toggles the screen share on/off.
   *
   * @param screenShareOptions - Options for configuring screen share quality
   *
   * ### iOS Memory Limitations
   *
   * **Important**: iOS broadcast extensions have strict memory limits that vary by device:
   * - **Devices with < 3GB RAM** (e.g., iPhone SE, 8, X): ~50MB limit
   * - **Devices with ≥ 3GB RAM** (e.g., iPhone 11+): ~150-200MB limit
   * - **iPads**: Generally higher limits (~200-300MB)
   *
   * If the extension exceeds these limits, iOS will terminate it with an `EXC_RESOURCE` exception,
   * causing the screen share to stop unexpectedly.
   *
   * ### Quality Recommendations
   *
   * Choose quality settings based on device capabilities:
   * - **VGA or HD5**: Recommended for older devices (< 3GB RAM)
   * - **HD15**: Good balance for most devices (default)
   * - **FHD15/FHD30**: Only for newer devices with 4GB+ RAM
   *
   * Higher resolutions consume significantly more memory:
   * - 640x360 (VGA): ~1MB per frame
   * - 1280x720 (HD): ~4MB per frame
   * - 1920x1080 (FHD): ~8MB per frame
   *
   * ### Hardware Acceleration
   *
   * **H.264 codec is strongly recommended** for screen sharing as it:
   * - Has hardware acceleration on iOS devices, reducing memory footprint
   * - Provides better encoding efficiency (less CPU/memory usage)
   * - Is more stable for broadcast extensions compared to VP8/VP9
   *
   * Configure the codec at the Fishjam server level to ensure optimal performance.
   *
   * @example
   * ```typescript
   * // For older devices - conservative quality
   * await toggleScreenShare({ quality: 'HD5' });
   *
   * // For modern devices - balanced quality
   * await toggleScreenShare({ quality: 'HD15' });
   *
   * // For high-end devices - maximum quality
   * await toggleScreenShare({ quality: 'FHD15' });
   * ```
   *
   * @platform iOS - Shows system broadcast picker
   * @platform Android - Requires screen capture permission
   */
  const toggleScreenShare = useCallback(
    async (screenShareOptions: Partial<ScreenShareOptions> = {}) => {
      if (Platform.OS === 'android' && !isScreenShareOn) {
        if ((await handleScreenSharePermission()) !== 'granted') {
          return;
        }
      }
      const options = {
        ...screenShareOptions,
        screenShareMetadata: {
          displayName: 'presenting',
          type: 'screenShareVideo' as const,
          active: !isScreenShareOn,
        },
      };
      await RNFishjamClientModule.toggleScreenShare(options);
      screenShareSimulcastConfig = defaultSimulcastConfig(); //to do: sync with camera settings
    },
    [isScreenShareOn, handleScreenSharePermission],
  );

  return {
    isScreenShareOn,
    simulcastConfig,

    /**
     * Toggles the screen share on/off.
     *
     * **Important**: On iOS, be mindful of device memory limitations. Choose quality settings
     * based on device capabilities and prefer H.264 codec for optimal performance.
     * See the function documentation above for detailed information about memory limits
     * and quality recommendations.
     *
     * @platform iOS - Shows system broadcast picker; emits warning when screensharing app screen
     * @platform Android - Requires screen capture permission
     */
    toggleScreenShare,
    handleScreenSharePermission,
  };
}
