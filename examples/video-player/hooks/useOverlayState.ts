import { useState, useCallback, useRef, useEffect } from 'react';

const OVERLAY_AUTO_HIDE_INTERVAL_MS = 2000;

export const useOverlayState = (isLandscape: boolean) => {
  const [isOverlayVisible, setOverlayVisible] = useState(!isLandscape);
  const hideTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const startHideTimer = useCallback(() => {
    if (!isLandscape) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setOverlayVisible(false);
      hideTimeoutRef.current = null;
    }, OVERLAY_AUTO_HIDE_INTERVAL_MS);
  }, [isLandscape]);

  const cancelHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const toggleOverlay = useCallback(() => {
    if (!isLandscape) return;

    cancelHideTimer();

    const newOverlayState = !isOverlayVisible;
    setOverlayVisible(newOverlayState);

    if (newOverlayState) {
      startHideTimer();
    }
  }, [isOverlayVisible, startHideTimer, cancelHideTimer, isLandscape]);

  useEffect(() => {
    if (!isLandscape) {
      setOverlayVisible(true);
    } else if (isOverlayVisible) {
      startHideTimer();
    }
  }, [isLandscape, startHideTimer, isOverlayVisible]);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    },
    [],
  );

  return {
    isOverlayVisible,
    toggleOverlay,
  };
};
