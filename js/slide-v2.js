/**
 * Clean Slide v2 — Tagalog Kids (Preserves buttons)
 */

const CONFIG = {
  wordListFile: 'data/greetings.json',
  audioBasePath: 'assets/audio/',
  illustrationBasePath: 'assets/images/',
  progressKey: 'tagalog-kids-progress'
};

let wordList = [];
let currentIndex = 0;
let phase = 'learn';
let currentQuiz = null;

const $ = id => document.getElementById(id);

async function loadWords() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('words');
  const res = await fetch(CONFIG.wordListFile);
  const all = await res.json();

  if (param && /^\d+$/.test(param)) {
    const n = parseInt(param);
    wordList = [...all].sort(() => 0.5 - Math.random()).slice(0, n);
  } else {
    wordList = all;
  }
}

function showLearnWord(index) {
  const word = wordList[index];
  currentIndex = index;

  $('tagalog-word').textContent = word.tagalog;
  $('english-translation').textContent = `"${word.english}"`;
  $('illustration').src = `${CONFIG.illustrationBasePath}${word.wordId}.webp`;

  const total = wordList.length;
  $('progress-text').textContent = `${index + 1} / ${total}`;
  $('progress-fill').style.width = `${((index + 1) / total) * 100}%`;

  $('prev-btn').style.display = index > 0 ? 'block' : 'none';
  $('next-btn').textContent = 'Next →';
  $('next-btn').style.display = 'block';

  // Remove any quiz choices
  const oldChoices = $('quiz-choices');
  if (oldChoices) oldChoices.remove();
}

function nextLearn() {
  if (currentIndex < wordList.length - 1) {
    showLearnWord(currentIndex + 1);
  } else {
    startQuiz('easy');
  }
}

function startQuiz(type) {
  phase = `quiz-${type}`;
  const numWrong = type === 'easy' ? 1 : 3;

  const questions = wordList.map(w => {
    const wrongs = wordList.filter(x => x.wordId !== w.wordId)
      .sort(() => 0.5 - Math.random()).slice(0, numWrong);
    const opts = [w, ...wrongs].sort(() => 0.5 - Math.random());
    return { word: w, options: opts, correct: w };
  });

  currentQuiz = { questions, index: 0, answers: [], type };
  showQuizQuestion();
}

function showQuizQuestion() {
  const q = currentQuiz.questions[currentQuiz.index];
  const totalQ = wordList.length * 2;
  const num = wordList.length + currentQuiz.index + 1;

  $('tagalog-word').textContent = q.word.tagalog;
  $('english-translation').textContent = `What does this mean?`;
  $('illustration').src = `${CONFIG.illustrationBasePath}${q.word.wordId}.webp`;

  $('progress-text').textContent = `${num} / ${totalQ}`;
  $('progress-fill').style.width = `${(num / totalQ) * 100}%`;

  $('prev-btn').style.display = 'block';
  $('next-btn').style.display = 'block';
  $('next-btn').textContent = 'Next →';

  // Remove old choices if exist
  const old = $('quiz-choices');
  if (old) old.remove();

  // Add choices
  let html = '<div id="quiz-choices" style="margin-top:25px;display:flex;flex-direction:column;gap:10px">';
  q.options.forEach((opt, i) => {
    html += `<button onclick="answerQuiz(${i})" style="padding:13px 18px;font-size:1.1rem;border:none;border-radius:12px;background:white;cursor:pointer">${opt.english}</button>`;
  });
  html += '</div>';

  const container = document.querySelector('.word-display');
  container.insertAdjacentHTML('beforeend', html);
}

window.answerQuiz = function(i) {
  const q = currentQuiz.questions[currentQuiz.index];
  const correct = q.options[i].wordId === q.correct.wordId;
  currentQuiz.answers.push(correct);

  const container = document.querySelector('.word-display');
  const choices = $('quiz-choices');
  if (choices) choices.innerHTML = `
    <p style="font-size:1.1rem;margin-top:10px">${correct ? '✅ Correct!' : '❌ Not quite'} — Correct: <strong>${q.correct.english}</strong></p>
  `;

  setTimeout(() => {
    if (choices) choices.remove();
    currentQuiz.index++;
    if (currentQuiz.index >= currentQuiz.questions.length) {
      if (currentQuiz.type === 'easy') startQuiz('hard');
      else showComplete();
    } else {
      showQuizQuestion();
    }
  }, 1100);
}

function showComplete() {
  phase = 'complete';
  const total = currentQuiz.answers.length;
  const correct = currentQuiz.answers.filter(Boolean).length;
  $('tagalog-word').textContent = '🎉 Great Job!';
  $('english-translation').textContent = `You scored ${correct} / ${total}`;
  $('next-btn').style.display = 'none';
  $('prev-btn').style.display = 'none';
}

function playAudio() {
  const audio = $('audio-player');
  if (audio && audio.src) audio.play().catch(() => {});
}

function setupListeners() {
  $('next-btn').addEventListener('click', () => {
    if (phase === 'learn') nextLearn();
  });
  $('prev-btn').addEventListener('click', () => {
    if (phase === 'learn' && currentIndex > 0) showLearnWord(currentIndex - 1);
  });
  $('sound-icon-btn').addEventListener('click', playAudio);
}

function init() {
  loadWords().then(() => {
    if (wordList.length === 0) {
      document.body.innerHTML = '<h1 style="text-align:center;margin-top:120px">No words</h1>';
      return;
    }
    showLearnWord(0);
    setupListeners();
  });
}

document.addEventListener('DOMContentLoaded', init);
