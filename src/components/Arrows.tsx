import React from 'react';

interface ArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

export default function Arrows({ onPrev, onNext }: ArrowsProps) {
  return (
    <>
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous story"
        data-cursor="btn"
        className="fixed z-30 flex items-center justify-center w-[44px] h-[44px] rounded-full text-[var(--ink)] hover:opacity-70 transition-opacity focus:outline-none pointer-events-auto left-[20px] max-md:left-[6px]"
        style={{
          top: 'calc(50% + var(--H) / 2 + 40px)',
        }}
      >
        <svg
          width="18"
          height="10"
          viewBox="0 0 18 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 1L1 5L5 9M1 5H17"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Next Button */}
      <button
        type="button"
        onClick={onNext}
        aria-label="Next story"
        data-cursor="btn"
        className="fixed z-30 flex items-center justify-center w-[44px] h-[44px] rounded-full text-[var(--ink)] hover:opacity-70 transition-opacity focus:outline-none pointer-events-auto right-[20px] max-md:right-[6px]"
        style={{
          top: 'calc(50% + var(--H) / 2 + 40px)',
        }}
      >
        <svg
          width="18"
          height="10"
          viewBox="0 0 18 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M13 1L17 5L13 9M17 5H1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}

