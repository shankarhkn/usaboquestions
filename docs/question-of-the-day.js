// Question of the Day functionality
let questions = [];
let currentQuestion = null;
let userStats = {
  totalPoints: 0,
  streak: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  lastAnswerDate: null
};

let leaderboards = {
  weekly: [],
  monthly: []
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
  // Set current year
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Load user data
  loadUserData();
  
  // Load questions
  await loadQuestions();
  
  // Load leaderboards
  loadLeaderboards();
  
  // Display today's question
  displayTodaysQuestion();
  
  // Update user stats display
  updateStatsDisplay();
});

// Load questions from the API
async function loadQuestions() {
  try {
    const local = await fetch('python/questions.json').then(r => r.json());
    const remote = await fetch('https://usaboquestions.onrender.com/questions').then(r => r.json()).catch(() => []);
    
    const combined = [...local, ...remote].flat(Infinity);
    questions = combined;
    console.log('Loaded questions:', questions.length);
  } catch (error) {
    console.error('Error loading questions:', error);
    questions = [];
  }
}

// Get today's question based on date
function getTodaysQuestion() {
  if (questions.length === 0) return null;
  
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const questionIndex = dayOfYear % questions.length;
  
  return questions[questionIndex];
}

// Display today's question
function displayTodaysQuestion() {
  currentQuestion = getTodaysQuestion();
  
  if (!currentQuestion) {
    document.getElementById('question-text').textContent = 'No questions available.';
    return;
  }
  
  // Set question date
  const today = new Date();
  document.getElementById('question-date').textContent = `Today: ${today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`;
  
  // Check if user already answered today
  const todayString = today.toDateString();
  const alreadyAnswered = userStats.lastAnswerDate === todayString;
  
  // Display question metadata
  document.getElementById('question-number-display').textContent = `Question #${currentQuestion.question_number || 'N/A'}`;
  document.getElementById('question-set-display').textContent = `Set: ${currentQuestion.set || 'N/A'}`;
  document.getElementById('question-category-display').textContent = `Category: ${currentQuestion.category || 'N/A'}`;
  
  // Display question text with proper image handling
  const questionText = currentQuestion.question;
  // Fix image paths to use local images
  const fixedQuestionText = questionText.replace(
    /https:\/\/raw\.githubusercontent\.com\/shankarhkn\/usaboquestions\/refs\/heads\/main\/docs\/questionphotos\//g,
    'questionphotos/'
  );
  
  // Check if question has an image
  const hasImage = fixedQuestionText.includes('<img');
  
  if (hasImage) {
    // Split content into image and text parts
    const imgMatch = fixedQuestionText.match(/<img[^>]*>/);
    const imgTag = imgMatch ? imgMatch[0] : '';
    const textContent = fixedQuestionText.replace(/<img[^>]*>/g, '').trim();
    
    document.getElementById('question-text').innerHTML = `
      ${imgTag}
      <div id="question-text-content">${textContent}</div>
    `;
  } else {
    // No image, just display text normally
    document.getElementById('question-text').innerHTML = `
      <div id="question-text-content">${fixedQuestionText}</div>
    `;
  }
  
  // Display choices
  const choicesContainer = document.getElementById('choices-container');
  choicesContainer.innerHTML = '';
  
  if (currentQuestion.choices && currentQuestion.choices.length > 0) {
    currentQuestion.choices.forEach((choice, index) => {
      const choiceDiv = document.createElement('div');
      choiceDiv.style.margin = '3px 0';
      choiceDiv.style.padding = '4px';
      choiceDiv.style.border = '1px solid #ddd';
      choiceDiv.style.borderRadius = '2px';
      choiceDiv.style.cursor = 'pointer';
      choiceDiv.style.transition = 'background-color 0.2s';
      
      const radioId = `choice-${index}`;
      choiceDiv.innerHTML = `
        <input type="radio" name="answer" value="${choice.charAt(0)}" id="${radioId}" style="margin-right: 6px;">
        <label for="${radioId}" style="cursor: pointer; margin: 0; width: 100%; display: block;">${choice}</label>
      `;
      
      // Add click handler to the entire div
      choiceDiv.addEventListener('click', (e) => {
        // Don't trigger if clicking directly on the radio button
        if (e.target.type !== 'radio') {
          const radio = choiceDiv.querySelector('input[type="radio"]');
          radio.checked = true;
          // Trigger change event to ensure other handlers work
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      // Add hover effect
      choiceDiv.addEventListener('mouseenter', () => {
        choiceDiv.style.backgroundColor = '#f8f9fa';
      });
      choiceDiv.addEventListener('mouseleave', () => {
        choiceDiv.style.backgroundColor = '';
      });
      
      choicesContainer.appendChild(choiceDiv);
    });
  }
  
  // Show answer section
  document.getElementById('answer-section').style.display = 'block';
  
  // Handle bookmark functionality
  setupBookmarkButton();
  
  // Handle already answered case
  if (alreadyAnswered) {
    document.getElementById('submit-answer').disabled = true;
    document.getElementById('submit-answer').textContent = 'Already Answered Today';
    
    // Show the correct answer
    const feedbackDiv = document.getElementById('answer-feedback');
    feedbackDiv.innerHTML = `
      <div class="answer-feedback correct">
        <div>You already answered today's question!</div>
        <div>Correct answer: ${currentQuestion.answer}</div>
      </div>
    `;
  } else {
    // Add submit button event listener
    document.getElementById('submit-answer').onclick = submitAnswer;
  }
}

// Submit answer
function submitAnswer() {
  const selectedAnswer = document.querySelector('input[name="answer"]:checked');
  
  if (!selectedAnswer) {
    alert('Please select an answer!');
    return;
  }
  
  const userAnswer = selectedAnswer.value;
  const isCorrect = userAnswer === currentQuestion.answer;
  
  // Calculate points (10 points for correct answer)
  const pointsEarned = isCorrect ? 10 : 0;
  
  // Update user stats
  updateUserStats(isCorrect, pointsEarned);
  
  // Display feedback
  const feedbackDiv = document.getElementById('answer-feedback');
  feedbackDiv.innerHTML = '';
  
  const resultDiv = document.createElement('div');
  resultDiv.className = `answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  resultDiv.innerHTML = `
    <div>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</div>
    <div>Correct answer: ${currentQuestion.answer}</div>
  `;
  
  if (pointsEarned > 0) {
    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'answer-feedback points-earned';
    pointsDiv.textContent = `+${pointsEarned} points earned!`;
    feedbackDiv.appendChild(pointsDiv);
  }
  
  feedbackDiv.appendChild(resultDiv);
  
  // Disable submit button
  document.getElementById('submit-answer').disabled = true;
  document.getElementById('submit-answer').textContent = 'Already Answered';
  
  // Update stats display
  updateStatsDisplay();
  
  // Update leaderboards
  updateLeaderboards();
}

// Update user statistics
function updateUserStats(isCorrect, pointsEarned) {
  const today = new Date().toDateString();
  
  // Check if user already answered today
  if (userStats.lastAnswerDate === today) {
    return; // Don't update if already answered today
  }
  
  userStats.questionsAnswered++;
  userStats.totalPoints += pointsEarned;
  
  if (isCorrect) {
    userStats.correctAnswers++;
  }
  
  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  if (userStats.lastAnswerDate === yesterdayString && isCorrect) {
    userStats.streak++;
  } else if (userStats.lastAnswerDate !== today) {
    userStats.streak = isCorrect ? 1 : 0;
  }
  
  userStats.lastAnswerDate = today;
  
  // Save to localStorage
  localStorage.setItem('userStats', JSON.stringify(userStats));
}

// Load user data from localStorage
function loadUserData() {
  const savedStats = localStorage.getItem('userStats');
  if (savedStats) {
    userStats = JSON.parse(savedStats);
  }
  
  // Load username
  const username = localStorage.getItem('username') || 'Guest';
  document.getElementById('username-display').textContent = username;
}

// Update stats display
function updateStatsDisplay() {
  document.getElementById('total-points').textContent = userStats.totalPoints;
  document.getElementById('streak').textContent = userStats.streak;
  document.getElementById('questions-answered').textContent = userStats.questionsAnswered;
  
  const accuracy = userStats.questionsAnswered > 0 
    ? Math.round((userStats.correctAnswers / userStats.questionsAnswered) * 100)
    : 0;
  document.getElementById('accuracy').textContent = accuracy + '%';
}

// Load leaderboards
function loadLeaderboards() {
  const savedLeaderboards = localStorage.getItem('leaderboards');
  if (savedLeaderboards) {
    leaderboards = JSON.parse(savedLeaderboards);
  }
  
  updateLeaderboards();
}

// Update leaderboards
function updateLeaderboards() {
  const username = localStorage.getItem('username') || 'Guest';
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Update weekly leaderboard
  updateLeaderboard('weekly', weekStart, 'weekly-leaderboard');
  
  // Update monthly leaderboard
  updateLeaderboard('monthly', monthStart, 'monthly-leaderboard');
  
  // Save leaderboards
  localStorage.setItem('leaderboards', JSON.stringify(leaderboards));
}

// Update a specific leaderboard
function updateLeaderboard(type, startDate, containerId) {
  const username = localStorage.getItem('username') || 'Guest';
  
  // Get or create user entry
  let userEntry = leaderboards[type].find(entry => entry.username === username);
  if (!userEntry) {
    userEntry = { username, points: 0, lastUpdated: null };
    leaderboards[type].push(userEntry);
  }
  
  // Update user's points for this period (only if they answered today)
  const today = new Date().toDateString();
  if (userEntry.lastUpdated !== today && userStats.lastAnswerDate === today) {
    // Add points earned today to the period total
    const pointsToday = userStats.lastAnswerDate === today ? 10 : 0;
    userEntry.points += pointsToday;
    userEntry.lastUpdated = today;
  }
  
  // Sort by points
  leaderboards[type].sort((a, b) => b.points - a.points);
  
  // Display top 5
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  const top5 = leaderboards[type].slice(0, 5);
  if (top5.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No entries yet</div>';
    return;
  }
  
  top5.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'leaderboard-entry';
    entryDiv.innerHTML = `
      <div>
        <span class="rank">#${index + 1}</span>
        <span>${entry.username}</span>
      </div>
      <span class="points">${entry.points} pts</span>
    `;
    container.appendChild(entryDiv);
  });
}

// Setup bookmark button functionality
function setupBookmarkButton() {
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (!bookmarkBtn || !currentQuestion) return;
  
  // Load existing bookmarks
  let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
  
  // Check if current question is bookmarked
  const questionKey = `${currentQuestion.set || 'unknown'}-${currentQuestion.question_number || 'unknown'}`;
  let isBookmarked = bookmarks.includes(questionKey);
  
  // Set initial bookmark state
  updateBookmarkButton(bookmarkBtn, isBookmarked);
  
  // Add click event listener
  bookmarkBtn.addEventListener('click', () => {
    if (isBookmarked) {
      // Remove bookmark
      bookmarks = bookmarks.filter(key => key !== questionKey);
      isBookmarked = false;
      updateBookmarkButton(bookmarkBtn, false);
    } else {
      // Add bookmark
      bookmarks.push(questionKey);
      isBookmarked = true;
      updateBookmarkButton(bookmarkBtn, true);
    }
    
    // Save bookmarks
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  });
}

// Update bookmark button appearance
function updateBookmarkButton(button, isBookmarked) {
  if (isBookmarked) {
    button.textContent = '★';
    button.style.color = '#ffd700';
    button.title = 'Remove bookmark';
  } else {
    button.textContent = '☆';
    button.style.color = '#ccc';
    button.title = 'Bookmark this question';
  }
}
