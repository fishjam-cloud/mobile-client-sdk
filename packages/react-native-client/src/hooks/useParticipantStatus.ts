import { useCallback, useState } from 'react';
import { ParticipantStatus } from '../types';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * This hook provides live updates of current connection state of the local participant.
 * @returns Current participant status.
 * @category Connection
 * @group Hooks
 */
export const useParticipantStatus = () => {
  const [peerStatus, setParticipantStatus] = useState<ParticipantStatus>(
    RNFishjamClientModule.participantStatus,
  );

  const onParticipantStatus = useCallback((status?: ParticipantStatus) => {
    status && setParticipantStatus(status);
  }, []);

  useFishjamEvent(
    ReceivableEvents.ParticipantStatusChanged,
    onParticipantStatus,
  );

  return peerStatus;
};