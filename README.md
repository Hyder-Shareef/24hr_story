# Stories — The Tactile Book Archive

A client-side editorial Stories application inspired by Instagram and WhatsApp Stories, transformed into an interactive 3D physical book archive. Built with React, Vite, and modern JavaScript (ES6).

---

## Key Features

1. **Core Interaction Model: 1 Story = 1 Physical 3D Book**
   - **Empty State**: When no stories exist, exactly **one** elegant 3D book placeholder appears (`+ ADD STORY`). No empty dummy books or repeated placeholders.
   - **Populated State**: Each uploaded story becomes **exactly one** corresponding physical 3D book on the horizontal shelf. 3 uploaded stories = exactly 3 books.

2. **3D Physical Book Craftsmanship**
   - **Spine**: The story caption is printed vertically along the spine (`writing-mode: vertical-rl`) in elegant typography with embossed foil rules and author name.
   - **8-Color Curated Spine Palette**: Derived from physical cloth bindings (Muted Sage, Warm Terracotta, Dusty Blue, Soft Olive, Warm Sand, Muted Burgundy, Slate Blue, Editorial Cream).
   - **Front Cover**: Uses the uploaded photograph (`object-fit: cover`) with a subtle paper matte finish, spine crease shadow, and editorial title plate.
   - **Page Edges & Shadow**: True 3D cuboid depth with cream page-block fore-edge and realistic ambient floor shadow that deepens when lifted.

3. **Client-Side Image Processing (Canvas API)**
   - Supports JPG, JPEG, PNG, and WebP.
   - Automatically resizes large photographs to a maximum of **1080px width × 1920px height** while preserving original aspect ratio.
   - Converts processed images to compressed Base64 JPEG (quality 0.82) to optimize LocalStorage quota.

4. **LocalStorage Persistence & Strict 24-Hour Expiration**
   - Stores each story with a unique ID, Base64 image, caption, author, `createdAt`, and `expiresAt` timestamps.
   - Stories expire exactly 24 hours after creation.
   - Automatic lifecycle cleanup triggers on startup, on tab focus (`visibilitychange`), and every 30 seconds.
   - QuotaExceededError protection prevents app crashes.

5. **Story Viewer with 3-Second Progression**
   - Organic ink-reveal animation transitions from the clicked book into the full-screen story.
   - Multi-segmented progress bar at the top (fills over **3 seconds** per story).
   - Hold-to-pause interaction (freezes timer while holding).
   - Left/right navigation zones, touch swipe gestures, and keyboard arrow controls.

6. **Delete Story Action with Confirmation**
   - Accessible in-app confirmation modal before permanently deleting.
   - Instantly removes the story from LocalStorage and updates the shelf count.
   - If the last story is deleted, the shelf gracefully returns to the single Add Story placeholder.

7. **High-Performance Custom Cursor (60 FPS)**
   - Zero React re-renders on mouse movement. Updates directly via native pointer events and `requestAnimationFrame`.
   - Context-sensitive states: `OPEN` on books, `ADD` on buttons, `DRAG` while navigating.
   - Automatically disabled on touch screens to preserve native mobile gestures.

---

## Technical Stack & Constraints

- **Framework**: React 18, Vite 6
- **Styling**: Tailwind CSS v4, Custom CSS3 3D Transforms
- **Icons**: Lucide React
- **APIs**: HTML5 Canvas API, FileReader API, Web Storage (LocalStorage)
- **Zero Backend**: 100% client-side, no external database, no authentication, no paid services.

---

## Project Structure

```
new_js_project/
├── index.html                   # HTML entry point with Newsreader & Inter fonts
├── package.json                 # Dependencies and npm scripts
├── src/
│   ├── main.jsx                 # React root mount
│   ├── App.tsx                  # Main controller component
│   ├── index.css                # CSS variables, 3D cuboid book styles & animations
│   ├── components/
│   │   ├── TopBar.tsx           # Header with "+ ADD STORY" button and brand title
│   │   ├── Shelf3D.tsx          # 3D physical horizontal bookshelf
│   │   ├── DetailModal.tsx      # Full-screen story viewer with ink-reveal & delete modal
│   │   ├── Caption.tsx          # Selected book title, author, and 24h countdown
│   │   ├── DecadeTabs.tsx       # Category navigation tabs
│   │   ├── CustomCursor.tsx     # 60 FPS hardware-accelerated circular cursor
│   │   ├── PlayRing.tsx         # Center action play ring
│   │   ├── Arrows.tsx           # Previous / Next shelf navigation controls
│   │   ├── Footer.tsx           # Footer with storage usage display
│   │   ├── PaperGrain.tsx       # SVG noise texture overlay
│   │   ├── StoryViewer/
│   │   │   └── StoryProgressBar.jsx # Top segmented progress bar
│   │   └── UploadModal/
│   │       ├── ImageUploadModal.jsx # Drag-and-drop file upload & caption form
│   │       └── ImageUploadModal.css # Upload modal styling
│   ├── constants/
│   │   └── storyConfig.js       # Durations, limits, color tokens & spine palette
│   ├── hooks/
│   │   ├── useStories.js        # React hook for LocalStorage CRUD & category filtering
│   │   └── useStoryPlayback.js  # 3-second rAF progress timer & pause/resume
│   ├── types/
│   │   └── films.ts             # TypeScript interface for StoryBook
│   └── utils/
│       ├── StoryStorage.js      # LocalStorage persistence & quota protection
│       ├── ExpirationManager.js # 24-hour expiration calculations & audit hooks
│       ├── ImageProcessor.js    # Canvas scaling (1080x1920) & Base64 conversion
│       └── shelfMath.ts         # 3D shelf positioning math & spring physics
└── tests/
    ├── unit-tests.js            # 12 QA & edge-case unit test suites
    └── acceptance-tests.js      # 8 acceptance tests verifying core requirements
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Run Automated Tests
```bash
# Run unit & edge case tests
npm test

# Run acceptance tests (1 Story = 1 Book, Expiration, Delete)
node tests/acceptance-tests.js
```

### 4. Build for Production
```bash
npm run build
```

---

## Keyboard Shortcuts

- `←` (Left Arrow): Previous book / story
- `→` (Right Arrow): Next book / story
- `Enter`: Open selected book in full-screen viewer (or open upload modal if empty)
- `Escape`: Close viewer or upload modal

---

## License

MIT License. Designed and developed as a client-side tactile book archive.


# 24hr_story
