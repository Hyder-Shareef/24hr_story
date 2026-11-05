import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

/**
 * CustomCursor: 58px circular cursor with exponential interpolation (lerp)
 * and interactive states (default, non-active story, button, active story OPEN).
 */
export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [cursorState, setCursorState] = useState('default'); // 'default' | 'story' | 'button' | 'active-story'
  const [isVisible, setIsVisible] = useState(false);

  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const rafIdRef = useRef(null);

  useEffect(() => {
    // Only run on fine pointer / desktop devices
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const handleMouseMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Detect cursor context via data-cursor attribute
      const target = e.target;
      if (!target) return;

      const cursorTarget = target.closest('[data-cursor]');
      if (cursorTarget) {
        const mode = cursorTarget.getAttribute('data-cursor');
        setCursorState(mode);
      } else {
        // Fallback checks for interactive elements
        if (target.closest('button, a, input, select, textarea, [role="button"]')) {
          setCursorState('button');
        } else {
          setCursorState('default');
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Continuous smooth exponential interpolation loop (lerp)
    const render = () => {
      const ease = 0.22; // Responsive spring-like lerp factor
      posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isVisible]);

  // If on mobile or touch device, do not render
  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className={`editorial-cursor ${cursorState} ${isVisible ? 'visible' : ''}`}
      aria-hidden="true"
    >
      <div className="cursor-ring">
        <div className="cursor-dot" />
        <div className="cursor-label">
          <span className="label-en">OPEN</span>
        </div>
      </div>
    </div>
  );
}

