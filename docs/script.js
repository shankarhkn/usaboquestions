let questions = [];
let filteredQuestions = [];
let currentIndex = 0;

// Get or ask for username
let username = localStorage.getItem('username');
if (!username) {
  username = prompt("Enter a username (just for this device):")?.trim();
  if (username) {
    localStorage.setItem('username', username);
  } else {
    username = "Guest";
  }
}
function getUsername() {
  let username = localStorage.getItem('usabo_username');
  if (!username) {
    username = prompt("Enter a username:");
    if (username) {
      localStorage.setItem('usabo_username', username);
    }
  }
  return username;
}

function updateGreeting() {
  const greeting = document.getElementById('greeting');
  const username = localStorage.getItem('usabo_username') || "user";
  greeting.textContent = `Welcome, ${username}!`;
}

// --- Existing code above remains unchanged ---

// After your DOMContentLoaded event listener (or inside it), add:

document.addEventListener("DOMContentLoaded", () => {
  // Insert greeting element once (already in your code)
  const greeting = document.createElement("p");
  greeting.innerHTML = `Welcome, <strong>${username}</strong>! <button id="show-stats">Show Stats</button>`;
  greeting.style.textAlign = "center";
  document.body.insertBefore(greeting, document.getElementById("app"));

  // Show Stats button handler
  document.getElementById("show-stats").addEventListener("click", showStats);

  // NEW: Change Username button handler
  document.getElementById("change-username").addEventListener("click", () => {
    const newUsername = prompt("Enter a new username (just for this device):")?.trim();
    if (newUsername) {
      // Update both localStorage keys to keep consistent
      localStorage.setItem('username', newUsername);
      localStorage.setItem('usabo_username', newUsername);
      // Update displayed username in greeting
      updateGreetingText(newUsername);
      alert(`Username changed to ${newUsername}`);
    }
  });

  // NEW: Clear Stats button handler
  document.getElementById("clear-stats").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all your progress stats?")) {
      localStorage.removeItem('progress');
      alert("Progress stats cleared.");
    }
  });

  // Helper function to update greeting text in #user-settings
  function updateGreetingText(name) {
    const greetingSpan = document.querySelector("#user-settings #greeting");
    if (greetingSpan) {
      greetingSpan.textContent = `Welcome, ${name}!`;
    }
  }

  // Initialize greeting text on page load
  updateGreetingText(localStorage.getItem('usabo_username') || username);
});




// Shuffle array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Fetch questions
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

// Populate filters
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

// Apply filters
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

// Show a question
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

      // Highlight correct answer
      allButtons.forEach(btn => {
        if (btn.textContent.trim().startsWith(answerLetter + ".")) {
          btn.classList.add('correct');
        }
      });

      // Save correct answer locally
      if (isCorrect) {
        const progress = JSON.parse(localStorage.getItem('progress')) || {};
        const key = `${question.set || 'set'}-${question.question_number || index}`;
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

// Show answer toggle (optional)
const showAnswerBtn = document.getElementById('show-answer');
if (showAnswerBtn) {
  showAnswerBtn.addEventListener('click', () => {
    const answerElem = document.getElementById('answer-text');
    answerElem.style.display = answerElem.style.display === 'none' ? 'block' : 'none';
  });
}

// Navigation
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

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Load questions
fetchQuestions();

// 📊 Show progress stats
function showStats() {
  const progress = JSON.parse(localStorage.getItem('progress')) || {};
  const totalCorrect = Object.keys(progress).length;
  alert(`${username}, you have correctly answered ${totalCorrect} question(s) correctly.`);
}
