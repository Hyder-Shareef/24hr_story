# Code Explanation Guide — Stories: The Tactile Book Archive

This document provides a beginner-friendly, line-by-line breakdown of the JavaScript (ES6) code used throughout this project. It is structured to help you understand the core fundamentals and explain your code to an instructor or interviewer.

---

## Table of Contents
1. [Module 1: Story Storage (`src/utils/StoryStorage.js`)](#module-1-story-storage)
2. [Module 2: 24-Hour Expiration Engine (`src/utils/ExpirationManager.js`)](#module-2-24-hour-expiration-engine)
3. [Module 3: Canvas Image Processing & Resizing (`src/utils/ImageProcessor.js`)](#module-3-canvas-image-processing--resizing)
4. [Module 4: 1 Story = 1 Book Shelf Logic (`src/components/Shelf3D.tsx`)](#module-4-1-story--1-book-shelf-logic)
5. [Module 5: 3-Second Playback Progress Timer (`src/hooks/useStoryPlayback.js`)](#module-5-3-second-playback-progress-timer)
6. [Instructor Q&A Cheat Sheet](#instructor-qa-cheat-sheet)

---

## Module 1: Story Storage

### 1. Approach
The application has no backend database, so we store stories directly inside the browser using the Web Storage API (`localStorage`). 
Because `localStorage` only stores text strings, we convert our array of story objects into a text string using `JSON.stringify()`, and read it back into an array using `JSON.parse()`.

### 2. Logic
- **`getStories()`**: Reads the raw string from `localStorage`. If nothing is stored, it returns an empty array `[]`. If data exists, it parses the string and verifies that each story has the required properties (`id`, `image`, `createdAt`, `expiresAt`).
- **`saveStory(newStory)`**: Reads the current stories, prepends the new story to the front of the array (`[newStory, ...currentStories]`), and writes it back to `localStorage`. If `localStorage` is full (throws a `QuotaExceededError`), we catch it and display a friendly error message instead of crashing.
- **`deleteStory(idToDelete)`**: Loops through the array and keeps only stories whose `id` does NOT match `idToDelete`.

### 3. Dry Run

#### Example Input
We have 1 existing story in storage, and we call `saveStory(newStory)`:
- `currentStories`: `[ { id: "story_1", title: "Sunset" } ]`
- `newStory`: `{ id: "story_2", title: "Morning Coffee" }`

#### Step-by-Step Execution
| Step | Variable / Expression | Value / Result | Explanation |
| :--- | :--- | :--- | :--- |
| 1 | `currentStories` | `[{ id: "story_1" }]` | `getStories()` returns existing array |
| 2 | `updatedStories` | `[{ id: "story_2" }, { id: "story_1" }]` | `[newStory, ...currentStories]` places new story first |
| 3 | `JSON.stringify(updatedStories)` | `'[{"id":"story_2"},...]'` | Converts array of objects to string |
| 4 | `localStorage.setItem(...)` | Saved successfully | Browser stores the updated JSON string |
| 5 | Return | `{ success: true, stories: [...] }` | Tells the component the save was successful |

### 4. Time Complexity
- **`getStories()`**: $O(N)$, where $N$ is the number of saved stories. We parse the string and check each story once.
- **`saveStory()`**: $O(N)$, because we read $N$ stories, add one item, and write the string back.
- **`deleteStory()`**: $O(N)$, because we check each of the $N$ stories to filter out the matching ID.

### 5. Space Complexity
- $O(N)$ auxiliary space to hold the array of $N$ story objects in memory.

### 6. Code
```javascript
export const StoryStorage = {
  // Read all stories from localStorage
  getStories() {
    try {
      const rawData = localStorage.getItem('editorial_stories_v1');
      if (!rawData) {
        return [];
      }
      const parsedData = JSON.parse(rawData);
      if (!Array.isArray(parsedData)) {
        return [];
      }

      // Check required fields using a standard for loop
      const validStories = [];
      for (let i = 0; i < parsedData.length; i++) {
        const item = parsedData[i];
        if (
          item &&
          typeof item.id === 'string' &&
          typeof item.image === 'string' &&
          typeof item.createdAt === 'number' &&
          typeof item.expiresAt === 'number'
        ) {
          validStories.push(item);
        }
      }
      return validStories;
    } catch (error) {
      console.error('Failed to read stories:', error);
      return [];
    }
  },

  // Save a new story
  saveStory(newStory) {
    if (!newStory || !newStory.image) {
      return { success: false, error: 'Invalid story data' };
    }

    const currentStories = this.getStories();
    const updatedStories = [newStory, ...currentStories];

    try {
      localStorage.setItem('editorial_stories_v1', JSON.stringify(updatedStories));
      return { success: true, stories: updatedStories };
    } catch (error) {
      return { success: false, error: 'Storage full. Please delete older stories.' };
    }
  },

  // Delete a story by ID
  deleteStory(idToDelete) {
    const currentStories = this.getStories();
    const remainingStories = [];

    for (let i = 0; i < currentStories.length; i++) {
      if (currentStories[i].id !== idToDelete) {
        remainingStories.push(currentStories[i]);
      }
    }

    localStorage.setItem('editorial_stories_v1', JSON.stringify(remainingStories));
    return remainingStories;
  }
};
```

---

## Module 2: 24-Hour Expiration Engine

### 1. Approach
Social media stories expire after 24 hours. We store exact timestamps in milliseconds using `Date.now()`.
When a story is created:
$$\text{expiresAt} = \text{createdAt} + (24 \times 60 \times 60 \times 1000)$$
A story is expired whenever $\text{Date.now()} \ge \text{expiresAt}$.

### 2. Logic
We do **not** rely solely on `setTimeout`, because timers stop running when the user closes their laptop or shuts the browser tab.
Instead, we check timestamps:
1. **On Application Mount**: Remove expired stories immediately upon loading.
2. **On Tab Visibility Change (`visibilitychange`)**: Re-check when the user switches back to this browser tab.
3. **Periodic Interval**: Re-check every 30 seconds while the page remains open.

### 3. Dry Run

#### Example Input
- Current Time (`Date.now()`): `1,700,000,000,000`
- Story A `expiresAt`: `1,700,050,000,000` (expires in 50 seconds $\rightarrow$ **Active**)
- Story B `expiresAt`: `1,699,999,000,000` (expired 1 second ago $\rightarrow$ **Expired**)

#### Step-by-Step Execution
| Story | `expiresAt` | Current Time `now` | Condition (`expiresAt > now`) | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Story A** | `1,700,050,000,000` | `1,700,000,000,000` | `true` | Added to `activeStories` list |
| **Story B** | `1,699,999,000,000` | `1,700,000,000,000` | `false` | Ignored (deleted from storage) |

### 4. Time Complexity
- $O(N)$ where $N$ is the number of stories. We inspect each story timestamp once.

### 5. Space Complexity
- $O(N)$ to hold the filtered active stories array.

### 6. Code
```javascript
export const ExpirationManager = {
  // Returns true if the story is expired
  isStoryExpired(story) {
    const now = Date.now();
    return now >= story.expiresAt;
  },

  // Formats remaining time (e.g. "EXPIRES IN 14 HOURS")
  formatTimeRemaining(expiresAt) {
    const now = Date.now();
    const remainingMs = expiresAt - now;

    if (remainingMs <= 0) {
      return 'EXPIRED';
    }

    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

    if (remainingMinutes < 60) {
      return `EXPIRES IN ${remainingMinutes} MIN`;
    }
    return `EXPIRES IN ${remainingHours} HOURS`;
  },

  // Cleans up expired stories and updates LocalStorage
  cleanupExpiredStories() {
    const allStories = StoryStorage.getStories();
    const now = Date.now();
    const activeStories = [];

    for (let i = 0; i < allStories.length; i++) {
      if (allStories[i].expiresAt > now) {
        activeStories.push(allStories[i]);
      }
    }

    // Only update LocalStorage if at least one story was removed
    if (activeStories.length !== allStories.length) {
      StoryStorage.updateStories(activeStories);
    }

    return activeStories;
  }
};
```

---

## Module 3: Canvas Image Processing & Resizing

### 1. Approach
Mobile phone cameras produce 10MB to 20MB images with 4000×3000 resolution. Storing such large images in `localStorage` quickly hits the 5MB browser quota.
We use the browser's native **HTML5 Canvas API** to downscale the image to a maximum dimension of **1080px × 1920px** while preserving the aspect ratio, then export it as a compressed Base64 JPEG.

### 2. Logic
1. **Validation**: Check that the file is an image (`image/jpeg`, `image/png`, `image/webp`).
2. **Dimension Calculation**:
   - If width $> 1080$, scale down proportionally: $\text{ratio} = 1080 / \text{originalWidth}$.
   - If resulting height $> 1920$, scale down again: $\text{ratio} = 1920 / \text{originalHeight}$.
3. **Canvas Drawing**: Create an off-screen `<canvas>`, set width and height, and call `ctx.drawImage()`.
4. **Base64 Export**: Call `canvas.toDataURL('image/jpeg', 0.82)`.

### 3. Dry Run

#### Example Input
- Uploaded Image: `3240px` width × `4320px` height.
- Max allowed: `1080px` width × `1920px` height.

#### Step-by-Step Calculation
1. Calculate width scale factor:
   $$\text{ratio} = \frac{1080}{3240} = 0.3333$$
2. Scale both dimensions:
   $$\text{targetWidth} = 3240 \times 0.3333 = 1080\text{px}$$
   $$\text{targetHeight} = 4320 \times 0.3333 = 1440\text{px}$$
3. Check height constraint: $1440\text{px} \le 1920\text{px}$ (Fits perfectly!).
4. Final Canvas Dimensions: **1080 × 1440**. Aspect ratio is preserved with zero distortion.

### 4. Time Complexity
- $O(W \times H)$ where $W$ and $H$ are the pixel dimensions of the image. Canvas hardware acceleration performs this in milliseconds.

### 5. Space Complexity
- $O(W_{\text{target}} \times H_{\text{target}})$ for the resized bitmap in memory before encoding into Base64.

### 6. Code
```javascript
export const ImageProcessor = {
  // Validate file type
  validateFile(file) {
    if (!file) return { valid: false, error: 'No file selected' };
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPG, PNG, and WebP images are supported.' };
    }
    return { valid: true };
  },

  // Calculate proportional dimensions
  calculateDimensions(origWidth, origHeight, maxWidth = 1080, maxHeight = 1920) {
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (targetWidth > maxWidth) {
      const ratio = maxWidth / targetWidth;
      targetWidth = maxWidth;
      targetHeight = Math.round(targetHeight * ratio);
    }

    if (targetHeight > maxHeight) {
      const ratio = maxHeight / targetHeight;
      targetHeight = maxHeight;
      targetWidth = Math.round(targetWidth * ratio);
    }

    return { width: targetWidth, height: targetHeight };
  },

  // Process image using HTML5 Canvas
  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const { width, height } = this.calculateDimensions(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to Base64 JPEG at 82% quality
          const base64 = canvas.toDataURL('image/jpeg', 0.82);
          resolve({ base64 });
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }
};
```

---

## Module 4: 1 Story = 1 Book Shelf Logic

### 1. Approach
The core visual problem was the "Endless Bookshelf" (rendering 36 virtual slots repeating empty books).
We fixed this by establishing an exact 1-to-1 relationship:
$$\text{Number of books rendered} = \begin{cases} 1 & \text{if } \text{stories.length} == 0 \text{ (Empty State Add Book)} \\ \text{stories.length} & \text{if } \text{stories.length} > 0 \end{cases}$$

### 2. Logic
- **When 0 stories exist**: We render exactly 1 book: an Add Story placeholder with a dashed border, plus symbol, and tactile hover response.
- **When $N$ stories exist**: We map over `stories` and render exactly $N$ physical 3D books.
- Each book is built as a complete 3D cuboid:
  - **Spine**: Rotated vertical caption with curated cloth binding color.
  - **Cover**: Uploaded image with realistic page crease.
  - **Page block**: Cream page edges on the side and top.
  - **Ambient shadow**: Realistic floor shadow underneath.

### 3. Dry Run

#### Scenario 1: User has 0 stories
- `stories.length = 0`
- `totalBooks = 1`
- The `stories.length === 0` branch executes.
- Renders **1** 3D book saying `ADD STORY`.

#### Scenario 2: User uploads 2 stories ("Trip" & "Coffee")
- `stories.length = 2`
- `stories.map()` executes twice:
  - Book 0: Spine title `"Trip"`, Cover photo of Trip.
  - Book 1: Spine title `"Coffee"`, Cover photo of Coffee.
- Result: Exactly **2** physical books on the shelf. Zero placeholders.

### 4. Time Complexity
- $O(N)$ where $N$ is the number of stories. React renders each book once in the loop.

### 5. Space Complexity
- $O(N)$ DOM nodes in the browser tree.

---

## Module 5: 3-Second Playback Progress Timer

### 1. Approach
In modern story apps, each story plays for a fixed duration (3 seconds / 3000ms), filling a top segmented progress bar from 0% to 100%, and then advances to the next story.
We implement this using `requestAnimationFrame` with timestamp deltas ($\Delta t$) instead of a simple `setInterval`, ensuring smooth 60 FPS animation.

### 2. Logic
- **`progress`**: Calculated as:
  $$\text{progress} = \min\left(100, \frac{\text{accumulatedTime}}{\text{STORY\_DURATION\_MS}} \times 100\right)$$
- **Hold-to-Pause**: On `pointerdown`, `isPaused` becomes `true` and time stops accumulating. On `pointerup`, it resumes from the exact millisecond.
- **Completion**: When `accumulatedTime >= 3000ms`:
  - If more stories exist: call `onNext()` to move to `currentIndex + 1`.
  - If on the last story: call `onComplete()` to close the viewer.

### 3. Dry Run

#### Example Input
- `STORY_DURATION_MS = 3000`
- `accumulatedTime = 1500ms` (halfway through story)

#### Step-by-Step
1. $\text{currentPct} = (1500 / 3000) \times 100 = 50\%$.
2. The segment for the active story renders with width `50%`.
3. User presses and holds screen: `isPaused = true`. Progress stays frozen at `50%`.
4. User releases screen: `isPaused = false`. Time resumes until `accumulatedTime = 3000ms`.
5. At 3000ms, progress hits 100%, and `onNext()` triggers the next story.

---

## Instructor Q&A Cheat Sheet

Use these concise, professional answers if your instructor asks about your technical decisions:

#### Q1: "Why did you use LocalStorage instead of a database?"
> *"The project constraints specified a 100% client-side application with no backend or external database. `localStorage` is built directly into every modern browser, persists data even after the browser is closed or refreshed, and requires no external API keys or server costs."*

#### Q2: "How do you prevent LocalStorage from running out of space?"
> *"Standard `localStorage` is limited to approximately 5MB. We protect against quota errors in three ways: First, the HTML5 Canvas API resizes large images down to max 1080×1920. Second, we compress images to JPEG at 82% quality. Third, our `saveStory` function uses a `try...catch` block to gracefully catch `QuotaExceededError` and notify the user to delete older stories instead of crashing."*

#### Q3: "How does the 24-hour expiration work without a server?"
> *"When a story is uploaded, we calculate `expiresAt = Date.now() + 24 * 60 * 60 * 1000`. We run audit checks at three key moments: on application load, when the browser tab becomes active via the `visibilitychange` event, and on a 30-second interval. Any story where `Date.now() >= expiresAt` is removed from `localStorage`."*

#### Q4: "Why did you use requestAnimationFrame instead of setInterval for the progress bar?"
> *" `setInterval` can stutter, does not synchronize with the monitor's 60Hz or 120Hz refresh rate, and continues running in background tabs, consuming unnecessary CPU. `requestAnimationFrame` automatically pauses when the tab is hidden and delivers buttery smooth 60 FPS transitions."*

#### Q5: "How is the 3D book effect created?"
> *"Each book is a true 3D cuboid built using CSS 3D transforms (`preserve-3d`, `rotateY`, `translateZ`, and `perspective`). When the user scrolls, a continuous relative distance $r$ calculates the turning angle $\text{rotY} = -90^\circ \times \text{openness}$. At the center, the book turns forward to show its cover, while adjacent books show their spines."*

