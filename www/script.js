// === FULL UPDATED script.js ===
// Additive, non-breaking, with "Incorrect Only" filtering within set filter, preserving your existing logic

let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
let seenQuestionKeys = new Set();

let username = localStorage.getItem('username') || "Guest";

let examCountdown = null;
let timeLeft = parseInt(localStorage.getItem('examTimeLeft')) || 50 * 60;
let timerPaused = false;
let examModeActive = JSON.parse(localStorage.getItem('examModeActive')) || false;
let examProgress = JSON.parse(localStorage.getItem('examProgress')) || {};

window._examTimerStartTimestamp = null;
window._examPauseTimestamp = null;

// === On DOM Loaded ===
document.addEventListener("DOMContentLoaded", () => {
  updateGreeting(username);

  document.getElementById("show-stats-btn").addEventListener("click", showStats);
  document.getElementById("bookmark-btn").addEventListener("click", () => {
    if (filteredQuestions.length === 0) return;
    const q = filteredQuestions[currentIndex];
    const key = `${q.set || 'set'}-${q.question_number || currentIndex + 1}`;
    toggleBookmark(key);
  });
  document.getElementById("change-username-btn").addEventListener("click", changeUsername);
  document.getElementById("clear-stats-btn").addEventListener("click", clearStats);
  document.getElementById("restart-questions").addEventListener("click", () => {
    if (filteredQuestions.length === 0) {
      alert("No questions to restart under current filters.");
      return;
    }
    if (confirm("Are you sure you want to restart the current filtered questions?")) {
      seenQuestionKeys.clear();
      currentIndex = 0;
      showQuestion(currentIndex);
    }
  });


  document.getElementById("prev").addEventListener("click", () => {
    if (filteredQuestions.length === 0) return;
    currentIndex = (currentIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
    showQuestion(currentIndex);
  });

  document.getElementById("next").addEventListener("click", () => {
    if (filteredQuestions.length === 0) return;
    currentIndex = (currentIndex + 1) % filteredQuestions.length;
    showQuestion(currentIndex);
  });

  document.getElementById("apply-filters").addEventListener("click", applyFilters);

  document.getElementById("start-exam-mode").addEventListener("click", startExamMode);
  document.getElementById("pause-timer-btn").addEventListener("click", pauseTimer);
  document.getElementById("stop-timer-btn").addEventListener("click", stopTimer);
  document.getElementById("show-exam-stats-btn").addEventListener("click", showExamStats);

  document.getElementById('year').textContent = new Date().getFullYear();

  fetchQuestions();

  if (examModeActive) {
    resumeExamTimer();
  }
});

function updateGreeting(name) {
  document.getElementById('username-display').textContent = name;
}

function changeUsername() {
  const newUsername = prompt("Enter a new username:", username);
  if (newUsername) {
    username = newUsername;
    localStorage.setItem('username', username);
    updateGreeting(username);
  }
}

function clearStats() {
  if (confirm("Clear all your progress stats?")) {
    localStorage.removeItem('progress');
    localStorage.removeItem('examProgress');
    alert("Progress cleared.");
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function fetchQuestions() {
  try {
    const res = await fetch('https://usaboquestions.onrender.com/questions');
    questions = await res.json();
    populateFilterOptions();
    applyFilters();
  } catch (e) {
    console.error(e);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
  }
}

function populateFilterOptions() {
  const categorySelect = document.getElementById('category-select');
  const setSelect = document.getElementById('set-select');

  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  const sets = [...new Set(questions.map(q => q.set).filter(Boolean))];

  categorySelect.innerHTML = '<option value="">All</option>';
  sets.sort();

  setSelect.innerHTML = `
        <option value="">All</option>
        <option value="__bookmarked__">Bookmarked</option>
        <option value="__incorrect__">Incorrect</option>
    `;

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  sets.forEach(set => {
    const opt = document.createElement('option');
    opt.value = set;
    opt.textContent = set;
    setSelect.appendChild(opt);
  });
}

function applyFilters() {
  seenQuestionKeys.clear();
  const selectedCategory = document.getElementById('category-select').value;
  const selectedSet = document.getElementById('set-select').value;

  filteredQuestions = questions.filter(q => {
    const isCategoryMatch = !selectedCategory || q.category === selectedCategory;

    const isSetMatch =
      (selectedSet === '__bookmarked__')
        ? bookmarks.includes(`${q.set || 'set'}-${q.question_number}`)
        : (!selectedSet || q.set === selectedSet);

    return isCategoryMatch && isSetMatch;
  });

  if (filteredQuestions.length === 0) {
    document.getElementById('question-text').textContent = 'No questions match the selected filters.';
    document.getElementById('choices-text').innerHTML = '';
    document.getElementById('question-set').textContent = '';
    document.getElementById('question-category').textContent = '';
    document.getElementById('question-number').textContent = '';
    document.getElementById('answer-text').style.display = 'none';
    return;
  }

  shuffle(filteredQuestions);
  currentIndex = 0;
  showQuestion(currentIndex);
}


async function showQuestion(index) {
  if (filteredQuestions.length === 0) {
    document.getElementById('question-text').textContent = 'No questions match the selected filters.';
    document.getElementById('choices-text').innerHTML = '';
    document.getElementById('question-set').textContent = '';
    document.getElementById('question-category').textContent = '';
    document.getElementById('question-number').textContent = '';
    document.getElementById('answer-text').style.display = 'none';
    return;
  }

  // If all filtered questions have been seen, show completion message
  if (seenQuestionKeys.size === filteredQuestions.length) {
    document.getElementById('question-text').textContent = '✅ You have completed all questions matching the current filters.';
    document.getElementById('choices-text').innerHTML = '';
    document.getElementById('question-set').textContent = '';
    document.getElementById('question-category').textContent = '';
    document.getElementById('question-number').textContent = '';
    document.getElementById('answer-text').style.display = 'none';
    return;
  }

  // Loop to find next unseen question starting from index
  let current = index;
  let tries = 0;
  while (tries < filteredQuestions.length) {
    const question = filteredQuestions[current];
    const key = `${question.set || 'set'}-${question.question_number || current + 1}`;
    if (!seenQuestionKeys.has(key)) {
      // Found unseen question, update currentIndex
      currentIndex = current;
      seenQuestionKeys.add(key);

      // Display bookmark status
      const bookmarkBtn = document.getElementById('bookmark-btn');
      if (bookmarks.includes(key)) {
        bookmarkBtn.classList.add('bookmarked');
        bookmarkBtn.textContent = '★'; // filled star
      } else {
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkBtn.textContent = '☆'; // empty star
      }

      // Show question metadata
      document.getElementById('question-number').textContent = `Question ${question.question_number || current + 1}`;
      document.getElementById('question-category').textContent = question.category ? `Category: ${question.category}` : '';
      document.getElementById('question-set').textContent = question.set ? `Set: ${question.set}` : '';

      // Show question text
      document.getElementById('question-text').innerHTML = question.question;

      // Show choices
      const choicesContainer = document.getElementById('choices-text');
      choicesContainer.innerHTML = '';

      const answerElem = document.getElementById('answer-text');
      answerElem.style.display = 'none';
      answerElem.textContent = '';

      question.choices.forEach(choice => {
        const choiceBtn = document.createElement('button');
        choiceBtn.textContent = choice;
        choiceBtn.classList.add('choice-btn');

        choiceBtn.addEventListener('click', () => {
          document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);

          const selected = choice.trim().charAt(0);
          const correct = question.answer;

          choiceBtn.classList.add(selected === correct ? 'correct' : 'incorrect');

          document.querySelectorAll('.choice-btn').forEach(btn => {
            if (btn.textContent.trim().startsWith(correct + '.')) btn.classList.add('correct');
            else if (btn !== choiceBtn) btn.classList.add('not-selected');
          });

          answerElem.style.display = 'block';
          answerElem.textContent = `You answered '${selected}'. The correct answer is '${correct}'.`;

          // Save progress to localStorage
          const progress = JSON.parse(localStorage.getItem('progress')) || {};
          progress[key] = selected === correct;
          localStorage.setItem('progress', JSON.stringify(progress));
        });

        choicesContainer.appendChild(choiceBtn);
      });

      return; // Exit after showing one question
    }
    current = (current + 1) % filteredQuestions.length;
    tries++;
  }

  // If we somehow got here, show no unseen questions message
  document.getElementById('question-text').textContent = '✅ You have completed all questions matching the current filters.';
  document.getElementById('choices-text').innerHTML = '';
  document.getElementById('question-set').textContent = '';
  document.getElementById('question-category').textContent = '';
  document.getElementById('question-number').textContent = '';
  document.getElementById('answer-text').style.display = 'none';
}



function handleAnswer(btn, q, choice, key) {
  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach(b => b.disabled = true);

  const userAnswer = choice.trim().charAt(0);
  const isCorrect = userAnswer === q.answer;

  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  progress[key] = isCorrect;
  localStorage.setItem('progress', JSON.stringify(progress));

  if (isCorrect) {
    btn.classList.add('correct');
  } else {
    btn.classList.add('incorrect');
    buttons.forEach(b => {
      if (b.textContent.trim().startsWith(q.answer + '.')) {
        b.classList.add('correct');
      }
    });
  }

  buttons.forEach(b => {
    if (!b.classList.contains('correct') && !b.classList.contains('incorrect')) {
      b.classList.add('not-selected');
      b.style.backgroundColor = '#fff'; // Ensure unselected stay white
    }
  });
}

function toggleBookmark(key) {
  const idx = bookmarks.indexOf(key);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(key);
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  showQuestion(currentIndex); // Refresh display to update star
}


function showStats() {
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  const totalSeen = Object.keys(progress).length;
  const totalCorrect = Object.values(progress).filter(v => v === true).length;
  const totalIncorrect = Object.values(progress).filter(v => v === false).length;

  alert(`Stats:\nSeen: ${totalSeen}\nCorrect: ${totalCorrect}\nIncorrect: ${totalIncorrect}`);
}

function startExamMode() {
  if (examModeActive) return;
  examModeActive = true;
  timeLeft = 50 * 60;
  saveExamState();
  examCountdown = setInterval(() => {
    if (!timerPaused) {
      timeLeft--;
      localStorage.setItem('examTimeLeft', timeLeft);
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(examCountdown);
        stopTimer();
        alert("Exam time is up!");
      }
    }
  }, 1000);
  updateTimerDisplay();
}

function pauseTimer() {
  timerPaused = !timerPaused;
  document.getElementById("pause-timer-btn").textContent = timerPaused ? "Resume" : "Pause";
}

function stopTimer() {
  clearInterval(examCountdown);
  examModeActive = false;
  timeLeft = 50 * 60;
  saveExamState();
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  document.getElementById('exam-timer').textContent = `⏱ ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function saveExamState() {
  localStorage.setItem('examModeActive', JSON.stringify(examModeActive));
  localStorage.setItem('examTimeLeft', timeLeft);
}

function resumeExamTimer() {
  if (!examModeActive) return;
  updateTimerDisplay();
  examCountdown = setInterval(() => {
    if (!timerPaused) {
      timeLeft--;
      localStorage.setItem('examTimeLeft', timeLeft);
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(examCountdown);
        stopTimer();
        alert("Exam time is up!");
      }
    }
  }, 1000);
}


function showExamStats() {
  const progress = JSON.parse(localStorage.getItem('examProgress')) || {};
  const totalSeen = Object.keys(progress).length;
  const totalCorrect = Object.values(progress).filter(v => v === true).length;
  const totalIncorrect = Object.values(progress).filter(v => v === false).length;

  alert(`Exam Stats:\nSeen: ${totalSeen}\nCorrect: ${totalCorrect}\nIncorrect: ${totalIncorrect}`);
}

document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburgerBtn.addEventListener('click', () => {
    const isActive = mobileMenu.classList.toggle('active');
    hamburgerBtn.setAttribute('aria-expanded', isActive);
    mobileMenu.setAttribute('aria-hidden', !isActive);
  });

  // Optional: Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      mobileMenu.classList.contains('active') &&
      !mobileMenu.contains(e.target) &&
      e.target !== hamburgerBtn
    ) {
      mobileMenu.classList.remove('active');
      hamburgerBtn.setAttribute('aria-expanded', false);
      mobileMenu.setAttribute('aria-hidden', true);
    }
  });
});
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuOverlay = document.getElementById('menu-overlay');

function toggleMenu() {
  const isActive = mobileMenu.classList.toggle('active');
  hamburgerBtn.setAttribute('aria-expanded', isActive);
  mobileMenu.setAttribute('aria-hidden', !isActive);
  if (isActive) {
    menuOverlay.classList.add('active');
    menuOverlay.removeAttribute('hidden');
  } else {
    menuOverlay.classList.remove('active');
    // hide overlay after transition
    setTimeout(() => menuOverlay.setAttribute('hidden', ''), 300);
  }
}

hamburgerBtn.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

