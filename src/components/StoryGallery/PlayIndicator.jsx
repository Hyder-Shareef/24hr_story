import React from 'react';
import { Play, Plus } from 'lucide-react';
import './PlayIndicator.css';

/**
 * PlayIndicator: Floating circular cobalt-outlined control near active story
 */
export default function PlayIndicator({ isSettled, isAddCard, onClick }) {
  return (
    <button
      type="button"
      className={`floating-play-ring ${isSettled ? 'is-settled' : 'is-navigating'}`}
      onClick={onClick}
      data-cursor="button"
      aria-label={isAddCard ? 'Add Story' : 'Open Active Story'}
    >
      <div className="play-ring-border">
        {isAddCard ? (
          <Plus className="play-ring-icon" strokeWidth={2} />
        ) : (
          <Play className="play-ring-icon" fill="currentColor" strokeWidth={0} />
        )}
      </div>
      <span className="play-ring-ping" aria-hidden="true" />
    </button>
  );
}

