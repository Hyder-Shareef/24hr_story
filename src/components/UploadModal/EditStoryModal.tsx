import React, { useState, useEffect } from 'react';
import { X, Check, Palette } from 'lucide-react';
import { StoryBook } from '../../types/films';
import { BOOK_SPINE_PALETTE } from '../../constants/storyConfig';

interface EditStoryModalProps {
  story: StoryBook | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStory: StoryBook) => void;
}

export default function EditStoryModal({
  story,
  isOpen,
  onClose,
  onSave,
}: EditStoryModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedColor, setSelectedColor] = useState('#1F3FB0');

  useEffect(() => {
    if (story && isOpen) {
      setTitle(story.title || story.caption || '');
      setAuthor(story.author || 'YOU');
      setSelectedColor(story.dominantColor || '#1F3FB0');
    }
  }, [story, isOpen]);

  if (!isOpen || !story) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTitle = title.trim() || 'UNTITLED MOMENT';
    const updatedAuthor = author.trim() || 'YOU';

    onSave({
      ...story,
      title: updatedTitle,
      caption: updatedTitle,
      author: updatedAuthor,
      dominantColor: selectedColor,
    });
    onClose();
  };

  return (
    <div
      className="upload-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-story-title"
    >
      <div
        className="upload-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        data-cursor="default"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-index">EDIT ARCHIVE</span>
            <h2 id="edit-story-title" className="modal-heading">
              Edit Story Book
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            data-cursor="btn"
            aria-label="Close edit modal"
          >
            <X className="modal-close-icon" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Cover Photo Preview (Fixed thumbnail) */}
          <div className="flex items-center gap-4 p-3 bg-black/5 border border-[var(--rule)]">
            <img
              src={story.image}
              alt={story.title}
              className="w-16 h-20 object-cover rounded shadow"
            />
            <div className="flex flex-col">
              <span className="lbl text-[9px] text-[var(--muted)]">CURRENT COVER PHOTO</span>
              <span className="font-serif-custom text-[16px] text-[var(--ink)] line-clamp-1">
                {title || story.title}
              </span>
              <span className="lbl text-[8px] text-[var(--cobalt)] mt-1">24H EPHEMERAL ARCHIVE</span>
            </div>
          </div>

          {/* Story Name / Book Spine Title */}
          <div className="input-group">
            <label className="input-label" htmlFor="edit-story-title-input">
              STORY NAME (PRINTED ON BOOK SPINE & COVER)
            </label>
            <input
              id="edit-story-title-input"
              type="text"
              maxLength={40}
              placeholder="e.g. Sunset in Kyoto, Weekend Escape..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="editorial-input serif-input text-[16px]"
              autoFocus
              required
            />
          </div>

          {/* Creator / Author */}
          <div className="input-group">
            <label className="input-label" htmlFor="edit-story-author-input">
              AUTHOR / CREATOR
            </label>
            <input
              id="edit-story-author-input"
              type="text"
              maxLength={24}
              placeholder="e.g. YOU or YOUR NAME"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="editorial-input"
            />
          </div>

          {/* Book Spine Cloth Color Selection */}
          <div className="input-group">
            <div className="flex items-center gap-1.5 mb-2">
              <Palette size={13} className="text-[var(--cobalt)]" />
              <label className="input-label mb-0">PHYSICAL BOOK SPINE CLOTH COLOR</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BOOK_SPINE_PALETTE.map((palette) => {
                const isSelected = selectedColor.toLowerCase() === palette.bg.toLowerCase();

                return (
                  <button
                    key={palette.name}
                    type="button"
                    onClick={() => setSelectedColor(palette.bg)}
                    className="flex items-center gap-2 p-2 rounded border border-[var(--rule)] text-left hover:opacity-90 transition-all cursor-pointer relative"
                    style={{
                      backgroundColor: palette.bg,
                      color: palette.text,
                      boxShadow: isSelected ? '0 0 0 2px var(--cobalt)' : 'none',
                    }}
                    data-cursor="btn"
                  >
                    <span className="lbl text-[8px] leading-tight flex-1">
                      {palette.name}
                    </span>
                    {isSelected && (
                      <Check size={12} className="stroke-[3]" style={{ color: palette.text }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="modal-footer pt-3">
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={onClose}
              data-cursor="btn"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="modal-primary-btn"
              data-cursor="btn"
            >
              SAVE CHANGES
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

