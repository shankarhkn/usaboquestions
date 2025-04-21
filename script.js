let questions = [];

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

    showRandomQuestion();
  } catch (error) {
    console.error(error);
    questionText.textContent = 'Failed to load questions.';
    answerText.style.display = 'none';
  }
}

function showRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

  document.getElementById('question-text').textContent = question.question;
  document.getElementById('answer-text').textContent = question.answer;
  document.getElementById('answer-text').style.display = 'none';
}

document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer-text').style.display = 'block';
});

fetchQuestions();
