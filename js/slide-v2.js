/**
 * Slide Template JavaScript v2 — Tagalog Kids
 * 
 * Seamless 3-phase flow:
 *   1. LEARN: word slides with 🔊 practice
 *   2. QUIZ EASY: 5 questions, 2 choices → auto
 *   3. QUIZ HARD: 5 questions, 4 choices → auto
 *   4. CONGRATS: final score + celebration
 * 
 * Student just presses "Next" the whole way through.
 */

// ===== Configuration =====
const CONFIG = {
  wordListFile: 'data/greetings.json',
  audioBasePath: 'assets/audio/',
  illustrationBasePath: 'assets/images/',
  progressKey: 'tagalog-kids-progress'
};

// ===== State =====
let wordList = [];
let progress = {};
let phase = 'learn';  // 'learn' | 'quiz-easy' | 'quiz-hard' | 'complete'
let currentWordIndex = 0;
let quiz = null;
let answered = false;
let sessionWords = [];

// ===== DOM Elements =====
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
  quizIcon: $('quiz-icon'),
  exampleSentence: $('example-sentence')
};

// ===== Initialize =====
async function init() {
  await loadWordList();
  loadProgress();
  setupEventListeners();
  startLearning();
}

// ===== Load Word List =====
async function loadWordList() {
  const params = new URLSearchParams(window.location.search);
  const wordIdsParam = params.get('words');

  if (wordIdsParam) {
    const response = await fetch(CONFIG.wordListFile);
    const allWords = await response.json();
    const wantedIds = wordIdsParam.split(',').map(s => s.trim());
    wordList = wantedIds.map(id => allWords.find(w => w.wordId === id)).filter(Boolean);
    sessionWords = wordList.map(w => w.wordId);
  } else {
    const response = await fetch(CONFIG.wordListFile);
    wordList = await response.json();
    sessionWords = wordList.map(w => w.wordId);
  }
}

// ===== Progress =====
function loadProgress() {
  const saved = localStorage.getItem(CONFIG.progressKey);
  progress = saved ? JSON.parse(saved) : { words: {}, streak: 0, lastActiveDate: null };
  if (!progress.words) progress.words = {};
  if (!progress.streak) progress.streak = 0;
  
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastActiveDate === today) { /* OK */ }
  else if (progress.lastActiveDate) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    progress.streak = progress.lastActiveDate === yesterday ? progress.streak + 1 : 0;
  }
  progress.lastActiveDate = today;
  saveProgress();
}

function saveProgress() {
  localStorage.setItem(CONFIG.progressKey, JSON.stringify(progress));
}

function trackPractice(wordId) {
  if (!progress.words[wordId]) progress.words[wordId] = { timesPracticed: 0, mastered: false };
  const wp = progress.words[wordId];
  wp.lastPracticed = new Date().toISOString();
  wp.timesPracticed = (wp.timesPracticed || 0) + 1;
  wp.mastered = wp.timesPracticed >= 3;
  saveProgress();
}

// =====================================================================
//  PHASE 1: LEARN
// =====================================================================

function startLearning() {
  phase = 'learn';
  currentWordIndex = 0;
  showLearnSection();
  showWord(currentWordIndex);
}

function showWord(index) {
  if (index < 0 || index >= wordList.length) return;
  const word = wordList[index];
  currentWordIndex = index;

  // Word + translation
  const soundBtn = el.soundIconBtn;
  el.tagalogWord.textContent = word.tagalog;
  el.tagalogWord.appendChild(soundBtn);
  el.englishTranslation.textContent = `"${word.english}"`;

  // Illustration
  el.illustration.src = `${CONFIG.illustrationBasePath}${word.wordId}.webp`;
  el.illustration.alt = `Illustration for ${word.tagalog}`;
  applyAnimation(word.wordId);

  el.illustration.onerror = () => {
    el.illustration.style.display = 'none';
    el.characterScene.innerHTML = '<div class="placeholder-illustration">🎨</div>';
    el.characterScene.appendChild(el.illustration);
  };
  el.illustration.onload = () => {
    el.illustration.style.display = 'block';
    const ph = el.characterScene.querySelector('.placeholder-illustration');
    if (ph) ph.remove();
  };

  // Audio
  el.audioPlayer.src = `${CONFIG.audioBasePath}${word.wordId}.mp3`;

  // Mastery badge
  const wp = progress.words?.[word.wordId];
  el.phaseBadge.textContent = wp?.mastered ? '⭐ Mastered' : (wp?.timesPracticed ? `🔊 ${wp.timesPracticed}/3` : 'Learn');

  // Progress
  const total = wordList.length;
  el.progressText.textContent = `${index + 1} / ${total}`;
  el.progressFill.style.width = `${((index + 1) / total) * 100}%`;

  // Previous button (only during learn)
  el.prevBtn.style.display = index > 0 ? 'block' : 'none';
  el.nextBtn.textContent = index < total - 1 ? 'Next →' : 'Next →';

  // Example sentence
  if (word.exampleTagalog && word.exampleEnglish) {
    document.querySelector('#example-sentence .tagalog-text').textContent = word.exampleTagalog;
    document.querySelector('#example-sentence .english-text').textContent = word.exampleEnglish;
    el.exampleSentence.style.display = 'block';
  } else {
    el.exampleSentence.style.display = 'none';
  }
}

// =====================================================================
//  PHASE 2 & 3: QUIZ (Easy then Hard)
// =====================================================================

function startQuiz(difficulty) {
  phase = difficulty === 'hard' ? 'quiz-hard' : 'quiz-easy';
  answered = false;
  const count = 5;
  quiz = new QuizEngine(wordList, difficulty, count);

  el.phaseBadge.textContent = difficulty === 'hard' ? 'Quiz Hard' : 'Quiz Easy';
  showQuizQuestion();
}

function showQuizQuestion() {
  const q = quiz.getCurrentQuestion();
  if (!q) {
    // Quiz ended → transition to next phase
    if (phase === 'quiz-easy') {
      // Auto-start hard quiz
      startQuiz('hard');
    } else {
      showCongrats();
    }
    return;
  }

  answered = false;

  // Progress
  const pg = quiz.getProgress();
  el.progressText.textContent = `${pg.current} / ${pg.total}`;
  el.progressFill.style.width = `${pg.percentage}%`;

  // Show quiz section, hide learn
  showQuizSection();

  // Question stem
  const typeIcon = { 'word-match': '', 'translation-match': '', 'audio-quiz': '🔊 ', 'image-quiz': '📷 ' };
  el.questionStem.textContent = (typeIcon[q.type] || '') + q.stem;

  // Quiz icon
  const icons = { 'word-match': '📝', 'translation-match': '📝', 'audio-quiz': '🔊', 'image-quiz': '📷' };
  el.quizIcon.textContent = icons[q.type] || '📝';

  // Audio/Image media
  let mediaHtml = '';
  if (q.type === 'audio-quiz' && q.audioFile) {
    mediaHtml = `<button class="quiz-audio-btn" onclick="document.getElementById('quiz-audio').src='${q.audioFile}';document.getElementById('quiz-audio').play()">🔊</button>`;
  }
  if (q.type === 'image-quiz' && q.imageFile) {
    mediaHtml = `<img src="${q.imageFile}" class="quiz-image" alt="Quiz illustration">`;
  }
  el.quizIcon.innerHTML = mediaHtml || '📝';

  // Choices
  el.choices.innerHTML = '';
  el.feedback.textContent = '';
  el.feedback.className = 'feedback';

  q.choices.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = text;
    btn.onclick = () => selectQuizAnswer(i);
    el.choices.appendChild(btn);
  });
}

function selectQuizAnswer(index) {
  if (answered) return;
  answered = true;

  const result = quiz.answer(index);
  if (!result) return;

  const btns = document.querySelectorAll('.choice-btn');
  btns.forEach(b => b.disabled = true);

  if (result.correct) {
    btns[index].classList.add('correct');
    el.feedback.textContent = '✅ Correct!';
    el.feedback.className = 'feedback correct';
  } else {
    btns[index].classList.add('wrong');
    btns[result.correctIndex].classList.add('reveal-correct');
    el.feedback.textContent = `❌ The answer was: ${quiz.getCurrentQuestion().choices[result.correctIndex]}`;
    el.feedback.className = 'feedback wrong';
  }

  // Next button shows automatically
}

// =====================================================================
//  PHASE 4: CONGRATULATIONS
// =====================================================================

function showCongrats() {
  phase = 'complete';
  el.progressFill.style.width = '100%';
  el.progressText.textContent = 'Done!';
  el.phaseBadge.textContent = '🎉 Complete';

  el.learnSection.style.display = 'none';
  el.quizSection.style.display = 'none';
  el.congratsSection.style.display = 'flex';
  el.nextBtn.style.display = 'none';

  // Combine easy + hard results
  const allAnswers = quiz ? quiz.answers : [];
  const correct = allAnswers.filter(a => a.correct).length;
  const total = allAnswers.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  el.congratsScore.textContent = `${pct}%`;
  if (pct >= 80) {
    el.congratsMessage.textContent = '🎉 Ang galing! Excellent!';
    el.congratsScore.style.color = '#7ED321';
  } else if (pct >= 50) {
    el.congratsMessage.textContent = '👍 Magaling! Good job!';
    el.congratsScore.style.color = '#F5A623';
  } else {
    el.congratsMessage.textContent = '💪 Keep practicing! Try again!';
    el.congratsScore.style.color = '#D0021B';
  }

  // Per-word breakdown
  const detail = el.congratsDetail;
  detail.innerHTML = '<h3 style="font-size:0.9rem;margin-bottom:0.5rem;opacity:0.7;">Words:</h3>';
  const wordResults = {};
  for (const a of allAnswers) {
    if (!wordResults[a.wordId]) wordResults[a.wordId] = { correct: 0, total: 0 };
    wordResults[a.wordId].total++;
    if (a.correct) wordResults[a.wordId].correct++;
  }
  for (const [wordId, stat] of Object.entries(wordResults)) {
    const w = wordList.find(x => x.wordId === wordId);
    const p = Math.round((stat.correct / stat.total) * 100);
    const d = document.createElement('div');
    d.className = 'result-word';
    d.innerHTML = `<span style="font-weight:700;">${w ? w.tagalog : wordId}</span> <span style="color:${p >= 50 ? '#7ED321' : '#D0021B'}">${stat.correct}/${stat.total}</span>`;
    detail.appendChild(d);
  }

  saveProgress();
}

// =====================================================================
//  NAVIGATION — Single "Next" button handles everything
// =====================================================================

function onNextClick() {
  switch (phase) {
    case 'learn':
      if (currentWordIndex < wordList.length - 1) {
        showWord(currentWordIndex + 1);
      } else {
        // Last word → auto-transition to quiz
        startQuiz('easy');
      }
      break;

    case 'quiz-easy':
    case 'quiz-hard':
      const nextQ = quiz.nextQuestion();
      if (nextQ) {
        showQuizQuestion();
      } else {
        // Quiz ended → handled by showQuizQuestion's null check
      }
      break;
  }
}

// =====================================================================
//  UI HELPERS
// =====================================================================

function showLearnSection() {
  el.learnSection.style.display = 'flex';
  el.quizSection.style.display = 'none';
  el.congratsSection.style.display = 'none';
  el.nextBtn.style.display = 'block';
  el.nextBtn.textContent = 'Next →';
}

function showQuizSection() {
  el.learnSection.style.display = 'none';
  el.quizSection.style.display = 'flex';
  el.congratsSection.style.display = 'none';
  el.nextBtn.style.display = 'block';
  el.nextBtn.textContent = 'Next →';
  el.prevBtn.style.display = 'none';
}

// =====================================================================
//  ANIMATIONS (unchanged from v2)
// =====================================================================

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

function applyAnimation(wordId) {
  el.illustration.className = 'illustration';
  const overlays = el.characterScene.querySelectorAll('.animation-overlay');
  overlays.forEach(o => o.remove());
  
  const key = wordId.split('-').slice(3).join('-');
  const def = ANIMATION_DEFS[key];
  if (!def) return;
  
  el.illustration.style.animation = '';
  if (def.imgClass) {
    const map = {
      'img-anim-bounce': 'bounce-gentle 2s ease-in-out infinite',
      'img-anim-bounce-fast': 'bounce-gentle 1.5s ease-in-out infinite',
      'img-anim-breathe': 'breathe 2.5s ease-in-out infinite',
      'img-anim-slide': 'slide-side 2s ease-in-out infinite alternate',
    };
    if (map[def.imgClass]) el.illustration.style.animation = map[def.imgClass];
  }
  def.overlays.forEach(o => {
    const span = document.createElement('span');
    span.className = `animation-overlay ${o.class}`;
    span.textContent = o.text;
    span.style.top = o.top || 'auto';
    span.style.left = o.left || 'auto';
    span.style.right = o.right || 'auto';
    span.style.bottom = o.bottom || 'auto';
    el.characterScene.appendChild(span);
  });
}

// ===== Audio Playback =====
function playAudio() {
  if (!el.audioPlayer.src) return;
  const word = wordList[currentWordIndex];
  if (word) trackPractice(word.wordId);
  
  el.audioPlayer.play().then(() => {
    el.soundIconBtn.classList.add('playing');
    el.audioPlayer.onended = () => el.soundIconBtn.classList.remove('playing');
  }).catch(() => {});
}

// ===== Event Listeners =====
function setupEventListeners() {
  el.soundIconBtn.addEventListener('click', e => { e.stopPropagation(); playAudio(); });
  el.nextBtn.addEventListener('click', onNextClick);
  el.prevBtn.addEventListener('click', () => {
    if (phase === 'learn' && currentWordIndex > 0) showWord(currentWordIndex - 1);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (phase === 'learn' && el.nextBtn.disabled) return;
      onNextClick();
    }
    if (e.key === 'ArrowLeft' && phase === 'learn') {
      if (currentWordIndex > 0) showWord(currentWordIndex - 1);
    }
  });
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);

// Audio element for quiz
const quizAudio = document.createElement('audio');
quizAudio.id = 'quiz-audio';
document.body.appendChild(quizAudio);

// ===== Voice Input Integration (Browser Web Speech API) =====
let voiceInput = null;

function initVoiceInput() {
  // Dynamically import the module (works with static site)
  import('./js/voice-input.js').then(module => {
    const { initVoiceInput: createVoice, createMicButton } = module;

    voiceInput = createVoice({
      lang: 'fil-PH',
      onResult: ({ transcript, confidence, matched }) => {
        const feedbackEl = document.getElementById('voice-feedback');
        if (!feedbackEl) return;

        let color = '#f59e0b'; // yellow
        let message = `Heard: "${transcript}"`;

        if (matched) {
          color = '#22c55e'; // green
          message = `✅ Great! "${transcript}"`;
        } else if (confidence > 0.7) {
          color = '#3b82f6'; // blue
        } else {
          color = '#ef4444'; // red
          message = `Try again — heard: "${transcript}"`;
        }

        feedbackEl.style.color = color;
        feedbackEl.textContent = message;
        feedbackEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
          if (feedbackEl) feedbackEl.style.display = 'none';
        }, 3000);
      },
      onStart: () => {
        const btn = document.getElementById('mic-btn');
        if (btn) btn.style.opacity = '0.7';
      },
      onEnd: () => {
        const btn = document.getElementById('mic-btn');
        if (btn && btn.resetUI) btn.resetUI();
      },
      onError: (err) => {
        console.warn('[Voice] Error:', err);
        const feedbackEl = document.getElementById('voice-feedback');
        if (feedbackEl) {
          feedbackEl.style.color = '#ef4444';
          feedbackEl.textContent = 'Voice recognition error. Try again.';
          feedbackEl.style.display = 'block';
          setTimeout(() => feedbackEl.style.display = 'none', 2500);
        }
      }
    });

    // Create mic button next to sound button
    const soundContainer = document.querySelector('.sound-centered');
    if (soundContainer && voiceInput) {
      const micBtn = createMicButton(soundContainer, voiceInput);
      // Add a small feedback line below
      const feedback = document.createElement('div');
      feedback.id = 'voice-feedback';
      feedback.style.cssText = 'margin-top:8px; font-size:0.95rem; text-align:center; min-height:24px; display:none;';
      soundContainer.appendChild(feedback);
    }
  }).catch(err => {
    console.log('[Voice] Module not loaded (expected on some pages)');
  });
}

// Initialize voice on DOM ready (after main init)
document.addEventListener('DOMContentLoaded', () => {
  // Delay slightly so main lesson init completes
  setTimeout(initVoiceInput, 800);
});

// ===== Voice Input Integration (Kid-friendly) =====
let voiceInput = null;

function initVoiceInput() {
  import('./js/voice-input.js').then(module => {
    const { initVoiceInput: createVoice, createMicButton } = module;

    voiceInput = createVoice({
      lang: 'fil-PH',
      onResult: ({ transcript, confidence, matched }) => {
        // This is handled inside createMicButton now via the returned feedbackEl
        console.log('[Voice] Result:', transcript, 'matched:', matched);
      },
      onStart: () => {},
      onEnd: () => {},
      onError: (err) => {
        console.warn('[Voice] Error:', err);
      }
    });

    const soundContainer = document.querySelector('.sound-centered');
    if (soundContainer && voiceInput) {
      const { feedbackEl, retryBtn } = createMicButton(soundContainer, voiceInput);

      // Override the onResult to update the kid-friendly feedback
      const originalOnResult = voiceInput.onResult;
      // Re-attach with kid-friendly messages
      voiceInput = createVoice({
        lang: 'fil-PH',
        onResult: ({ transcript, confidence, matched }) => {
          let emoji = '🟡';
          let message = `I heard: "${transcript}"`;

          if (matched) {
            emoji = '🌟';
            message = `Awesome! You said it perfectly!`;
            feedbackEl.style.background = '#dcfce7';
            feedbackEl.style.color = '#166534';
          } else if (confidence > 0.75) {
            emoji = '😊';
            message = `Good try! I heard "${transcript}"`;
            feedbackEl.style.background = '#dbeafe';
            feedbackEl.style.color = '#1e40af';
          } else {
            emoji = '💪';
            message = `Nice effort! Try saying "${transcript}" again`;
            feedbackEl.style.background = '#fee2e2';
            feedbackEl.style.color = '#991b1b';
          }

          feedbackEl.innerHTML = `${emoji} ${message}`;
          feedbackEl.style.display = 'block';
          retryBtn.style.display = 'inline-block';
        },
        onStart: () => {
          feedbackEl.style.display = 'none';
          retryBtn.style.display = 'none';
        },
        onEnd: () => {
          const micBtn = document.getElementById('mic-btn');
          if (micBtn && micBtn.resetUI) micBtn.resetUI();
        },
        onError: (err) => {
          feedbackEl.style.background = '#fee2e2';
          feedbackEl.style.color = '#991b1b';
          feedbackEl.innerHTML = `😕 Oops! Something went wrong. Try again!`;
          feedbackEl.style.display = 'block';
          setTimeout(() => feedbackEl.style.display = 'none', 2500);
        }
      });
    }
  }).catch(() => {
    console.log('[Voice] Module not available on this page');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initVoiceInput, 900);
});
