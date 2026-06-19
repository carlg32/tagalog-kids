/**
 * Clean Slide v2 — Tagalog Kids
 * Learn → Easy Quiz (2 choices) → Hard Quiz (4 choices)
 */

const CONFIG = {
  wordListFile: 'data/greetings.json',
  audioBasePath: 'assets/audio/',
  illustrationBasePath: 'assets/images/',
  progressKey: 'tagalog-kids-progress'
};

let wordList = [];
let currentIndex = 0;
let phase = 'learn'; // 'learn' | 'quiz-easy' | 'quiz-hard' | 'complete'
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
  $('next-btn').textContent = index < total - 1 ? 'Next →' : 'Finish →';
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
      .sort(() => 0.5 - Math.random())
      .slice(0, numWrong);
    const opts = [w, ...wrongs].sort(() => 0.5 - Math.random());
    return { word: w, options: opts, correct: w };
  });

  currentQuiz = { questions, index: 0, answers: [], type };

  showQuizQuestion();
}

function showQuizQuestion() {
  const q = currentQuiz.questions[currentQuiz.index];
  const totalQuestions = wordList.length * 2;
  const displayNum = wordList.length + currentQuiz.index + 1;

  $('tagalog-word').textContent = q.word.tagalog;
  $('english-translation').textContent = `"${q.word.english}"`;
  $('illustration').src = `${CONFIG.illustrationBasePath}${q.word.wordId}.webp`;

  $('progress-text').textContent = `${displayNum} / ${totalQuestions}`;
  $('progress-fill').style.width = `${(displayNum / totalQuestions) * 100}%`;

  $('prev-btn').style.display = 'none';
  $('next-btn').style.display = 'none';

  // Choices
  let html = '<div id="quiz-choices" style="margin-top:30px;display:flex;flex-direction:column;gap:12px">';
  q.options.forEach((opt, i) => {
    html += `<button onclick="answerQuiz(${i})" style="padding:14px 20px;font-size:1.15rem;border:none;border-radius:14px;background:white;cursor:pointer">${opt.tagalog}</button>`;
  });
  html += '</div>';

  const container = document.querySelector('.word-display');
  container.innerHTML = `
    <h1 style="font-size:2.1rem;margin-bottom:6px">${q.word.tagalog}</h1>
    <p style="font-size:1.05rem;opacity:0.8">"${q.word.english}"</p>
    ${html}
  `;
}

window.answerQuiz = function(i) {
  const q = currentQuiz.questions[currentQuiz.index];
  const correct = i === q.options.findIndex(o => o.wordId === q.correct.wordId);
  currentQuiz.answers.push(correct);

  const container = document.querySelector('.word-display');
  container.innerHTML = `
    <h1 style="font-size:2.1rem;margin-bottom:6px">${correct ? '✅ Correct!' : '❌ Not quite'}</h1>
    <p>Correct answer: <strong>${q.correct.tagalog}</strong></p>
  `;

  setTimeout(() => {
    currentQuiz.index++;
    if (currentQuiz.index >= currentQuiz.questions.length) {
      if (currentQuiz.type === 'easy') {
        startQuiz('hard');
      } else {
        showComplete();
      }
    } else {
      showQuizQuestion();
    }
  }, 1200);
}

function showComplete() {
  phase = 'complete';
  const correct = currentQuiz.answers.filter(Boolean).length;
  const total = currentQuiz.answers.length;

  $('tagalog-word').textContent = '🎉 Well Done!';
  $('english-translation').textContent = `You scored ${correct} / ${total}`;

  $('next-btn').style.display = 'none';
  $('prev-btn').style.display = 'none';
}

function init() {
  loadWordList().then(() => {
    if (wordList.length === 0) {
      document.body.innerHTML = '<h1 style="text-align:center;margin-top:120px">No words</h1>';
      return;
    }
    $('next-btn').addEventListener('click', () => {
      if (phase === 'learn') nextLearn();
    });
    $('prev-btn').addEventListener('click', () => {
      if (phase === 'learn' && currentIndex > 0) showLearnWord(currentIndex - 1);
    });
    $('sound-icon-btn').addEventListener('click', () => {
      const audio = $('audio-player');
      if (audio && audio.src) audio.play().catch(() => {});
    });

    showLearnWord(0);
  });
}

document.addEventListener('DOMContentLoaded', init);
