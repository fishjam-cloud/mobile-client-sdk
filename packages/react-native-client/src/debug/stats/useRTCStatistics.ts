import { takeRight } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

import type { RTCInboundStats, RTCOutboundStats, RTCStats } from './types';
import RNFishjamClientModule from '../../RNFishjamClientModule';

/**
 * This hook provides access to current rtc statistics data.
 * @category Debugging
 */
export function useRTCStatistics(refreshInterval: number) {
  const MAX_SIZE = 120;
  const [statistics, setStatistics] = useState<RTCStats[]>([]);

  // Calculates diff between pervious and current stats,
  // providing end users with a per second metric.
  const processIncomingStats = useCallback(
    (stats: readonly RTCStats[], stat: Readonly<RTCStats>) => {
      Object.keys(stat).forEach((obj) => {
        if (obj.includes('Inbound')) {
          const rtcStats = stat[obj] as RTCInboundStats;

          if (
            stats.length > 0 &&
            Object.keys(stats[stats.length - 1]).includes(obj)
          ) {
            const prevRtcStats = stats[stats.length - 1][
              obj
            ] as RTCInboundStats;

            rtcStats['packetsLost/s'] =
              rtcStats['packetsLost'] - prevRtcStats['packetsLost'];
            rtcStats['packetsReceived/s'] =
              rtcStats['packetsReceived'] - prevRtcStats['packetsReceived'];
            rtcStats['bytesReceived/s'] =
              rtcStats['bytesReceived'] - prevRtcStats['bytesReceived'];
            rtcStats['framesReceived/s'] =
              rtcStats['framesReceived'] - prevRtcStats['framesReceived'];
            rtcStats['framesDropped/s'] =
              rtcStats['framesDropped'] - prevRtcStats['framesDropped'];
          } else {
            rtcStats['packetsLost/s'] = 0;
            rtcStats['packetsReceived/s'] = 0;
            rtcStats['bytesReceived/s'] = 0;
            rtcStats['framesReceived/s'] = 0;
            rtcStats['framesDropped/s'] = 0;
          }
          return stat;
        }
        // Outbound
        const rtcStats = stat[obj] as RTCOutboundStats;

        if (
          stats.length > 0 &&
          Object.keys(stats[stats.length - 1]).includes(obj)
        ) {
          const prevRtcStats = stats[stats.length - 1][obj] as RTCOutboundStats;

          rtcStats['bytesSent/s'] =
            rtcStats['bytesSent'] - prevRtcStats['bytesSent'];
          rtcStats['packetsSent/s'] =
            rtcStats['packetsSent'] - prevRtcStats['packetsSent'];
          rtcStats['framesEncoded/s'] =
            rtcStats['framesEncoded'] - prevRtcStats['framesEncoded'];
        } else {
          rtcStats['bytesSent/s'] = 0;
          rtcStats['packetsSent/s'] = 0;
          rtcStats['framesEncoded/s'] = 0;
        }
        return stat;
      });
      return stat;
    },
    [],
  );

  // Gets stats from the native libraries.
  const getStatistics = useCallback(async () => {
    const stats = await RNFishjamClientModule.getStatistics();
    setStatistics((prev) => {
      const newStats = [...prev, processIncomingStats(prev, stats)];
      takeRight(newStats, MAX_SIZE);
      return newStats;
    });
  }, [processIncomingStats]);

  useEffect(() => {
    const intervalId = setInterval(getStatistics, refreshInterval);
    return () => {
      clearInterval(intervalId);
      setStatistics([]);
    };
  }, [getStatistics, refreshInterval]);

  return { statistics };
}
