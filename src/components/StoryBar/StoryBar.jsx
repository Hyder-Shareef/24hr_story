import React, { useRef } from 'react';
import AddStoryButton from './AddStoryButton.jsx';
import StoryThumbnail from './StoryThumbnail.jsx';
import './StoryBar.css';

/**
 * StoryBar: Horizontal scrollable story thumbnail bar
 */
export default function StoryBar({
  stories = [],
  activeStoryIndex = null,
  onAddStory,
  onSelectStory
}) {
  const scrollContainerRef = useRef(null);

  return (
    <div className="story-bar-wrapper">
      <div 
        ref={scrollContainerRef}
        className="story-bar-scroll no-scrollbar" 
        role="region" 
        aria-label="Stories strip"
      >
        {/* Add Story Action Thumbnail */}
        <AddStoryButton onClick={onAddStory} />

        {/* Uploaded Story Thumbnails */}
        {stories.map((story, idx) => {
          const isSelected = activeStoryIndex === idx;
          return (
            <StoryThumbnail
              key={story.id}
              story={story}
              index={idx}
              isSelected={isSelected}
              onClick={() => onSelectStory(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

