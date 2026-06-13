/**
 * word-selector.js — Dynamic Word Selection Engine
 * 
 * Picks words based on sound-click tracking so kids don't repeat:
 *   1. Unpracticed words first (never clicked 🔊)
 *   2. Practiced < 3 times (still learning)
 *   3. Mastered (≥3 practices) → cooldown 7 days, then spiral review
 * 
 * Usage:
 *   const session = WordSelector.generateSession(allWords, progress, config);
 *   // → ["greetings-01-...", "greetings-05-...", ...]
 */

const WordSelector = {

  DEFAULTS: {
    wordsPerSession: 5,
    masteredCooldownDays: 7,
    maxPerSession: 3,
    reviewRatio: 0.3  // 30% mastered words for spiral review
  },

  /**
   * Generate a session word list.
   * @param {Array} allWords - Full word list from JSON
   * @param {Object} progress - Progress from localStorage
   * @param {Object} config - User config (wordsPerSession, categories, etc.)
   * @returns {Array<string>} Ordered array of wordIds for this session
   */
  generateSession(allWords, progress, config = {}) {
    const cfg = { ...this.DEFAULTS, ...config };
    const today = new Date().toISOString().split('T')[0];
    const wordProgress = progress?.words || {};

    // Categorize each word
    const unpracticed = [];   // never clicked 🔊
    const learning = [];      // clicked < 3 times
    const mastered = [];      // clicked ≥ 3 times

    // Filter by user's selected categories (if any)
    const filtered = cfg.categories && cfg.categories.length > 0
      ? allWords.filter(w => cfg.categories.includes(w.category))
      : allWords;

    for (const word of filtered) {
      const wp = wordProgress[word.wordId];
      if (!wp || !wp.timesPracticed) {
        unpracticed.push(word.wordId);
      } else if (wp.timesPracticed < 3) {
        learning.push(word.wordId);
      } else {
        mastered.push(word.wordId);
      }
    }

    // Shuffle within each tier
    this._shuffle(unpracticed);
    this._shuffle(learning);
    this._shuffle(mastered);

    // Filter mastered: exclude recent (within cooldown)
    const cooldownMs = cfg.masteredCooldownDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const masteredAvailable = mastered.filter(id => {
      const wp = wordProgress[id];
      const last = new Date(wp.lastPracticed).getTime();
      return (now - last) >= cooldownMs;
    });

    // Build session: fill slots with priority order
    const maxSlots = cfg.wordsPerSession;
    const session = [];

    // 1. Fill with unpracticed first
    for (const id of unpracticed) {
      if (session.length >= maxSlots) break;
      session.push(id);
    }

    // 2. Add learning words
    for (const id of learning) {
      if (session.length >= maxSlots) break;
      session.push(id);
    }

    // 3. Add mastered (spiral review) up to reviewRatio
    const reviewCount = Math.floor(maxSlots * cfg.reviewRatio);
    for (const id of masteredAvailable) {
      if (session.length >= maxSlots || session.filter(w => masteredAvailable.includes(w)).length >= reviewCount) break;
      session.push(id);
    }

    // If still under maxSlots, add more learning/unpracticed
    if (session.length < maxSlots) {
      const remaining = [...learning, ...unpracticed].filter(id => !session.includes(id));
      for (const id of remaining) {
        if (session.length >= maxSlots) break;
        session.push(id);
      }
    }

    return session;
  },

  /**
   * Track a word practice (called when sound is clicked)
   * @param {string} wordId
   * @param {Object} progress - Progress object (mutated in-place)
   */
  trackPractice(wordId, progress) {
    if (!progress.words) progress.words = {};
    if (!progress.words[wordId]) {
      progress.words[wordId] = { timesPracticed: 0, mastered: false };
    }
    const wp = progress.words[wordId];
    wp.lastPracticed = new Date().toISOString();
    wp.timesPracticed = (wp.timesPracticed || 0) + 1;
    wp.mastered = wp.timesPracticed >= 3;
  },

  /**
   * Get stats for the dashboard
   * @param {Object} progress
   * @param {Array} allWords
   * @returns {Object} { learned: number, total: number, streak: number, ... }
   */
  getStats(progress, allWords) {
    const wp = progress?.words || {};
    const practiced = Object.values(wp).filter(w => w.timesPracticed > 0).length;
    const mastered = Object.values(wp).filter(w => w.mastered).length;
    return {
      total: allWords?.length || 0,
      practiced,
      mastered,
      streak: progress?.streak || 0
    };
  },

  /** Fisher-Yates shuffle (in-place) */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordSelector };
}
