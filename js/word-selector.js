/**
 * word-selector.js — Dynamic Word Selection Engine (Updated)
 *
 * Supports the new flexible word list schema with:
 * - tags[]
 * - excludeable
 * - difficultyLevel
 * - User exclusions (from progress.excludedWords)
 */

const WordSelector = {

  DEFAULTS: {
    wordsPerSession: 5,
    masteredCooldownDays: 7,
    maxPerSession: 3,
    reviewRatio: 0.3
  },

  /**
   * Generate a session word list.
   */
  generateSession(allWords, progress, config = {}) {
    const cfg = { ...this.DEFAULTS, ...config };
    const wordProgress = progress?.words || {};
    const excluded = progress?.excludedWords || [];

    const unpracticed = [];
    const learning = [];
    const mastered = [];

    // Filter words
    const filtered = allWords.filter(word => {
      if (cfg.categories && cfg.categories.length > 0) {
        if (!cfg.categories.includes(word.category)) return false;
      }
      if (cfg.tags && cfg.tags.length > 0) {
        if (!word.tags || !word.tags.some(t => cfg.tags.includes(t))) return false;
      }
      if (word.excludeable === false) return false;
      if (excluded.includes(word.wordId)) return false;
      return true;
    });

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

    this._shuffle(unpracticed);
    this._shuffle(learning);
    this._shuffle(mastered);

    // Cooldown filter for mastered words
    const cooldownMs = cfg.masteredCooldownDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const masteredAvailable = mastered.filter(id => {
      const wp = wordProgress[id];
      if (!wp?.lastPracticed) return true;
      const last = new Date(wp.lastPracticed).getTime();
      return (now - last) >= cooldownMs;
    });

    const maxSlots = cfg.wordsPerSession;
    const session = [];

    // 1. Unpracticed first
    for (const id of unpracticed) {
      if (session.length >= maxSlots) break;
      session.push(id);
    }

    // 2. Learning
    for (const id of learning) {
      if (session.length >= maxSlots) break;
      session.push(id);
    }

    // 3. Spiral review (mastered)
    const reviewCount = Math.floor(maxSlots * cfg.reviewRatio);
    let reviewAdded = 0;
    for (const id of masteredAvailable) {
      if (session.length >= maxSlots || reviewAdded >= reviewCount) break;
      session.push(id);
      reviewAdded++;
    }

    // Fill remaining slots
    if (session.length < maxSlots) {
      const remaining = [...unpracticed, ...learning].filter(id => !session.includes(id));
      for (const id of remaining) {
        if (session.length >= maxSlots) break;
        session.push(id);
      }
    }

    return session;
  },

  trackPractice(wordId, progress) {
    if (!progress.words) progress.words = {};
    if (!progress.words[wordId]) {
      progress.words[wordId] = { timesPracticed: 0 };
    }
    const wp = progress.words[wordId];
    wp.lastPracticed = new Date().toISOString();
    wp.timesPracticed = (wp.timesPracticed || 0) + 1;
    wp.mastered = wp.timesPracticed >= 3;
  },

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

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordSelector };
}