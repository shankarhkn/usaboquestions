// === FULL UPDATED script.js ===
// Additive, non-breaking, with "Incorrect Only" filtering within set filter, preserving your existing logic

let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

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
  document.getElementById("change-username-btn").addEventListener("click", changeUsername);
  document.getElementById("clear-stats-btn").addEventListener("click", clearStats);

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
  const selectedCategory = document.getElementById('category-select').value;
  const selectedSet = document.getElementById('set-select').value;
  const progress = JSON.parse(localStorage.getItem('progress')) || {};

  if (selectedSet === "__bookmarked__") {
    filteredQuestions = questions.filter(q => bookmarks.includes(`${q.set || 'set'}-${q.question_number}`));
  } else if (selectedSet === "__incorrect__") {
    filteredQuestions = questions.filter(q => {
      const key = `${q.set || 'set'}-${q.question_number}`;
      return progress[key] === false && (!selectedCategory || q.category === selectedCategory);
    });
  } else {
    filteredQuestions = questions.filter(q => {
      return (!selectedCategory || q.category === selectedCategory) && (!selectedSet || q.set === selectedSet);
    });
  }

  if (filteredQuestions.length === 0) {
    document.getElementById('question-text').textContent = 'No questions match the filters.';
    document.getElementById('choices-text').innerHTML = '';
    return;
  }

  shuffle(filteredQuestions);
  currentIndex = 0;
  showQuestion(currentIndex);
}

function showQuestion(index) {
  const q = filteredQuestions[index];
  if (!q) return;

  const key = `${q.set || 'set'}-${q.question_number}`;

  document.getElementById('question-set').textContent = q.set ? `Set: ${q.set}` : '';
  document.getElementById('question-number').textContent = `Question ${q.question_number}`;
  document.getElementById('question-category').textContent = q.category ? `Category: ${q.category}` : '';

  const bookmarkBtn = document.getElementById('bookmark-btn');
  bookmarkBtn.textContent = bookmarks.includes(key) ? '★' : '☆';
  bookmarkBtn.style.color = '#f5b301';
  bookmarkBtn.onclick = () => toggleBookmark(key);

  document.getElementById('question-text').innerHTML = q.question;

  const choicesContainer = document.getElementById('choices-text');
  choicesContainer.innerHTML = '';

  q.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;

    btn.addEventListener('click', () => handleAnswer(btn, q, choice, key));
    choicesContainer.appendChild(btn);
  });
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
  showQuestion(currentIndex);
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
  startExamMode();
}

function showExamStats() {
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  const totalSeen = Object.keys(progress).length;
  const totalCorrect = Object.values(progress).filter(v => v === true).length;
  const totalIncorrect = Object.values(progress).filter(v => v === false).length;

  alert(`Exam Stats:\nSeen: ${totalSeen}\nCorrect: ${totalCorrect}\nIncorrect: ${totalIncorrect}`);
}