import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { StoryBook } from '../types/films';
import { B, F, openness } from '../utils/shelfMath';
import { getSpineColorForId } from '../constants/storyConfig';
import { CursorMode } from './CustomCursor';

interface Shelf3DProps {
  stories: StoryBook[];
  isOpen: boolean;
  onActiveStoryChange: (story: StoryBook | null, direction: number) => void;
  onOpenDetail: (story: StoryBook) => void;
  onOpenAddModal: () => void;
  onCursorModeChange: (mode: CursorMode) => void;
  activeCoverRef: React.MutableRefObject<HTMLDivElement | null>;
}

export default function Shelf3D({
  stories,
  isOpen,
  onActiveStoryChange,
  onOpenDetail,
  onOpenAddModal,
  onCursorModeChange,
  activeCoverRef,
}: Shelf3DProps) {
  const containerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const bookRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coverRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Dimensions
  const dimRef = useRef({
    H: 380,
    ws: 54,
    d: 200,
    gap: 14,
  });

  // Target and physics refs
  const sRef = useRef(0);
  const tRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, t0: 0, time: 0, moved: false });
  const hoverIndexRef = useRef<number>(-1);
  const liftsRef = useRef<number[]>([]);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const tiltRef = useRef({ x: 0, y: 0 });
  const activeIndexRef = useRef(0);

  const itemCount = stories.length === 0 ? 1 : stories.length;

  // Initialize or reset lifts when stories change
  useEffect(() => {
    liftsRef.current = new Array(itemCount).fill(0);
    // Keep target bounded
    tRef.current = Math.max(0, Math.min(itemCount - 1, tRef.current));
  }, [itemCount]);

  // Measure dimensions from probe
  const updateDimensions = useCallback(() => {
    if (probeRef.current) {
      const H = probeRef.current.offsetHeight || 380;
      const ws = Math.max(46, (H * 142) / 880);
      const d = (H * 474) / 900;
      const gap = H * 0.035;

      dimRef.current = { H, ws, d, gap };

      if (stageRef.current) {
        stageRef.current.style.setProperty('--ws', `${ws.toFixed(2)}px`);
        stageRef.current.style.setProperty('--d', `${d.toFixed(2)}px`);
      }
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Main 60 FPS animation loop with direct DOM updates (zero React re-renders per frame!)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const { H, ws, d, gap } = dimRef.current;
      const W = window.innerWidth;
      const H_screen = window.innerHeight;
      const cy = H_screen / 2;
      const count = stories.length === 0 ? 1 : stories.length;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 1. Spring physics for scroll s towards target T
      const k = isDraggingRef.current ? 22 : 6.5;
      if (reducedMotion) {
        sRef.current = tRef.current;
      } else {
        const diff = tRef.current - sRef.current;
        if (Math.abs(diff) < 1e-4) {
          sRef.current = tRef.current;
        } else {
          sRef.current += diff * (1 - Math.exp(-k * dt));
        }
      }

      // Check active item index change
      const roundedIndex = Math.max(0, Math.min(count - 1, Math.round(sRef.current)));
      if (roundedIndex !== activeIndexRef.current) {
        const dir = roundedIndex > activeIndexRef.current ? 1 : -1;
        activeIndexRef.current = roundedIndex;
        if (stories.length > 0) {
          onActiveStoryChange(stories[roundedIndex] || null, dir);
        } else {
          onActiveStoryChange(null, dir);
        }
      }

      // 2. Cursor hit test & tilt
      const mx = pointerPosRef.current.x;
      const my = pointerPosRef.current.y;
      const isSettled = Math.abs(tRef.current - sRef.current) < 0.35;
      const onCenterCover =
        !isOpen &&
        isSettled &&
        Math.abs(mx - W / 2) <= 0.55 * d &&
        Math.abs(my - cy) <= 0.55 * H;

      if (isOpen) {
        onCursorModeChange('default');
      } else if (isDraggingRef.current) {
        onCursorModeChange('drag');
      } else if (onCenterCover) {
        onCursorModeChange(stories.length === 0 ? 'add' : 'open');
      } else if (hoverIndexRef.current >= 0) {
        const rel = hoverIndexRef.current - sRef.current;
        if (Math.abs(rel) < 0.45) {
          onCursorModeChange(stories.length === 0 ? 'add' : 'open');
        } else {
          onCursorModeChange('btn');
        }
      } else {
        onCursorModeChange('default');
      }

      // Tilt computation
      let targetTiltX = 0;
      let targetTiltY = 0;
      if (onCenterCover) {
        targetTiltY = ((mx - W / 2) / (0.55 * d)) * 8;
        targetTiltX = (-(my - cy) / (H / 2)) * 5;
      } else {
        targetTiltY = ((mx - W / 2) / (W || 1)) * 4;
        targetTiltX = 0;
      }

      const tiltFactor = 1 - Math.exp(-8 * dt);
      tiltRef.current.x += (targetTiltX - tiltRef.current.x) * tiltFactor;
      tiltRef.current.y += (targetTiltY - tiltRef.current.y) * tiltFactor;

      // 3. Render 3D Book Anatomy
      for (let i = 0; i < count; i++) {
        const bookEl = bookRefs.current[i];
        if (!bookEl) continue;

        // Relative index r from active scroll s
        const r = count === 1 ? 0 - sRef.current : i - sRef.current;
        const x = count === 1 ? 0 : F(r, ws, gap, d);

        // Culling
        if (Math.abs(x) > W / 2 + 1.6 * d) {
          bookEl.style.visibility = 'hidden';
          continue;
        }

        bookEl.style.visibility = 'visible';

        // Hover lift easing
        const isHovered = hoverIndexRef.current === i;
        const targetLift = isHovered ? 1 : 0;
        const liftFactor = reducedMotion ? 1 : 1 - Math.exp(-14 * dt);
        if (!liftsRef.current[i]) liftsRef.current[i] = 0;
        liftsRef.current[i] += (targetLift - liftsRef.current[i]) * liftFactor;
        const lift = liftsRef.current[i];

        // Book turning calculation
        const o = openness(r);
        const rotY = -90 * o + tiltRef.current.y * o;
        const rotX = tiltRef.current.x * o;
        const rotZ = -4.2 * o;
        const transZ = o * 0.22 * H;
        const transY = -o * 0.025 * H - lift * 0.05 * H;

        bookEl.style.transform = `translate3d(${x.toFixed(2)}px, ${transY.toFixed(2)}px, ${transZ.toFixed(2)}px) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        bookEl.style.zIndex = `${Math.round(100 - Math.abs(r) * 6)}`;

        // Shadow expansion on hover lift
        const shadowEl = bookEl.querySelector('.tape-shadow') as HTMLElement | null;
        if (shadowEl) {
          const shadowScale = 1 + lift * 0.15;
          const shadowOpacity = 0.8 + lift * 0.35;
          shadowEl.style.transform = `rotateX(90deg) scale(${shadowScale.toFixed(3)})`;
          shadowEl.style.opacity = `${shadowOpacity.toFixed(2)}`;
        }

        // Shading
        const spineFace = bookEl.querySelector('.tape-spine') as HTMLElement | null;
        const coverFace = bookEl.querySelector('.tape-cover') as HTMLElement | null;
        if (spineFace) {
          spineFace.style.setProperty('--shade', `${(o * 0.55).toFixed(3)}`);
        }
        if (coverFace) {
          coverFace.style.setProperty('--shade', `${((1 - o) * 0.45).toFixed(3)}`);
        }

        // Active cover reference for DetailModal expansion transition
        if (Math.abs(r) < 0.45 && coverFace) {
          activeCoverRef.current = coverFace;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, stories, onActiveStoryChange, onCursorModeChange, activeCoverRef]);

  // Pointer and interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isOpen) return;
    isDraggingRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      t0: tRef.current,
      time: performance.now(),
      moved: false,
    };
    velocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    pointerPosRef.current = { x: e.clientX, y: e.clientY };

    if (isOpen || !e.buttons) return;

    const count = stories.length === 0 ? 1 : stories.length;
    if (count <= 1) return;

    const dx = e.clientX - dragStartRef.current.x;
    if (Math.abs(dx) > 6) {
      isDraggingRef.current = true;
      dragStartRef.current.moved = true;
      const { ws, gap } = dimRef.current;

      const now = performance.now();
      const dt = Math.max(1, now - dragStartRef.current.time);
      velocityRef.current = -dx / dt;

      const rawT = dragStartRef.current.t0 - dx / (ws + gap);
      // Soft rubber-band resistance beyond bounds
      if (rawT < 0) {
        tRef.current = rawT * 0.35;
      } else if (rawT > count - 1) {
        tRef.current = count - 1 + (rawT - (count - 1)) * 0.35;
      } else {
        tRef.current = rawT;
      }
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      const count = stories.length === 0 ? 1 : stories.length;
      // Add natural momentum release
      let targetT = tRef.current + velocityRef.current * 12;
      targetT = Math.max(0, Math.min(count - 1, Math.round(targetT)));
      tRef.current = targetT;
      isDraggingRef.current = false;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isOpen) return;
    const count = stories.length === 0 ? 1 : stories.length;
    if (count <= 1) return;

    const { ws, gap } = dimRef.current;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const nextT = tRef.current + (delta / (ws + gap)) * 0.45;
    tRef.current = Math.max(0, Math.min(count - 1, Math.round(nextT)));
  };

  const handleBookClick = (i: number) => {
    if (dragStartRef.current.moved) return;

    if (stories.length === 0) {
      onOpenAddModal();
      return;
    }

    const rel = i - sRef.current;
    if (Math.abs(rel) < 0.45) {
      // Center book clicked -> Open story viewer!
      const story = stories[i];
      if (story) onOpenDetail(story);
    } else {
      // Adjacent book clicked -> Smoothly center it
      tRef.current = i;
    }
  };

  // Step left/right navigation exposed for Arrows & keyboard
  const step = useCallback((direction: number) => {
    const count = stories.length === 0 ? 1 : stories.length;
    if (count <= 1) return;
    tRef.current = Math.max(0, Math.min(count - 1, Math.round(tRef.current) + direction));
  }, [stories.length]);

  // Expose step function to window for Arrow controls
  useEffect(() => {
    (window as any).__shelfStep = step;
    return () => {
      delete (window as any).__shelfStep;
    };
  }, [step]);

  return (
    <>
      {/* Off-screen probe to measure computed var(--H) */}
      <div
        ref={probeRef}
        className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0"
        style={{ height: 'var(--H)' }}
        aria-hidden="true"
      />

      <section
        ref={containerRef}
        aria-label="Physical book archive"
        className="shelf-section select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div ref={stageRef} className="stage">
          {/* EMPTY STATE: Exactly ONE Add Story 3D book object */}
          {stories.length === 0 && (
            <div
              ref={(el) => {
                bookRefs.current[0] = el;
              }}
              className="tape"
              onPointerEnter={() => {
                hoverIndexRef.current = 0;
              }}
              onPointerLeave={() => {
                if (hoverIndexRef.current === 0) hoverIndexRef.current = -1;
              }}
              onClick={() => handleBookClick(0)}
              role="button"
              aria-label="Add story placeholder book"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBookClick(0);
              }}
            >
              {/* Spine Face: ADD STORY */}
              <div
                className="tape-face tape-spine cursor-pointer flex flex-col justify-between"
                style={{
                  backgroundColor: '#F4F2ED',
                  border: '1.5px dashed var(--rule)',
                  color: 'var(--ink)',
                  padding: '16px 6px',
                }}
              >
                <div className="flex items-center justify-center pt-1 text-[var(--cobalt)]">
                  <Plus size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1 flex items-center justify-center overflow-hidden my-3">
                  <span
                    className="lbl font-bold text-[10px] tracking-[0.22em] uppercase text-[var(--cobalt)]"
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                    }}
                  >
                    ADD STORY
                  </span>
                </div>
                <div className="text-center pb-1">
                  <span className="lbl text-[8px] text-[var(--muted)]">EMPTY</span>
                </div>
              </div>

              {/* Front Cover: Tactile book cloth invitation */}
              <div
                ref={(el) => {
                  coverRefs.current[0] = el;
                }}
                className="tape-face tape-cover cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: '#EDEBE6',
                  border: '2px dashed var(--cobalt)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 24px',
                  color: 'var(--ink)',
                  boxShadow: 'inset 8px 0 16px rgba(0,0,0,0.1)',
                }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-[var(--cobalt)] flex items-center justify-center text-[var(--cobalt)] mb-4">
                  <Plus size={28} strokeWidth={2.5} />
                </div>
                <h3 className="font-serif-custom text-[22px] font-normal text-center leading-tight">
                  Add Story
                </h3>
                <p className="lbl text-[9.5px] text-[var(--muted)] tracking-wider uppercase mt-1">
                  CREATE YOUR ARCHIVE
                </p>
                <span className="lbl text-[8.5px] text-[var(--cobalt)] border border-[var(--cobalt)] px-2.5 py-1 mt-4">
                  EPHEMERAL / 24H
                </span>
              </div>

              {/* Back Cover */}
              <div
                className="tape-face tape-back"
                style={{
                  backgroundColor: '#E5E2DC',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />

              {/* Page Block Fore-Edge */}
              <div className="tape-face tape-pages" />

              {/* Top Page Edge */}
              <div className="tape-top-pages" />

              {/* Ambient Floor Shadow */}
              <div className="tape-shadow" />
            </div>
          )}

          {/* POPULATED STATE: Exactly N stories = Exactly N physical 3D books */}
          {stories.map((story, i) => {
            const spinePalette = getSpineColorForId(story.id, story.dominantColor);

            return (
              <div
                key={story.id}
                ref={(el) => {
                  bookRefs.current[i] = el;
                }}
                className="tape"
                onPointerEnter={() => {
                  hoverIndexRef.current = i;
                }}
                onPointerLeave={() => {
                  if (hoverIndexRef.current === i) hoverIndexRef.current = -1;
                }}
                onClick={() => handleBookClick(i)}
                role="button"
                aria-label={`${story.title} physical book`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBookClick(i);
                }}
              >
                {/* 1. Spine Face: Caption printed vertically with embossed foil rules */}
                <div
                  className="tape-face tape-spine cursor-pointer flex flex-col justify-between"
                  style={{
                    backgroundColor: spinePalette.bg,
                    border: '1px solid rgba(255,255,255,0.22)',
                    color: spinePalette.text,
                    padding: '14px 6px',
                    boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Top Embossed Rule & Expiration */}
                  <div
                    className="flex flex-col items-center gap-[3px] pb-2"
                    style={{ borderBottom: `1px solid ${spinePalette.rule}` }}
                  >
                    <span
                      className="lbl text-[7px] tracking-widest uppercase opacity-80"
                      style={{ color: spinePalette.text }}
                    >
                      24H
                    </span>
                  </div>

                  {/* Middle: Story Caption printed vertically down the spine */}
                  <div className="flex-1 flex items-center justify-center overflow-hidden my-2">
                    <span
                      className="font-serif-custom font-normal text-[13px] tracking-wide uppercase text-center leading-tight line-clamp-2"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        maxHeight: '76%',
                        color: spinePalette.text,
                        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                      }}
                    >
                      {story.title || story.caption || 'UNTITLED MOMENT'}
                    </span>
                  </div>

                  {/* Bottom Embossed Rule & Author */}
                  <div
                    className="pt-2 flex flex-col items-center"
                    style={{ borderTop: `1px solid ${spinePalette.rule}` }}
                  >
                    <span
                      className="lbl text-[8px] tracking-widest uppercase truncate max-w-[50px] opacity-85"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        color: spinePalette.text,
                      }}
                    >
                      {story.author || 'YOU'}
                    </span>
                  </div>
                </div>

                {/* 2. Front Cover Face: Uploaded story image with paper matte & book crease */}
                <div
                  ref={(el) => {
                    coverRefs.current[i] = el;
                  }}
                  className="tape-face tape-cover cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundImage: `url(${story.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#16161a',
                    boxShadow: 'inset 8px 0 18px rgba(0,0,0,0.45)',
                  }}
                >
                  {/* Book Binding Crease Shadow along spine hinge */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[14px] pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                      borderRight: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />

                  {/* Editorial Title Plate at bottom of book cover */}
                  <div
                    className="absolute bottom-0 inset-x-0 p-4 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(15,15,18,0.92) 0%, rgba(15,15,18,0.55) 65%, transparent 100%)',
                    }}
                  >
                    <h3 className="font-serif-custom text-[19px] max-md:text-[16px] text-white font-normal leading-snug tracking-[-0.01em] line-clamp-2 drop-shadow-sm">
                      {story.title || story.caption || 'UNTITLED MOMENT'}
                    </h3>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/20">
                      <span className="lbl text-[9px] text-white/85 tracking-widest uppercase">
                        BY {story.author || 'YOU'}
                      </span>
                      <span className="lbl text-[8px] text-white/75">
                        24H EPHEMERAL
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Back Cover Face */}
                <div
                  className="tape-face tape-back"
                  style={{
                    backgroundColor: spinePalette.bg,
                    border: '1px solid rgba(0,0,0,0.2)',
                  }}
                />

                {/* 4. Page Fore-Edge */}
                <div className="tape-face tape-pages" />

                {/* 5. Top Page Edge */}
                <div className="tape-top-pages" />

                {/* 6. Realistic Ambient Floor Shadow */}
                <div className="tape-shadow" />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
