/**
 * Slide Template JavaScript — Tagalog Kids
 * 
 * Features:
 * - Load word data from JSON
 * - Play audio pronunciation
 * - Navigate between slides
 * - Track progress (localStorage)
 * - Mark words as complete
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
  audioBtn: document.getElementById('audio-btn'),
  audioPlayer: document.getElementById('audio-player'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  completeBtn: document.getElementById('complete-btn'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  exampleSentence: document.getElementById('example-sentence')
};

// ===== Initialize =====
async function init() {
  console.log('🎤 Initializing Tagalog Kids Slide...');
  
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

// ===== Show Word =====
function showWord(index) {
  if (index < 0 || index >= wordList.length) {
    console.warn('⚠️ Word index out of bounds:', index);
    return;
  }
  
  const word = wordList[index];
  currentWordIndex = index;
  
  // Update UI
  elements.tagalogWord.textContent = word.tagalog;
  elements.englishTranslation.textContent = `"${word.english}"`;
  
  // Update illustration (if exists, else show placeholder)
  const illustrationPath = `${CONFIG.illustrationBasePath}${word.wordId}.svg`;
  elements.illustration.src = illustrationPath;
  elements.illustration.alt = `Illustration for ${word.tagalog}`;
  elements.illustration.onerror = () => {
    // If illustration doesn't exist, show placeholder
    elements.illustration.style.display = 'none';
    elements.characterScene.innerHTML = '<div class="placeholder-illustration">🎨</div>';
  };
  elements.illustration.onload = () => {
    elements.illustration.style.display = 'block';
    elements.characterScene.querySelector('.placeholder-illustration')?.remove();
  };
  
  // Update audio source
  const audioPath = `${CONFIG.audioBasePath}${word.wordId}.mp3`;
  elements.audioPlayer.src = audioPath;
  
  // Update progress bar
  const progressPercent = ((index + 1) / wordList.length) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
  elements.progressText.textContent = `${index + 1} / ${wordList.length}`;
  
  // Update navigation buttons
  elements.prevBtn.disabled = index === 0;
  elements.nextBtn.disabled = index === wordList.length - 1;
  
  // Update complete button
  const isCompleted = progress.words[word.wordId]?.completed;
  elements.completeBtn.textContent = isCompleted ? '✓ Completed!' : '✓ Mark Complete';
  elements.completeBtn.style.opacity = isCompleted ? '0.6' : '1';
  
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
    elements.audioBtn.classList.add('playing');
    elements.audioBtn.querySelector('.audio-icon').textContent = '🔊';
    
    // Remove playing state when audio ends
    elements.audioPlayer.onended = () => {
      elements.audioBtn.classList.remove('playing');
      elements.audioBtn.querySelector('.audio-icon').textContent = '🔊';
    };
  }).catch(error => {
    console.error('❌ Error playing audio:', error);
  });
}

// ===== Mark Complete =====
function markComplete() {
  const word = wordList[currentWordIndex];
  const wordId = word.wordId;
  
  // Toggle completion
  if (!progress.words[wordId]) {
    progress.words[wordId] = {};
  }
  
  progress.words[wordId].completed = !progress.words[wordId].completed;
  progress.words[wordId].completedAt = new Date().toISOString();
  
  // Update UI
  const isCompleted = progress.words[wordId].completed;
  elements.completeBtn.textContent = isCompleted ? '✓ Completed!' : '✓ Mark Complete';
  elements.completeBtn.style.opacity = isCompleted ? '0.6' : '1';
  
  // Save progress
  saveProgress();
  
  console.log(`✅ ${word.tagalog} marked as ${isCompleted ? 'completed' : 'incomplete'}`);
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
  // Audio button
  elements.audioBtn.addEventListener('click', playAudio);
  
  // Navigation buttons
  elements.prevBtn.addEventListener('click', goToPrevWord);
  elements.nextBtn.addEventListener('click', goToNextWord);
  
  // Complete button
  elements.completeBtn.addEventListener('click', markComplete);
  
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
        event.preventDefault();
        playAudio();
        break;
      case 'Enter':
        markComplete();
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
    markComplete,
    goToPrevWord,
    goToNextWord
  };
}
