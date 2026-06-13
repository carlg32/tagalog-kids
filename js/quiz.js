/**
 * quiz.js — Quiz Engine for Tagalog Kids
 * 
 * Question types (cycles to avoid monotony):
 *   1. Word Match: "What does [Tagalog] mean?" → pick English
 *   2. Translation Match: "How do you say [English] in Tagalog?" → pick Tagalog
 *   3. Audio Quiz: 🔊 plays audio → "Which word did you hear?"
 *   4. Image Quiz: shows illustration → "What word matches this picture?"
 * 
 * Difficulty:
 *   - Easy: 2 choices
 *   - Hard: 4 choices
 * 
 * Usage:
 *   const quiz = new QuizEngine(words, difficulty, questionCount);
 *   const question = quiz.nextQuestion();
 *   quiz.answer(selectedIndex);
 *   quiz.getResults();
 */

class QuizEngine {

  /**
   * @param {Array} words - Array of word objects from JSON
   * @param {string} difficulty - 'easy' (2 choices) or 'hard' (4 choices)
   * @param {number} questionCount - How many questions to generate
   */
  constructor(words, difficulty = 'easy', questionCount = 5) {
    if (!words || words.length < 4) {
      throw new Error(`Need at least 4 words for quiz, got ${words?.length || 0}`);
    }
    this.allWords = words;
    this.difficulty = difficulty;
    this.choiceCount = difficulty === 'hard' ? 4 : 2;

    // Generate questions
    this.questions = this._generateQuestions(Math.min(questionCount, words.length * 3));
    this.currentIndex = 0;
    this.answers = [];  // { questionIndex, selected, correct, wordId }
    this.totalQuestions = this.questions.length;

    // Shuffle questions
    this._shuffle(this.questions);
  }

  /**
   * Get the current question
   * @returns {Object|null} { type, stem, wordId, choices[], correctIndex, audioFile?, imageFile? }
   */
  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  }

  /**
   * Move to next question
   * @returns {Object|null}
   */
  nextQuestion() {
    this.currentIndex++;
    return this.getCurrentQuestion();
  }

  /**
   * Submit an answer
   * @param {number} selectedIndex - Which choice the user picked (0-based)
   * @returns {Object} { correct: boolean, correctIndex: number, wordId: string }
   */
  answer(selectedIndex) {
    const q = this.getCurrentQuestion();
    if (!q) return null;

    const correct = selectedIndex === q.correctIndex;
    this.answers.push({
      questionIndex: this.currentIndex,
      type: q.type,
      wordId: q.wordId,
      selected: selectedIndex,
      correct,
      correctIndex: q.correctIndex
    });

    return { correct, correctIndex: q.correctIndex, wordId: q.wordId };
  }

  /**
   * Go back to the previous question
   * @returns {Object|null}
   */
  prevQuestion() {
    if (this.currentIndex > 0) {
      // Remove the last answer (current question's answer)
      this.answers.pop();
      this.currentIndex--;
      return this.getCurrentQuestion();
    }
    return null;
  }

  /**
   * Get results summary
   * @returns {Object} { score, total, percentage, answers[], wordResults }
   */
  getResults() {
    const correct = this.answers.filter(a => a.correct).length;
    const total = this.answers.length;

    // Per-word stats
    const wordResults = {};
    for (const a of this.answers) {
      if (!wordResults[a.wordId]) wordResults[a.wordId] = { correct: 0, total: 0 };
      wordResults[a.wordId].total++;
      if (a.correct) wordResults[a.wordId].correct++;
    }

    return {
      score: correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      answers: this.answers,
      wordResults
    };
  }

  /**
   * Get progress info
   * @returns {Object} { current, total, percentage }
   */
  getProgress() {
    return {
      current: this.currentIndex + 1,
      total: this.totalQuestions,
      percentage: ((this.currentIndex + 1) / this.totalQuestions) * 100
    };
  }

  // ===== Question Generation =====

  _generateQuestions(count) {
    const types = ['word-match', 'translation-match', 'audio-quiz', 'image-quiz'];
    const questions = [];
    let typeIndex = 0;

    for (let i = 0; i < count; i++) {
      const type = types[typeIndex % types.length];
      typeIndex++;

      // Pick a random word for the correct answer
      const correctWord = this.allWords[Math.floor(Math.random() * this.allWords.length)];

      // Pick distractors (wrong choices)
      const distractors = this._pickDistractors(correctWord, this.choiceCount - 1);

      // Build choices and shuffle
      const choices = this._buildChoices(type, correctWord, distractors);

      const question = {
        type,
        wordId: correctWord.wordId,
        tagalog: correctWord.tagalog,
        english: correctWord.english,
        stem: this._getStem(type, correctWord),
        choices: choices.map(c => c.text),
        correctIndex: choices.findIndex(c => c.isCorrect),
        audioFile: type === 'audio-quiz' ? `assets/audio/${correctWord.wordId}.mp3` : null,
        imageFile: type === 'image-quiz' ? `assets/images/${correctWord.wordId}.webp` : null
      };

      questions.push(question);
    }

    return questions;
  }

  _getStem(type, word) {
    switch (type) {
      case 'word-match':
        return `What does "${word.tagalog}" mean?`;
      case 'translation-match':
        return `How do you say "${word.english}" in Tagalog?`;
      case 'audio-quiz':
        return '🔊 Listen and pick the correct word:';
      case 'image-quiz':
        return '📷 Which word matches this picture?';
      default:
        return 'Choose the correct answer:';
    }
  }

  _buildChoices(type, correctWord, distractors) {
    const choices = [];

    switch (type) {
      case 'word-match':
        // Correct: English translation. Distractors: English from other words
        choices.push({ text: correctWord.english, isCorrect: true });
        for (const d of distractors) {
          choices.push({ text: d.english, isCorrect: false });
        }
        break;
      case 'translation-match':
        // Correct: Tagalog word. Distractors: Tagalog from other words
        choices.push({ text: correctWord.tagalog, isCorrect: true });
        for (const d of distractors) {
          choices.push({ text: d.tagalog, isCorrect: false });
        }
        break;
      case 'audio-quiz':
      case 'image-quiz':
        // Correct: Tagalog word. Distractors: Tagalog from other words
        choices.push({ text: correctWord.tagalog, isCorrect: true });
        for (const d of distractors) {
          choices.push({ text: d.tagalog, isCorrect: false });
        }
        break;
    }

    this._shuffle(choices);
    return choices;
  }

  _pickDistractors(correctWord, count) {
    const others = this.allWords.filter(w => w.wordId !== correctWord.wordId);
    this._shuffle(others);
    return others.slice(0, count);
  }

  /** Fisher-Yates shuffle */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizEngine };
}
