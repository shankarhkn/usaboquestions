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

window._examTimerStartTimestamp = null;
window._examPauseTimestamp = null;

// === On DOM Loaded ===
document.addEventListener("DOMContentLoaded", () => {
  updateGreeting(username);
  updateExamControlButtons();

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
      updateProgressBar();
    }
  });


  document.getElementById("prev").addEventListener("click", () => {
    if (filteredQuestions.length === 0) return;
    currentIndex = (currentIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
    showQuestion(currentIndex, true);
    document.getElementById('answer-text').style.display = 'none';
    document.getElementById('answer-text').textContent = '';
  });

  document.getElementById("next").addEventListener("click", () => {
    if (filteredQuestions.length === 0) return;
    currentIndex = (currentIndex + 1) % filteredQuestions.length;
    showQuestion(currentIndex, true);
    document.getElementById('answer-text').style.display = 'none';
    document.getElementById('answer-text').textContent = '';
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

    // Reset seenQuestionKeys set, so stats and filters can work fresh:
    seenQuestionKeys.clear();

    // Reload question display so stats and UI reset:
    if (filteredQuestions.length > 0) {
      currentIndex = 0;
      showQuestion(currentIndex);
    }
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
    const data = await res.json();
    questions = data.flat(); // FIX: Flatten nested arrays
    console.log('Cleaned questions:', questions);
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
  updateProgressBar();
}


async function showQuestion(index, force = false) {
  const box = document.getElementById("question-box");

  fadeOutAndIn(box, () => {
    window.questionStartTime = Date.now();

    if (filteredQuestions.length === 0) {
      document.getElementById('question-text').textContent = 'No questions match the selected filters.';
      document.getElementById('choices-text').innerHTML = '';
      document.getElementById('question-set').textContent = '';
      document.getElementById('question-category').textContent = '';
      document.getElementById('question-number').textContent = '';
      document.getElementById('answer-text').style.display = 'none';
      return;
    }

    let current = index;

    // If force is false, try to skip seen questions (your existing logic)
    if (!force) {
      let tries = 0;
      while (tries < filteredQuestions.length) {
        const question = filteredQuestions[current];
        const key = `${question.set || 'set'}-${question.question_number || current + 1}`;
        if (!seenQuestionKeys.has(key)) {
          currentIndex = current;
          seenQuestionKeys.add(key);
          break;
        }
        current = (current + 1) % filteredQuestions.length;
        tries++;
      }
      if (tries === filteredQuestions.length) {
        // All seen
        document.getElementById('question-text').textContent = '✅ You have completed all questions matching the current filters.';
        document.getElementById('choices-text').innerHTML = '';
        document.getElementById('question-set').textContent = '';
        document.getElementById('question-category').textContent = '';
        document.getElementById('question-number').textContent = '';
        document.getElementById('answer-text').style.display = 'none';
        return;
      }
    } else {
      // If force is true, just show the exact question requested
      currentIndex = current;
    }

    const question = filteredQuestions[currentIndex];
    const key = `${question.set || 'set'}-${question.question_number || currentIndex + 1}`;

    // Update bookmark button
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarks.includes(key)) {
      bookmarkBtn.classList.add('bookmarked');
      bookmarkBtn.textContent = '★';
    } else {
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkBtn.textContent = '☆';
    }

    document.getElementById('question-number').textContent = `Question ${question.question_number || currentIndex + 1}`;
    document.getElementById('question-category').textContent = question.category ? `Category: ${question.category}` : '';
    document.getElementById('question-set').textContent = question.set ? `Set: ${question.set}` : '';
    document.getElementById('question-text').innerHTML = question.question;

    const choicesContainer = document.getElementById('choices-text');
    choicesContainer.innerHTML = '';

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
          if (btn.textContent.trim().startsWith(correct + '.')) {
            btn.classList.add('correct');
          } else if (btn !== choiceBtn) {
            btn.classList.add('not-selected');
          }
        });

        const answerElem = document.getElementById('answer-text');
        answerElem.style.display = 'block';
        answerElem.textContent = `You answered '${selected}'. The correct answer is '${correct}'.`;

        const timeSpentSeconds = Math.floor((Date.now() - window.questionStartTime) / 1000);

        let progress = JSON.parse(localStorage.getItem('progress')) || {};
        progress[key] = { correct: selected === correct, time: timeSpentSeconds };
        localStorage.setItem('progress', JSON.stringify(progress));

        seenQuestionKeys.add(key);

        if (examModeActive) {
          let examProgress = JSON.parse(localStorage.getItem('examProgress')) || {};
          examProgress[key] = { correct: selected === correct, time: timeSpentSeconds };
          localStorage.setItem('examProgress', JSON.stringify(examProgress));
        }
      });

      choicesContainer.appendChild(choiceBtn);
    });
    updateProgressBar();
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
function updateBookmarkButtonForCurrentQuestion() {
  if (filteredQuestions.length === 0) return;
  const question = filteredQuestions[currentIndex];
  const key = `${question.set || 'set'}-${question.question_number || currentIndex + 1}`;
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarks.includes(key)) {
    bookmarkBtn.classList.add('bookmarked');
    bookmarkBtn.textContent = '★'; // filled star
  } else {
    bookmarkBtn.classList.remove('bookmarked');
    bookmarkBtn.textContent = '☆'; // empty star
  }
}

function toggleBookmark(key) {
  const idx = bookmarks.indexOf(key);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(key);
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  updateBookmarkButtonForCurrentQuestion(); // Just update star, no question change
}
function updateExamControlButtons() {
  const pauseBtn = document.getElementById("pause-timer-btn");
  const stopBtn = document.getElementById("stop-timer-btn");
  const startBtn = document.getElementById("start-exam-mode");

  if (examModeActive) {
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    startBtn.disabled = true;
  } else {
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    startBtn.disabled = false;
    pauseBtn.textContent = "Pause"; // reset pause text
    timerPaused = false;
  }
}




function showStats() {
  const raw = localStorage.getItem('progress');
  console.log("Raw progress data:", raw);

  if (!raw) {
    alert("No progress data found.");
    return;
  }

  let progress;
  try {
    progress = JSON.parse(raw);
  } catch (e) {
    alert("Progress data corrupted.");
    return;
  }

  console.log("Parsed progress object:", progress);

  // Normalize
  const normalized = Object.values(progress).map(entry => {
    if (typeof entry === 'boolean') {
      return { correct: entry, time: 0 };
    }
    return {
      correct: !!entry.correct,
      time: entry.time || entry.timeSpent || 0
    };
  });

  console.log("Normalized progress:", normalized);

  const totalSeen = normalized.length;
  const totalCorrect = normalized.filter(e => e.correct).length;
  const totalIncorrect = totalSeen - totalCorrect;
  const totalTime = normalized.reduce((sum, e) => sum + e.time, 0);
  const avgTime = totalSeen > 0 ? (totalTime / totalSeen).toFixed(1) : 0;

  alert(`Stats:
Seen: ${totalSeen}
Correct: ${totalCorrect}
Incorrect: ${totalIncorrect}
Average time per question: ${avgTime} seconds`);
}






function startExamMode() {
  if (examModeActive) return;
  examModeActive = true;
  timeLeft = 50 * 60;

  localStorage.setItem('examProgress', JSON.stringify({}));  // Clear exam progress on new exam

  saveExamState();
  updateExamControlButtons();
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

function stopTimer() {
  if (!confirm("Are you sure you want to stop the exam? Your progress will be reset.")) {
    return; // Cancel stop if user says no
  }
  clearInterval(examCountdown);
  examModeActive = false;
  timeLeft = 50 * 60;
  saveExamState();
  updateExamControlButtons();
  updateTimerDisplay();
}


function pauseTimer() {
  timerPaused = !timerPaused;
  document.getElementById("pause-timer-btn").textContent = timerPaused ? "Resume" : "Pause";
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
  const raw = localStorage.getItem('examProgress');
  console.log("Raw examProgress data:", raw);

  if (!raw) {
    alert("No exam progress found.");
    return;
  }

  let progress;
  try {
    progress = JSON.parse(raw);
  } catch (e) {
    alert("Exam progress data corrupted.");
    return;
  }

  console.log("Parsed examProgress object:", progress);

  // Normalize
  const normalized = Object.values(progress).map(entry => {
    if (typeof entry === 'boolean') {
      return { correct: entry, time: 0 };
    }
    return {
      correct: !!entry.correct,
      time: entry.time || entry.timeSpent || 0
    };
  });

  console.log("Normalized exam progress:", normalized);

  const totalSeen = normalized.length;
  const totalCorrect = normalized.filter(e => e.correct).length;
  const totalIncorrect = totalSeen - totalCorrect;
  const totalTime = normalized.reduce((sum, e) => sum + e.time, 0);
  const avgTime = totalSeen > 0 ? (totalTime / totalSeen).toFixed(1) : 0;

  alert(`Exam Stats:
Seen: ${totalSeen}
Correct: ${totalCorrect}
Incorrect: ${totalIncorrect}
Average time per question: ${avgTime} seconds`);
}
function saveProgress(key, data) {
    const progress = JSON.parse(localStorage.getItem('progress')) || {};
    progress[key] = data;
    localStorage.setItem('progress', JSON.stringify(progress));
}

function saveExamProgress(key, data) {
    const examProgress = JSON.parse(localStorage.getItem('examProgress')) || {};
    examProgress[key] = data;
    localStorage.setItem('examProgress', JSON.stringify(examProgress));
}
function fadeOutAndIn(element, updateCallback) {
  // Ensure .fade is present to enable fade transition
  if (!element.classList.contains('fade')) {
    element.classList.add('fade');
  }

  // Start fade-out by removing .show
  element.classList.remove("show");

  // After transition duration (250ms), update content and fade-in
  setTimeout(() => {
    updateCallback();                // update content

    // Force reflow for transition restart
    void element.offsetWidth;

    // Fade in by adding .show back
    element.classList.add("show");

    // Optional: Remove 'fade' class after fade-in completes (another 250ms)
    // so it doesn't stay forever and affect other styles:
    setTimeout(() => {
      element.classList.remove('fade');
    }, 300);

  }, 250);
}

function updateProgressBar() {
  if (!filteredQuestions.length) {
    document.getElementById('progress-bar').style.width = '0';
    document.getElementById('progress-bar-label').textContent = '';
    return;
  }
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  let seenCount = 0;
  filteredQuestions.forEach((q, idx) => {
    const key = `${q.set || 'set'}-${q.question_number || (idx + 1)}`;
    if (progress.hasOwnProperty(key)) seenCount++;
  });
  const total = filteredQuestions.length;
  const percent = Math.round((seenCount / total) * 100);
  document.getElementById('progress-bar').style.width = percent + '%';
  document.getElementById('progress-bar-label').textContent = `Seen: ${seenCount} / ${total}`;
}
