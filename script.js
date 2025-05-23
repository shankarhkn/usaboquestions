let questions = [];
let currentQuestionIndex = 0; // Keep track of the current question

async function fetchQuestions() {
  try {
    const response = await fetch('https://usaboquestions.onrender.com/questions');
    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.status}`);
    }

    questions = await response.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions available');
    }

    showQuestion(currentQuestionIndex); // Show the first question
  } catch (error) {
    console.error(error);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
    document.getElementById('answer-text').style.display = 'none';
    document.getElementById('choices-text').innerHTML = ''; // Clear choices
  }
}

function showQuestion(index) {
  if (index < 0 || index >= questions.length) {
    console.warn('Question index out of bounds:', index);
    return; // Don't try to display an invalid question
  }

  const question = questions[index];

  if (!question) {
    console.error('Error: No question found at index', index);
    return;
  }

  document.getElementById('question-text').textContent = question.question;

  const choicesText = document.getElementById('choices-text');
  choicesText.innerHTML = '';

  if (question.choices && Array.isArray(question.choices)) {
    question.choices.forEach(choice => {
      const choiceElement = document.createElement('div');
      choiceElement.textContent = choice;
      choicesText.appendChild(choiceElement);
    });
  } else {
    choicesText.textContent = 'No choices provided.';
  }

  document.getElementById('answer-text').textContent = question.answer || 'Answer will be shown here';
  document.getElementById('answer-text').style.display = 'none'; // Initially hidden
}

document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer-text').style.display = 'block';
});

document.getElementById('next').addEventListener('click', () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
  }
});

fetchQuestions();