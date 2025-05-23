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

    try {
      showRandomQuestion();
    } catch (err) {
      console.error('Error displaying question:', err);
      questionText.textContent = 'Error displaying question.';
    }
  } catch (error) {
    console.error('Fetch error:', error);
    questionText.textContent = 'Failed to load questions.';
    answerText.style.display = 'none';
  }
}

function showRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

  // Safety checks
  if (!question || typeof question.question !== 'string' || !Array.isArray(question.choices)) {
    throw new Error('Invalid question structure');
  }

  document.getElementById('question-text').textContent = question.question;

  const choicesText = document.getElementById('choices-text');
  choicesText.innerHTML = '';  // Clear previous choices

  question.choices.forEach(choice => {
    const choiceElement = document.createElement('div');
    choiceElement.textContent = choice;
    choicesText.appendChild(choiceElement);
  });

  // If "answer" exists, display it. Otherwise, hide.
  const answer = document.getElementById('answer');
  if (question.answer || question.answer_text) {
    answer.textContent = question.answer_text || question.answer || 'Answer not available';
  } else {
    answer.textContent = 'Answer not available';
  }
  answer.style.display = 'none';
}

document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer').style.display = 'block';
});

fetchQuestions();
