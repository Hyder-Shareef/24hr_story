import React from 'react';
import './Header.css';

/**
 * Header: Sophisticated 3-column editorial navigation bar
 */
export default function Header({ onBackClick }) {
  return (
    <header className="editorial-header">
      <div className="header-column left">
        <button 
          type="button" 
          className="boxed-nav-pill" 
          onClick={onBackClick}
          data-cursor="button"
          aria-label="Back"
        >
          <span className="pill-en">BACK</span>
        </button>
      </div>

      <div className="header-column centre">
        <div className="wordmark-group">
          <h1 className="editorial-wordmark">STORIES</h1>
          <span className="editorial-subtitle">YOUR MOMENTS / 24 HOURS</span>
        </div>
      </div>

      <div className="header-column right">
        <div className="compact-metadata-badge">
          <span className="badge-pulse" />
          <span className="badge-text">EPHEMERAL STORIES / 24H</span>
        </div>
      </div>
    </header>
  );
}

