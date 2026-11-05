import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

export type CursorMode = 'default' | 'open' | 'add' | 'drag' | 'btn';

interface CustomCursorProps {
  mode?: CursorMode;
}

export default function CustomCursor({ mode = 'default' }: CustomCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPosRef = useRef({ x: -100, y: -100 });
  const currentPosRef = useRef({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check touch device on mount
  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    setIsTouchDevice(isTouch);
  }, []);

  // Native pointermove listener on window (zero React state updates on mouse move!)
  useEffect(() => {
    if (isTouchDevice) return;

    let hasMoved = false;

    const handlePointerMove = (e: PointerEvent) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };
      if (!hasMoved) {
        currentPosRef.current = { x: e.clientX, y: e.clientY };
        hasMoved = true;
        setIsVisible(true);
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
    };
  }, [isTouchDevice]);

  // High-performance animation loop updating translate3d via ref
  useEffect(() => {
    if (isTouchDevice) return;

    let animId: number;
    let lastTime = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (reducedMotion) {
        currentPosRef.current = targetPosRef.current;
      } else {
        // Fast, tight spring easing (factor ~26) so cursor tracks closely without perceptible lag
        const factor = 1 - Math.exp(-28 * dt);
        currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * factor;
        currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * factor;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentPosRef.current.x}px, ${currentPosRef.current.y}px, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
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
      className={`custom-cursor fixed top-0 left-0 pointer-events-none z-[9999] select-none -translate-x-1/2 -translate-y-1/2 ${stateClass}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
      aria-hidden="true"
    >
      <div className="cursor-ring flex items-center justify-center">
        {mode === 'default' && <div className="cursor-dot" />}
        {mode === 'btn' && <div className="cursor-dot scale-125 bg-[var(--cobalt)]" />}
        {mode === 'open' && (
          <span className="lbl font-bold text-[9px] tracking-widest text-white uppercase select-none">
            OPEN
          </span>
        )}
        {mode === 'add' && (
          <div className="flex items-center gap-0.5 text-white">
            <Plus size={11} strokeWidth={2.5} />
            <span className="lbl font-bold text-[8.5px] tracking-wider uppercase select-none">
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
