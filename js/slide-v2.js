  el.prevBtn.style.display = index > 0 ? 'block' : 'none';
  el.nextBtn.style.display = index < wordList.length - 1 ? 'block' : 'none';
  el.prevBtn.textContent = 'Back';
  el.nextBtn.textContent = 'Next →';