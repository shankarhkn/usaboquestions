let questions = [];

async function fetchQuestions() {
  const questionText = document.getElementById('question-text');
  const answerText = document.getElementById('answer-text');
  const choicesText = document.getElementById('choices-text');

  try {
    const response = await fetch('https://usaboquestions.onrender.com/questions');
    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.status}`);
    }

    questions = await response.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions available');
    }

    showRandomQuestion();
  } catch (error) {
    console.error(error);
    questionText.textContent = 'Failed to load questions.';
    answerText.style.display = 'none';
  }
}

function showRandomQuestion() {
  const questionText = document.getElementById('question-text');
  const choicesText = document.getElementById('choices-text');
  const answerText = document.getElementById('answer-text');

  if (!questionText || !choicesText || !answerText) {
    console.error("❌ Missing one or more required HTML elements (check your IDs)");
    return;
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

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

document.getElementById('show-answer').addEventListener('click', () => {
  const answerText = document.getElementById('answer-text');
  if (answerText) {
    answerText.style.display = 'block';
  }
});

fetchQuestions();
