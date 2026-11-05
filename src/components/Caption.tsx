import React, { useEffect, useRef } from 'react';
import { StoryBook } from '../types/films';
import { ExpirationManager } from '../utils/ExpirationManager';

interface CaptionProps {
  story: StoryBook | null;
  direction: number; // +1 if moving right/forward, -1 if moving left/back
}

export default function Caption({ story, direction }: CaptionProps) {
  const titleMaskRef = useRef<HTMLDivElement>(null);
  const subtitleMaskRef = useRef<HTMLDivElement>(null);
  const yearMaskRef = useRef<HTMLDivElement>(null);

  const prevStoryRef = useRef<StoryBook | null>(story);
  const isFirstRender = useRef(true);

  const getTitle = (s: StoryBook | null) => {
    if (!s) return 'ADD STORY';
    return s.title || s.caption || 'UNTITLED MOMENT';
  };

  const getSubtitle = (s: StoryBook | null) => {
    if (!s) return 'TAP TO CREATE ARCHIVE';
    const author = s.author ? s.author.toUpperCase() : 'YOU';
    return `BY ${author} / PERSONAL ARCHIVE`;
  };

  const getYearOrTime = (s: StoryBook | null) => {
    if (!s) return 'CLIENT LOCALSTORAGE — 24H EPHEMERAL';
    if (s.createdAt && s.expiresAt) {
      const timeAgo = ExpirationManager.formatRelativeTime(s.createdAt);
      const remaining = ExpirationManager.formatTimeRemaining(s.expiresAt);
      return `POSTED ${timeAgo.toUpperCase()} — EXPIRES IN ${remaining.toUpperCase()}`;
    }
    return 'POSTED JUST NOW — EXPIRES IN 24 HOURS';
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (titleMaskRef.current) titleMaskRef.current.innerHTML = `<span>${getTitle(story)}</span>`;
      if (subtitleMaskRef.current) subtitleMaskRef.current.innerHTML = `<span>${getSubtitle(story)}</span>`;
      if (yearMaskRef.current) yearMaskRef.current.innerHTML = `<span>${getYearOrTime(story)}</span>`;
      prevStoryRef.current = story;
      return;
    }

    if (prevStoryRef.current?.id === story?.id) return;

    const dir = direction >= 0 ? 1 : -1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 1 : 650;
    const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

    const swapLine = (container: HTMLDivElement | null, newText: string) => {
      if (!container) return;

      const oldSpans = Array.from(container.querySelectorAll('span:not([data-leaving])')) as HTMLElement[];
      oldSpans.forEach((oldSpan) => {
        oldSpan.setAttribute('data-leaving', 'true');
        oldSpan.style.position = 'absolute';
        oldSpan.style.left = '0';
        oldSpan.style.right = '0';
        oldSpan.style.top = '0';

        const anim = oldSpan.animate(
          [
            { transform: 'translateY(0%)' },
            { transform: `translateY(${-dir * 105}%)` },
          ],
          {
            duration,
            easing,
            fill: 'both',
          }
        );
        anim.onfinish = () => oldSpan.remove();
      });

      const newSpan = document.createElement('span');
      newSpan.textContent = newText;
      newSpan.style.display = 'block';
      newSpan.style.width = '100%';
      container.appendChild(newSpan);

      newSpan.animate(
        [
          { transform: `translateY(${dir * 105}%)` },
          { transform: 'translateY(0%)' },
        ],
        {
          duration,
          easing,
          fill: 'both',
        }
      );
    };

    swapLine(titleMaskRef.current, getTitle(story));
    swapLine(subtitleMaskRef.current, getSubtitle(story));
    swapLine(yearMaskRef.current, getYearOrTime(story));

    prevStoryRef.current = story;
  }, [story, direction]);

  return (
    <div
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center select-none"
      style={{
        top: 'calc(50% + var(--H) / 2 + 30px)',
        gap: '9px',
        width: 'min(92vw, 760px)',
      }}
    >
      {/* Title (Newsreader Serif) */}
      <div
        ref={titleMaskRef}
        className="relative overflow-hidden w-full text-center font-serif-custom text-[31px] max-md:text-[24px] text-[var(--ink)] tracking-[-0.01em] leading-[1.12]"
        style={{ minHeight: '36px' }}
      >
        <span>{getTitle(story)}</span>
      </div>

      {/* Subtitle (Cobalt Sans) */}
      <div
        ref={subtitleMaskRef}
        className="relative overflow-hidden w-full text-center lbl font-medium text-[var(--cobalt)] leading-[1.2]"
        style={{ minHeight: '16px' }}
      >
        <span>{getSubtitle(story)}</span>
      </div>

      {/* Expiration / Time Metadata */}
      <div
        ref={yearMaskRef}
        className="relative overflow-hidden w-full text-center font-sans-custom font-medium text-[11px] tracking-[0.08em] text-[var(--ink)] leading-none"
        style={{ minHeight: '14px' }}
      >
        <span>{getYearOrTime(story)}</span>
      </div>
    </div>
  );
}
