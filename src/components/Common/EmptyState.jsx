import React from 'react';
import { Camera, Sparkles } from 'lucide-react';
import './EmptyState.css';

/**
 * EmptyState: Editorial invitation displayed when no stories are active.
 */
export default function EmptyState({ onAddStory }) {
  return (
    <div className="editorial-empty-state">
      <div className="empty-state-card">
        <div className="empty-icon-ring">
          <Camera className="empty-camera-icon" strokeWidth={1.5} />
        </div>
        <div className="empty-text-group">
          <span className="empty-tag">EPHEMERAL ARCHIVE / 24H</span>
          <h3 className="empty-title">No Active Stories</h3>
          <p className="empty-description">
            Photographs published here remain visible for exactly 24 hours before naturally dissolving from storage.
          </p>
        </div>
        <button
          type="button"
          className="empty-action-btn"
          onClick={onAddStory}
          data-cursor="button"
        >
          <Sparkles className="empty-btn-icon" />
          <span>CAPTURE YOUR FIRST STORY</span>
        </button>
      </div>
    </div>
  );
}

