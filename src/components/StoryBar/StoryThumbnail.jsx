import React from 'react';
import './StoryThumbnail.css';

/**
 * StoryThumbnail: Circular thumbnail preview for a published story
 */
export default function StoryThumbnail({ story, index, isSelected, onClick }) {
  const authorName = story.author || 'Story';

  return (
    <button
      type="button"
      className={`story-thumbnail-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      data-cursor="story"
      aria-label={`View ${authorName}'s story`}
    >
      <div className="story-thumb-ring">
        <div className="story-thumb-inner">
          <img
            src={story.image}
            alt={story.caption || 'Story preview'}
            className="story-thumb-img"
            loading="lazy"
            draggable="false"
            onError={(e) => {
              e.target.style.opacity = '0';
              if (e.target.parentElement) {
                e.target.parentElement.style.background = '#222228';
              }
            }}
          />
        </div>
      </div>
      <span className="story-thumb-label">{authorName}</span>
    </button>
  );
}
