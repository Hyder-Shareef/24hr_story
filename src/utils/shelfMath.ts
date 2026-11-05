/**
 * Smooth step function: 3x^2 - 2x^3
 */
export function smoothstep(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * The continuous smooth step B(r) for horizontal spacing:
 * For |r| < 1: (r + sin(πr) / π) / 2
 * Otherwise: ±0.5 (sign of r * 0.5)
 */
export function B(r: number): number {
  if (Math.abs(r) < 1) {
    return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
  }
  return r > 0 ? 0.5 : -0.5;
}

/**
 * Centre x position of tape at relative index r
 */
export function F(r: number, ws: number, gap: number, d: number): number {
  return r * (ws + gap) + (d - ws + 1.6 * gap) * B(r);
}

/**
 * Openness value o in [0, 1]
 */
export function openness(r: number): number {
  return smoothstep(Math.max(0, 1 - Math.abs(r)));
}

/**
 * Wraps relative index (v - s) into [-18, 18] for 36 virtual tapes
 */
export function wrapRelativeIndex(v: number, s: number, total = 36): number {
  let diff = (v - s) % total;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

/**
 * Resolves normalized film index (0..filmCount-1) from continuous scroll s
 */
export function getActiveFilmIndex(s: number, filmCount = 12): number {
  const rounded = Math.round(s);
  return ((rounded % filmCount) + filmCount) % filmCount;
}

/**
 * Target film index when clicking decade tabs:
 */
export function getFilmIndexForDecade(tab: string): number {
  switch (tab) {
    case '1950s':
      return 0;
    case '1960s':
      return 1;
    case '1970s':
      return 5;
    case '1980s':
      return 9;
    case 'ALL':
    default:
      return 0;
  }
}

/**
 * Calculates shortest jump to target film index from current target T
 */
export function getShortestTargetScroll(currentT: number, targetFilmIndex: number, filmCount = 12): number {
  const currentNormalized = ((Math.round(currentT) % filmCount) + filmCount) % filmCount;
  let diff = targetFilmIndex - currentNormalized;
  if (diff > filmCount / 2) diff -= filmCount;
  if (diff < -filmCount / 2) diff += filmCount;
  return Math.round(currentT) + diff;
}

