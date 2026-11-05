import React, { useEffect, useRef, useState } from 'react';

interface DecadeTabsProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onAddStory?: () => void;
  storyCount?: number;
}

const TABS = ['ALL STORIES', 'RECENT', '+ ADD STORY'] as const;

export default function DecadeTabs({
  activeTab,
  onSelectTab,
  onAddStory,
  storyCount = 0,
}: DecadeTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
    opacity: number;
  }>({
    width: 0,
    left: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = btnRefs.current[activeTab];
      if (activeBtn && containerRef.current) {
        setIndicatorStyle({
          width: activeBtn.offsetWidth,
          left: activeBtn.offsetLeft,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      cancelAnimationFrame(rafId);
    };
  }, [activeTab]);

  return (
    <nav
      aria-label="Story categories"
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-auto top-[calc(50%-var(--H)/2-86px)] max-md:top-[calc(50%-var(--H)/2-70px)]"
    >
      <div
        ref={containerRef}
        className="relative flex items-center select-none"
      >
        {/* Cobalt sliding indicator behind buttons */}
        <div
          className="absolute top-0 bottom-0 bg-[var(--cobalt)] pointer-events-none"
          style={{
            height: '100%',
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
            opacity: indicatorStyle.opacity,
            transition: 'width 0.6s var(--ease), transform 0.6s var(--ease), opacity 0.3s ease',
          }}
        />

        {TABS.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              ref={(el) => {
                btnRefs.current[tab] = el;
              }}
              onClick={() => {
                if (tab === '+ ADD STORY') {
                  if (onAddStory) onAddStory();
                  else onSelectTab(tab);
                } else {
                  onSelectTab(tab);
                }
              }}
              className="lbl relative z-10 box h-[23px] px-[11px] max-md:px-[7px] max-md:text-[9px] -ml-[1px] first:ml-0 border-[var(--rule)] cursor-pointer whitespace-nowrap focus:outline-none"
              style={{
                color: isActive ? '#FFFFFF' : 'var(--ink)',
                transition: 'color 0.45s ease',
              }}
              data-cursor="btn"
              aria-pressed={isActive}
            >
              {tab === 'ALL STORIES' && storyCount > 0 ? `ALL STORIES (${storyCount})` : tab}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
