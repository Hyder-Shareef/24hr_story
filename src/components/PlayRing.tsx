import React from 'react';
import { Plus } from 'lucide-react';
import { smoothstep } from '../utils/shelfMath';

interface PlayRingProps {
  d: number;
  H: number;
  s: number;
  T: number;
  isOpen: boolean;
  isAddCard?: boolean;
  onOpen: () => void;
}

export default function PlayRing({
  d,
  H,
  s,
  T,
  isOpen,
  isAddCard,
  onOpen,
}: PlayRingProps) {
  // Scale: smoothstep(max(0, 1 − |T − s|·3)). Shrinks to 0 while moving or detail is open.
  const diff = Math.abs(T - s);
  const rawProgress = Math.max(0, 1 - diff * 3);
  const scale = isOpen ? 0 : smoothstep(rawProgress);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={isAddCard ? 'Add new story' : 'View story'}
      data-cursor="btn"
      tabIndex={scale > 0.05 ? 0 : -1}
      className="fixed z-30 flex items-center justify-center w-[42px] h-[42px] rounded-full border border-[var(--cobalt)] text-[var(--cobalt)] pointer-events-auto transition-transform focus:outline-none cursor-pointer"
      style={{
        left: `calc(50% - ${0.5 * d + 6}px)`,
        top: `calc(50% + ${0.36 * H}px)`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        backgroundColor: 'rgba(237, 235, 230, 0.85)',
        backdropFilter: 'blur(4px)',
        visibility: scale <= 0.001 ? 'hidden' : 'visible',
      }}
    >
      {isAddCard ? (
        <Plus size={16} />
      ) : (
        /* 12px solid play triangle nudged 1.5px right */
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className="translate-x-[1.5px]"
          aria-hidden="true"
        >
          <path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
        </svg>
      )}
    </button>
  );
}
