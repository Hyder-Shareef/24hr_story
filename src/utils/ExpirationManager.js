import { STORY_CONFIG } from '../constants/storyConfig.js';
import { StoryStorage } from './StoryStorage.js';

/**
 * ExpirationManager: Precise 24-hour expiration calculations and multi-point lifecycle auditing
 * Meets Phase 4 requirements:
 * - expiresAt = createdAt + 24 hours
 * - Remove expired stories on app initialization
 * - Recheck on visibility change
 * - Recheck periodically while active
 * - Update React state & persist cleaned list
 */
export const ExpirationManager = {
  /**
   * Checks whether a story has exceeded its 24-hour lifespan.
   * @param {Object} story
   * @param {number} [now]
   * @returns {boolean}
   */
  isStoryExpired(story, now = Date.now()) {
    if (!story || typeof story.expiresAt !== 'number') return true;
    return now >= story.expiresAt;
  },

  /**
   * Filters an array of stories to retain only active, non-expired ones.
   * @param {Array} stories
   * @param {number} [now]
   * @returns {Array}
   */
  filterActiveStories(stories, now = Date.now()) {
    if (!Array.isArray(stories)) return [];
    return stories.filter(story => !this.isStoryExpired(story, now));
  },

  /**
   * Performs an audit on stored stories, removes any expired items from LocalStorage,
   * updates LocalStorage, and invokes the callback if any items were purged.
   * @param {Function} [onCleaned] - Callback called with (activeStories, purgedCount)
   * @returns {Array} Active stories remaining
   */
  runAudit(onCleaned) {
    const { activeStories, purgedCount } = StoryStorage.cleanupExpiredStories();
    if (purgedCount > 0 && typeof onCleaned === 'function') {
      onCleaned(activeStories, purgedCount);
    }
    return activeStories;
  },

  /**
   * Formats human-readable relative timestamp for editorial captions.
   * e.g., "POSTED 02 HOURS AGO", "JUST NOW", "POSTED 15 MIN AGO"
   * @param {number} createdAt
   * @returns {string}
   */
  formatRelativeTime(createdAt) {
    const elapsedMs = Math.max(0, Date.now() - createdAt);
    const minutes = Math.floor(elapsedMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'JUST NOW';
    if (minutes < 60) return `POSTED ${String(minutes).padStart(2, '0')} MIN AGO`;
    if (hours === 1) return 'POSTED 01 HOUR AGO';
    return `POSTED ${String(hours).padStart(2, '0')} HOURS AGO`;
  },

  /**
   * Formats human-readable remaining lifetime before 24-hour expiration.
   * e.g., "EXPIRES IN 22 HOURS", "EXPIRES IN 45 MIN"
   * @param {number} expiresAt
   * @returns {string}
   */
  formatTimeRemaining(expiresAt) {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) return 'EXPIRED';

    const hours = Math.ceil(remainingMs / (1000 * 60 * 60));
    const minutes = Math.ceil(remainingMs / (1000 * 60));

    if (hours > 1) {
      return `EXPIRES IN ${String(hours).padStart(2, '0')} HOURS`;
    }
    if (hours === 1) {
      return 'EXPIRES IN 01 HOUR';
    }
    return `EXPIRES IN ${String(minutes).padStart(2, '0')} MIN`;
  },

  /**
   * Sets up event listeners for window visibility and focus plus periodic interval.
   * Returns a cleanup unbind function to prevent memory leaks.
   * @param {Function} auditCallback
   * @returns {Function} unbind
   */
  setupLifecycleAudits(auditCallback) {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        auditCallback();
      }
    };

    window.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', handler);

    const intervalId = setInterval(() => {
      auditCallback();
    }, STORY_CONFIG.CLEANUP_INTERVAL_MS);

    return () => {
      window.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', handler);
      clearInterval(intervalId);
    };
  }
};
