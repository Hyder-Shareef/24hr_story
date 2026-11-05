import React, { useState, useRef } from 'react';
import { Upload, X, Camera, AlertCircle, Check, Loader2 } from 'lucide-react';
import { ImageProcessor } from '../../utils/ImageProcessor.js';
import './ImageUploadModal.css';

/**
 * ImageUploadModal: Editorial upload dialog with drag-and-drop,
 * client-side canvas resizing (1080x1920), and validation.
 * Uses story title as the book title and uploaded image as book cover.
 */
export default function ImageUploadModal({ isOpen, onClose, onStoryCreated }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    const validation = ImageProcessor.validateFile(selectedFile);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || isProcessing) return;
    if (!file) {
      setErrorMessage('Please select a photograph for your story book cover.');
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Scale to max 1080x1920 and convert to Base64 JPEG
      const { base64, dominantColor } = await ImageProcessor.processImage(file);

      const storyTitle = title.trim() || 'UNTITLED MOMENT';
      const storyAuthor = author.trim() || 'YOU';

      const result = onStoryCreated({
        image: base64,
        title: storyTitle,
        caption: storyTitle,
        author: storyAuthor,
        dominantColor
      });

      if (result && result.success) {
        handleClose();
      } else {
        setErrorMessage(result?.error || 'Failed to save story to LocalStorage.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image processing failed.');
    } finally {
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setAuthor('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="upload-modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div 
        className="upload-modal-sheet" 
        onClick={(e) => e.stopPropagation()}
        data-cursor="default"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-index">01 / NEW STORY BOOK</span>
            <h2 className="modal-heading">Create Story Book</h2>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={handleClose}
            data-cursor="button"
            aria-label="Close modal"
          >
            <X className="modal-close-icon" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Dropzone / Preview */}
          <div 
            className={`upload-dropzone ${isDragging ? 'is-dragging' : ''} ${previewUrl ? 'has-preview' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-cursor="button"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              className="hidden-file-input"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />

            {previewUrl ? (
              <div className="preview-container">
                <img 
                  src={previewUrl} 
                  alt="Story book cover preview" 
                  className="preview-image" 
                  onError={() => {
                    setErrorMessage('Selected file appears corrupted or unreadable.');
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                />
                <div className="preview-overlay-badge">
                  <Check className="badge-icon" />
                  <span>COVER PHOTO VALIDATED</span>
                </div>
              </div>
            ) : (
              <div className="dropzone-empty">
                <div className="dropzone-icon-box">
                  <Upload className="dropzone-icon" />
                </div>
                <div className="dropzone-text">
                  <span className="dropzone-title">DRAG & DROP COVER PHOTO</span>
                  <span className="dropzone-subtitle">OR CLICK TO BROWSE DEVICE</span>
                  <span className="dropzone-meta">JPEG, PNG, WEBP — MAX 1080×1920 AUTO-SCALED</span>
                </div>
              </div>
            )}
          </div>

          {/* Story Title -> Book Title */}
          <div className="input-group">
            <label className="input-label" htmlFor="story-title">
              STORY NAME (PRINTED ON BOOK SPINE & COVER)
            </label>
            <input 
              id="story-title"
              type="text" 
              maxLength={40}
              placeholder="e.g. Sunset in Kyoto, Weekend Escape..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="editorial-input serif-input text-[16px]"
              autoFocus
            />
          </div>

          {/* Creator Name */}
          <div className="input-group">
            <label className="input-label" htmlFor="story-author">AUTHOR / CREATOR</label>
            <input 
              id="story-author"
              type="text" 
              maxLength={24}
              placeholder="e.g. YOU or YOUR NAME" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="editorial-input"
            />
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="modal-error-banner" role="alert">
              <AlertCircle className="error-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="modal-secondary-btn" 
              onClick={handleClose}
              data-cursor="button"
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              className="modal-primary-btn" 
              disabled={!file || isProcessing}
              data-cursor="button"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="btn-spinner" />
                  <span>CREATING BOOK...</span>
                </>
              ) : (
                <span>PUBLISH STORY BOOK (24H)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
