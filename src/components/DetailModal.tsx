import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Trash2, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { StoryBook } from '../types/films';
import { ExpirationManager } from '../utils/ExpirationManager';
import StoryProgressBar from './StoryViewer/StoryProgressBar';
import { useStoryPlayback } from '../hooks/useStoryPlayback';

interface DetailModalProps {
  story: StoryBook | null;
  totalItems: number;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDeleteStory?: (id: string) => void;
  getCoverRect: () => DOMRect | null;
}

const BLOBS = [
  { cx: 150, cy: 330, delay: 0 },
  { cx: 340, cy: 600, delay: 110 },
  { cx: 250, cy: 120, delay: 200 },
  { cx: 90, cy: 760, delay: 280 },
  { cx: 400, cy: 250, delay: 340 },
  { cx: 260, cy: 860, delay: 400 },
  { cx: 230, cy: 470, delay: 170 },
];

export default function DetailModal({
  story,
  totalItems,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onDeleteStory,
  getCoverRect,
}: DetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const animRef = useRef<Animation | null>(null);
  const [activeStoryState, setActiveStoryState] = useState<StoryBook | null>(story);
  const [isRendered, setIsRendered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Playback engine for automatic 3-second story progression
  const { progress, isPaused, pause, resume } = useStoryPlayback({
    currentIndex,
    totalStories: totalItems,
    isOpen: isOpen && !showDeleteConfirm,
    onNext: () => onNext?.(),
    onComplete: () => onClose(),
  });

  // Update story state when opening or prop changes
  useEffect(() => {
    if (isOpen && story) {
      setActiveStoryState(story);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, story]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isOpen) {
      setIsRendered(true);
      dialog.style.visibility = 'visible';

      // 1. Reset blob radii
      circleRefs.current.forEach((circle) => {
        if (circle) circle.setAttribute('r', reducedMotion ? '720' : '0');
      });

      // 2. Measure active book cover rect for origin
      const coverRect = getCoverRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const top = coverRect ? Math.max(0, coverRect.top) : vh / 2 - 200;
      const left = coverRect ? Math.max(0, coverRect.left) : vw / 2 - 100;
      const right = coverRect ? Math.max(0, vw - coverRect.right) : vw / 2 - 100;
      const bottom = coverRect ? Math.max(0, vh - coverRect.bottom) : vh / 2 - 200;

      const cx = coverRect ? coverRect.left + coverRect.width / 2 : vw / 2;
      const cy = coverRect ? coverRect.top + coverRect.height / 2 : vh / 2;

      dialog.style.transformOrigin = `${cx}px ${cy}px`;

      if (animRef.current) {
        animRef.current.cancel();
      }

      if (reducedMotion) {
        dialog.style.clipPath = 'inset(0 0 0 0 round 0)';
        dialog.style.transform = 'rotate(0deg)';
        textLineRefs.current.forEach((line) => {
          if (line) line.style.transform = 'translateY(0%)';
        });
        circleRefs.current.forEach((circle) => {
          if (circle) circle.setAttribute('r', '720');
        });
        return;
      }

      // Animate paper sheet expansion
      const keyframes = [
        {
          clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)`,
          transform: 'rotate(-4.2deg)',
        },
        {
          clipPath: 'inset(0px 0px 0px 0px round 0px)',
          transform: 'rotate(0deg)',
        },
      ];

      const anim = dialog.animate(keyframes, {
        duration: 1000,
        easing: 'cubic-bezier(0.76, 0, 0.18, 1)',
        fill: 'both',
      });
      animRef.current = anim;

      // 3. Staggered text reveal
      textLineRefs.current.forEach((line, idx) => {
        if (!line) return;
        line.animate(
          [
            { transform: 'translateY(110%)' },
            { transform: 'translateY(0%)' },
          ],
          {
            duration: 850,
            delay: 580 + idx * 70,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'both',
          }
        );
      });

      // 4. Cinematic Organic Ink Blots expansion
      let rafId: number;
      const startTime = performance.now() + 480;
      const duration = 1200;

      const animateBlobs = (now: number) => {
        const elapsed = now - startTime;
        let allDone = true;

        BLOBS.forEach((blob, i) => {
          const circle = circleRefs.current[i];
          if (!circle) return;

          const blobElapsed = elapsed - blob.delay;
          if (blobElapsed <= 0) {
            circle.setAttribute('r', '0');
            allDone = false;
          } else {
            const p = Math.min(1, blobElapsed / duration);
            const ease = 1 - Math.pow(1 - p, 3);
            const radius = ease * 720;
            circle.setAttribute('r', radius.toFixed(1));
            if (p < 1) allDone = false;
          }
        });

        if (elapsed < 2300 && !allDone) {
          rafId = requestAnimationFrame(animateBlobs);
        } else {
          circleRefs.current.forEach((circle) => {
            if (circle) circle.setAttribute('r', '720');
          });
        }
      };

      rafId = requestAnimationFrame(animateBlobs);

      return () => {
        cancelAnimationFrame(rafId);
      };
    } else if (isRendered) {
      // Reverse closing sequence back into selected book
      const coverRect = getCoverRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const top = coverRect ? Math.max(0, coverRect.top) : vh / 2 - 200;
      const left = coverRect ? Math.max(0, coverRect.left) : vw / 2 - 100;
      const right = coverRect ? Math.max(0, vw - coverRect.right) : vw / 2 - 100;
      const bottom = coverRect ? Math.max(0, vh - coverRect.bottom) : vh / 2 - 200;

      const cx = coverRect ? coverRect.left + coverRect.width / 2 : vw / 2;
      const cy = coverRect ? coverRect.top + coverRect.height / 2 : vh / 2;

      dialog.style.transformOrigin = `${cx}px ${cy}px`;

      if (animRef.current) animRef.current.cancel();

      if (reducedMotion) {
        dialog.style.visibility = 'hidden';
        setIsRendered(false);
        return;
      }

      const closeAnim = dialog.animate(
        [
          {
            clipPath: 'inset(0px 0px 0px 0px round 0px)',
            transform: 'rotate(0deg)',
          },
          {
            clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)`,
            transform: 'rotate(-4.2deg)',
          },
        ],
        {
          duration: 800,
          easing: 'cubic-bezier(0.76, 0, 0.18, 1)',
          fill: 'both',
        }
      );

      closeAnim.onfinish = () => {
        dialog.style.visibility = 'hidden';
        setIsRendered(false);
        closeAnim.cancel();
      };
    }
  }, [isOpen, getCoverRect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (showDeleteConfirm) {
        if (e.key === 'Escape') setShowDeleteConfirm(false);
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNext?.();
      } else if (e.key === 'ArrowLeft') {
        onPrev?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDeleteConfirm, onClose, onNext, onPrev]);

  if (!activeStoryState) return null;

  const timeRemaining = activeStoryState.expiresAt
    ? ExpirationManager.formatTimeRemaining(activeStoryState.expiresAt)
    : '24 HOURS';

  const timeAgo = activeStoryState.createdAt
    ? ExpirationManager.formatRelativeTime(activeStoryState.createdAt)
    : 'JUST NOW';

  const handleDelete = () => {
    if (onDeleteStory && activeStoryState) {
      onDeleteStory(activeStoryState.id);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${activeStoryState.title} story viewer`}
      className="detail-modal fixed inset-0 z-50 bg-[var(--sheet)] text-[var(--ink)] flex flex-col pointer-events-auto select-none"
      style={{
        display: isRendered || isOpen ? 'flex' : 'none',
      }}
      onPointerDown={pause}
      onPointerUp={resume}
    >
      {/* 3-second Segmented Story Progress Bar (per diagram) */}
      <StoryProgressBar
        totalStories={Math.max(1, totalItems)}
        currentIndex={currentIndex}
        progress={progress}
        isPaused={isPaused}
      />

      {/* Top Bar inside Detail */}
      <div className="fixed top-0 left-0 right-0 h-[84px] max-md:h-[64px] px-8 max-md:px-4 flex items-center justify-between z-10 pointer-events-auto">
        <button
          type="button"
          onClick={onClose}
          className="box lbl text-[var(--ink)] hover:opacity-80 transition-opacity cursor-pointer"
          data-cursor="btn"
          aria-label="Close story viewer"
        >
          CLOSE
        </button>

        {/* Center Title */}
        <div className="flex flex-col items-center justify-center text-[var(--cobalt)] gap-[4px] max-md:gap-[2px]">
          <span className="font-serif-custom font-normal text-[22px] max-md:text-[17px] tracking-[0.02em] leading-none">
            Stories
          </span>
          <span className="lbl font-semibold text-[9px] max-md:text-[7.5px] tracking-[0.3em] pl-[0.3em] leading-none">
            EPHEMERAL ARCHIVE / 24H
          </span>
        </div>

        {/* Right Actions: Delete Story button & Expiry */}
        <div className="flex items-center gap-3">
          {onDeleteStory && (
            <button
              type="button"
              onClick={() => {
                pause();
                setShowDeleteConfirm(true);
              }}
              className="box lbl text-[#d63031] border-[#d63031] hover:bg-[#d63031] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5"
              data-cursor="btn"
              aria-label="Delete story"
            >
              <Trash2 size={13} />
              <span>DELETE STORY</span>
            </button>
          )}

          <span className="lbl text-[var(--cobalt)] hidden md:inline-block">
            {timeRemaining.toUpperCase()}
          </span>
        </div>
      </div>

      {/* In-App Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-[var(--sheet)] border border-[var(--ink)] max-w-[440px] w-full p-6 flex flex-col gap-4 shadow-2xl relative"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="flex items-center gap-2 text-[#d63031]">
              <AlertTriangle size={18} />
              <h2 id="delete-dialog-title" className="lbl font-bold text-[12px] tracking-wider uppercase">
                PERMANENTLY DELETE STORY?
              </h2>
            </div>
            <p className="font-serif-custom text-[16px] text-[var(--ink)] leading-relaxed">
              Deleting &ldquo;{activeStoryState.title}&rdquo; will remove it from your local archive and browser storage immediately. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--rule)]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  resume();
                }}
                className="box lbl px-4 text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
                data-cursor="btn"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className="box lbl px-4 bg-[#d63031] text-white border-[#d63031] hover:bg-[#b02223] transition-colors cursor-pointer"
                data-cursor="btn"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: 2 equal columns */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-2 max-md:flex max-md:flex-col gap-[4vw] max-md:gap-[24px] pt-[110px] max-md:pt-[84px] px-[7vw] max-md:px-[22px] pb-[56px] max-md:pb-[40px] items-center relative">
        {/* Mobile Poster (moves first in single column on mobile) */}
        <div className="hidden max-md:flex items-center justify-center w-full h-[46svh]">
          <svg
            viewBox="0 0 474 900"
            className="h-full w-auto aspect-[474/900] shadow-2xl rounded-[3px]"
            aria-hidden="true"
          >
            <defs>
              <clipPath id="mobile-poster-clip">
                <rect width="474" height="900" rx="3" />
              </clipPath>
            </defs>
            <g clipPath="url(#mobile-poster-clip)">
              <image
                href={activeStoryState.image}
                x="0"
                y="0"
                width="474"
                height="900"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          </svg>
        </div>

        {/* Left Column: text details */}
        <div className="flex flex-col justify-center max-w-[520px] gap-[18px] max-md:gap-[14px]">
          {/* 1. Subtitle: BY YOU / PERSONAL ARCHIVE */}
          <div className="overflow-hidden">
            <div
              ref={(el) => {
                textLineRefs.current[0] = el;
              }}
              className="lbl text-[var(--cobalt)] font-medium text-[12px] leading-tight"
            >
              BY {activeStoryState.author ? activeStoryState.author.toUpperCase() : 'YOU'} / PERSONAL ARCHIVE
            </div>
          </div>

          {/* 2. Title: Story Caption */}
          <div className="overflow-hidden">
            <h1
              ref={(el) => {
                textLineRefs.current[1] = el;
              }}
              className="font-serif-custom text-[clamp(44px,5.4vw,84px)] max-md:text-[38px] leading-[1] tracking-[-0.025em] text-[var(--ink)] font-normal"
            >
              {activeStoryState.title || activeStoryState.caption || 'UNTITLED MOMENT'}
            </h1>
          </div>

          {/* 3. Meta line */}
          <div className="overflow-hidden">
            <div
              ref={(el) => {
                textLineRefs.current[2] = el;
              }}
              className="lbl text-[var(--muted)] font-medium text-[11px] leading-none"
            >
              POSTED {timeAgo.toUpperCase()} — EXPIRES IN {timeRemaining.toUpperCase()}
            </div>
          </div>

          {/* 4. Description */}
          <div className="overflow-hidden">
            <p
              ref={(el) => {
                textLineRefs.current[3] = el;
              }}
              className="font-serif-custom text-[17px] max-md:text-[16px] leading-[1.5] text-[var(--ink)] max-w-[42ch]"
            >
              Preserved in your private browser archive. Available for 24 hours from creation before automatic local expiration.
            </p>
          </div>

          {/* 5. Navigation Buttons */}
          <div className="overflow-hidden pt-4 flex items-center gap-3">
            <div
              ref={(el) => {
                textLineRefs.current[4] = el;
              }}
              className="flex items-center gap-3"
            >
              {onPrev && totalItems > 1 && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="box lbl h-[44px] px-[18px] border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition-colors cursor-pointer select-none"
                  data-cursor="btn"
                >
                  &larr; PREVIOUS
                </button>
              )}
              {onNext && totalItems > 1 && (
                <button
                  type="button"
                  onClick={onNext}
                  className="box lbl h-[44px] px-[20px] border-[var(--cobalt)] text-[var(--cobalt)] hover:bg-[var(--cobalt)] hover:text-white transition-colors cursor-pointer select-none"
                  data-cursor="btn"
                >
                  NEXT STORY &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Desktop): Full Story Image with Ink Blot Reveal */}
        <div className="max-md:hidden flex items-center justify-center h-full max-h-[78vh] relative">
          {/* Click zones for Previous (left 35%) and Next (right 65%) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onPrev?.();
            }}
            className="absolute left-0 top-0 bottom-0 w-[35%] z-20 cursor-pointer"
            title="Previous Story"
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            className="absolute right-0 top-0 bottom-0 w-[65%] z-20 cursor-pointer"
            title="Next Story"
          />

          <svg
            viewBox="0 0 474 900"
            className="h-[min(100%,78vh)] w-auto aspect-[474/900] shadow-2xl rounded-[3px]"
            aria-hidden="true"
          >
            <defs>
              <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.011"
                  numOctaves="3"
                  seed="7"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="120"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>

              <mask
                id="detail-ink-mask"
                maskUnits="userSpaceOnUse"
                x="-200"
                y="-200"
                width="874"
                height="1300"
              >
                <g filter="url(#ink-bleed)">
                  {BLOBS.map((blob, idx) => (
                    <circle
                      key={idx}
                      ref={(el) => {
                        circleRefs.current[idx] = el;
                      }}
                      cx={blob.cx}
                      cy={blob.cy}
                      r="0"
                      fill="#ffffff"
                    />
                  ))}
                </g>
              </mask>

              <clipPath id="desktop-poster-clip">
                <rect width="474" height="900" rx="3" />
              </clipPath>
            </defs>

            <g clipPath="url(#desktop-poster-clip)">
              <image
                href={activeStoryState.image}
                x="0"
                y="0"
                width="474"
                height="900"
                preserveAspectRatio="xMidYMid slice"
                mask="url(#detail-ink-mask)"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
