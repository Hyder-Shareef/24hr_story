import React from 'react';
import { Plus } from 'lucide-react';
import { ExpirationManager } from '../../utils/ExpirationManager.js';
import './StoryCard.css';

/**
 * StoryCard: Physical 3D portrait card.
 * Handles both the "Add Story" invitation card and individual photograph cards.
 */
export default React.forwardRef(function StoryCard(
  {
    isAddCard = false,
    story = null,
    isActive = false,
    index,
    activeIndex,
    onClick,
    cardRef
  },
  ref
) {
  const offset = index - activeIndex;

  // Determine cursor mode
  const cursorMode = isActive ? 'active-story' : 'story';

  if (isAddCard) {
    return (
      <div
        ref={cardRef || ref}
        className={`editorial-card add-story-card ${isActive ? 'is-active' : ''}`}
        style={{ '--card-offset': offset }}
        data-cursor={cursorMode}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label="Add new story"
      >
        <div className="card-surface">
          <div className="card-inner-frame">
            <div className="add-plus-circle">
              <Plus className="plus-icon" strokeWidth={1.5} />
            </div>
            <div className="add-card-editorial-text">
              <span className="add-label-primary">ADD STORY</span>
              <span className="add-label-symbol">+</span>
              <span className="add-label-sub">NEW CAPTURE</span>
            </div>
          </div>
          <div className="card-bottom-plate">
            <span className="plate-index">00 / NEW</span>
            <span className="plate-tag">24H EPHEMERAL</span>
          </div>
        </div>
      </div>
    );
  }

  // Regular Story Card
  const timeAgo = ExpirationManager.formatRelativeTime(story.createdAt);
  const timeRemaining = ExpirationManager.formatTimeRemaining(story.expiresAt);

  return (
    <div
      ref={cardRef || ref}
      className={`editorial-card photo-card ${isActive ? 'is-active' : ''}`}
      style={{
        '--card-offset': offset,
        '--dominant-color': story.dominantColor || '#1F3FB0'
      }}
      data-cursor={cursorMode}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Story by ${story.author}, ${timeAgo}`}
    >
      <div className="card-surface">
        {/* Physical Paper Framing and Image */}
        <div className="card-image-wrapper">
          <img
            src={story.image}
            alt={story.caption || 'User story'}
            className="card-photo-img"
            loading="lazy"
            draggable="false"
            onError={(e) => {
              e.target.style.opacity = '0';
              if (e.target.parentElement) {
                e.target.parentElement.style.background = '#222228';
              }
            }}
          />
          <div className="card-film-grain" />
          <div className="card-vignette" />
        </div>

        {/* Physical Metadata Header on the card */}
        <div className="card-meta-top">
          <span className="card-author-label">{story.author || 'YOU'}</span>
          <span className="card-time-remaining">{timeRemaining}</span>
        </div>

        {/* Physical Bottom Plate */}
        <div className="card-bottom-plate">
          <span className="plate-index">{String(index).padStart(2, '0')}</span>
          <span className="plate-tag">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
});
