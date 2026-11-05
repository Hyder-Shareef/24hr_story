import React from 'react';

export default function PaperGrain() {
  return (
    <svg
      className="paper-grain"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 40,
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
        opacity: 0.55,
      }}
    >
      <defs>
        <pattern
          id="paper-noise-pattern"
          width="220"
          height="220"
          patternUnits="userSpaceOnUse"
        >
          <filter id="paper-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0.22 0"
            />
          </filter>
          <rect width="220" height="220" filter="url(#paper-noise)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#paper-noise-pattern)" />
    </svg>
  );
}

