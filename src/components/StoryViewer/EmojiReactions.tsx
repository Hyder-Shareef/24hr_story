import React, { useState, useCallback } from 'react';

interface EmojiReactionsProps {
  storyId: string;
  reactions?: Record<string, number>;
  onReact: (emoji: string) => void;
}

const EMOJIS = ['❤️', '😂', '😮', '🔥'] as const;

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
}

export default function EmojiReactions({
  storyId,
  reactions = {},
  onReact,
}: EmojiReactionsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeBounce, setActiveBounce] = useState<string | null>(null);

  const handleEmojiClick = useCallback(
    (emoji: string, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      // Trigger bounce on tapped button
      setActiveBounce(emoji);
      setTimeout(() => setActiveBounce(null), 300);

      // Get exact button position
      const rect = e.currentTarget.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      // Generate 6 flying emoji particles directly from the button
      const newParticles: Particle[] = [];
      for (let i = 0; i < 6; i++) {
        newParticles.push({
          id: Date.now() + Math.random(),
          emoji,
          x: originX - 16,
          y: originY - 16,
          dx: -45 + Math.random() * 90,
          dy: -180 - Math.random() * 160,
          rot: -25 + Math.random() * 50,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove after animation completes
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 1200);

      // Persist reaction count
      onReact(emoji);
    },
    [onReact]
  );

  return (
    <div className="relative flex items-center">
      {/* Floating Particles Stream */}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
          {particles.map((p) => (
            <span
              key={p.id}
              className="fly-emoji-particle"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--rot': `${p.rot}deg`,
              } as React.CSSProperties}
            >
              {p.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Styled Reaction Pill matching paper/cobalt theme */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sheet)] border border-[var(--cobalt)]/30 shadow-[0_4px_16px_rgba(20,20,20,0.08)] select-none pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {EMOJIS.map((emoji) => {
          const count = reactions[emoji] || 0;
          const isBouncing = activeBounce === emoji;

          return (
            <button
              key={emoji}
              type="button"
              onClick={(e) => handleEmojiClick(emoji, e)}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[var(--cobalt)]/10 active:scale-125 transition-transform duration-150 cursor-pointer focus:outline-none"
              style={{
                transform: isBouncing ? 'scale(1.35)' : 'scale(1)',
              }}
              title={`React with ${emoji}`}
              aria-label={`React with ${emoji}`}
            >
              <span className="text-[20px] max-md:text-[18px] leading-none">{emoji}</span>
              {count > 0 && (
                <span className="text-[11px] font-bold text-[var(--cobalt)] font-sans-custom ml-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

