let questions = [];
let index = 0;

async function fetchQuestions() {
  try {
    const res = await fetch('https://usabo-api.onrender.com/questions'); // Replace with your real URL
    questions = await res.json();
    showQuestion();
  } catch (e) {
    document.getElementById('question-text').textContent = 'Failed to load questions.';
  }
}

function showQuestion() {
  const q = questions[index];
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('answer-text').textContent = q.answer;
  document.getElementById('answer-text').style.display = 'none';
}

document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer-text').style.display = 'block';
});

document.getElementById('next').addEventListener('click', () => {
  if (index < questions.length - 1) {
    index++;
    showQuestion();
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (index > 0) {
    index--;
    showQuestion();
  }
});

fetchQuestions();
