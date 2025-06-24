document.addEventListener("DOMContentLoaded", () => {
  const greetingSpan = document.getElementById('greeting');
  const savedUsername = localStorage.getItem('username') || 'Guest';
  greetingSpan.textContent = `Welcome, ${savedUsername}!`;

  document.getElementById("show-stats").addEventListener("click", showStats);

  document.getElementById("change-username").addEventListener("click", () => {
    const newUsername = prompt("Enter a new username (just for this device):")?.trim();
    if (newUsername) {
      localStorage.setItem('username', newUsername);
      localStorage.setItem('usabo_username', newUsername);
      greetingSpan.textContent = `Welcome, ${newUsername}!`;
      alert(`Username changed to ${newUsername}`);
    }
  });

  document.getElementById("clear-stats").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all your progress stats?")) {
      localStorage.removeItem('progress');
      alert("Progress stats cleared.");
    }
  });

  // Initialize timer
  window.currentQuestionStartTime = Date.now();

  // Example to show the first question
  // Replace this with your actual logic
  if (typeof showQuestion === 'function' && typeof filteredQuestions !== 'undefined') {
    showQuestion(0);
  }
});

function showQuestion(index) {
  const question = filteredQuestions[index];
  const questionElem = document.getElementById("question");
  const choicesElem = document.getElementById("choices");
  const answerElem = document.getElementById("answer");

  questionElem.textContent = question.question;
  choicesElem.innerHTML = "";
  answerElem.textContent = question.answer || "";
  answerElem.style.display = "none";

  const answerLetter = (question.answer || "").trim().charAt(0).toUpperCase();

  question.choices.forEach(choice => {
    const choiceButton = document.createElement("button");
    choiceButton.textContent = choice;
    choiceButton.classList.add("choice-btn");

    choiceButton.addEventListener("click", () => {
      const allButtons = document.querySelectorAll(".choice-btn");
      allButtons.forEach(btn => btn.disabled = true);

      const isCorrect = choice.trim().startsWith(answerLetter + '.');
      choiceButton.classList.add(isCorrect ? 'correct' : 'incorrect');

      allButtons.forEach(btn => {
        if (btn !== choiceButton) {
          btn.classList.add('not-selected');
        }
        if (btn.textContent.trim().startsWith(answerLetter + ".")) {
          btn.classList.add('correct');
        }
      });

      const progress = JSON.parse(localStorage.getItem('progress')) || {};
      const key = `${question.set || 'set'}-${question.question_number || index}`;
      const timeTaken = (Date.now() - (window.currentQuestionStartTime || Date.now())) / 1000;

      progress[key] = {
        correct: isCorrect,
        timeTaken: timeTaken,
        timestamp: Date.now()
      };

      localStorage.setItem('progress', JSON.stringify(progress));

      answerElem.style.display = 'block';
    });

    choicesElem.appendChild(choiceButton);
  });

  window.currentQuestionStartTime = Date.now();
}

function showStats() {
  const currentUsername = localStorage.getItem('username') || 'Guest';
  const progress = JSON.parse(localStorage.getItem('progress')) || {};

  let correctCount = 0;
  let incorrectCount = 0;
  let totalTime = 0;

  for (const key in progress) {
    const entry = progress[key];
    if (entry.correct) correctCount++;
    else incorrectCount++;
    totalTime += entry.timeTaken || 0;
  }

  const totalQuestions = correctCount + incorrectCount;
  const avgTime = totalQuestions ? (totalTime / totalQuestions).toFixed(2) : 0;

  alert(`${currentUsername}'s Stats:
Correct: ${correctCount}
Incorrect: ${incorrectCount}
Average Time per Question: ${avgTime} seconds`);
}
