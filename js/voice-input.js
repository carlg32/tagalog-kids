/**
 * Voice Input Module — Tagalog Kids (Browser Web Speech API)
 * Kid-friendly pronunciation practice with zero cost
 */

export function initVoiceInput(options = {}) {
  const {
    lang = 'fil-PH',
    onResult = () => {},
    onStart = () => {},
    onEnd = () => {},
    onError = () => {}
  } = options;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('[VoiceInput] Web Speech API not supported');
    return null;
  }

  let recognition = null;
  let isListening = false;

  function createRecognition() {
    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;
      const matched = options.expectedWord
        ? transcript.toLowerCase() === options.expectedWord.toLowerCase()
        : false;
      onResult({ transcript, confidence, matched });
    };

    recognition.onstart = () => { isListening = true; onStart(); };
    recognition.onend = () => { isListening = false; onEnd(); };
    recognition.onerror = (event) => { isListening = false; onError(event.error); };
  }

  function start(expectedWord = null) {
    if (!recognition) createRecognition();
    if (isListening) return;
    options.expectedWord = expectedWord;
    try { recognition.start(); } catch (e) { onError('start-failed'); }
  }

  function stop() {
    if (recognition && isListening) recognition.stop();
  }

  return { start, stop, isSupported: true, isListening: () => isListening };
}

// ===== Kid-friendly Mic Button + Mobile + Listening Animation =====
export function createMicButton(container, voiceInstance) {
  const btn = document.createElement('button');
  btn.id = 'mic-btn';
  btn.innerHTML = `<span class="mic-icon">🎤</span><span class="mic-label">Speak!</span>`;

  // Base styles + mobile enlargement
  btn.style.cssText = `
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 32px; font-size: 1.2rem; font-weight: 800;
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: white; border: none; border-radius: 9999px;
    cursor: pointer; box-shadow: 0 8px 25px rgba(74, 222, 128, 0.5);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  // Mobile enlargement
  const mobileStyle = document.createElement('style');
  mobileStyle.textContent = `
    @media (max-width: 768px) {
      #mic-btn {
        padding: 20px 40px !important;
        font-size: 1.35rem !important;
        gap: 12px !important;
      }
    }
  `;
  document.head.appendChild(mobileStyle);

  // Feedback
  const feedback = document.createElement('div');
  feedback.id = 'voice-feedback';
  feedback.style.cssText = `
    margin-top: 14px; font-size: 1.1rem; font-weight: 700;
    text-align: center; min-height: 36px; display: none;
    padding: 10px 20px; border-radius: 9999px;
    animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;

  // Animations
  if (!document.getElementById('voice-anim-style')) {
    const style = document.createElement('style');
    style.id = 'voice-anim-style';
    style.textContent = `
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0.6) translateY(10px); }
        60% { transform: scale(1.1) translateY(-2px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes pulseRetry {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
        70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
      }
      @keyframes listeningPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      .listening-ring {
        display: inline-block;
        width: 18px; height: 18px;
        border: 3px solid rgba(255,255,255,0.9);
        border-radius: 50%;
        margin-right: 8px;
        animation: listeningPulse 1.2s infinite ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }

  // Prominent Retry Button
  const retryBtn = document.createElement('button');
  retryBtn.innerHTML = `🔄 <span>Practice Again</span>`;
  retryBtn.style.cssText = `
    display: none; margin-top: 10px;
    padding: 12px 26px; font-size: 1.05rem; font-weight: 800;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white; border: none; border-radius: 9999px;
    cursor: pointer; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    animation: pulseRetry 2s infinite ease-in-out;
    transition: transform 0.2s ease;
  `;

  let listening = false;

  function resetUI() {
    listening = false;
    btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
    btn.style.boxShadow = '0 8px 25px rgba(74, 222, 128, 0.5)';
    btn.innerHTML = `<span class="mic-icon">🎤</span><span class="mic-label">Speak!</span>`;
    feedback.style.display = 'none';
    retryBtn.style.display = 'none';
  }

  btn.addEventListener('click', () => {
    if (!voiceInstance) {
      feedback.style.cssText += ';background:#fee2e2;color:#991b1b;';
      feedback.innerHTML = `😕 Voice not supported here`;
      feedback.style.display = 'block';
      return;
    }
    if (listening) {
      voiceInstance.stop();
      return;
    }

    const expectedEl = document.getElementById('tagalog-word');
    const expected = expectedEl ? expectedEl.textContent.trim() : null;

    voiceInstance.start(expected);
    listening = true;

    // Listening state
    btn.style.background = 'linear-gradient(135deg, #f87171, #ef4444)';
    btn.style.boxShadow = '0 8px 25px rgba(248, 113, 113, 0.6)';
    btn.innerHTML = `
      <span class="listening-ring"></span>
      <span class="mic-label">Listening…</span>
    `;
  });

  retryBtn.addEventListener('click', () => {
    resetUI();
    setTimeout(() => btn.click(), 80);
  });

  // Assemble
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
  wrapper.appendChild(btn);
  wrapper.appendChild(feedback);
  wrapper.appendChild(retryBtn);
  container.appendChild(wrapper);

  btn.resetUI = resetUI;
  return { button: btn, feedbackEl: feedback, retryBtn };
}