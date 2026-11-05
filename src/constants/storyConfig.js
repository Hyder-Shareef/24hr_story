/**
 * Application Constants & Configuration for Cinematic Editorial Stories
 */

export const STORY_CONFIG = {
  // Dimensions & Canvas constraints
  MAX_WIDTH: 1080,
  MAX_HEIGHT: 1920,

  // Storage & Compression
  STORAGE_KEY: 'editorial_stories_v1',
  LAST_CLEANUP_KEY: 'editorial_stories_last_cleanup',
  IMAGE_MIME_TYPE: 'image/jpeg',
  IMAGE_QUALITY: 0.82,
  MAX_RAW_FILE_SIZE_MB: 15,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],

  // Expiration (Strict 24 hours in ms)
  EXPIRATION_MS: 24 * 60 * 60 * 1000, // 86,400,000 ms
  CLEANUP_INTERVAL_MS: 30 * 1000,      // Audit every 30 seconds

  // Playback & Interaction (3 seconds per story per visual specification)
  STORY_DURATION_MS: 3000,             // 3 seconds playback per story
  HOLD_TO_PAUSE_DELAY_MS: 160,         // Hold delay threshold
  EXPANSION_DURATION_MS: 1050,         // Paper sheet expansion duration
  CLOSING_DURATION_MS: 850,            // Paper sheet shrink return duration
  CAPTION_TRANSITION_MS: 650,          // Masked text transition duration
  
  // Easing curve from reference
  EASING_CURVE: 'cubic-bezier(0.76, 0, 0.18, 1)',

  // Gestures & Swipe Navigation
  SWIPE_THRESHOLD_PX: 45,
  SWIPE_MAX_TIME_MS: 320,
  SWIPE_HORIZONTAL_RATIO: 1.35
};

export const COLOR_TOKENS = {
  paper: '#EDEBE6',
  sheet: '#F4F2ED',
  ink: '#141414',
  muted: '#6D6A63',
  cobalt: '#1F3FB0',
  rule: 'rgba(20, 20, 20, 0.9)',
};

/**
 * Curated physical book spine colour palette:
 * Muted sage, warm terracotta, dusty blue, soft olive, warm sand, muted burgundy, slate blue, cream.
 */
export const BOOK_SPINE_PALETTE = [
  { name: 'Muted Sage', bg: '#5A6E5A', text: '#F4F2ED', rule: 'rgba(244, 242, 237, 0.25)' },
  { name: 'Warm Terracotta', bg: '#A65A46', text: '#F4F2ED', rule: 'rgba(244, 242, 237, 0.25)' },
  { name: 'Dusty Blue', bg: '#4A6984', text: '#F4F2ED', rule: 'rgba(244, 242, 237, 0.25)' },
  { name: 'Soft Olive', bg: '#6A6E4E', text: '#F4F2ED', rule: 'rgba(244, 242, 237, 0.25)' },
  { name: 'Warm Sand', bg: '#9E8D72', text: '#141414', rule: 'rgba(20, 20, 20, 0.2)' },
  { name: 'Muted Burgundy', bg: '#6E3845', text: '#F4F2ED', rule: 'rgba(244, 242, 237, 0.25)' },
  { name: 'Slate Blue', bg: '#3D5063', text: '#F4F2ED', rule: 'rgba(244, 242, 237, 0.25)' },
  { name: 'Editorial Cream', bg: '#E4DFD5', text: '#141414', rule: 'rgba(20, 20, 20, 0.2)' },
];

/**
 * Assigns a deterministic curated book spine colour from story ID
 */
export function getSpineColorForId(id = '', defaultBg = '') {
  if (defaultBg && BOOK_SPINE_PALETTE.some(c => c.bg.toLowerCase() === defaultBg.toLowerCase())) {
    return BOOK_SPINE_PALETTE.find(c => c.bg.toLowerCase() === defaultBg.toLowerCase());
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BOOK_SPINE_PALETTE.length;
  return BOOK_SPINE_PALETTE[index];
}
