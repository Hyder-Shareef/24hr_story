import React from 'react';

interface TopBarProps {
  onBack?: () => void;
  onAddStory?: () => void;
}

export default function TopBar({ onBack, onAddStory }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-[84px] max-md:h-[64px] px-8 max-md:px-4 pointer-events-auto">
      <div className="grid grid-cols-3 w-full items-center">
        {/* Left: BACK + ADD STORY */}
        <div className="flex justify-start items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="box lbl cursor-pointer"
            aria-label="Back to start"
          >
            BACK
          </button>
          {onAddStory && (
            <button
              type="button"
              onClick={onAddStory}
              className="box box-cobalt lbl cursor-pointer"
              aria-label="Add story"
            >
              + ADD STORY
            </button>
          )}
        </div>

        {/* Centre, Application Title */}
        <div className="flex flex-col items-center justify-center text-[var(--cobalt)] gap-[3px]">
          <span className="font-serif-custom italic text-[24px] max-md:text-[19px] tracking-[0.02em] leading-none select-none text-[var(--ink)]">
            Stories
          </span>
          <span className="lbl font-semibold text-[9px] max-md:text-[7.5px] tracking-[0.34em] pl-[0.34em] leading-none select-none text-[var(--cobalt)]">
            YOUR MOMENTS / 24H
          </span>
        </div>

        {/* Right: Ephemeral Metadata */}
        <div className="flex justify-end">
          <span className="lbl text-[var(--ink)] hidden md:inline-block">
            EPHEMERAL / 24H
          </span>
        </div>
      </div>
    </header>
  );
}
