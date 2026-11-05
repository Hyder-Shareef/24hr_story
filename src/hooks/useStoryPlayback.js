import { useState, useEffect, useRef, useCallback } from 'react';
import { STORY_CONFIG } from '../constants/storyConfig.js';

export function useStoryPlayback({
  currentIndex,
  totalStories,
  isOpen,
  onNext,
  onComplete
}) {
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isPaused, setIsPaused] = useState(false);

  const startTimeRef = useRef(null);
  const accumulatedMsRef = useRef(0);
  const animFrameRef = useRef(null);
  const lastIndexRef = useRef(currentIndex);

  // Reset progress when index or open state changes
  useEffect(() => {
    setProgress(0);
    accumulatedMsRef.current = 0;
    startTimeRef.current = Date.now();
    lastIndexRef.current = currentIndex;
  }, [currentIndex, isOpen]);

  // Handle tab visibility change (Edge case: Switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        startTimeRef.current = null;
      } else {
        startTimeRef.current = null;
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Main playback loop using timestamp deltas and requestAnimationFrame
  useEffect(() => {
    if (!isOpen || totalStories === 0) return;

    let running = true;

    const tick = () => {
      if (!running) return;

      if (!isPaused && !document.hidden) {
        const now = Date.now();
        if (!startTimeRef.current) {
          startTimeRef.current = now;
        }

        const delta = now - startTimeRef.current;
        startTimeRef.current = now;
        accumulatedMsRef.current += delta;

        const currentPct = Math.min(100, (accumulatedMsRef.current / STORY_CONFIG.STORY_DURATION_MS) * 100);
        setProgress(currentPct);

        if (accumulatedMsRef.current >= STORY_CONFIG.STORY_DURATION_MS) {
          accumulatedMsRef.current = 0;
          setProgress(100);
          if (currentIndex < totalStories - 1) {
            onNext?.();
          } else {
            onComplete?.();
          }
          return;
        }
      } else {
        // Paused or Tab Hidden: reset startTime so delta doesn't jump upon unpausing
        startTimeRef.current = null;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, currentIndex, totalStories, isPaused, onNext, onComplete]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    startTimeRef.current = null;
    setIsPaused(false);
  }, []);

  return {
    progress,
    isPaused,
    setIsPaused,
    pause,
    resume
  };
}
