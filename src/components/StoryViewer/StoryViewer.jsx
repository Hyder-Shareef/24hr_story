import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import StoryProgressBar from './StoryProgressBar.jsx';
import InkBleedReveal from './InkBleedReveal.jsx';
import { useStoryPlayback } from '../../hooks/useStoryPlayback.js';
import { useSwipeGesture } from '../../hooks/useSwipeGesture.js';
import { ExpirationManager } from '../../utils/ExpirationManager.js';
import { STORY_CONFIG } from '../../constants/storyConfig.js';
import './StoryViewer.css';

/**
 * StoryViewer: Cinematic Full-Screen Story Experience with
 * Web Animations API paper-sheet expansion, ink-bleed image reveal,
 * 5-second progress ticker, hold-to-pause, story deletion, and smooth closing return.
 */
export default function StoryViewer({
  stories = [],
  currentIndex = 0,
  isOpen = false,
  onClose,
  onNext,
  onPrev,
  onDeleteStory,
  sourceCardRef
}) {
  const sheetRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  // Safely clamp index
  const safeIndex = Math.max(0, Math.min(Math.max(0, stories.length - 1), currentIndex));
  const currentStory = stories[safeIndex] || null;
  const totalStories = stories.length;

  // Story Playback ticker hook
  const { progress, isPaused, pause, resume } = useStoryPlayback({
    currentIndex: safeIndex,
    totalStories,
    isOpen: isOpen && !isClosing && !!currentStory,
    onNext,
    onComplete: () => handleClose()
  });

  // Swipe & Hold-to-pause gestures
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useSwipeGesture({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    onHoldStart: pause,
    onHoldEnd: resume,
    onTap: (e) => {
      // Ignore if clicking an action button
      if (e.target.closest('button, [role="button"]')) return;

      // Tap left 30% goes to previous; tap right 70% goes to next
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width * 0.3) {
        onPrev?.();
      } else {
        onNext?.();
      }
    }
  });

  // Smooth Closing Transition returning back to active card
  const handleClose = useCallback(() => {
    if (isClosing) return;

    if (!sheetRef.current) {
      setHasOpened(false);
      onClose();
      return;
    }

    setIsClosing(true);
    const sheetEl = sheetRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let targetRect = { left: vw / 2 - 125, top: vh / 2 - 190, width: 250, height: 380 };
    if (sourceCardRef?.current) {
      const measured = sourceCardRef.current.getBoundingClientRect();
      if (measured.width > 0 && measured.height > 0) {
        targetRect = measured;
      }
    }

    const scaleX = targetRect.width / vw;
    const scaleY = targetRect.height / vh;
    const translateX = targetRect.left;
    const translateY = targetRect.top;

    const animation = sheetEl.animate(
      [
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1) rotate(0deg)',
          borderRadius: '0px'
        },
        {
          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY}) rotate(-3.5deg)`,
          borderRadius: '2px'
        }
      ],
      {
        duration: STORY_CONFIG.CLOSING_DURATION_MS,
        easing: 'cubic-bezier(0.76, 0, 0.18, 1)',
        fill: 'forwards'
      }
    );

    animation.onfinish = () => {
      setHasOpened(false);
      setIsClosing(false);
      onClose();
    };
  }, [isClosing, sourceCardRef, onClose]);

  // Edge Case: If stories list becomes empty while viewer is open, close automatically
  useEffect(() => {
    if (isOpen && totalStories === 0) {
      handleClose();
    }
  }, [isOpen, totalStories, handleClose]);

  // Web Animations API: Paper-Sheet Opening Transition
  useEffect(() => {
    if (isOpen && !hasOpened && sheetRef.current) {
      setHasOpened(true);
      setIsClosing(false);

      const sheetEl = sheetRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Measure source card bounding box
      let sourceRect = { left: vw / 2 - 125, top: vh / 2 - 190, width: 250, height: 380 };
      if (sourceCardRef?.current) {
        const measured = sourceCardRef.current.getBoundingClientRect();
        if (measured.width > 0 && measured.height > 0) {
          sourceRect = measured;
        }
      }

      const cardCenterX = sourceRect.left + sourceRect.width / 2;
      const cardCenterY = sourceRect.top + sourceRect.height / 2;
      const originX = (cardCenterX / vw) * 100;
      const originY = (cardCenterY / vh) * 100;

      const scaleX = sourceRect.width / vw;
      const scaleY = sourceRect.height / vh;
      const translateX = sourceRect.left;
      const translateY = sourceRect.top;

      sheetEl.style.transformOrigin = `${originX}% ${originY}%`;

      const animation = sheetEl.animate(
        [
          {
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY}) rotate(-3.5deg)`,
            borderRadius: '2px',
            boxShadow: '0 32px 64px rgba(20, 20, 20, 0.4)'
          },
          {
            transform: 'translate3d(0, 0, 0) scale(1, 1) rotate(0deg)',
            borderRadius: '0px',
            boxShadow: 'none'
          }
        ],
        {
          duration: STORY_CONFIG.EXPANSION_DURATION_MS,
          easing: 'cubic-bezier(0.76, 0, 0.18, 1)',
          fill: 'forwards'
        }
      );

      animation.onfinish = () => {
        sheetEl.style.transform = 'none';
      };
    }
  }, [isOpen, hasOpened, sourceCardRef]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext?.();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, onNext, onPrev]);

  if (!isOpen || !currentStory) return null;

  const timeAgo = ExpirationManager.formatRelativeTime(currentStory.createdAt);
  const timeRemaining = ExpirationManager.formatTimeRemaining(currentStory.expiresAt);

  return (
    <div 
      className="editorial-viewer-portal" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Story Viewer"
    >
      {/* Expanding Paper Sheet Container */}
      <div 
        ref={sheetRef} 
        className="viewer-paper-sheet"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Top Segmented Progress Bar */}
        <StoryProgressBar
          totalStories={totalStories}
          currentIndex={safeIndex}
          progress={progress}
          isPaused={isPaused}
        />

        {/* Top Header Bar */}
        <div className="viewer-top-bar">
          <div className="viewer-creator-meta">
            <span className="viewer-author-name">{currentStory.author || 'YOU'}</span>
            <span className="viewer-divider">/</span>
            <span className="viewer-time-ago">{timeAgo}</span>
          </div>

          <div className="viewer-actions-group">
            {/* Delete Story Button */}
            <button
              type="button"
              className="viewer-action-btn viewer-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this story?')) {
                  onDeleteStory?.(currentStory.id);
                }
              }}
              data-cursor="button"
              aria-label="Delete story"
              title="Delete Story"
            >
              <Trash2 className="viewer-action-icon" />
            </button>

            {/* Close Viewer Button */}
            <button
              type="button"
              className="viewer-action-btn viewer-close-button"
              onClick={handleClose}
              data-cursor="button"
              aria-label="Close story"
              title="Close Viewer"
            >
              <X className="viewer-action-icon" />
            </button>
          </div>
        </div>

        {/* Central Photographic Stage with Ink Bleed Reveal */}
        <div className="viewer-photo-viewport">
          <InkBleedReveal
            key={currentStory.id}
            triggerKey={currentStory.id}
            imageSrc={currentStory.image}
            altText={currentStory.caption || 'User story photograph'}
          />

          {/* Interactive Tap Zones */}
          <div className="tap-zone tap-zone-left" aria-hidden="true" title="Previous Story" />
          <div className="tap-zone tap-zone-right" aria-hidden="true" title="Next Story" />
        </div>

        {/* Bottom Editorial Caption & Expiration Metadata */}
        <div className="viewer-bottom-bar">
          <p className="viewer-caption-text">{currentStory.caption}</p>
          <div className="viewer-expiration-pill">
            <span className="pill-dot" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
