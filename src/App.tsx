import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Arrows from './components/Arrows';
import Caption from './components/Caption';
import CustomCursor, { CursorMode } from './components/CustomCursor';
import DecadeTabs from './components/DecadeTabs';
import DetailModal from './components/DetailModal';
import Footer from './components/Footer';
import PaperGrain from './components/PaperGrain';
import PlayRing from './components/PlayRing';
import Shelf3D from './components/Shelf3D';
import TopBar from './components/TopBar';
import ImageUploadModal from './components/UploadModal/ImageUploadModal';
import { StoryBook } from './types/films';
import { useStories } from './hooks/useStories';

export default function App() {
  const {
    stories,
    allStoriesCount,
    activeCategory,
    setActiveCategory,
    addStory,
    deleteStory,
    storageUsageKB,
  } = useStories();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryBook | null>(stories[0] || null);
  const [captionDirection, setCaptionDirection] = useState(1);
  const [cursorMode, setCursorMode] = useState<CursorMode>('default');
  const [btnHovered, setBtnHovered] = useState(false);

  const activeCoverRef = useRef<HTMLDivElement | null>(null);

  // Keep activeStory synchronized when stories change
  useEffect(() => {
    if (stories.length === 0) {
      setActiveStory(null);
    } else {
      setActiveStory((prev) => {
        if (!prev) return stories[0];
        const match = stories.find((s) => s.id === prev.id);
        return match || stories[0];
      });
    }
  }, [stories]);

  const activeStoryIndex = useMemo(() => {
    if (!activeStory || stories.length === 0) return 0;
    const idx = stories.findIndex((s) => s.id === activeStory.id);
    return idx >= 0 ? idx : 0;
  }, [stories, activeStory]);

  // Handle active story change from Shelf3D (only triggered on index transition, NOT every frame!)
  const handleActiveStoryChange = useCallback((story: StoryBook | null, direction: number) => {
    setActiveStory(story);
    setCaptionDirection(direction);
  }, []);

  // Arrow & Step navigation
  const handlePrev = useCallback(() => {
    if ((window as any).__shelfStep) {
      (window as any).__shelfStep(-1);
    }
  }, []);

  const handleNext = useCallback(() => {
    if ((window as any).__shelfStep) {
      (window as any).__shelfStep(1);
    }
  }, []);

  // Story Viewer Next / Prev (cycles within actual uploaded stories)
  const handleViewerNext = useCallback(() => {
    if (stories.length <= 1) return;
    const nextIdx = (activeStoryIndex + 1) % stories.length;
    setActiveStory(stories[nextIdx]);
    if ((window as any).__shelfStep) {
      (window as any).__shelfStep(1);
    }
  }, [activeStoryIndex, stories]);

  const handleViewerPrev = useCallback(() => {
    if (stories.length <= 1) return;
    const prevIdx = (activeStoryIndex - 1 + stories.length) % stories.length;
    setActiveStory(stories[prevIdx]);
    if ((window as any).__shelfStep) {
      (window as any).__shelfStep(-1);
    }
  }, [activeStoryIndex, stories]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isDetailOpen) {
          handleViewerPrev();
        } else {
          handlePrev();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isDetailOpen) {
          handleViewerNext();
        } else {
          handleNext();
        }
      } else if (e.key === 'Enter') {
        if (!isDetailOpen && !isUploadOpen) {
          e.preventDefault();
          if (stories.length === 0) {
            setIsUploadOpen(true);
          } else if (activeStory) {
            setIsDetailOpen(true);
          }
        }
      } else if (e.key === 'Escape') {
        if (isDetailOpen) {
          e.preventDefault();
          setIsDetailOpen(false);
        } else if (isUploadOpen) {
          e.preventDefault();
          setIsUploadOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleViewerPrev, handleViewerNext, isDetailOpen, isUploadOpen, stories.length, activeStory]);

  // Track button hover for custom cursor
  useEffect(() => {
    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-cursor="btn"]')) {
        setBtnHovered(true);
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-cursor="btn"]')) {
        setBtnHovered(false);
      }
    };

    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });
    return () => {
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
    };
  }, []);

  const handleStoryCreated = (storyData: any) => {
    const result = addStory(storyData);
    if (result && result.success) {
      setActiveStory(result.story);
      // Snap shelf to the newly created book
      if ((window as any).__shelfStep) {
        (window as any).__shelfStep(0);
      }
    }
    return result;
  };

  const handleDeleteStory = (storyId: string) => {
    deleteStory(storyId);
    if (stories.length <= 1) {
      setIsDetailOpen(false);
      setActiveStory(null);
    } else {
      // Advance to adjacent story
      const nextIdx = Math.max(0, activeStoryIndex - 1);
      setActiveStory(stories[nextIdx] || null);
    }
  };

  // Effective cursor mode: prioritizes detail, open/add, drag, and button states
  const effectiveCursorMode: CursorMode = isDetailOpen
    ? 'default'
    : btnHovered
    ? 'btn'
    : cursorMode;

  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') return { H: 380, d: 200 };
    const isMobile = window.innerWidth <= 767;
    const hVal = isMobile
      ? Math.min(window.innerWidth * 0.6, window.innerHeight * 0.4)
      : Math.min(window.innerHeight * 0.46, window.innerWidth * 0.31);
    return { H: hVal, d: (hVal * 474) / 900 };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 767;
      const hVal = isMobile
        ? Math.min(window.innerWidth * 0.6, window.innerHeight * 0.4)
        : Math.min(window.innerHeight * 0.46, window.innerWidth * 0.31);
      setDimensions({ H: hVal, d: (hVal * 474) / 900 });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { H, d } = dimensions;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[var(--paper)]">
      {/* 1. Paper grain texture */}
      <PaperGrain />

      {/* 2. Top bar with Add Story button */}
      <TopBar
        onBack={() => {
          if (stories.length > 0) {
            setActiveStory(stories[0]);
            if ((window as any).__shelfStep) (window as any).__shelfStep(-100);
          }
        }}
        onAddStory={() => setIsUploadOpen(true)}
      />

      {/* 3. Category tabs */}
      <DecadeTabs
        activeTab={activeCategory}
        onSelectTab={setActiveCategory}
        onAddStory={() => setIsUploadOpen(true)}
        storyCount={allStoriesCount}
      />

      {/* 4. The 3D Physical Bookshelf: Exactly 1 book per story, or 1 Add Story empty state */}
      <Shelf3D
        stories={stories}
        isOpen={isDetailOpen}
        onActiveStoryChange={handleActiveStoryChange}
        onOpenDetail={(story) => {
          setActiveStory(story);
          setIsDetailOpen(true);
        }}
        onOpenAddModal={() => setIsUploadOpen(true)}
        onCursorModeChange={setCursorMode}
        activeCoverRef={activeCoverRef}
      />

      {/* 5. Center Play Ring (appears when settled on a story book) */}
      {stories.length > 0 && (
        <PlayRing
          d={d}
          H={H}
          s={0}
          T={0}
          isOpen={isDetailOpen}
          isAddCard={false}
          onOpen={() => {
            if (activeStory) setIsDetailOpen(true);
          }}
        />
      )}

      {/* 6. Caption with story details & 24h countdown */}
      <Caption story={activeStory} direction={captionDirection} />

      {/* 7. Arrow navigation (only visible when multiple stories exist) */}
      {stories.length > 1 && <Arrows onPrev={handlePrev} onNext={handleNext} />}

      {/* 8. Footer */}
      <Footer storageUsageKB={storageUsageKB} />

      {/* 9. Detail modal sheet & story viewer with ink-reveal */}
      <DetailModal
        story={activeStory}
        totalItems={stories.length}
        currentIndex={activeStoryIndex}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onNext={handleViewerNext}
        onPrev={handleViewerPrev}
        onDeleteStory={handleDeleteStory}
        getCoverRect={() => {
          if (activeCoverRef.current) {
            return activeCoverRef.current.getBoundingClientRect();
          }
          return null;
        }}
      />

      {/* 10. Image Upload Modal */}
      <ImageUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* 11. High-Performance Custom Cursor (zero re-renders on mousemove) */}
      <CustomCursor mode={effectiveCursorMode} />
    </div>
  );
}
