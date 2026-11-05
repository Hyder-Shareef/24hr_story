import React from 'react';
import './Footer.css';

/**
 * Footer: Minimal editorial footer
 */
export default function Footer({ storageUsageKB = 0 }) {
  return (
    <footer className="editorial-footer">
      <div className="footer-left">
        <span className="footer-copyright">
          © STORIES. YOUR MOMENTS, YOUR MEMORY.
        </span>
      </div>

      <div className="footer-right">
        {storageUsageKB > 0 && (
          <span className="footer-storage-badge">
            STORAGE: {storageUsageKB}KB
          </span>
        )}
        <span className="footer-tag">STORIES / 24H</span>
      </div>
    </footer>
  );
}

