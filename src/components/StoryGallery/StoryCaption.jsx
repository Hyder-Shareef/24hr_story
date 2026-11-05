import React, { useEffect, useState } from 'react';
import { ExpirationManager } from '../../utils/ExpirationManager.js';
import './StoryCaption.css';

/**
 * StoryCaption: Editorial caption section with masked vertical sliding transitions.
 */
export default function StoryCaption({ activeIndex, story, isAddCard }) {
  const [displayData, setDisplayData] = useState(() => getCaptionData(activeIndex, story, isAddCard));
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setDisplayData(getCaptionData(activeIndex, story, isAddCard));
    setAnimKey(prev => prev + 1);
  }, [activeIndex, story, isAddCard]);

  function getCaptionData(idx, currentStory, addCard) {
    if (addCard || !currentStory) {
      return {
        creator: 'NEW ARCHIVE',
        title: 'ADD A MOMENT TO YOUR STORY',
        metadata: 'SELECT IMAGE / EXPIRES IN 24 HOURS'
      };
    }

    const timeAgo = ExpirationManager.formatRelativeTime(currentStory.createdAt);
    const timeRemaining = ExpirationManager.formatTimeRemaining(currentStory.expiresAt);

    return {
      creator: currentStory.author ? `${currentStory.author.toUpperCase()}'S STORY` : 'YOUR STORY',
      title: currentStory.caption || 'A MOMENT WORTH KEEPING',
      metadata: `${timeAgo} / ${timeRemaining}`
    };
  }

  return (
    <div className="editorial-caption-section" aria-live="polite">
      {/* Masked Creator Line */}
      <div className="caption-mask creator-mask">
        <div key={`creator-${animKey}`} className="sliding-line creator-text">
          {displayData.creator}
        </div>
      </div>

      {/* Masked Main Title / Caption (Newsreader Serif) */}
      <div className="caption-mask title-mask">
        <div key={`title-${animKey}`} className="sliding-line title-text">
          {displayData.title}
        </div>
      </div>

      {/* Masked Metadata Line (Inter Tight / Cobalt) */}
      <div className="caption-mask metadata-mask">
        <div key={`meta-${animKey}`} className="sliding-line metadata-text">
          <span className="metadata-cobalt">{displayData.metadata}</span>
        </div>
      </div>
    </div>
  );
}

