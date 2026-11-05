import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StoryCard from './StoryCard.jsx';
import StoryCaption from './StoryCaption.jsx';
import PlayIndicator from './PlayIndicator.jsx';
import './StoryGallery.css';

/**
 * StoryGallery: Signature 3D Horizontal Cinematic Stage with physical depth,
 * spring-like keyboard/drag/wheel navigation, and masked captions.
 */
export default function StoryGallery({
  stories = [],
  activeIndex,
  setActiveIndex,
  onOpenStory,
  onOpenAddModal,
  activeCardRef
}) {
  const [isSettled, setIsSettled] = useState(true);
  const settleTimeoutRef = useRef(null);
  const stageRef = useRef(null);

  // Drag tracking refs
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    currentX: 0,
    startTime: 0
  });

  const totalItems = stories.length + 1; // 1 Add Card + N Stories

  // Notify when gallery settles
  const triggerSettle = useCallback(() => {
    setIsSettled(false);
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
    }
    settleTimeoutRef.current = setTimeout(() => {
      setIsSettled(true);
    }, 550);
  }, []);

  const goToIndex = useCallback((newIndex) => {
    const clamped = Math.max(0, Math.min(totalItems - 1, newIndex));
    if (clamped !== activeIndex) {
      setActiveIndex(clamped);
      triggerSettle();
    }
  }, [totalItems, activeIndex, setActiveIndex, triggerSettle]);

  const handlePrev = useCallback(() => goToIndex(activeIndex - 1), [goToIndex, activeIndex]);
  const handleNext = useCallback(() => goToIndex(activeIndex + 1), [goToIndex, activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is inside an input/modal
      if (e.target.closest('input, textarea, [role="dialog"]')) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex === 0) {
          onOpenAddModal();
        } else {
          onOpenStory(activeIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, activeIndex, onOpenAddModal, onOpenStory]);

  // Wheel navigation (horizontal delta)
  const handleWheel = useCallback((e) => {
    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 30) {
      const direction = (e.deltaX > 0 || e.deltaY > 0) ? 1 : -1;
      goToIndex(activeIndex + direction);
    }
  }, [goToIndex, activeIndex]);

  // Pointer drag gestures
  const handlePointerDown = (e) => {
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      currentX: e.clientX,
      startTime: Date.now()
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDown) return;
    dragRef.current.currentX = e.clientX;
  };

  const handlePointerUp = () => {
    if (!dragRef.current.isDown) return;
    dragRef.current.isDown = false;

    const deltaX = dragRef.current.currentX - dragRef.current.startX;
    const duration = Date.now() - dragRef.current.startTime;

    if (Math.abs(deltaX) > 40 && duration < 350) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Card click handler
  const handleCardClick = (index) => {
    if (index === activeIndex) {
      // Already active -> trigger open action
      if (index === 0) {
        onOpenAddModal();
      } else {
        onOpenStory(index - 1);
      }
    } else {
      goToIndex(index);
    }
  };

  // Calculate dynamic 3D transform for each card
  const getCardTransform = (index) => {
    const k = index - activeIndex;
    const step = window.innerWidth <= 600 ? 220 : 280;

    if (k === 0) {
      // Active Story: moves forward, tilts slightly, lifts up
      return {
        transform: 'translate3d(0, 0, 65px) rotateY(-3.5deg) rotateZ(0.8deg) scale(1.05)',
        zIndex: 30,
        opacity: 1
      };
    } else if (k < 0) {
      // Left cards
      const x = k * step - 25;
      const rotY = Math.min(25, Math.abs(k) * 10);
      return {
        transform: `translate3d(${x}px, 0, ${Math.max(-120, k * 30)}px) rotateY(${rotY}deg) rotateZ(-1deg) scale(${Math.max(0.88, 1 - Math.abs(k) * 0.04)})`,
        zIndex: 20 + k,
        opacity: Math.max(0.4, 1 - Math.abs(k) * 0.2)
      };
    } else {
      // Right cards
      const x = k * step + 25;
      const rotY = Math.max(-25, -k * 10);
      return {
        transform: `translate3d(${x}px, 0, ${Math.max(-120, -k * 30)}px) rotateY(${rotY}deg) rotateZ(1deg) scale(${Math.max(0.88, 1 - k * 0.04)})`,
        zIndex: 20 - k,
        opacity: Math.max(0.4, 1 - k * 0.2)
      };
    }
  };

  const isAddCardActive = activeIndex === 0;
  const currentStory = activeIndex > 0 ? stories[activeIndex - 1] : null;

  return (
    <section 
      className="editorial-gallery-section" 
      aria-label="Story Gallery"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Cinematic 3D Stage */}
      <div className="gallery-stage-viewport" ref={stageRef}>
        <div className="gallery-stage-track">
          {/* Item 0: Add Story Card */}
          <div
            className="gallery-item-wrapper"
            style={getCardTransform(0)}
            ref={isAddCardActive ? activeCardRef : null}
          >
            <StoryCard
              isAddCard={true}
              index={0}
              activeIndex={activeIndex}
              isActive={isAddCardActive}
              onClick={() => handleCardClick(0)}
            />
          </div>

          {/* Items 1..N: Real Stories */}
          {stories.map((story, i) => {
            const itemIndex = i + 1;
            const isCardActive = activeIndex === itemIndex;
            return (
              <div
                key={story.id}
                className="gallery-item-wrapper"
                style={getCardTransform(itemIndex)}
                ref={isCardActive ? activeCardRef : null}
              >
                <StoryCard
                  isAddCard={false}
                  story={story}
                  index={itemIndex}
                  activeIndex={activeIndex}
                  isActive={isCardActive}
                  onClick={() => handleCardClick(itemIndex)}
                />
              </div>
            );
          })}
        </div>

        {/* Floating Play / Open Indicator */}
        <PlayIndicator
          isSettled={isSettled}
          isAddCard={isAddCardActive}
          onClick={() => {
            if (isAddCardActive) {
              onOpenAddModal();
            } else {
              onOpenStory(activeIndex - 1);
            }
          }}
        />

        {/* Previous and Next Navigation Arrows */}
        {activeIndex > 0 && (
          <button
            type="button"
            className="stage-nav-arrow arrow-prev"
            onClick={handlePrev}
            data-cursor="button"
            aria-label="Previous story"
          >
            <ChevronLeft className="arrow-icon" />
          </button>
        )}

        {activeIndex < totalItems - 1 && (
          <button
            type="button"
            className="stage-nav-arrow arrow-next"
            onClick={handleNext}
            data-cursor="button"
            aria-label="Next story"
          >
            <ChevronRight className="arrow-icon" />
          </button>
        )}
      </div>

      {/* Editorial Masked Caption Section */}
      <StoryCaption
        activeIndex={activeIndex}
        story={currentStory}
        isAddCard={isAddCardActive}
      />
    </section>
  );
}

