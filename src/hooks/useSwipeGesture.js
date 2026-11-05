import { useRef, useCallback } from 'react';
import { STORY_CONFIG } from '../constants/storyConfig.js';

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onHoldStart,
  onHoldEnd,
  onTap
}) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isDraggingRef = useRef(false);
  const holdTimerRef = useRef(null);
  const hasTriggeredHoldRef = useRef(false);

  const handlePointerDown = useCallback((e) => {
    // Only handle primary button
    if (e.button !== undefined && e.button !== 0) return;

    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    isDraggingRef.current = true;
    hasTriggeredHoldRef.current = false;

    // Start hold-to-pause timer
    holdTimerRef.current = setTimeout(() => {
      hasTriggeredHoldRef.current = true;
      onHoldStart?.();
    }, STORY_CONFIG.HOLD_TO_PAUSE_DELAY_MS);
  }, [onHoldStart]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const dx = Math.abs(e.clientX - touchStartRef.current.x);
    const dy = Math.abs(e.clientY - touchStartRef.current.y);

    // If movement exceeds small threshold, cancel hold timer
    if (dx > 12 || dy > 12) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (hasTriggeredHoldRef.current) {
      onHoldEnd?.();
      return;
    }

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    const absDx = Math.abs(deltaX);
    const absDy = Math.abs(deltaY);

    // Check if it's a tap (small distance, short duration)
    if (absDx < 10 && absDy < 10 && duration < 250) {
      onTap?.(e);
      return;
    }

    // Check if it's a swipe
    if (
      absDx >= STORY_CONFIG.SWIPE_THRESHOLD_PX &&
      duration <= STORY_CONFIG.SWIPE_MAX_TIME_MS &&
      absDx > absDy * STORY_CONFIG.SWIPE_HORIZONTAL_RATIO
    ) {
      if (deltaX < 0) {
        onSwipeLeft?.(); // Swiped left -> Next
      } else {
        onSwipeRight?.(); // Swiped right -> Previous
      }
    }
  }, [onSwipeLeft, onSwipeRight, onHoldEnd, onTap]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
}

