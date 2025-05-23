let questions = [];
let currentIndex = 0;

// Fisher-Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

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

    shuffle(questions);
    currentIndex = 0;
    showQuestion(currentIndex);
  } catch (error) {
    console.error(error);
    document.getElementById('question-text').textContent = 'Failed to load questions.';
    document.getElementById('answer-text').style.display = 'none';
  }
}

function showQuestion(index) {
  const question = questions[index];

  document.getElementById('question-number').textContent =
    `Question ${question.question_number || (index + 1)}`;

  document.getElementById('question-set').textContent =
    question.set ? `Set: ${question.set}` : '';
  
  
  document.getElementById('question-category').textContent =
    question.category ? `Category: ${question.category}` : '';  

  document.getElementById('question-text').innerHTML = question.question;

  const choicesText = document.getElementById('choices-text');
  choicesText.innerHTML = '';
  question.choices.forEach(choice => {
    const choiceElement = document.createElement('div');
    choiceElement.textContent = choice;
    choicesText.appendChild(choiceElement);
  });

  // Prepare answer text as "Answer: B. Myosin." for example
  const answerLetter = question.answer;
  const matchingChoice = question.choices.find(c => c.trim().startsWith(answerLetter + '.')) || '';
  const answerFullText = matchingChoice ? matchingChoice : `Answer: ${answerLetter}`;

  const answerElem = document.getElementById('answer-text');
  answerElem.textContent = answerFullText;
  answerElem.style.display = 'none';
}

document.getElementById('show-answer').addEventListener('click', () => {
  const answerElem = document.getElementById('answer-text');
  answerElem.style.display = answerElem.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('prev').addEventListener('click', () => {
  if (questions.length === 0) return;
  currentIndex = (currentIndex - 1 + questions.length) % questions.length;
  showQuestion(currentIndex);
});

document.getElementById('next').addEventListener('click', () => {
  if (questions.length === 0) return;
  currentIndex = (currentIndex + 1) % questions.length;
  showQuestion(currentIndex);
});

fetchQuestions();
