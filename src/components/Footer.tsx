import React from 'react';

interface FooterProps {
  storageUsageKB?: number;
}

export default function Footer({ storageUsageKB = 0 }: FooterProps) {
  return (
    <footer className="fixed bottom-[26px] max-md:bottom-[18px] left-[32px] max-md:left-[16px] right-[32px] max-md:right-[16px] z-30 flex items-center justify-between select-none pointer-events-auto">
      <span className="lbl text-[var(--ink)]">
        &copy; STORIES. YOUR MOMENTS, YOUR MEMORY.
      </span>
      <div className="flex items-center gap-2">
        {storageUsageKB > 0 && (
          <span className="lbl text-[var(--cobalt)]">
            STORAGE: {storageUsageKB}KB /
          </span>
        )}
        <span className="lbl text-[var(--ink)]">EPHEMERAL / 24H</span>
      </div>
    </footer>
  );
}

