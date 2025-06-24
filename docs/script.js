let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let questionStartTime = null;
let examTimer = null;
let examTimeLeft = 0;

// Get or use default username
let username = localStorage.getItem('username') || "Guest";

document.addEventListener("DOMContentLoaded", () => {
  updateGreeting(username);

  document.getElementById("show-stats").addEventListener("click", showStats);

  document.getElementById("change-username").addEventListener("click", () => {
    const newUsername = prompt("Enter a new username (just for this device):")?.trim();
    if (newUsername) {
      localStorage.setItem('username', newUsername);
      localStorage.setItem('usabo_username', newUsername);
      updateGreetingText(newUsername);
      alert(`Username changed to ${newUsername}`);
    }
  });

  document.getElementById("clear-stats").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all your progress stats?")) {
      localStorage.removeItem('progress');
      alert("Progress stats cleared.");
    }
  });

  document.getElementById("start-exam-mode").addEventListener("click", () => {
    if (confirm("Start exam simulation mode? You will have 50 minutes.")) {
      startExamTimer(50 * 60); // 50 minutes in seconds
    }
  });

  updateGreetingText(localStorage.getItem('usabo_username') || username);
  fetchQuestions();
  document.getElementById('year').textContent = new Date().getFullYear();
});

function updateGreetingText(name) {
  const greetingSpan = document.querySelector("#user-settings #greeting");
  if (greetingSpan) greetingSpan.textContent = `Welcome, ${name}!`;
}

function updateGreeting(name) {
  const greeting = document.getElementById('greeting');
  const username = localStorage.getItem('usabo_username') || "user";
  if (greeting) greeting.textContent = `Welcome, ${username}!`;
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

  filteredQuestions = questions.filter(q => {
    return (!selectedCategory || q.category === selectedCategory) &&
      (!selectedSet || q.set === selectedSet);
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

function showQuestion(index) {
  const question = filteredQuestions[index];

  document.getElementById('question-number').textContent = `Question ${question.question_number || index + 1}`;
  document.getElementById('question-set').textContent = question.set ? `Set: ${question.set}` : '';
  document.getElementById('question-category').textContent = question.category ? `Category: ${question.category}` : '';
  document.getElementById('question-text').innerHTML = question.question;

  const choicesContainer = document.getElementById('choices-text');
  choicesContainer.innerHTML = '';

  const answerLetter = question.answer;
  const matchingChoice = question.choices.find(c => c.trim().startsWith(answerLetter + '.')) || '';
  const answerFullText = matchingChoice ? matchingChoice : `Answer: ${answerLetter}`;
  const answerElem = document.getElementById('answer-text');
  answerElem.textContent = answerFullText;
  answerElem.style.display = 'none';

  questionStartTime = Date.now();

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
        if (btn !== choiceButton) btn.classList.add('not-selected');
        if (btn.textContent.trim().startsWith(answerLetter + '.')) btn.classList.add('correct');
      });

      const key = `${question.set || 'set'}-${question.question_number || index}`;
      const timeTaken = (Date.now() - questionStartTime) / 1000;

      const progress = JSON.parse(localStorage.getItem('progress')) || {};
      progress[key] = {
        correct: isCorrect,
        timeTaken: timeTaken,
        timestamp: Date.now()
      };
      localStorage.setItem('progress', JSON.stringify(progress));

      answerElem.style.display = 'block';
    });

    choicesContainer.appendChild(choiceButton);
  });
}

function showStats() {
  const currentUsername = localStorage.getItem('username') || 'Guest';
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  let correct = 0, incorrect = 0, totalTime = 0;

  for (const key in progress) {
    if (progress[key].correct) correct++;
    else incorrect++;
    totalTime += progress[key].timeTaken || 0;
  }

  const total = correct + incorrect;
  const avgTime = total > 0 ? (totalTime / total).toFixed(2) : 0;

  alert(`${currentUsername}'s Stats:\nCorrect: ${correct}\nIncorrect: ${incorrect}\nAverage Time: ${avgTime}s/question`);
}

function startExamTimer(seconds) {
  clearInterval(examTimer);
  examTimeLeft = seconds;
  updateTimerDisplay();

  examTimer = setInterval(() => {
    examTimeLeft--;
    updateTimerDisplay();

    if (examTimeLeft <= 0) {
      clearInterval(examTimer);
      alert("Exam time is up!");
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById("exam-timer");
  if (!el) return;
  const minutes = Math.floor(examTimeLeft / 60).toString().padStart(2, '0');
  const seconds = (examTimeLeft % 60).toString().padStart(2, '0');
  el.textContent = `⏱ ${minutes}:${seconds}`;
}

document.getElementById('prev').addEventListener('click', () => {
  if (filteredQuestions.length === 0) return;
  currentIndex = (currentIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
  showQuestion(currentIndex);
});

document.getElementById('next').addEventListener('click', () => {
  if (filteredQuestions.length === 0) return;
  currentIndex = (currentIndex + 1) % filteredQuestions.length;
  showQuestion(currentIndex);
});

document.getElementById('apply-filters').addEventListener('click', applyFilters);

const showAnswerBtn = document.getElementById('show-answer');
if (showAnswerBtn) {
  showAnswerBtn.addEventListener('click', () => {
    const answerElem = document.getElementById('answer-text');
    answerElem.style.display = answerElem.style.display === 'none' ? 'block' : 'none';
  });
}
