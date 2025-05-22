let questions = [];

async function fetchQuestions() {
  const questionText = document.getElementById('question-text');
  const answerText = document.getElementById('answer-text');
  const choicesText = document.getElementById('choices-text'); // Add this to reference where choices will go

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
  
  // Dynamically display choices as a list
  const choicesText = document.getElementById('choices-text');
  choicesText.innerHTML = '';  // Clear previous choices

  question.choices.forEach(choice => {
    const choiceElement = document.createElement('div');
    choiceElement.textContent = choice;
    choicesText.appendChild(choiceElement);
  });

  document.getElementById('answer-text').textContent = question.answer || 'Answer will be shown here';
  document.getElementById('answer-text').style.display = 'none';
}

document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer-text').style.display = 'block';
});

fetchQuestions();

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
