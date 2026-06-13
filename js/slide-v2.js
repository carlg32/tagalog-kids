/**
 * Slide Template JavaScript v2 — Tagalog Kids
 * 
 * Seamless 3-phase flow:
 *   1. LEARN: word slides with 🔊 practice
 *   2. QUIZ EASY: 5 questions, 2 choices → auto
 *   3. QUIZ HARD: 5 questions, 4 choices → auto
 *   4. CONGRATS: final score + celebration
 */

const CONFIG = {
  wordListFile: 'data/word-list-grade1-greetings-all.json',
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
let allQuizAnswers = {};  // keyed by "phase-index" — survives re-answer

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
  exampleSentence: $('example-sentence'),
  soundBar: $('sound-bar')
};

async function init() {
  await loadWordList();
  loadProgress();
  setupEventListeners();
  startLearning();
}

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
  el.soundBar.style.display = 'flex';
  showLearnSection();
  showWord(currentWordIndex);
}

function showWord(index) {
  if (index < 0 || index >= wordList.length) return;
  const word = wordList[index];
  currentWordIndex = index;

  el.tagalogWord.textContent = word.tagalog;
  el.englishTranslation.textContent = `"${word.english}"`;

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

  el.audioPlayer.src = `${CONFIG.audioBasePath}${word.wordId}.mp3`;

  const wp = progress.words?.[word.wordId];
  el.phaseBadge.textContent = wp?.mastered ? '⭐ Mastered' : (wp?.timesPracticed ? `🔊 ${wp.timesPracticed}/3` : 'Learn');

  const total = wordList.length;
  el.progressText.textContent = `${index + 1} / ${total}`;
  el.progressFill.style.width = `${((index + 1) / total) * 100}%`;

  el.prevBtn.style.display = index > 0 ? 'block' : 'none';
  el.nextBtn.textContent = 'Next →';

  if (word.exampleTagalog && word.exampleEnglish) {
    document.querySelector('#example-sentence .tagalog-text').textContent = word.exampleTagalog;
    document.querySelector('#example-sentence .english-text').textContent = word.exampleEnglish;
    el.exampleSentence.style.display = 'block';
  } else {
    el.exampleSentence.style.display = 'none';
  }

  // Show sound bar for learn phase
  el.soundBar.style.display = 'flex';
}

// =====================================================================
//  PHASE 2 & 3: QUIZ
// =====================================================================

function startQuiz(difficulty) {
  phase = difficulty === 'hard' ? 'quiz-hard' : 'quiz-easy';
  answered = false;
  if (difficulty === 'easy') allQuizAnswers = {};
  const count = 5;
  quiz = new QuizEngine(wordList, difficulty, count);

  el.phaseBadge.textContent = difficulty === 'hard' ? 'Quiz Hard' : 'Quiz Easy';
  showQuizQuestion();
}

function showQuizQuestion() {
  const q = quiz.getCurrentQuestion();
  if (!q) {
    if (phase === 'quiz-easy') startQuiz('hard');
    else showCongrats();
    return;
  }

  answered = false;
  const pg = quiz.getProgress();
  el.progressText.textContent = `${pg.current} / ${pg.total}`;
  el.progressFill.style.width = `${pg.percentage}%`;

  showQuizSection();

  const typeIcon = { 'word-match': '', 'translation-match': '', 'audio-quiz': '🔊 ', 'image-quiz': '📷 ' };
  el.questionStem.textContent = (typeIcon[q.type] || '') + q.stem;

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

  // Prev button: show on questions 2+ (not first question)
  el.prevBtn.style.display = pg.current > 1 ? 'block' : 'none';
  el.soundBar.style.display = 'none';
}

function selectQuizAnswer(index) {
  if (answered) return;
  answered = true;

  const result = quiz.answer(index);
  if (!result) return;

  // Store in map (replaces if re-answered after going back)
  const key = phase + '-' + quiz.currentIndex;
  allQuizAnswers[key] = { wordId: result.wordId, correct: result.correct };

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
  el.prevBtn.style.display = 'none';
  el.soundBar.style.display = 'none';

  const allAnswers = Object.values(allQuizAnswers);
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
//  NAVIGATION
// =====================================================================

function onNextClick() {
  switch (phase) {
    case 'learn':
      if (currentWordIndex < wordList.length - 1) {
        showWord(currentWordIndex + 1);
      } else {
        startQuiz('easy');
      }
      break;
    case 'quiz-easy':
    case 'quiz-hard':
      const nextQ = quiz.nextQuestion();
      if (nextQ) showQuizQuestion();
      else {
        if (phase === 'quiz-easy') startQuiz('hard');
        else showCongrats();
      }
      break;
  }
}

function onPrevClick() {
  switch (phase) {
    case 'learn':
      if (currentWordIndex > 0) showWord(currentWordIndex - 1);
      break;
    case 'quiz-easy':
    case 'quiz-hard':
      // Remove current answer from accumulated map
      const key = phase + '-' + quiz.currentIndex;
      delete allQuizAnswers[key];
      const prevQ = quiz.prevQuestion();
      if (prevQ) showQuizQuestion();
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
}

// =====================================================================
//  ANIMATIONS
// =====================================================================

const ANIMATION_DEFS = {
  'kumusta':        { imgClass: 'img-anim-bounce',       overlays: [] },
  'salamat':        { imgClass: '',                       overlays: [{ class: 'overlay-heart', text: '❤️', top: '5%', right: '5%', left: 'auto', bottom: 'auto' }] },
  'magandang-umaga':{ imgClass: '',                       overlays: [{ class: 'overlay-sun', text: '☀️', top: '3%', left: '10%', right: 'auto', bottom: 'auto' }] },
  'paalam':         { imgClass: 'img-anim-bounce',       overlays: [{ class: 'overlay-waving', text: '👋', top: '5%', right: '10%', left: 'auto', bottom: 'auto' }] },
  'magandang-hapon':{ imgClass: 'img-anim-bounce-fast',  overlays: [] },
  'magandang-gabi': { imgClass: '',                       overlays: [{ class: 'overlay-star', text: '⭐', top: '5%', left: '15%', right: 'auto', bottom: 'auto' }, { class: 'overlay-star-2', text: '✨', top: '10%', right: '12%', left: 'auto', bottom: 'auto' }] },
  'magandang-araw': { imgClass: '',                       overlays: [{ class: 'overlay-rainbow overlay-rainbow-anim', text: '🌈', bottom: '5%', left: '10%', top: 'auto', right: 'auto' }] },
  'tuloy-kayo':     { imgClass: 'img-anim-breathe',      overlays: [] },
  'hanggang-sa-muli':{ imgClass: 'img-anim-bounce',      overlays: [{ class: 'overlay-float-hearts', text: '💕', bottom: '10%', left: '50%', top: 'auto', right: 'auto' }] },
  'kumain-ka-na':   { imgClass: '',                       overlays: [{ class: 'overlay-steam', text: '💨', top: '8%', left: '45%', right: 'auto', bottom: 'auto' }, { class: 'overlay-steam-2', text: '💨', top: '12%', left: '55%', right: 'auto', bottom: 'auto' }] },
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
    const map = { 'img-anim-bounce': 'bounce-gentle 2s ease-in-out infinite', 'img-anim-bounce-fast': 'bounce-gentle 1.5s ease-in-out infinite', 'img-anim-breathe': 'breathe 2.5s ease-in-out infinite', 'img-anim-slide': 'slide-side 2s ease-in-out infinite alternate' };
    if (map[def.imgClass]) el.illustration.style.animation = map[def.imgClass];
  }
  def.overlays.forEach(o => {
    const span = document.createElement('span');
    span.className = `animation-overlay ${o.class}`; span.textContent = o.text;
    span.style.top = o.top || 'auto'; span.style.left = o.left || 'auto';
    span.style.right = o.right || 'auto'; span.style.bottom = o.bottom || 'auto';
    el.characterScene.appendChild(span);
  });
}

function playAudio() {
  if (!el.audioPlayer.src) return;
  const word = wordList[currentWordIndex];
  if (word) trackPractice(word.wordId);
  el.audioPlayer.play().then(() => {
    el.soundIconBtn.classList.add('playing');
    el.audioPlayer.onended = () => el.soundIconBtn.classList.remove('playing');
  }).catch(() => {});
}

function setupEventListeners() {
  el.soundIconBtn.addEventListener('click', e => { e.stopPropagation(); playAudio(); });
  el.nextBtn.addEventListener('click', onNextClick);
  el.prevBtn.addEventListener('click', onPrevClick);

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (phase === 'learn' && el.nextBtn.disabled) return;
      onNextClick();
    }
    if (e.key === 'ArrowLeft') {
      onPrevClick();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

const quizAudio = document.createElement('audio');
quizAudio.id = 'quiz-audio';
document.body.appendChild(quizAudio);
