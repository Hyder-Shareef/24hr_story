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
  leftPercent: number;
  rotation: number;
}

export default function EmojiReactions({
  storyId,
  reactions = {},
  onReact,
}: EmojiReactionsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeBounce, setActiveBounce] = useState<string | null>(null);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      // Trigger bounce animation on tapped button
      setActiveBounce(emoji);
      setTimeout(() => setActiveBounce(null), 300);

      // Generate 5 floating emoji particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 5; i++) {
        newParticles.push({
          id: Date.now() + Math.random(),
          emoji,
          leftPercent: 35 + Math.random() * 30, // scatter around center
          rotation: -20 + Math.random() * 40,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove particles after float animation finishes (1500ms)
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 1500);

      // Persist reaction
      onReact(emoji);
    },
    [onReact]
  );

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating Particles Stream */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="floating-emoji"
            style={{
              left: `${p.leftPercent}%`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* 4 Instagram Reaction Pills */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 select-none pointer-events-auto"
        onClick={(e) => e.stopPropagation()} // Prevent story viewer skip on tap
      >
        {EMOJIS.map((emoji) => {
          const count = reactions[emoji] || 0;
          const isBouncing = activeBounce === emoji;

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-white/20 active:scale-125 transition-transform duration-150 cursor-pointer focus:outline-none"
              style={{
                transform: isBouncing ? 'scale(1.35)' : 'scale(1)',
              }}
              title={`React with ${emoji}`}
              aria-label={`React with ${emoji}`}
              data-cursor="btn"
            >
              <span className="text-[20px] max-md:text-[18px] leading-none">{emoji}</span>
              {count > 0 && (
                <span className="text-[11px] font-bold text-white/90 font-sans-custom ml-0.5">
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
