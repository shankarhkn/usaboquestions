let questions = [];
let currentIndex = 0;

async function fetchQuestions() {
  const questionText = document.getElementById('question-text');
  const answerText = document.getElementById('answer-text');

  try {
    const response = await fetch('https://usaboquestions.onrender.com/questions');
    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.status}`);
    }

    questions = await response.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions available');
    }

    currentIndex = 0;  // Start at first question
    showQuestion(currentIndex);
  } catch (error) {
    console.error(error);
    questionText.textContent = 'Failed to load questions.';
    answerText.style.display = 'none';
  }
}

function showQuestion(index) {
  const questionNumber = document.getElementById('question-number');
  const questionText = document.getElementById('question-text');
  const choicesText = document.getElementById('choices-text');
  const answerText = document.getElementById('answer-text');

  if (!questionNumber || !questionText || !choicesText || !answerText) {
    console.error("Missing one or more required HTML elements");
    return;
  }

  if (index < 0 || index >= questions.length) {
    console.warn("Question index out of bounds");
    return;
  }

  const question = questions[index];

  // Show actual question_number field if it exists, else fallback to index+1
  questionNumber.textContent = question.question_number
    ? `Question ${question.question_number}`
    : `Question ${index + 1}`;

  questionText.textContent = question.question;

  choicesText.innerHTML = '';
  question.choices.forEach(choice => {
    const choiceElement = document.createElement('div');
    choiceElement.textContent = choice;
    choicesText.appendChild(choiceElement);
  });

  answerText.textContent = question.answer_text || question.answer || 'Answer not available';
  answerText.style.display = 'none';
}

// Show answer button functionality
document.getElementById('show-answer').addEventListener('click', () => {
  const answerText = document.getElementById('answer-text');
  if (answerText) {
    answerText.style.display = 'block';
  }
});

// Previous button functionality
document.getElementById('prev').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    showQuestion(currentIndex);
  }
});

// Next button functionality
document.getElementById('next').addEventListener('click', () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    showQuestion(currentIndex);
  }
});

fetchQuestions();
