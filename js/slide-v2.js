/**
 * Slide Template JavaScript v2 — Tagalog Kids
 */

const CONFIG = {
  wordListFile: 'data/greetings.json',
  audioBasePath: 'assets/audio/',
  illustrationBasePath: 'assets/images/',
  progressKey: 'tagalog-kids-progress'
};

let wordList = [];
let progress = {};
let phase = 'learn';
let currentWordIndex = 0;
let quiz = null;
let answered = false;
let sessionWords = [];

const $ = id => document.getElementById(id);
const el = {
  container: $('slide-container'),
  tagalogWord: $('tagalog-word'),
  englishTranslation: $('english-translation'),
  illustration: $('illustration'),
  characterScene: $('character-scene'),
  soundIconBtn: $('sound-icon-btn'),
  audioPlayer: $('audio-player'),
  nextBtn: $('next-btn'),
  prevBtn: $('prev-btn'),
  progressFill: $('progress-fill'),
  progressText: $('progress-text'),
  phaseBadge: $('phase-badge'),
  learnSection: $('learn-section'),
  quizSection: $('quiz-section'),
  congratsSection: $('congrats-section'),
  questionStem: $('question-stem'),
  choices: $('choices'),
  feedback: $('feedback'),
  congratsScore: $('congrats-score'),
  congratsMessage: $('congrats-message'),
  congratsDetail: $('congrats-detail'),
  exampleSentence: $('example-sentence')
};

async function loadWordList() {
  const params = new URLSearchParams(window.location.search);
  const wordIdsParam = params.get('words');

  if (wordIdsParam) {
    const response = await fetch(CONFIG.wordListFile);
    const allWords = await response.json();

    if (/^\d+$/.test(wordIdsParam)) {
      const count = parseInt(wordIdsParam);
      const shuffled = [...allWords].sort(() => 0.5 - Math.random());
      wordList = shuffled.slice(0, count);
    } else {
      const wantedIds = wordIdsParam.split(',').map(s => s.trim());
      wordList = wantedIds.map(id => allWords.find(w => w.wordId === id)).filter(Boolean);
    }
    sessionWords = wordList.map(w => w.wordId);
  } else {
    const response = await fetch(CONFIG.wordListFile);
    wordList = await response.json();
    sessionWords = wordList.map(w => w.wordId);
  }
}

function loadProgress() {
  const saved = localStorage.getItem(CONFIG.progressKey);
  progress = saved ? JSON.parse(saved) : { words: {}, streak: 0, lastActiveDate: null };
  if (!progress.words) progress.words = {};
}

function saveProgress() {
  localStorage.setItem(CONFIG.progressKey, JSON.stringify(progress));
}

function startLearning() {
  phase = 'learn';
  currentWordIndex = 0;
  showWord(currentWordIndex);
}

function showWord(index) {
  if (index < 0 || index >= wordList.length) return;
  const word = wordList[index];
  currentWordIndex = index;

  el.tagalogWord.textContent = word.tagalog;
  el.englishTranslation.textContent = `"${word.english}"`;
  el.illustration.src = `${CONFIG.illustrationBasePath}${word.wordId}.webp`;

  if (el.audioPlayer) {
    el.audioPlayer.src = `${CONFIG.audioBasePath}${word.wordId}.mp3`;
  }

  const wp = progress.words?.[word.wordId];
  if (el.phaseBadge) {
    el.phaseBadge.textContent = wp?.mastered ? '⭐ Mastered' : (wp?.timesPracticed ? `🔊 ${wp.timesPracticed}/3` : 'Learn');
  }

  const total = wordList.length;
  if (el.progressText) el.progressText.textContent = `${index + 1} / ${total}`;
  if (el.progressFill) el.progressFill.style.width = `${((index + 1) / total) * 100}%`;

  if (el.prevBtn) el.prevBtn.style.display = index > 0 ? 'block' : 'none';
  if (el.nextBtn) el.nextBtn.textContent = index < total - 1 ? 'Next →' : 'Finish →';
}

function playAudio() {
  if (el.audioPlayer && el.audioPlayer.src) {
    el.audioPlayer.play().catch(() => {});
  }
}

function onNextClick() {
  if (phase === 'learn') {
    if (currentWordIndex < wordList.length - 1) {
      showWord(currentWordIndex + 1);
    } else {
      // Transition to quiz
      if (typeof startQuiz === 'function') {
        startQuiz('easy');
      }
    }
  }
}

function setupEventListeners() {
  if (el.soundIconBtn) {
    el.soundIconBtn.addEventListener('click', playAudio);
  }
  if (el.nextBtn) {
    el.nextBtn.addEventListener('click', onNextClick);
  }
  if (el.prevBtn) {
    el.prevBtn.addEventListener('click', () => {
      if (phase === 'learn' && currentWordIndex > 0) {
        showWord(currentWordIndex - 1);
      }
    });
  }
}

async function init() {
  loadProgress();
  await loadWordList();

  if (wordList.length === 0) {
    document.body.innerHTML = '<h1 style="text-align:center;margin-top:100px">No words found</h1>';
    return;
  }

  setupEventListeners();
  startLearning();
}

document.addEventListener('DOMContentLoaded', init);
