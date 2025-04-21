let questions = [];
let currentQuestion = {};

async function fetchQuestions() {
  try {
    const res = await fetch('https://usaboquestions.onrender.com/questions'); // Your deployed API endpoint
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} - ${res.statusText}`);
    }
    questions = await res.json();
    
    if (questions.length > 0) {
      showRandomQuestion();
    } else {
      throw new Error('No questions available.');
    }
  } catch (e) {
    console.error('Error fetching questions:', e);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
  }
}

// Function to display a random question
function showRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  currentQuestion = questions[randomIndex];

  document.getElementById('question-text').textContent = currentQuestion.question;
  document.getElementById('answer-text').textContent = currentQuestion.answer;
  document.getElementById('answer-text').style.display = 'none';
}

// Show the answer when the button is clicked
document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer-text').style.display = 'block';
});

// Fetch the questions when the page loads
fetchQuestions();
