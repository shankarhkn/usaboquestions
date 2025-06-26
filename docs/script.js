let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
let username = localStorage.getItem('username') || "Guest";

let examCountdown = null;
let timeLeft = 50 * 60;
let timerPaused = false;
let examModeActive = false;
let examProgress = {};

window._examTimerStartTimestamp = null;
window._examPauseTimestamp = null;

// Replace this URL with your real explanation API endpoint.
// The endpoint should accept POST with JSON body like { set, question_number, user_answer, correct_answer }
// and respond with JSON { explanation: "..." }
const explanationApiUrl = 'https://your-real-api.example.com/explain';

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

  setupExamControls();

  if (loadTimerState()) {
    loadExamProgress();
    resumeExamTimer();
  }
});

function updateGreeting(name) {
  const greetingSpan = document.getElementById('greeting');
  if (greetingSpan) greetingSpan.textContent = `Welcome, ${name}!`;
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
    document.getElementById('explanation-text').style.display = 'none';
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

  const questionSetElem = document.getElementById('question-set');
  questionSetElem.innerHTML = '';
  if (question.set) {
    const spanSet = document.createElement('span');
    spanSet.textContent = `Set: ${question.set}`;
    questionSetElem.appendChild(spanSet);

    const bookmarkBtn = document.getElementById('bookmark-btn');
    bookmarkBtn.style.color = bookmarks.includes(key) ? '#f5b301' : '#666';
    bookmarkBtn.textContent = bookmarks.includes(key) ? '★' : '☆';
    bookmarkBtn.onclick = toggleBookmark;
  } else {
    document.getElementById('bookmark-btn').style.display = 'none';
    questionSetElem.textContent = '';
  }

  document.getElementById('question-text').innerHTML = question.question;

  const choicesContainer = document.getElementById('choices-text');
  choicesContainer.innerHTML = '';

  const answerLetter = question.answer;

  // Hide answer and explanation text at first
  const answerElem = document.getElementById('answer-text');
  const explanationElem = document.getElementById('explanation-text');
  answerElem.style.display = 'none';
  explanationElem.style.display = 'none';
  explanationElem.textContent = '';

  question.choices.forEach(choice => {
    const choiceButton = document.createElement('button');
    choiceButton.textContent = choice;
    choiceButton.classList.add('choice-btn');
    choiceButton.disabled = false;

    choiceButton.onclick = async () => {
      // Disable all buttons once answered
      const allButtons = document.querySelectorAll('.choice-btn');
      allButtons.forEach(btn => btn.disabled = true);

      const userAnswerLetter = choice.trim()[0];
      const isCorrect = userAnswerLetter === answerLetter;

      // Add styles for correct/incorrect
      allButtons.forEach(btn => {
        if (btn === choiceButton) {
          btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        } else {
          btn.classList.add('not-selected');
          if (btn.textContent.trim()[0] === answerLetter) {
            btn.classList.add('correct');
          }
        }
      });

      // Show selected and correct answer in answer-text
      answerElem.textContent = `You answered '${userAnswerLetter}'. The correct answer is '${answerLetter}'.`;
      answerElem.style.display = 'block';

      // Save progress locally
      if (examModeActive) {
        examProgress[key] = isCorrect ? 'correct' : 'incorrect';
        saveExamProgress();
      } else if (isCorrect) {
        const progress = JSON.parse(localStorage.getItem('progress')) || {};
        progress[key] = {
          correct: true,
          timestamp: Date.now()
        };
        localStorage.setItem('progress', JSON.stringify(progress));
      }

      // Fetch explanation from API
      explanationElem.textContent = 'Loading explanation...';
      explanationElem.style.display = 'block';

      try {
        const response = await fetch(explanationApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            set: question.set,
            question_number: question.question_number,
            user_answer: userAnswerLetter,
            correct_answer: answerLetter
          })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        if (data.explanation) {
          explanationElem.textContent = data.explanation.trim();
        } else {
          explanationElem.textContent = 'No explanation available.';
        }
      } catch (error) {
        console.error('Error fetching explanation:', error);
        explanationElem.textContent = 'Failed to fetch explanation.';
      }
    };

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
    bookmarkBtn.style.color = '#666';
  }
}

function showStats() {
  const currentUsername = localStorage.getItem('username') || 'Guest';
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  const totalCorrect = Object.keys(progress).length;
  alert(`${currentUsername}, you have correctly answered ${totalCorrect} question(s).`);
}

// --- Exam timer and controls (same as you had, but with fixed timer format) ---

function setupExamControls() {
  const container = document.getElementById('exam-controls-box');
  if (!container) return;

  // Timer display is already in HTML (#exam-timer)

  const startBtn = document.getElementById('start-exam-mode');
  const pauseBtn = document.getElementById('pause-timer-btn');
  const stopBtn = document.getElementById('stop-timer-btn');
  const statsBtn = document.getElementById('show-exam-stats-btn');

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;

  startBtn.onclick = startExamMode;
  pauseBtn.onclick = togglePause;
  stopBtn.onclick = stopExamMode;
  statsBtn.onclick = showExamStats;

  updateTimerDisplay();
}

function updateTimerDisplay() {
  const timerDisplay = document.getElementById('exam-timer');
  if (!timerDisplay) return;

  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;

  // Fix NaN case
  if (isNaN(minutes) || isNaN(seconds)) {
    minutes = 50;
    seconds = 0;
  }

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

  const startBtn = document.getElementById('start-exam-mode');
  const pauseBtn = document.getElementById('pause-timer-btn');
  const stopBtn = document.getElementById('stop-timer-btn');

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;

  examCountdown = setInterval(() => {
    if (!timerPaused) {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(examCountdown);
        examCountdown = null;
        examModeActive = false;
        alert("Time's up! Exam mode ended.");
        saveTimerState();
        resetExamControls();
      }
    }
  }, 1000);

  // Reload questions to reset UI for exam mode
  applyFilters();
}

function togglePause() {
  if (!examModeActive) return;

  const pauseBtn = document.getElementById('pause-timer-btn');
  if (!timerPaused) {
    timerPaused = true;
    window._examPauseTimestamp = Date.now();
    pauseBtn.textContent = "Resume";
  } else {
    timerPaused = false;
    if (window._examPauseTimestamp) {
      // Adjust start time to exclude paused duration
      let pausedDuration = Date.now() - window._examPauseTimestamp;
      window._examTimerStartTimestamp += pausedDuration;
    }
    window._examPauseTimestamp = null;
    pauseBtn.textContent = "Pause";
  }
  saveTimerState();
}

function stopExamMode() {
  if (!examModeActive) return;
  if (!confirm("Stop the exam timer? This will end exam mode.")) return;

  if (examCountdown !== null) {
    clearInterval(examCountdown);
    examCountdown = null;
  }
  examModeActive = false;
  timerPaused = false;
  timeLeft = 50 * 60;
  window._examTimerStartTimestamp = null;
  window._examPauseTimestamp = null;
  saveTimerState();

  resetExamControls();
  applyFilters(); // reset UI to normal mode
}

function resetExamControls() {
  const startBtn = document.getElementById('start-exam-mode');
  const pauseBtn = document.getElementById('pause-timer-btn');
  const stopBtn = document.getElementById('stop-timer-btn');

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";
  stopBtn.disabled = true;

  updateTimerDisplay();
}

function resumeExamTimer() {
  if (!examModeActive) return;

  const startBtn = document.getElementById('start-exam-mode');
  const pauseBtn = document.getElementById('pause-timer-btn');
  const stopBtn = document.getElementById('stop-timer-btn');

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;

  examCountdown = setInterval(() => {
    if (!timerPaused) {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(examCountdown);
        examCountdown = null;
        examModeActive = false;
        alert("Time's up! Exam mode ended.");
        saveTimerState();
        resetExamControls();
      }
    }
  }, 1000);
}

function showExamStats() {
  if (!examModeActive) {
    alert("Exam mode is not active.");
    return;
  }
  let correctCount = 0;
  let totalAnswered = 0;

  for (const key in examProgress) {
    totalAnswered++;
    if (examProgress[key] === 'correct') correctCount++;
  }

  alert(`Exam Mode Stats:\nAnswered: ${totalAnswered}\nCorrect: ${correctCount}\nAccuracy: ${totalAnswered > 0 ? ((correctCount / totalAnswered) * 100).toFixed(1) : '0'}%`);
}

// Utility: shuffle array in-place
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ---

// End of script.js
