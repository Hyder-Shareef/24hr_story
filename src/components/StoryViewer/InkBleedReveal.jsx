import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import './InkBleedReveal.css';

/**
 * InkBleedReveal: Signature ink-blot reveal using SVG mask with feDisplacementMap
 * and expanding organic circles. Discloses photograph with printed-paper bleed edges.
 * Includes defensive fallback for corrupted or unreadable images.
 */
export default function InkBleedReveal({ imageSrc, altText, triggerKey }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
    setHasError(false);
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [triggerKey, imageSrc]);

  const maskId = `ink-mask-${triggerKey}`;

  return (
    <div className="ink-bleed-stage">
      {/* Dynamic SVG Mask Definition for this specific story */}
      <svg className="ink-bleed-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            {/* White reveals, black hides */}
            <rect x="0" y="0" width="100" height="100" fill="#000000" />
            
            {/* Multiple organic blot circles with feDisplacementMap applied */}
            <g filter="url(#ink-bleed-filter)">
              <circle
                cx="50"
                cy="50"
                className={`ink-circle blot-center ${isRevealed ? 'bloom' : ''}`}
                fill="#ffffff"
              />
              <circle
                cx="35"
                cy="40"
                className={`ink-circle blot-sub-1 ${isRevealed ? 'bloom' : ''}`}
                fill="#ffffff"
              />
              <circle
                cx="65"
                cy="55"
                className={`ink-circle blot-sub-2 ${isRevealed ? 'bloom' : ''}`}
                fill="#ffffff"
              />
              <circle
                cx="45"
                cy="70"
                className={`ink-circle blot-sub-3 ${isRevealed ? 'bloom' : ''}`}
                fill="#ffffff"
              />
              <circle
                cx="58"
                cy="30"
                className={`ink-circle blot-sub-4 ${isRevealed ? 'bloom' : ''}`}
                fill="#ffffff"
              />
            </g>
          </mask>
        </defs>
      </svg>

      {/* Main Photograph or Defensive Fallback */}
      <div 
        className="ink-masked-image-container"
        style={{
          WebkitMaskImage: `url(#${maskId})`,
          maskImage: `url(#${maskId})`
        }}
      >
        {hasError ? (
          <div className="photo-render-error">
            <AlertCircle className="error-icon-lg" />
            <span className="error-title">UNABLE TO DISPLAY PHOTOGRAPH</span>
            <span className="error-sub">IMAGE DATA MAY BE CORRUPTED OR TRUNCATED</span>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={altText}
            className="story-main-photo"
            draggable="false"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  );
}
