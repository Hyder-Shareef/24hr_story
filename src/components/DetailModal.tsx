import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Trash2, Pencil, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { StoryBook } from '../types/films';
import { ExpirationManager } from '../utils/ExpirationManager';
import StoryProgressBar from './StoryViewer/StoryProgressBar';
import EmojiReactions from './StoryViewer/EmojiReactions';
import EditStoryModal from './UploadModal/EditStoryModal';
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
  onUpdateStory?: (updatedStory: StoryBook) => void;
  onReactToStory?: (storyId: string, emoji: string) => void;
  getCoverRect: () => DOMRect | null;
}

export default function DetailModal({
  story,
  totalItems,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onDeleteStory,
  onUpdateStory,
  onReactToStory,
  getCoverRect,
}: DetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animRef = useRef<Animation | null>(null);
  const [activeStoryState, setActiveStoryState] = useState<StoryBook | null>(story);
  const [isRendered, setIsRendered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 450);
  }, [isClosing, onClose]);

  // Playback engine for automatic 3-second story progression
  const { progress, isPaused, pause, resume } = useStoryPlayback({
    currentIndex,
    totalStories: totalItems,
    isOpen: isOpen && !showDeleteConfirm && !isEditOpen && !isClosing,
    onNext: () => onNext?.(),
    onComplete: () => handleClose(),
  });

  // Update story state whenever story prop changes
  useEffect(() => {
    if (story) {
      setActiveStoryState(story);
      setShowDeleteConfirm(false);
      setIsEditOpen(false);
    }
  }, [story]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setIsRendered(true);
      dialog.style.visibility = 'visible';
      dialog.style.opacity = '1';
      dialog.style.clipPath = 'none';
      dialog.style.transform = 'none';

      // Fast, immediate text presentation
      textLineRefs.current.forEach((line) => {
        if (line) line.style.transform = 'translateY(0%)';
      });
    } else if (isRendered) {
      dialog.style.visibility = 'hidden';
      dialog.style.opacity = '0';
      setIsRendered(false);
    }
  }, [isOpen, isRendered]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (showDeleteConfirm || isEditOpen) {
        if (e.key === 'Escape') {
          setShowDeleteConfirm(false);
          setIsEditOpen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        onNext?.();
      } else if (e.key === 'ArrowLeft') {
        onPrev?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDeleteConfirm, isEditOpen, onClose, onNext, onPrev]);

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

  const handleSaveEdit = (updated: StoryBook) => {
    setActiveStoryState(updated);
    if (onUpdateStory) {
      onUpdateStory(updated);
    }
    resume();
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
      {/* 3-second Segmented Story Progress Bar (fills up in 3s) */}
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
          onClick={handleClose}
          className="box box-cobalt lbl cursor-pointer"
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

        {/* Right Actions: Edit Story & Delete Story & Expiry */}
        <div className="flex items-center gap-2.5">
          {/* Edit Story Button */}
          <button
            type="button"
            onClick={() => {
              pause();
              setIsEditOpen(true);
            }}
            className="box lbl text-[var(--cobalt)] border-[var(--cobalt)] hover:bg-[var(--cobalt)] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5"
            aria-label="Edit story"
          >
            <Pencil size={12} />
            <span>EDIT</span>
          </button>

          {/* Delete Story Button */}
          {onDeleteStory && (
            <button
              type="button"
              onClick={() => {
                pause();
                setShowDeleteConfirm(true);
              }}
              className="box lbl text-[#d63031] border-[#d63031] hover:bg-[#d63031] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5"
              aria-label="Delete story"
            >
              <Trash2 size={12} />
              <span>DELETE</span>
            </button>
          )}

          <span className="lbl text-[var(--cobalt)] hidden md:inline-block ml-1">
            {timeRemaining.toUpperCase()}
          </span>
        </div>
      </div>

      {/* In-App Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 pointer-events-auto"
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

      {/* Edit Story Modal */}
      <EditStoryModal
        story={activeStoryState}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          resume();
        }}
        onSave={handleSaveEdit}
      />

      {/* Main Content Grid: 2 equal columns */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-2 max-md:flex max-md:flex-col gap-[4vw] max-md:gap-[20px] pt-[100px] max-md:pt-[76px] px-[7vw] max-md:px-[20px] pb-[40px] max-md:pb-[24px] items-center relative">
        {/* Mobile Poster (full story image display with zero cropping) */}
        <div className="hidden max-md:flex items-center justify-center w-full max-h-[50svh]">
          <img
            src={activeStoryState.image}
            alt={activeStoryState.title || 'Story'}
            className={`max-h-[48svh] max-w-full w-auto h-auto object-contain rounded-[4px] shadow-2xl block select-none pointer-events-auto ${
              isClosing ? 'ink-drain-anim' : 'ink-bloom-anim'
            }`}
          />
        </div>

        {/* Left Column: text details & navigation */}
        <div className="flex flex-col justify-center max-w-[520px] gap-[18px] max-md:gap-[12px]">
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
              className="font-serif-custom text-[clamp(40px,5vw,78px)] max-md:text-[34px] leading-[1.05] tracking-[-0.025em] text-[var(--ink)] font-normal"
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
              className="font-serif-custom text-[16px] max-md:text-[15px] leading-[1.5] text-[var(--ink)] max-w-[42ch]"
            >
              Preserved in your private browser archive. Available for 24 hours from creation before automatic local expiration.
            </p>
          </div>

          {/* 5. Navigation Buttons & Instagram Emoji Reactions Bar */}
          <div className="overflow-hidden pt-3 flex flex-col gap-4">
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
                  className="box box-cobalt lbl h-[42px] px-[16px] cursor-pointer select-none"
                >
                  &larr; PREVIOUS
                </button>
              )}
              {onNext && totalItems > 1 && (
                <button
                  type="button"
                  onClick={onNext}
                  className="box box-cobalt lbl h-[42px] px-[18px] cursor-pointer select-none"
                >
                  NEXT STORY &rarr;
                </button>
              )}
            </div>

            {/* Instagram Quick Reactions Bar */}
            <div className="pt-1 flex items-center gap-3">
              <span className="lbl text-[10px] text-[var(--muted)] tracking-wider">REACT:</span>
              <EmojiReactions
                storyId={activeStoryState.id}
                reactions={activeStoryState.reactions || {}}
                onReact={(emoji) => {
                  if (onReactToStory && activeStoryState) {
                    onReactToStory(activeStoryState.id, emoji);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column (Desktop): Full Story Image with Inkdrop Bloom & Reverse Drain */}
        <div className="max-md:hidden flex items-center justify-center h-full max-h-[78vh] relative w-full">
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

          <div className="relative flex items-center justify-center max-h-[78vh] max-w-full">
            <img
              src={activeStoryState.image}
              alt={activeStoryState.title || 'Story'}
              className={`max-h-[76vh] max-w-full w-auto h-auto object-contain rounded-[4px] shadow-2xl block select-none pointer-events-auto ${
                isClosing ? 'ink-drain-anim' : 'ink-bloom-anim'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
