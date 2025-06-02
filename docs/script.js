let questions = [];
let filteredQuestions = [];
let currentIndex = 0;

// Shuffle array in place
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Fetch questions from API
async function fetchQuestions() {
  try {
    const response = await fetch('https://usaboquestions.onrender.com/questions');
    if (!response.ok) throw new Error(`Error fetching questions: ${response.status}`);

    questions = await response.json();
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions are available');

    populateFilterOptions();
    applyFilters(); // show default view
  } catch (error) {
    console.error(error);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
    document.getElementById('answer-text').style.display = 'none';
  }
}

// Populate category and set dropdowns
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

// Apply filter selections
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

// Show one question by index
function showQuestion(index) {
  const question = filteredQuestions[index];

  document.getElementById('question-number').textContent =
    `Question ${question.question_number || index + 1}`;
  document.getElementById('question-set').textContent =
    question.set ? `Set: ${question.set}` : '';
  document.getElementById('question-category').textContent =
    question.category ? `Category: ${question.category}` : '';
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
      answerElem.style.display = 'block';
    });

    choicesContainer.appendChild(choiceButton);
  });
}

// Toggle answer visibility
const showAnswerBtn = document.getElementById('show-answer');
if (showAnswerBtn) {
  document.getElementById('show-answer').addEventListener('click', () => {
    const answerElem = document.getElementById('answer-text');
    answerElem.style.display = answerElem.style.display === 'none' ? 'block' : 'none';
  });
}

// Navigation buttons
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

// Apply filters
document.getElementById('apply-filters').addEventListener('click', applyFilters);

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Load questions initially
fetchQuestions();
