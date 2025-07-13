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

  const showStatsBtn = document.getElementById("show-stats-btn");
  if (showStatsBtn) {
    showStatsBtn.addEventListener("click", showStats);
  }
  document.getElementById("bookmark-btn").addEventListener("click", () => {
    if (filteredQuestions.length === 0) return;
    const q = filteredQuestions[currentIndex];
    const key = `${q.set || 'set'}-${q.question_number || currentIndex + 1}`;
    toggleBookmark(key);
  });
  document.getElementById("change-username-btn")?.addEventListener("click", changeUsername);
  document.getElementById("clear-stats-btn")?.addEventListener("click", clearStats);
  document.getElementById("restart-questions")?.addEventListener("click", () => {
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


  document.getElementById('bottom-stats-btn')?.addEventListener('click', showStats);
  document.getElementById('bottom-username-btn')?.addEventListener('click', changeUsername);
  document.getElementById('bottom-start-timer-btn')?.addEventListener('click', startExamMode);
  document.getElementById('bottom-stop-timer-btn')?.addEventListener('click', stopTimer);
  document.getElementById('bottom-home-btn')?.addEventListener('click', () => {
    seenQuestionKeys.clear();
    currentIndex = 0;
    populateFilterOptions();
    applyFilters();
  });

  const bottomPauseBtn = document.getElementById("bottom-pause-timer-btn");

  if (bottomPauseBtn) {
    bottomPauseBtn.addEventListener("click", () => {
      timerPaused = !timerPaused;
      document.getElementById("pause-timer-btn").textContent = timerPaused ? "Resume" : "Pause";

      bottomPauseBtn.innerHTML = timerPaused
        ? `<img src="photos/play-solid.svg" alt="Play" width="20" height="20"><br /><span class='nav-label'>Resume</span>`
        : `<img src="photos/pause-solid.svg" alt="Pause" width="20" height="20"><br /><span class='nav-label'>Pause</span>`;
    });
  }



  const examInfoContainer = document.getElementById('exam-info');
  const examInfoTimer = document.getElementById('exam-info-timer');
  const inlineExamStatsBtn = document.getElementById('show-inline-exam-stats');

  inlineExamStatsBtn.addEventListener('click', showExamStats);

  document.getElementById('bottom-start-timer-btn')?.addEventListener('click', () => {
    startExamMode();
    examInfoContainer.style.display = 'block';
  });

  // Keep exam info shown if examModeActive was already true
  if (examModeActive) {
    examInfoContainer.style.display = 'block';
  }

  // Keep timer synced
  setInterval(() => {
    if (examModeActive) {
      const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const seconds = (timeLeft % 60).toString().padStart(2, '0');
      examInfoTimer.textContent = `⏱ ${minutes}:${seconds}`;
    }
  }, 1000);




  fetchQuestions();

  if (examModeActive) {
    resumeExamTimer();
  }
});

function updateGreeting(name) {
  document.getElementById('username-display').innerHTML = `Welcome, <strong>${name}</strong>`;
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
    let data = await res.json();

    // ✅ Fully flatten any nested structure
    const flattenDeep = (arr) => arr.flatMap(q => Array.isArray(q) ? flattenDeep(q) : [q]);
    questions = flattenDeep(data);

    // 🔍 Warn about bad/missing categories
    questions.forEach((q, i) => {
      if (!q.category || typeof q.category !== 'string' || q.category.trim() === '') {
        console.warn(`❌ Invalid category at index ${i}:`, q.category, q);
      }
    });

    console.log('✅ Total questions loaded:', questions.length);

    populateFilterOptions();
    applyFilters();
  } catch (error) {
    console.error("❌ Failed to fetch questions:", error);
  }
}




function populateCategoryDropdown(questions) {
  // Extract category strings, trim whitespace, and remove null/empty
  const rawCategories = questions
    .map(q => (typeof q.category === 'string' ? q.category.trim() : null))
    .filter(cat => cat && cat.length > 0);

  // Get unique categories
  const uniqueCategories = [...new Set(rawCategories)];

  // Sort categories alphabetically
  uniqueCategories.sort((a, b) => a.localeCompare(b));

  // Get the dropdown <select> element by its ID
  const categorySelect = document.getElementById('category-select');

  if (!categorySelect) {
    console.error('Category select element with id "category-select" not found.');
    return;
  }

  // Clear existing options but keep the default "All" option
  categorySelect.innerHTML = '<option value="">All</option>';

  // Create an option element for each unique category
  uniqueCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Debug: Log loaded categories to the console
  console.log('Categories loaded:', uniqueCategories);
}


function populateFilterOptions() {
  const categorySelect = document.getElementById('category-select');
  const setSelect = document.getElementById('set-select');

  categorySelect.innerHTML = '<option value="">All</option>';
  setSelect.innerHTML = `
    <option value="">All</option>
    <option value="__bookmarked__">Bookmarked</option>
    <option value="__incorrect__">Incorrect</option>
  `;

  // Map normalized category -> original
  const categoryMap = new Map();

  questions.forEach(q => {
    if (typeof q.category === 'string' && q.category.trim().length > 0) {
      const normalized = q.category.trim().toLowerCase();
      if (!categoryMap.has(normalized)) {
        categoryMap.set(normalized, q.category.trim());
      }
    }
  });

  const categories = Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b));

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Same for sets (assuming they are simpler strings)
  const sets = [...new Set(
    questions
      .map(q => (typeof q.set === 'string' ? q.set.trim() : ''))
      .filter(set => set.length > 0)
  )].sort((a, b) => a.localeCompare(b));

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
  const progress = JSON.parse(localStorage.getItem('progress')) || {};

  filteredQuestions = questions.filter(q => {
    const isCategoryMatch = !selectedCategory || q.category === selectedCategory;

    const key = `${q.set || 'set'}-${q.question_number || q.id || 'unknown'}`;
    const progressEntry = progress[key];

    let isSetMatch = false;
    if (selectedSet === '__bookmarked__') {
      isSetMatch = bookmarks.includes(key);
    } else if (selectedSet === '__incorrect__') {
      isSetMatch = progressEntry && typeof progressEntry === 'object' && progressEntry.correct === false;
    } else {
      isSetMatch = !selectedSet || q.set === selectedSet;
    }

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
          progress[key] = { correct: selected === correct };
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
