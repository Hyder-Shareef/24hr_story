import React, { useRef, useEffect, useState } from 'react';
import './NavigationTabs.css';

const TABS = [
  { id: 'ALL', label: 'ALL' },
  { id: 'RECENT', label: 'RECENT' },
  { id: 'YOUR STORIES', label: 'YOUR STORIES' }
];

export default function NavigationTabs({ activeTab, onTabChange }) {
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector(`.nav-tab-btn[data-tab="${activeTab}"]`);
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab]);

  return (
    <nav className="editorial-nav-container" aria-label="Stories categories">
      <div className="boxed-tabs-group" ref={containerRef}>
        {/* Sliding Cobalt Active Indicator */}
        <div 
          className="cobalt-slider-indicator" 
          style={{
            transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity
          }}
          aria-hidden="true"
        />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab={tab.id}
              data-cursor="button"
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

