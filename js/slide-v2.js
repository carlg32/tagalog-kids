/**
 * Slide Template JavaScript v2 — Tagalog Kids
 * 
 * Features:
 * - Loads words from JSON or ?words= query param (curated sessions)
 * - Sound-click tracking (records practice when 🔊 is clicked)
 * - Per-word progress in localStorage
 * - Streak tracking
 */

// ===== Configuration =====
const CONFIG = {
  wordListFile: 'data/word-list-grade1-greetings-all.json',
  audioBasePath: 'assets/audio/',
  illustrationBasePath: 'assets/images/',
  progressKey: 'tagalog-kids-progress'
};

// ===== State =====
let currentWordIndex = 0;
let wordList = [];       // Words loaded (full or curated session)
let progress = {};       // localStorage progress
let isSession = false;   // True if loaded from ?words= param

// ===== DOM Elements =====
const elements = {
  container: document.getElementById('slide-container'),
  tagalogWord: document.getElementById('tagalog-word'),
  englishTranslation: document.getElementById('english-translation'),
  illustration: document.getElementById('illustration'),
  characterScene: document.getElementById('character-scene'),
  soundIconBtn: document.getElementById('sound-icon-btn'),
  audioPlayer: document.getElementById('audio-player'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  exampleSentence: document.getElementById('example-sentence'),
  masteryBadge: document.getElementById('mastery-badge'),
  endBtn: document.getElementById('end-btn')
};

// ===== Initialize =====
async function init() {
  console.log('🎤 Initializing Tagalog Kids Slide v2...');
  
  // Load word list
  await loadWordList();
  if (wordList.length === 0) {
    document.getElementById('slide-container').innerHTML = '<p style="text-align:center;padding:4rem;font-size:1.2rem;">No words selected. <a href="index.html">Go back</a></p>';
    return;
  }
  
  // Load progress from localStorage
  loadProgress();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show first word
  showWord(currentWordIndex);
  
  console.log(`✅ Init complete: ${wordList.length} words, session=${isSession}`);
}

// ===== Load Word List =====
async function loadWordList() {
  // Check for ?words= query param (curated session)
  const params = new URLSearchParams(window.location.search);
  const wordIdsParam = params.get('words');

  if (wordIdsParam) {
    // Load all words from JSON, then filter by wordIds
    isSession = true;
    try {
      const response = await fetch(CONFIG.wordListFile);
      const allWords = await response.json();
      const wantedIds = wordIdsParam.split(',').map(s => s.trim());
      wordList = wantedIds.map(id => allWords.find(w => w.wordId === id)).filter(Boolean);
      console.log(`📚 Session mode: ${wordList.length} curated words`);
      if (wordList.length === 0) {
        console.warn('⚠️ No matching words found for IDs:', wantedIds);
      }
    } catch (error) {
      console.error('❌ Error loading curated word list:', error);
    }
    return;
  }

  // Normal mode: load all words
  try {
    const response = await fetch(CONFIG.wordListFile);
    wordList = await response.json();
    console.log(`📚 Loaded ${wordList.length} words (all)`);
  } catch (error) {
    console.error('❌ Error loading word list:', error);
    wordList = [
      { wordId: 'greetings-01-female-kumusta', tagalog: 'Kumusta', english: 'How are you?', grade: 1, category: 'greetings' }
    ];
  }
}

// ===== Load Progress =====
function loadProgress() {
  const saved = localStorage.getItem(CONFIG.progressKey);
  if (saved) {
    try {
      progress = JSON.parse(saved);
    } catch(e) {
      progress = {};
    }
  }
  
  // Ensure schema
  if (!progress.words) progress.words = {};
  if (!progress.streak) progress.streak = 0;
  if (!progress.lastActiveDate) progress.lastActiveDate = null;
  if (!progress.sessionDate) progress.sessionDate = null;
  if (!progress.sessionWords) progress.sessionWords = [];
  
  // Update streak
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastActiveDate === today) {
    // Already active today, streak continues
  } else if (progress.lastActiveDate) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (progress.lastActiveDate === yesterday) {
      progress.streak += 1;
    } else {
      progress.streak = 0; // Streak broken
    }
  } else {
    progress.streak = 0;
  }
  progress.lastActiveDate = today;
  
  // Restore last position (only in non-session mode)
  currentWordIndex = isSession ? 0 : (progress.currentIndex || 0);
}

// ===== Save Progress =====
function saveProgress() {
  progress.currentIndex = currentWordIndex;
  localStorage.setItem(CONFIG.progressKey, JSON.stringify(progress));
}

// ===== Track Practice (Sound Click) =====
function trackPractice(wordId) {
  if (!progress.words) progress.words = {};
  if (!progress.words[wordId]) {
    progress.words[wordId] = { timesPracticed: 0, mastered: false };
  }
  const wp = progress.words[wordId];
  wp.lastPracticed = new Date().toISOString();
  wp.timesPracticed = (wp.timesPracticed || 0) + 1;
  wp.mastered = wp.timesPracticed >= 3;
  saveProgress();
  console.log(`🔊 Tracked practice: ${wordId} (${wp.timesPracticed}x)`);
}

// ===== Animation Overlay Definitions =====
const ANIMATION_DEFS = {
  'kumusta':        { imgClass: 'img-anim-bounce',       overlays: [] },
  'salamat':        { imgClass: '',                       overlays: [{ class: 'overlay-heart', text: '❤️', top: '5%', right: '5%', left: 'auto', bottom: 'auto' }] },
  'magandang-umaga':{ imgClass: '',                       overlays: [{ class: 'overlay-sun', text: '☀️', top: '3%', left: '10%', right: 'auto', bottom: 'auto' }] },
  'paalam':         { imgClass: 'img-anim-bounce',       overlays: [{ class: 'overlay-waving', text: '👋', top: '5%', right: '10%', left: 'auto', bottom: 'auto' }] },
  'magandang-hapon':{ imgClass: 'img-anim-bounce-fast',  overlays: [] },
  'magandang-gabi': { imgClass: '',                       overlays: [
    { class: 'overlay-star',   text: '⭐', top: '5%',  left: '15%', right: 'auto', bottom: 'auto' },
    { class: 'overlay-star-2', text: '✨', top: '10%', right: '12%', left: 'auto', bottom: 'auto' }
  ]},
  'magandang-araw': { imgClass: '',                       overlays: [{ class: 'overlay-rainbow overlay-rainbow-anim', text: '🌈', bottom: '5%', left: '10%', top: 'auto', right: 'auto' }] },
  'tuloy-kayo':     { imgClass: 'img-anim-breathe',      overlays: [] },
  'hanggang-sa-muli':{ imgClass: 'img-anim-bounce',      overlays: [{ class: 'overlay-float-hearts', text: '💕', bottom: '10%', left: '50%', top: 'auto', right: 'auto' }] },
  'kumain-ka-na':   { imgClass: '',                       overlays: [
    { class: 'overlay-steam',   text: '💨', top: '8%',  left: '45%', right: 'auto', bottom: 'auto' },
    { class: 'overlay-steam-2', text: '💨', top: '12%', left: '55%', right: 'auto', bottom: 'auto' }
  ]},
  'saan-pupunta':   { imgClass: 'img-anim-slide',        overlays: [] }
};

// ===== Apply Animation =====
function applyAnimation(wordId) {
  elements.illustration.className = 'illustration';
  
  const existingOverlays = elements.characterScene.querySelectorAll('.animation-overlay');
  existingOverlays.forEach(el => el.remove());
  
  const parts = wordId.split('-');
  const tagalogKey = parts.slice(3).join('-');
  
  const def = ANIMATION_DEFS[tagalogKey];
  if (!def) {
    console.log(`🎨 No animation defined for: ${tagalogKey}`);
    return;
  }
  
  elements.illustration.style.animation = '';
  
  if (def.imgClass) {
    const animMap = {
      'img-anim-bounce': 'bounce-gentle 2s ease-in-out infinite',
      'img-anim-bounce-fast': 'bounce-gentle 1.5s ease-in-out infinite',
      'img-anim-breathe': 'breathe 2.5s ease-in-out infinite',
      'img-anim-slide': 'slide-side 2s ease-in-out infinite alternate',
    };
    const inlineAnim = animMap[def.imgClass];
    if (inlineAnim) {
      elements.illustration.style.animation = inlineAnim;
    }
  }
  
  def.overlays.forEach((overlayConfig) => {
    const overlay = document.createElement('span');
    overlay.className = `animation-overlay ${overlayConfig.class}`;
    overlay.textContent = overlayConfig.text;
    overlay.style.top = overlayConfig.top || 'auto';
    overlay.style.left = overlayConfig.left || 'auto';
    overlay.style.right = overlayConfig.right || 'auto';
    overlay.style.bottom = overlayConfig.bottom || 'auto';
    elements.characterScene.appendChild(overlay);
  });
}

// ===== Show Word =====
function showWord(index) {
  if (index < 0 || index >= wordList.length) {
    console.warn('⚠️ Word index out of bounds:', index);
    return;
  }
  
  const word = wordList[index];
  currentWordIndex = index;
  
  // Update word text (preserve sound button)
  const soundBtn = elements.soundIconBtn;
  elements.tagalogWord.textContent = word.tagalog;
  elements.tagalogWord.appendChild(soundBtn);
  
  elements.englishTranslation.textContent = `"${word.english}"`;
  
  // Update illustration
  const illustrationPath = `${CONFIG.illustrationBasePath}${word.wordId}.webp`;
  elements.illustration.src = illustrationPath;
  elements.illustration.alt = `Illustration for ${word.tagalog}`;
  
  applyAnimation(word.wordId);
  
  // Image error/load handlers
  elements.illustration.onerror = () => {
    elements.illustration.style.display = 'none';
    elements.characterScene.innerHTML = '<div class="placeholder-illustration">🎨</div>';
    elements.characterScene.appendChild(elements.illustration);
  };
  
  elements.illustration.onload = () => {
    elements.illustration.style.display = 'block';
    const placeholder = elements.characterScene.querySelector('.placeholder-illustration');
    if (placeholder) placeholder.remove();
  };
  
  // Update audio source
  const audioPath = `${CONFIG.audioBasePath}${word.wordId}.mp3`;
  elements.audioPlayer.src = audioPath;
  
  // Update mastery badge
  const wp = progress.words?.[word.wordId];
  if (elements.masteryBadge) {
    if (wp?.mastered) {
      elements.masteryBadge.textContent = '⭐ Mastered!';
      elements.masteryBadge.style.display = 'inline';
    } else if (wp?.timesPracticed && wp.timesPracticed > 0) {
      elements.masteryBadge.textContent = `🔊 ${wp.timesPracticed}/3`;
      elements.masteryBadge.style.display = 'inline';
    } else {
      elements.masteryBadge.style.display = 'none';
    }
  }
  
  // Update example sentence
  if (word.exampleTagalog && word.exampleEnglish) {
    document.querySelector('.example-sentence .tagalog-text').textContent = word.exampleTagalog;
    document.querySelector('.example-sentence .english-text').textContent = word.exampleEnglish;
    elements.exampleSentence.style.display = 'block';
  } else {
    elements.exampleSentence.style.display = 'none';
  }
  
  // Update progress bar
  const progressPercent = ((index + 1) / wordList.length) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
  elements.progressText.textContent = `${index + 1} / ${wordList.length}`;
  
  // Navigation buttons
  elements.prevBtn.disabled = index === 0;
  elements.nextBtn.disabled = index === wordList.length - 1;
  
  // Session end button
  if (elements.endBtn) {
    elements.endBtn.style.display = isSession && index === wordList.length - 1 ? 'block' : 'none';
  }
  
  saveProgress();
}

// ===== Play Audio =====
function playAudio() {
  if (!elements.audioPlayer.src) {
    console.warn('⚠️ No audio source set');
    return;
  }
  
  // Track practice on sound click (regardless of audio playback success)
  const word = wordList[currentWordIndex];
  if (word) trackPractice(word.wordId);
  
  // Play audio (may be blocked by autoplay policies on first click)
  elements.audioPlayer.play().then(() => {
    elements.soundIconBtn.classList.add('playing');
    
    elements.audioPlayer.onended = () => {
      elements.soundIconBtn.classList.remove('playing');
    };
  }).catch(error => {
    console.error('❌ Error playing audio:', error);
  });
}

// ===== Navigation =====
function goToPrevWord() {
  if (currentWordIndex > 0) showWord(currentWordIndex - 1);
}

function goToNextWord() {
  if (currentWordIndex < wordList.length - 1) showWord(currentWordIndex + 1);
}

// ===== End Session → Auto-Start Quiz =====
function endSession() {
  // Mark session as complete in progress
  progress.sessionDate = new Date().toISOString().split('T')[0];
  saveProgress();
  
  // Get the session words from the current word list
  const wordIds = wordList.map(w => w.wordId).join(',');
  
  // Auto-transition to quiz with same words
  window.location.href = `quiz.html?words=${encodeURIComponent(wordIds)}&difficulty=easy&count=5`;
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
  elements.soundIconBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    playAudio();
  });
  
  elements.prevBtn.addEventListener('click', goToPrevWord);
  elements.nextBtn.addEventListener('click', goToNextWord);
  
  if (elements.endBtn) {
    elements.endBtn.addEventListener('click', endSession);
  }
  
  document.addEventListener('keydown', (event) => {
    switch(event.key) {
      case 'ArrowLeft':
        goToPrevWord();
        break;
      case 'ArrowRight':
        goToNextWord();
        break;
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        playAudio();
        break;
    }
  });
}

// ===== Start App =====
document.addEventListener('DOMContentLoaded', init);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { init, showWord, playAudio, goToPrevWord, goToNextWord, endSession };
}
