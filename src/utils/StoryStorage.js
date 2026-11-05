import { STORY_CONFIG } from '../constants/storyConfig.js';

/**
 * StoryStorage Utility: Dedicated LocalStorage persistence engine with Quota guard
 * Simple, beginner-friendly ES6 functions:
 * - getStories()
 * - saveStory(story)
 * - updateStory(story)
 * - addReaction(storyId, emoji)
 * - deleteStory(id)
 * - cleanupExpiredStories()
 */
export const StoryStorage = {
  /**
   * Retrieves all stories stored in LocalStorage, validating required fields.
   * @returns {Array} Array of valid story objects
   */
  getStories() {
    try {
      const raw = localStorage.getItem(STORY_CONFIG.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(item =>
        item &&
        typeof item.id === 'string' &&
        typeof item.image === 'string' &&
        item.image.startsWith('data:image/') &&
        typeof item.createdAt === 'number' &&
        typeof item.expiresAt === 'number'
      );
    } catch (err) {
      console.warn('[StoryStorage] Failed to parse LocalStorage data:', err);
      return [];
    }
  },

  /**
   * Updates/persists the full stories array in LocalStorage.
   * @param {Array} stories
   * @returns {{ success: boolean, error?: string }}
   */
  updateStories(stories) {
    try {
      const json = JSON.stringify(stories);
      localStorage.setItem(STORY_CONFIG.STORAGE_KEY, json);
      return { success: true };
    } catch (err) {
      console.error('[StoryStorage] Failed to persist stories:', err);
      const isQuota = err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014;
      return {
        success: false,
        error: isQuota
          ? 'Storage limit reached. Please delete older stories to free up local space.'
          : 'Unable to write to browser local storage.'
      };
    }
  },

  /**
   * Saves a single new story to LocalStorage (prepends to list).
   * @param {Object} story
   * @returns {{ success: boolean, stories: Array, error?: string }}
   */
  saveStory(story) {
    if (!story || !story.id || !story.image || !story.image.startsWith('data:image/')) {
      return { success: false, stories: this.getStories(), error: 'Invalid story payload or malformed image data.' };
    }
    const current = this.getStories();
    const updated = [story, ...current];
    const res = this.updateStories(updated);
    return {
      success: res.success,
      stories: res.success ? updated : current,
      error: res.error
    };
  },

  /**
   * Updates an existing story in LocalStorage (title, author, dominantColor, etc.)
   * @param {Object} updatedData
   * @returns {{ success: boolean, stories: Array, error?: string }}
   */
  updateStory(updatedData) {
    if (!updatedData || !updatedData.id) {
      return { success: false, stories: this.getStories(), error: 'Story ID is required to update.' };
    }
    const current = this.getStories();
    let found = false;
    const updated = current.map((s) => {
      if (s.id === updatedData.id) {
        found = true;
        return {
          ...s,
          ...updatedData,
          createdAt: s.createdAt, // Preserve original timestamp
          expiresAt: s.expiresAt,
        };
      }
      return s;
    });

    if (!found) {
      return { success: false, stories: current, error: 'Story not found.' };
    }

    const res = this.updateStories(updated);
    return {
      success: res.success,
      stories: res.success ? updated : current,
      error: res.error,
    };
  },

  /**
   * Adds an emoji reaction to a story (like Instagram Stories)
   * @param {string} storyId
   * @param {string} emoji
   * @returns {Array} Updated stories list
   */
  addReaction(storyId, emoji) {
    const current = this.getStories();
    const updated = current.map((s) => {
      if (s.id === storyId) {
        const reactions = s.reactions || {};
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...s, reactions, lastReactedEmoji: emoji };
      }
      return s;
    });
    this.updateStories(updated);
    return updated;
  },

  /**
   * Deletes a single story by ID from LocalStorage.
   * @param {string} id
   * @returns {Array} Updated stories list
   */
  deleteStory(id) {
    const current = this.getStories();
    const filtered = current.filter(s => s.id !== id);
    this.updateStories(filtered);
    return filtered;
  },

  /**
   * Cleans up expired stories whose expiresAt is <= Date.now().
   * Persists cleaned list and updates last cleanup timestamp.
   * @returns {{ activeStories: Array, purgedCount: number }}
   */
  cleanupExpiredStories() {
    const all = this.getStories();
    const now = Date.now();
    const active = all.filter(s => s.expiresAt > now);
    const purgedCount = all.length - active.length;

    if (purgedCount > 0) {
      this.updateStories(active);
    }

    try {
      localStorage.setItem(STORY_CONFIG.LAST_CLEANUP_KEY, now.toString());
    } catch {
      // ignore
    }

    return { activeStories: active, purgedCount };
  },

  // Aliases for convenience
  addStory(story) {
    return this.saveStory(story);
  },

  removeStory(id) {
    return this.deleteStory(id);
  },

  saveStories(stories) {
    return this.updateStories(stories);
  },

  /**
   * Returns approximate LocalStorage usage in Kilobytes.
   * @returns {number}
   */
  getStorageUsageKB() {
    try {
      const raw = localStorage.getItem(STORY_CONFIG.STORAGE_KEY);
      if (!raw) return 0;
      return Math.round((new Blob([raw]).size) / 1024);
    } catch {
      return 0;
    }
  }
};
