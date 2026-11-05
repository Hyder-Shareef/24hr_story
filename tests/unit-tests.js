import assert from 'node:assert';
import { STORY_CONFIG } from '../src/constants/storyConfig.js';

// Setup Mock LocalStorage for Node runtime test
class MockLocalStorage {
  constructor() {
    this.store = {};
    this.failOnSet = false;
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    if (this.failOnSet) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage();
globalThis.Blob = class {
  constructor(parts) {
    this.size = parts.reduce((acc, p) => acc + (typeof p === 'string' ? p.length : 0), 0);
  }
};

const { StoryStorage } = await import('../src/utils/StoryStorage.js');
const { ExpirationManager } = await import('../src/utils/ExpirationManager.js');
const { ImageProcessor } = await import('../src/utils/ImageProcessor.js');

console.log('====================================================');
console.log('   FORENSIC QA & TEST SUITE FOR STORIES APP');
console.log('====================================================\n');

// TEST 1: Initial Empty Storage
localStorage.clear();
assert.deepStrictEqual(StoryStorage.getStories(), [], 'Storage must initially be empty');
console.log('✔ Test 1 Passed: Initial storage is empty');

// TEST 2: Story Creation & Persistence
const now = Date.now();
const testStory = {
  id: `story_${now}_test1`,
  image: 'data:image/jpeg;base64,mockImageData123',
  caption: 'Architectural Journey',
  author: 'TEST USER',
  createdAt: now,
  expiresAt: now + STORY_CONFIG.EXPIRATION_MS // exactly 24 hours
};

const saveRes = StoryStorage.saveStory(testStory);
assert.strictEqual(saveRes.success, true, 'Saving story must succeed');
assert.strictEqual(StoryStorage.getStories().length, 1, 'Storage must have 1 story');
assert.strictEqual(StoryStorage.getStories()[0].id, testStory.id, 'Stored story ID must match');
console.log('✔ Test 2 Passed: Story correctly saved & validated in LocalStorage');

// TEST 3: Story Deletion
const deleteRes = StoryStorage.deleteStory(testStory.id);
assert.strictEqual(deleteRes.length, 0, 'Story must be deleted');
assert.strictEqual(StoryStorage.getStories().length, 0, 'Storage must be empty after deletion');
console.log('✔ Test 3 Passed: Story deleted successfully');

// TEST 4: Expiration Filtering (24-Hour Rule)
const activeStory = {
  id: 'story_active_1',
  image: 'data:image/jpeg;base64,activeData',
  createdAt: now,
  expiresAt: now + (12 * 60 * 60 * 1000) // 12 hours remaining
};

const expiredStory = {
  id: 'story_expired_1',
  image: 'data:image/jpeg;base64,expiredData',
  createdAt: now - (25 * 60 * 60 * 1000), // created 25 hours ago
  expiresAt: now - (1 * 60 * 60 * 1000)   // expired 1 hour ago
};

StoryStorage.updateStories([activeStory, expiredStory]);
assert.strictEqual(StoryStorage.getStories().length, 2, 'Two stories stored before audit');

const { activeStories, purgedCount } = StoryStorage.cleanupExpiredStories();
assert.strictEqual(purgedCount, 1, 'Exactly 1 story must be purged');
assert.strictEqual(activeStories.length, 1, 'Only 1 active story must remain');
assert.strictEqual(activeStories[0].id, 'story_active_1', 'Active story must be retained');
assert.strictEqual(StoryStorage.getStories().length, 1, 'LocalStorage must reflect purged state');
console.log('✔ Test 4 Passed: 24-hour expiration audit automatically removed expired story');

// TEST 5: Expiration Formatting Helpers
const formattedTimeAgo = ExpirationManager.formatRelativeTime(now - (2 * 60 * 60 * 1000));
assert.strictEqual(formattedTimeAgo, 'POSTED 02 HOURS AGO', 'Relative time must format hours');

const formattedRemaining = ExpirationManager.formatTimeRemaining(Date.now() + (22 * 60 * 60 * 1000));
assert.strictEqual(formattedRemaining, 'EXPIRES IN 22 HOURS', 'Time remaining must format hours');

const formattedExpired = ExpirationManager.formatTimeRemaining(now - 1000);
assert.strictEqual(formattedExpired, 'EXPIRED', 'Past time must return EXPIRED');
console.log('✔ Test 5 Passed: Editorial relative time & expiration formatters verified');

// TEST 6: File Validation in ImageProcessor
const invalidFile = { type: 'application/pdf', size: 1024 };
const invalidRes = ImageProcessor.validateFile(invalidFile);
assert.strictEqual(invalidRes.valid, false, 'PDF file must be rejected');

const oversizeFile = { type: 'image/jpeg', size: 25 * 1024 * 1024 };
const oversizeRes = ImageProcessor.validateFile(oversizeFile);
assert.strictEqual(oversizeRes.valid, false, 'File exceeding 15MB must be rejected');

const validFile = { type: 'image/jpeg', size: 2 * 1024 * 1024 };
const validRes = ImageProcessor.validateFile(validFile);
assert.strictEqual(validRes.valid, true, 'Valid JPEG file under 15MB must be accepted');
console.log('✔ Test 6 Passed: Image validation rules verified');

// TEST 7: Invalid Base64 Rejection
const invalidBase64Story = {
  id: 'story_invalid_base64',
  image: 'not_a_valid_base64_string',
  createdAt: now,
  expiresAt: now + STORY_CONFIG.EXPIRATION_MS
};
const resInvalid = StoryStorage.saveStory(invalidBase64Story);
assert.strictEqual(resInvalid.success, false, 'Malformed Base64 payload must be rejected');
console.log('✔ Test 7 Passed: Malformed Base64 data rejected safely');

// TEST 8: Storage Quota Handling
localStorage.failOnSet = true;
const quotaStory = {
  id: 'story_quota_test',
  image: 'data:image/jpeg;base64,hugeImage',
  createdAt: now,
  expiresAt: now + STORY_CONFIG.EXPIRATION_MS
};
const quotaRes = StoryStorage.saveStory(quotaStory);
assert.strictEqual(quotaRes.success, false, 'Quota exhaustion must return false without throwing');
assert.match(quotaRes.error, /Storage limit reached|quota/i, 'Meaningful quota error message returned');
localStorage.failOnSet = false;
console.log('✔ Test 8 Passed: QuotaExceededError trapped gracefully without app crash');

// TEST 9: Corrupted JSON Recovery in LocalStorage
localStorage.setItem(STORY_CONFIG.STORAGE_KEY, '{ malformed: json [ invalid');
const safeRecoveredStories = StoryStorage.getStories();
assert.deepStrictEqual(safeRecoveredStories, [], 'Corrupted LocalStorage JSON must recover to empty array');
console.log('✔ Test 9 Passed: Corrupted LocalStorage JSON gracefully parsed as empty array');

// TEST 10: Multi-Story Sequencing with Differential Expiration
localStorage.clear();
const storyEarly = {
  id: 'story_early',
  image: 'data:image/jpeg;base64,data1',
  createdAt: now,
  expiresAt: now + 5000 // expires in 5 seconds
};
const storyLate = {
  id: 'story_late',
  image: 'data:image/jpeg;base64,data2',
  createdAt: now,
  expiresAt: now + 86400000 // expires in 24 hours
};
StoryStorage.saveStory(storyEarly);
StoryStorage.saveStory(storyLate);
assert.strictEqual(StoryStorage.getStories().length, 2, 'Two stories saved');

// Simulate 10 seconds later
const timeFastForward = now + 10000;
const filtered = ExpirationManager.filterActiveStories(StoryStorage.getStories(), timeFastForward);
assert.strictEqual(filtered.length, 1, 'Only later story must remain');
assert.strictEqual(filtered[0].id, 'story_late', 'Late story must be the only active item');
console.log('✔ Test 10 Passed: Multi-story sequencing with differential expiration verified');

// TEST 11: Return After > 24 Hours (Full Purge)
const timeAfter25Hours = now + (25 * 3600 * 1000);
const allPurged = ExpirationManager.filterActiveStories(StoryStorage.getStories(), timeAfter25Hours);
assert.strictEqual(allPurged.length, 0, 'All stories must be expired after 25 hours');
console.log('✔ Test 11 Passed: Full purge after 24h lifespan verified');

// TEST 12: Aspect Ratio Math & Clamping
function calculateScale(origW, origH) {
  return Math.min(1.0, STORY_CONFIG.MAX_WIDTH / origW, STORY_CONFIG.MAX_HEIGHT / origH);
}
// 1. Large 4K Portrait (2160 x 3840) -> scaled down by 0.5 to 1080 x 1920
const scale4k = calculateScale(2160, 3840);
assert.strictEqual(scale4k, 0.5, '4K portrait must scale by exactly 0.5');

// 2. Small Photo (600 x 800) -> scale must stay 1.0 (no upscaling)
const scaleSmall = calculateScale(600, 800);
assert.strictEqual(scaleSmall, 1.0, 'Small photo must not be upscaled');

// 3. Wide Landscape (4000 x 2000) -> width bound clamps to 1080
const scaleWide = calculateScale(4000, 2000);
assert.strictEqual(scaleWide, 1080 / 4000, 'Wide photo must clamp by width');
console.log('✔ Test 12 Passed: Dimension scaling & aspect ratio clamping verified');

console.log('\n====================================================');
console.log('   ALL 12 QA & EDGE CASE SUITES PASSED CLEANLY!');
console.log('====================================================');
