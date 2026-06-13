/**
 * Slide Template JavaScript v2 — Tagalog Kids
 * 
 * Changes from v1:
 * - Removed "Mark Complete" functionality
 * - Sound icon moved next to word (inline)
 * - Simplified navigation (Previous/Next only)
 * - Auto-save progress on navigation
 * - NEW: Apply CSS animation based on wordId
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
let wordList = [];
let progress = {};

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
  exampleSentence: document.getElementById('example-sentence')
};

// ===== Initialize =====
async function init() {
  console.log('🎤 Initializing Tagalog Kids Slide v2...');
  
  // Load word list
  await loadWordList();
  
  // Load progress from localStorage
  loadProgress();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show first word
  showWord(currentWordIndex);
  
  console.log('✅ Initialization complete!');
}

// ===== Load Word List =====
async function loadWordList() {
  try {
    const response = await fetch(CONFIG.wordListFile);
    wordList = await response.json();
    console.log(`📚 Loaded ${wordList.length} words`);
  } catch (error) {
    console.error('❌ Error loading word list:', error);
    // Fallback: hardcoded words for testing
    wordList = [
      {
        wordId: 'greetings-01-female-kumusta',
        tagalog: 'Kumusta',
        english: 'How are you?',
        grade: 1,
        category: 'greetings'
      }
    ];
  }
}

// ===== Load Progress =====
function loadProgress() {
  const saved = localStorage.getItem(CONFIG.progressKey);
  if (saved) {
    progress = JSON.parse(saved);
  } else {
    progress = {
      words: {},
      currentIndex: 0
    };
  }
  
  // Restore last position
  currentWordIndex = progress.currentIndex || 0;
}

// ===== Save Progress =====
function saveProgress() {
  progress.currentIndex = currentWordIndex;
  localStorage.setItem(CONFIG.progressKey, JSON.stringify(progress));
}

// ===== Animation Overlay Definitions =====
// Map wordId patterns to image animation + overlay elements
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
  // 1. Strip image animation classes from the <img>
  elements.illustration.className = 'illustration';
  
  // 2. Remove any existing overlay elements from .character-scene
  const existingOverlays = elements.characterScene.querySelectorAll('.animation-overlay');
  existingOverlays.forEach(el => el.remove());
  
  // 3. Extract the tagalog key from wordId
  // Example: "greetings-01-female-kumusta" → "kumusta"
  const parts = wordId.split('-');
  const tagalogKey = parts.slice(3).join('-'); // Remove prefix: greetings-01-female-
  
  // 4. Look up animation def
  const def = ANIMATION_DEFS[tagalogKey];
  if (!def) {
    console.log(`🎨 No animation defined for: ${tagalogKey}`);
    return;
  }
  
  // 5. Apply image animation (inline style - more reliable than CSS class)
  // Clear any previous animation
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
      console.log(`🎨 Animation: ${inlineAnim}`);
    }
  }
  
  // 6. Create overlay elements (if any)
  def.overlays.forEach((overlayConfig, i) => {
    const overlay = document.createElement('span');
    overlay.className = `animation-overlay ${overlayConfig.class}`;
    overlay.textContent = overlayConfig.text;
    overlay.style.top = overlayConfig.top || 'auto';
    overlay.style.left = overlayConfig.left || 'auto';
    overlay.style.right = overlayConfig.right || 'auto';
    overlay.style.bottom = overlayConfig.bottom || 'auto';
    elements.characterScene.appendChild(overlay);
    console.log(`🎨 Added overlay ${i + 1}: ${overlayConfig.text}`);
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
  
  // Update UI
  // Note: tagalogWord now contains the word + sound icon button
  // We need to preserve the button while updating the text
  const soundBtn = elements.soundIconBtn;
  elements.tagalogWord.textContent = word.tagalog;
  elements.tagalogWord.appendChild(soundBtn);
  
  elements.englishTranslation.textContent = `"${word.english}"`;
  
  // Update illustration (if exists, else show placeholder)
  const illustrationPath = `${CONFIG.illustrationBasePath}${word.wordId}.webp`;
  elements.illustration.src = illustrationPath;
  elements.illustration.alt = `Illustration for ${word.tagalog}`;
  
  // Apply animation based on wordId
  applyAnimation(word.wordId);
  
  elements.illustration.onerror = () => {
    // If illustration doesn't exist, show placeholder
    elements.illustration.style.display = 'none';
    elements.characterScene.innerHTML = '<div class="placeholder-illustration">🎨</div>';
    // Re-append the illustration (hidden) for next word
    elements.characterScene.appendChild(elements.illustration);
  };
  
  elements.illustration.onload = () => {
    elements.illustration.style.display = 'block';
    const placeholder = elements.characterScene.querySelector('.placeholder-illustration');
    if (placeholder) {
      placeholder.remove();
    }
  };
  
  // Update audio source
  const audioPath = `${CONFIG.audioBasePath}${word.wordId}.mp3`;
  elements.audioPlayer.src = audioPath;
  
  // Update example sentence (hide if empty)
  const wordData = wordList[index];
  if (wordData.exampleTagalog && wordData.exampleEnglish) {
    document.querySelector('.example-sentence .tagalog-text').textContent = wordData.exampleTagalog;
    document.querySelector('.example-sentence .english-text').textContent = wordData.exampleEnglish;
    elements.exampleSentence.style.display = 'block';
  } else {
    elements.exampleSentence.style.display = 'none';
  }
  
  // Update progress bar
  const progressPercent = ((index + 1) / wordList.length) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
  elements.progressText.textContent = `${index + 1} / ${wordList.length}`;
  
  // Update navigation buttons
  elements.prevBtn.disabled = index === 0;
  elements.nextBtn.disabled = index === wordList.length - 1;
  
  // Save current position
  saveProgress();
}

// ===== Play Audio =====
function playAudio() {
  if (!elements.audioPlayer.src) {
    console.warn('⚠️ No audio source set');
    return;
  }
  
  // Play audio
  elements.audioPlayer.play().then(() => {
    // Visual feedback
    elements.soundIconBtn.classList.add('playing');
    
    // Remove playing state when audio ends
    elements.audioPlayer.onended = () => {
      elements.soundIconBtn.classList.remove('playing');
    };
  }).catch(error => {
    console.error('❌ Error playing audio:', error);
  });
}

// ===== Navigation =====
function goToPrevWord() {
  if (currentWordIndex > 0) {
    showWord(currentWordIndex - 1);
  }
}

function goToNextWord() {
  if (currentWordIndex < wordList.length - 1) {
    showWord(currentWordIndex + 1);
  }
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
  // Sound icon button (next to word)
  elements.soundIconBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    playAudio();
  });
  
  // Navigation buttons
  elements.prevBtn.addEventListener('click', goToPrevWord);
  elements.nextBtn.addEventListener('click', goToNextWord);
  
  // Keyboard navigation
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

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    showWord,
    playAudio,
    goToPrevWord,
    goToNextWord
  };
}
