import { useState, useEffect, useCallback, useMemo } from 'react';
import { StoryStorage } from '../utils/StoryStorage.js';
import { ExpirationManager } from '../utils/ExpirationManager.js';
import { STORY_CONFIG } from '../constants/storyConfig.js';

export function useStories() {
  const [stories, setStories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL STORIES'); // 'ALL STORIES' | 'RECENT'
  const [storageUsageKB, setStorageUsageKB] = useState(0);

  // Synchronize from LocalStorage & audit expired stories
  const refreshStories = useCallback(() => {
    const active = ExpirationManager.runAudit((cleaned) => {
      setStories(cleaned);
    });
    setStories(active);
    setStorageUsageKB(StoryStorage.getStorageUsageKB());
  }, []);

  // Initial load and lifecycle auditing subscriptions
  useEffect(() => {
    refreshStories();
    const unbind = ExpirationManager.setupLifecycleAudits(() => {
      refreshStories();
    });
    return () => unbind();
  }, [refreshStories]);

  // Add new story
  const addStory = useCallback(({ image, title, caption, author = 'YOU', dominantColor = '#1F3FB0' }) => {
    const now = Date.now();
    const storyTitle = (title || caption || 'A MOMENT IN TIME').trim();
    const newStory = {
      id: `story_${now}_${Math.random().toString(36).substring(2, 7)}`,
      image,
      title: storyTitle,
      caption: storyTitle,
      author: (author || 'YOU').trim(),
      dominantColor,
      createdAt: now,
      expiresAt: now + STORY_CONFIG.EXPIRATION_MS // Exactly 24 hours
    };

    const res = StoryStorage.addStory(newStory);
    if (res.success) {
      setStories(res.stories);
      setStorageUsageKB(StoryStorage.getStorageUsageKB());
      return { success: true, story: newStory };
    }
    return { success: false, error: res.error };
  }, []);

  // Delete story
  const deleteStory = useCallback((id) => {
    const updated = StoryStorage.removeStory(id);
    setStories(updated);
    setStorageUsageKB(StoryStorage.getStorageUsageKB());
  }, []);

  // Filtered stories according to category tab
  const filteredStories = useMemo(() => {
    const now = Date.now();
    if (activeCategory === 'RECENT') {
      // Stories uploaded in the last 6 hours
      const sixHoursAgo = now - 6 * 60 * 60 * 1000;
      return stories.filter((s) => s.createdAt >= sixHoursAgo);
    }
    return stories;
  }, [stories, activeCategory]);

  return {
    stories: filteredStories,
    allStoriesCount: stories.length,
    activeCategory,
    setActiveCategory,
    addStory,
    deleteStory,
    refreshStories,
    storageUsageKB,
  };
}
