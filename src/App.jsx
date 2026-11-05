import React, { useState, useRef } from 'react';
import Header from './components/Header/Header.jsx';
import StoryBar from './components/StoryBar/StoryBar.jsx';
import NavigationTabs from './components/NavigationTabs/NavigationTabs.jsx';
import StoryGallery from './components/StoryGallery/StoryGallery.jsx';
import EmptyState from './components/Common/EmptyState.jsx';
import ImageUploadModal from './components/UploadModal/ImageUploadModal.jsx';
import StoryViewer from './components/StoryViewer/StoryViewer.jsx';
import Footer from './components/Footer/Footer.jsx';
import CustomCursor from './components/Common/CustomCursor.jsx';
import { useStories } from './hooks/useStories.js';
import './App.css';

export default function App() {
  const {
    stories,
    activeCategory,
    setActiveCategory,
    addStory,
    deleteStory,
    storageUsageKB
  } = useStories();

  // 0 corresponds to Add Story Card; 1..N corresponds to stories[0..N-1]
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewerState, setViewerState] = useState({ isOpen: false, storyIndex: 0 });

  // Ref to the currently active card on the 3D stage for paper-sheet expansion
  const activeCardRef = useRef(null);

  const handleOpenStory = (storyIdx) => {
    setViewerState({ isOpen: true, storyIndex: storyIdx });
  };

  const handleCloseViewer = () => {
    setViewerState({ isOpen: false, storyIndex: 0 });
  };

  const handleNextStory = () => {
    setViewerState(prev => {
      if (prev.storyIndex < stories.length - 1) {
        const nextIdx = prev.storyIndex + 1;
        setGalleryIndex(nextIdx + 1); // Keep gallery synchronized
        return { ...prev, storyIndex: nextIdx };
      }
      return prev;
    });
  };

  const handlePrevStory = () => {
    setViewerState(prev => {
      if (prev.storyIndex > 0) {
        const prevIdx = prev.storyIndex - 1;
        setGalleryIndex(prevIdx + 1); // Keep gallery synchronized
        return { ...prev, storyIndex: prevIdx };
      }
      return prev;
    });
  };

  const handleStoryCreated = (storyData) => {
    const result = addStory(storyData);
    if (result.success) {
      // Focus the newly added story (index 1)
      setGalleryIndex(1);
    }
    return result;
  };

  const handleDeleteStory = (storyId) => {
    deleteStory(storyId);
    if (stories.length <= 1) {
      handleCloseViewer();
      setGalleryIndex(0);
    } else if (viewerState.storyIndex >= stories.length - 1) {
      setViewerState(prev => ({ ...prev, storyIndex: Math.max(0, prev.storyIndex - 1) }));
      setGalleryIndex(prev => Math.max(1, prev - 1));
    }
  };

  const handleBackClick = () => {
    if (viewerState.isOpen) {
      handleCloseViewer();
    } else if (isUploadOpen) {
      setIsUploadOpen(false);
    } else {
      setGalleryIndex(0); // Return to Add Story card
    }
  };

  const activeStoryThumbnailIndex = galleryIndex > 0 ? galleryIndex - 1 : null;

  return (
    <div className="cinematic-editorial-app">
      {/* Custom Lerp Cursor (Desktop fine-pointer only) */}
      <CustomCursor />

      {/* 3-Column Editorial Header */}
      <Header onBackClick={handleBackClick} />

      {/* Horizontal Story Bar with Circular Thumbnails */}
      <StoryBar
        stories={stories}
        activeStoryIndex={activeStoryThumbnailIndex}
        onAddStory={() => setIsUploadOpen(true)}
        onSelectStory={(idx) => {
          setGalleryIndex(idx + 1);
          handleOpenStory(idx);
        }}
      />

      {/* Boxed Category Navigation Tabs with Cobalt Sliding Indicator */}
      <NavigationTabs
        activeTab={activeCategory}
        onTabChange={(tab) => {
          setActiveCategory(tab);
          setGalleryIndex(0);
        }}
      />

      {/* Main 3D Cinematic Story Stage & Masked Caption */}
      <main className="main-stage-container">
        <StoryGallery
          stories={stories}
          activeIndex={galleryIndex}
          setActiveIndex={setGalleryIndex}
          onOpenStory={handleOpenStory}
          onOpenAddModal={() => setIsUploadOpen(true)}
          activeCardRef={activeCardRef}
        />

        {/* Empty State Banner if no stories are active */}
        {stories.length === 0 && (
          <EmptyState onAddStory={() => setIsUploadOpen(true)} />
        )}
      </main>

      {/* Editorial Upload Modal Dialog */}
      <ImageUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Full-Screen Story Viewer Portal */}
      <StoryViewer
        stories={stories}
        currentIndex={viewerState.storyIndex}
        isOpen={viewerState.isOpen}
        onClose={handleCloseViewer}
        onNext={handleNextStory}
        onPrev={handlePrevStory}
        onDeleteStory={handleDeleteStory}
        sourceCardRef={activeCardRef}
      />

      {/* Minimal Editorial Footer */}
      <Footer storageUsageKB={storageUsageKB} />
    </div>
  );
}
