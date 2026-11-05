import React from 'react';
import { Plus } from 'lucide-react';
import './AddStoryButton.css';

/**
 * AddStoryButton: Circular story thumbnail button with plus badge
 */
export default function AddStoryButton({ onClick }) {
  return (
    <button
      type="button"
      className="add-story-thumb-btn"
      onClick={onClick}
      data-cursor="button"
      aria-label="Add story"
    >
      <div className="thumb-circle-ring">
        <div className="thumb-avatar-placeholder">
          <span className="thumb-avatar-initials">YOU</span>
          <div className="plus-badge">
            <Plus className="badge-plus-icon" strokeWidth={2.5} />
          </div>
        </div>
      </div>
      <span className="thumb-label">Your Story</span>
    </button>
  );
}

