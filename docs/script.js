let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

let username = localStorage.getItem('username') || "Guest";

let examCountdown = null;
let timeLeft = 50 * 60;
let timerPaused = false;
let examModeActive = false;
let examProgress = {};  // To track correct/incorrect answers in exam mode

// Timestamp when exam started (ms)
window._examTimerStartTimestamp = null;
// Timestamp when paused (ms)
window._examPauseTimestamp = null;

document.addEventListener("DOMContentLoaded", () => {
  updateGreeting(username);

  document.getElementById("show-stats").addEventListener("click", showStats);
  document.getElementById("change-username").addEventListener("click", () => {
    const newUsername = prompt("Enter a new username (just for this device):")?.trim();
    if (newUsername) {
      localStorage.setItem('username', newUsername);
      username = newUsername;
      updateGreeting(username);
      alert(`Username changed to ${newUsername}`);
    }
  });

  document.getElementById("clear-stats").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all your progress stats?")) {
      localStorage.removeItem('progress');
      localStorage.removeItem('examProgress');
      localStorage.removeItem('examTimerState');
      examProgress = {};
      alert("Progress stats cleared.");
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

  document.getElementById('year').textContent = new Date().getFullYear();
  fetchQuestions();

  setupExamControls();  // Set up the floating sidebar with timer and buttons

  // Load exam timer and progress if any saved state
  if (loadTimerState()) {
    loadExamProgress();
    resumeExamTimer();
  }
});

function updateGreeting(name) {
  const greetingSpan = document.getElementById('greeting');
  if (greetingSpan) greetingSpan.textContent = `Welcome, ${name}!`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function fetchQuestions() {
  try {
    const response = await fetch('https://usaboquestions.onrender.com/questions');
    if (!response.ok) throw new Error(`Error fetching questions: ${response.status}`);
    questions = await response.json();
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions available.');
    populateFilterOptions();
    applyFilters();
  } catch (error) {
    console.error(error);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
    document.getElementById('answer-text').style.display = 'none';
  }
}

function populateFilterOptions() {
  const categorySelect = document.getElementById('category-select');
  const setSelect = document.getElementById('set-select');
  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  const sets = [...new Set(questions.map(q => q.set).filter(Boolean))];

  categorySelect.innerHTML = '<option value="">All</option>';
  setSelect.innerHTML = '<option value="">All</option><option value="__bookmarked__">Bookmarked</option>';

  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  }

  for (const set of sets) {
    const option = document.createElement('option');
    option.value = set;
    option.textContent = set;
    setSelect.appendChild(option);
  }
}

function applyFilters() {
  const selectedCategory = document.getElementById('category-select').value;
  const selectedSet = document.getElementById('set-select').value;

  if (selectedSet === '__bookmarked__') {
    filteredQuestions = questions.filter(q => {
      const key = `${q.set || 'set'}-${q.question_number}`;
      return bookmarks.includes(key);
    });
  } else {
    filteredQuestions = questions.filter(q => {
      return (!selectedCategory || q.category === selectedCategory) &&
        (!selectedSet || q.set === selectedSet);
    });
  }

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

function showQuestion(index) {
  const question = filteredQuestions[index];
  const key = `${question.set || 'set'}-${question.question_number || index + 1}`;

  document.getElementById('question-number').textContent = `Question ${question.question_number || index + 1}`;
  document.getElementById('question-category').textContent = question.category ? `Category: ${question.category}` : '';

  // Show set with bookmark star at right
  const questionSetElem = document.getElementById('question-set');
  questionSetElem.innerHTML = ''; // Clear
  if (question.set) {
    const spanSet = document.createElement('span');
    spanSet.textContent = `Set: ${question.set}`;
    questionSetElem.appendChild(spanSet);

    // Bookmark button
    let bookmarkBtn = document.getElementById('bookmark-btn');
    if (!bookmarkBtn) {
      bookmarkBtn = document.createElement('button');
      bookmarkBtn.id = 'bookmark-btn';
      bookmarkBtn.title = 'Bookmark this question';
      bookmarkBtn.style.cssText = `
        font-size: 1.3rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        color: #f5b301;
        transition: color 0.3s ease;
      `;
      bookmarkBtn.addEventListener("click", toggleBookmark);
    }
    bookmarkBtn.textContent = bookmarks.includes(key) ? '★' : '☆';
    bookmarkBtn.style.color = bookmarks.includes(key) ? '#f5b301' : '#f5b301';
    questionSetElem.appendChild(bookmarkBtn);
  } else {
    document.getElementById('question-set').textContent = '';
  }

  document.getElementById('question-text').innerHTML = question.question;

  const choicesContainer = document.getElementById('choices-text');
  choicesContainer.innerHTML = '';

  const answerLetter = question.answer;
  const matchingChoice = question.choices.find(c => c.trim().startsWith(answerLetter + '.')) || '';
  const answerFullText = matchingChoice ? matchingChoice : `Answer: ${answerLetter}`;
  const answerElem = document.getElementById('answer-text');
  answerElem.textContent = answerFullText;
  answerElem.style.display = 'none';

  question.choices.forEach(choice => {
    const choiceButton = document.createElement('button');
    choiceButton.textContent = choice;
    choiceButton.classList.add('choice-btn');

    choiceButton.addEventListener('click', () => {
      const allButtons = document.querySelectorAll('.choice-btn');
      allButtons.forEach(btn => btn.disabled = true);

      const isCorrect = choice.trim().startsWith(answerLetter + '.');
      choiceButton.classList.add(isCorrect ? 'correct' : 'incorrect');

      allButtons.forEach(btn => {
        if (btn !== choiceButton) {
          btn.classList.add('not-selected');
        }
      });

      allButtons.forEach(btn => {
        if (btn.textContent.trim().startsWith(answerLetter + ".")) {
          btn.classList.add('correct');
        }
      });

      if (examModeActive) {
        // Track answers only during exam mode
        examProgress[key] = isCorrect ? 'correct' : 'incorrect';
        saveExamProgress();
      } else if (isCorrect) {
        // Outside exam mode, track correct answers as before
        const progress = JSON.parse(localStorage.getItem('progress')) || {};
        progress[key] = {
          correct: true,
          timestamp: Date.now()
        };
        localStorage.setItem('progress', JSON.stringify(progress));
      }

      answerElem.style.display = 'block';
    });

    choicesContainer.appendChild(choiceButton);
  });
}

function toggleBookmark() {
  const question = filteredQuestions[currentIndex];
  const key = `${question.set || 'set'}-${question.question_number || currentIndex + 1}`;
  const index = bookmarks.indexOf(key);

  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(key);
  }

  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  const bookmarkBtn = document.getElementById("bookmark-btn");
  if (bookmarks.includes(key)) {
    bookmarkBtn.textContent = '★';
    bookmarkBtn.style.color = '#f5b301';
  } else {
    bookmarkBtn.textContent = '☆';
    bookmarkBtn.style.color = '#f5b301';
  }
}

function showStats() {
  const currentUsername = localStorage.getItem('username') || 'Guest';
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  const totalCorrect = Object.keys(progress).length;
  alert(`${currentUsername}, you have correctly answered ${totalCorrect} question(s).`);
}

// --- EXAM TIMER & CONTROLS ---

function setupExamControls() {
  const container = document.getElementById('exam-controls-box');
  if (!container) return;

  // Clear any existing controls
  container.innerHTML = '';

  // Timer display
  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'exam-timer';
  timerDisplay.style.fontWeight = '700';
  timerDisplay.style.fontSize = '1.6rem';
  timerDisplay.style.color = '#007bff';
  timerDisplay.style.textAlign = 'center';
  timerDisplay.style.marginBottom = '15px';
  timerDisplay.textContent = '⏱ 50:00';
  container.appendChild(timerDisplay);

  // Start Exam button
  const startBtn = document.createElement('button');
  startBtn.id = 'start-exam-mode';
  startBtn.textContent = 'Start 50-min Exam';
  startBtn.style.backgroundColor = '#007bff';
  startBtn.style.color = 'white';
  startBtn.style.border = 'none';
  startBtn.style.padding = '12px';
  startBtn.style.borderRadius = '8px';
  startBtn.style.cursor = 'pointer';
  startBtn.style.fontWeight = '600';
  startBtn.style.width = '100%';
  startBtn.addEventListener('click', startExamMode);
  container.appendChild(startBtn);

  // Pause button
  const pauseBtn = document.createElement('button');
  pauseBtn.id = 'pause-timer-btn';
  pauseBtn.textContent = 'Pause';
  pauseBtn.style.backgroundColor = '#ffc107';  // amber
  pauseBtn.style.color = '#333';
  pauseBtn.style.border = 'none';
  pauseBtn.style.padding = '12px';
  pauseBtn.style.borderRadius = '8px';
  pauseBtn.style.cursor = 'pointer';
  pauseBtn.style.fontWeight = '600';
  pauseBtn.style.width = '100%';
  pauseBtn.disabled = true; // Disabled until exam started
  pauseBtn.addEventListener('click', () => {
    timerPaused = !timerPaused;
    pauseBtn.textContent = timerPaused ? 'Resume' : 'Pause';

    if (timerPaused) {
      // Save pause timestamp
      window._examPauseTimestamp = Date.now();
    } else {
      // Adjust startTimestamp to account for pause duration
      if (window._examPauseTimestamp) {
        const pausedDuration = Date.now() - window._examPauseTimestamp;
        window._examTimerStartTimestamp += pausedDuration;
        window._examPauseTimestamp = null;
      }
    }
    saveTimerState();
  });
  container.appendChild(pauseBtn);

  // Stop button
  const stopBtn = document.createElement('button');
  stopBtn.id = 'stop-timer-btn';
  stopBtn.textContent = 'Stop';
  stopBtn.style.backgroundColor = '#dc3545'; // red
  stopBtn.style.color = 'white';
  stopBtn.style.border = 'none';
  stopBtn.style.padding = '12px';
  stopBtn.style.borderRadius = '8px';
  stopBtn.style.cursor = 'pointer';
  stopBtn.style.fontWeight = '600';
  stopBtn.style.width = '100%';
  stopBtn.disabled = true; // Disabled until exam started
  stopBtn.addEventListener('click', () => {
    if (confirm("Stop and reset the exam timer?")) {
      clearInterval(examCountdown);
      examCountdown = null;
      timeLeft = 0;
      timerPaused = false;
      examModeActive = false;
      examProgress = {};
      window._examTimerStartTimestamp = null;
      window._examPauseTimestamp = null;

      updateTimerDisplay(true);
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      startBtn.disabled = false;
      pauseBtn.textContent = 'Pause';

      localStorage.removeItem('examTimerState');
      localStorage.removeItem('examProgress');

      showExamSummary();
    }
  });
  container.appendChild(stopBtn);

  // Show Exam Stats button
  const statsBtn = document.createElement('button');
  statsBtn.id = 'show-exam-stats-btn';
  statsBtn.textContent = 'Show Exam Stats';
  statsBtn.style.backgroundColor = '#28a745'; // green
  statsBtn.style.color = 'white';
  statsBtn.style.border = 'none';
  statsBtn.style.padding = '12px';
  statsBtn.style.borderRadius = '8px';
  statsBtn.style.cursor = 'pointer';
  statsBtn.style.fontWeight = '600';
  statsBtn.style.width = '100%';
  statsBtn.addEventListener('click', showExamStats);
  container.appendChild(statsBtn);

  // Save buttons globally for convenience
  window._examButtons = { startBtn, pauseBtn, stopBtn };

  updateTimerDisplay();
}

function updateTimerDisplay(forceReset = false) {
  const timerDisplay = document.getElementById('exam-timer');
  if (!timerDisplay) return;

  if (forceReset) {
    timerDisplay.textContent = '⏱ 50:00';
    return;
  }

  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerDisplay.textContent = `⏱ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function saveTimerState() {
  localStorage.setItem('examTimerState', JSON.stringify({
    examModeActive,
    timerPaused,
    timeLeft,
    startTimestamp: window._examTimerStartTimestamp || null,
    pauseTimestamp: window._examPauseTimestamp || null
  }));
}

function loadTimerState() {
  const state = JSON.parse(localStorage.getItem('examTimerState'));
  if (!state) return false;

  examModeActive = state.examModeActive;
  timerPaused = state.timerPaused;
  timeLeft = state.timeLeft || 50 * 60;
  window._examTimerStartTimestamp = state.startTimestamp || null;
  window._examPauseTimestamp = state.pauseTimestamp || null;

  return examModeActive;
}

function saveExamProgress() {
  localStorage.setItem('examProgress', JSON.stringify(examProgress));
}

function loadExamProgress() {
  examProgress = JSON.parse(localStorage.getItem('examProgress')) || {};
}

function startExamMode() {
  if (examCountdown !== null) {
    alert("Exam timer is already running.");
    return;
  }
  if (!confirm("Start the 50-minute exam timer?")) return;

  timeLeft = 50 * 60;
  timerPaused = false;
  examModeActive = true;
  examProgress = {};

  window._examTimerStartTimestamp = Date.now();
  window._examPauseTimestamp = null;

  saveTimerState();
  saveExamProgress();

  const { startBtn, pauseBtn, stopBtn } = window._examButtons;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  pauseBtn.textContent = 'Pause';

  updateTimerDisplay();

  examCountdown = setInterval(() => {
    if (!timerPaused) {
      const elapsedSeconds = Math.floor((Date.now() - window._examTimerStartTimestamp) / 1000);
      timeLeft = Math.max(50 * 60 - elapsedSeconds, 0);

      if (timeLeft <= 0) {
        clearInterval(examCountdown);
        examCountdown = null;
        examModeActive = false;
        alert("Exam time is over!");
        showExamSummary();

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        pauseBtn.textContent = 'Pause';

        localStorage.removeItem('examTimerState');
        localStorage.removeItem('examProgress');
      } else {
        updateTimerDisplay();
        saveTimerState();
      }
    }
  }, 1000);
}

function resumeExamTimer() {
  if (!examModeActive || !window._examTimerStartTimestamp) return;

  const { startBtn, pauseBtn, stopBtn } = window._examButtons;

  // Disable start, enable pause and stop buttons
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  pauseBtn.textContent = timerPaused ? 'Resume' : 'Pause';

  // Calculate timeLeft using timestamps if not paused
  if (timerPaused && window._examPauseTimestamp) {
    const pausedDuration = Date.now() - window._examPauseTimestamp;
    // timeLeft remains same but we note paused time for display
  } else {
    const elapsedSeconds = Math.floor((Date.now() - window._examTimerStartTimestamp) / 1000);
    timeLeft = Math.max(50 * 60 - elapsedSeconds, 0);
  }

  updateTimerDisplay();

  examCountdown = setInterval(() => {
    if (!timerPaused) {
      const elapsedSeconds = Math.floor((Date.now() - window._examTimerStartTimestamp) / 1000);
      timeLeft = Math.max(50 * 60 - elapsedSeconds, 0);

      if (timeLeft <= 0) {
        clearInterval(examCountdown);
        examCountdown = null;
        examModeActive = false;
        alert("Exam time is over!");
        showExamSummary();

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        pauseBtn.textContent = 'Pause';

        localStorage.removeItem('examTimerState');
        localStorage.removeItem('examProgress');
      } else {
        updateTimerDisplay();
        saveTimerState();
      }
    }
  }, 1000);
}

function showExamStats() {
  loadExamProgress();

  const totalQuestions = Object.keys(examProgress).length;
  const correctCount = Object.values(examProgress).filter(v => v === 'correct').length;
  const incorrectCount = totalQuestions - correctCount;

  alert(`Exam Stats:
  Total Answered: ${totalQuestions}
  Correct: ${correctCount}
  Incorrect: ${incorrectCount}`);
}

function showExamSummary() {
  loadExamProgress();

  const totalQuestions = Object.keys(examProgress).length;
  const correctCount = Object.values(examProgress).filter(v => v === 'correct').length;
  const incorrectCount = totalQuestions - correctCount;

  alert(`Exam finished!
  Total Questions Answered: ${totalQuestions}
  Correct: ${correctCount}
  Incorrect: ${incorrectCount}
  Your progress has been reset.`);
}
