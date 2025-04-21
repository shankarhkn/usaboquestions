let questions = [];
let currentQuestionIndex = 0; // Track the index of the current question

async function fetchQuestions() {
  try {
    const res = await fetch('https://usaboquestions.onrender.com/questions');
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} - ${res.statusText}`);
    }
    questions = await res.json();
    showQuestion(currentQuestionIndex); // Show the first question
  } catch (e) {
    console.error('Error fetching questions:', e);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
  }
}

// Function to display the current question based on its index
function showQuestion(index) {
  if (index >= questions.length) {
    document.getElementById('question-text').textContent = 'No more questions available.';
    return;
  }
  
  const currentQuestion = questions[index];
  document.getElementById('question-text').textContent = currentQuestion.question;
  document.getElementById('answer-text').textContent = currentQuestion.answer;
  document.getElementById('answer-text').style.display = 'none';
}

// Show the answer when the button is clicked
document.getElementById('show-answer').addEventListener('click', () => {
  document.getElementById('answer-text').style.display = 'block';
});

// Move to the next question when the "Next Question" button is clicked
document.getElementById('next-question').addEventListener('click', () => {
  currentQuestionIndex++;
  if (currentQuestionIndex >= questions.length) {
    currentQuestionIndex = 0; // Reset to the first question when we reach the end
  }
  showQuestion(currentQuestionIndex); // Show the next question
});

// Fetch the questions when the page loads
fetchQuestions();
