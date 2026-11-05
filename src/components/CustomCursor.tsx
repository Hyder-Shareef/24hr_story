import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

export type CursorMode = 'default' | 'open' | 'add' | 'drag' | 'btn';

interface CustomCursorProps {
  mode?: CursorMode;
}

export default function CustomCursor({ mode = 'default' }: CustomCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch screens on mount to disable custom cursor on mobile
  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    setIsTouchDevice(isTouch);
  }, []);

  // Zero-lag native pointer tracking
  useEffect(() => {
    if (isTouchDevice) return;

    let rafId: number | null = null;
    let latestX = -100;
    let latestY = -100;

    const updatePosition = () => {
      if (containerRef.current) {
        // Exact geometric centering (50px / 2 = 25px offset)
        containerRef.current.style.transform = `translate3d(${latestX - 25}px, ${latestY - 25}px, 0)`;
      }
      rafId = null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      setIsVisible(true);

      if (!rafId) {
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    const handlePointerLeave = () => {
      setIsVisible(false);
    };

    const handlePointerEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('mouseenter', handlePointerEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('mouseenter', handlePointerEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isTouchDevice]);

  if (isTouchDevice) return null;

  const stateClass =
    mode === 'open'
      ? 'cursor-open'
      : mode === 'add'
      ? 'cursor-add'
      : mode === 'drag'
      ? 'cursor-drag'
      : mode === 'btn'
      ? 'cursor-btn'
      : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`custom-cursor fixed top-0 left-0 pointer-events-none select-none ${stateClass}`}
      style={{
        opacity: isVisible ? 1 : 0,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <div className="cursor-ring flex items-center justify-center">
        {mode === 'default' && <div className="cursor-dot" />}
        {mode === 'btn' && <div className="cursor-dot scale-125 bg-[var(--cobalt)]" />}
        {mode === 'open' && (
          <span className="lbl font-bold text-[8.5px] tracking-widest text-white uppercase select-none">
            OPEN
          </span>
        )}
        {mode === 'add' && (
          <div className="flex items-center gap-0.5 text-white">
            <Plus size={10} strokeWidth={2.5} />
            <span className="lbl font-bold text-[8px] tracking-wider uppercase select-none">
              ADD
            </span>
          </div>
        )}
        {mode === 'drag' && (
          <span className="lbl font-semibold text-[8px] tracking-widest text-[var(--cobalt)] uppercase select-none">
            &bull; &bull; &bull;
          </span>
        )}
      </div>
    </div>
  );
}
