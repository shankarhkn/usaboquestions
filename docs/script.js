// script.js
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

const explanationApiUrl = 'https://233d-34-125-70-186.ngrok-free.app/explain';


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

async function showQuestion(index) {
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
    bookmarkBtn.style.display = 'inline';
    bookmarkBtn.style.color = bookmarks.includes(key) ? '#f5b301' : '#666';
    bookmarkBtn.textContent = bookmarks.includes(key) ? '★' : '☆';
    bookmarkBtn.onclick = toggleBookmark;
  } else {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    bookmarkBtn.style.display = 'none';
    questionSetElem.textContent = '';
  }

  document.getElementById('question-text').innerHTML = question.question;

  const choicesContainer = document.getElementById('choices-text');
  choicesContainer.innerHTML = '';

  const answerLetter = question.answer;

  // Hide answer and explanation text initially
  const answerElem = document.getElementById('answer-text');
  const explanationElem = document.getElementById('explanation-text');
  answerElem.style.display = 'none';
  explanationElem.style.display = 'none';
  explanationElem.textContent = '';

  question.choices.forEach(choice => {
    const choiceBtn = document.createElement('button');
    choiceBtn.textContent = choice;
    choiceBtn.classList.add('choice-btn');

    choiceBtn.addEventListener('click', async () => {
      const allButtons = document.querySelectorAll('.choice-btn');
      allButtons.forEach(btn => btn.disabled = true);

      const selectedAnswer = choice.trim().charAt(0);
      const isCorrect = selectedAnswer === question.answer;

      choiceBtn.classList.add(isCorrect ? 'correct' : 'incorrect');

      allButtons.forEach(btn => {
        if (btn !== choiceBtn) btn.classList.add('not-selected');
        if (btn.textContent.trim().startsWith(question.answer + '.')) {
          btn.classList.add('correct');
        }
      });

      if (examModeActive) {
        examProgress[key] = isCorrect ? 'correct' : 'incorrect';
        saveExamProgress();
      } else if (isCorrect) {
        const progress = JSON.parse(localStorage.getItem('progress')) || {};
        progress[key] = { correct: true, timestamp: Date.now() };
        localStorage.setItem('progress', JSON.stringify(progress));
      }

      const answerElem = document.getElementById('answer-text');
      answerElem.style.display = 'block';
      answerElem.textContent = `You answered '${selectedAnswer}'. The correct answer is '${question.answer}'.`;

      const explanationElem = document.getElementById('explanation-text');
      explanationElem.style.display = 'block';
      explanationElem.textContent = 'Loading explanation...';

      try {
        const response = await fetch(explanationApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.question,
            user_answer: selectedAnswer,
            correct_answer: question.answer,
            set: question.set,
            question_number: question.question_number
          })
        });

        const data = await response.json();
        explanationElem.textContent = data.explanation || 'No explanation available.';
      } catch (err) {
        console.error('Error fetching explanation:', err);
        explanationElem.textContent = 'Failed to fetch explanation.';
      }
    });

    choicesContainer.appendChild(choiceBtn);
  });
  
}

function toggleBookmark() {
  const question = filteredQuestions[currentIndex];
  const key = `${question.set || 'set'}-${question.question_number || currentIndex + 1}`;
  const index = bookmarks.indexOf(key);

  if (index > -1) bookmarks.splice(index, 1);
  else bookmarks.push(key);

  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  showQuestion(currentIndex);
}

function showStats() {
  const currentUsername = localStorage.getItem('username') || 'Guest';
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  const totalCorrect = Object.keys(progress).length;
  alert(`${currentUsername}, you have correctly answered ${totalCorrect} question(s).`);
}

// Dummy placeholder functions for exam timer controls (implement or remove as needed)
function setupExamControls() { }
function loadTimerState() { return false; }
function loadExamProgress() { }
function resumeExamTimer() { }
function saveExamProgress() { }

