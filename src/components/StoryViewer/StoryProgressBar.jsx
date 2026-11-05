import React from 'react';
import './StoryProgressBar.css';

/**
 * StoryProgressBar: Segmented editorial progress bar for stories playback.
 */
export default function StoryProgressBar({ totalStories, currentIndex, progress, isPaused }) {
  const segments = Array.from({ length: totalStories });

  return (
    <div className={`story-progress-container ${isPaused ? 'is-paused' : ''}`} aria-label="Story progress">
      {segments.map((_, idx) => {
        let width = '0%';
        let isCurrent = false;

        if (idx < currentIndex) {
          width = '100%';
        } else if (idx === currentIndex) {
          width = `${progress}%`;
          isCurrent = true;
        }

        return (
          <div key={idx} className="progress-segment-track">
            <div
              className={`progress-segment-fill ${isCurrent ? 'current' : ''}`}
              style={{ width }}
            />
          </div>
        );
      })}
    </div>
  );
}

