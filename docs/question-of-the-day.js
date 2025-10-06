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
  await loadLeaderboards();
  
  // Set up real-time leaderboard updates
  setupRealTimeLeaderboards();
  
  // Set up manual refresh buttons
  setupRefreshButtons();
  
  // Display today's question
  displayTodaysQuestion();
  
  // Update user stats display
  updateStatsDisplay();
  
  // Setup change name functionality
  setupChangeName();
  
  // Add animations to elements (after stats are loaded)
  addAnimations();
  
  // Ensure stats are displayed (fallback)
  setTimeout(() => {
    updateStatsDisplay();
    
    // Force visibility of stats elements
    const statsElements = [
      'total-points', 'streak', 'questions-answered', 'accuracy'
    ];
    statsElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.opacity = '1';
        element.style.visibility = 'visible';
        element.style.display = 'block';
      }
    });
  }, 500);
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
      choiceDiv.style.margin = '6px 0';
      choiceDiv.style.padding = '12px 16px';
      choiceDiv.style.border = '1px solid rgba(0,0,0,0.1)';
      choiceDiv.style.borderRadius = '8px';
      choiceDiv.style.cursor = 'pointer';
      choiceDiv.style.transition = 'all 0.3s ease';
      choiceDiv.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
      choiceDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      
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
        choiceDiv.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)';
        choiceDiv.style.transform = 'translateX(4px)';
        choiceDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
      });
      choiceDiv.addEventListener('mouseleave', () => {
        choiceDiv.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
        choiceDiv.style.transform = 'translateX(0)';
        choiceDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      });
      
      choicesContainer.appendChild(choiceDiv);
      
      // Add choice animation
      addChoiceAnimation(choiceDiv);
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
    
    // Add submit button animation
    addSubmitAnimation();
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
  
  // Add animation to feedback
  resultDiv.classList.add('bounce-in');
  
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
  const totalPointsEl = document.getElementById('total-points');
  const streakEl = document.getElementById('streak');
  const questionsAnsweredEl = document.getElementById('questions-answered');
  const accuracyEl = document.getElementById('accuracy');
  
  if (totalPointsEl) totalPointsEl.textContent = userStats.totalPoints;
  if (streakEl) streakEl.textContent = userStats.streak;
  if (questionsAnsweredEl) questionsAnsweredEl.textContent = userStats.questionsAnswered;
  
  const accuracy = userStats.questionsAnswered > 0 
    ? Math.round((userStats.correctAnswers / userStats.questionsAnswered) * 100)
    : 0;
  if (accuracyEl) accuracyEl.textContent = accuracy + '%';
}

// Load leaderboards
// API base URL - update this to your server URL
const API_BASE_URL = 'http://localhost:3001/api';

async function loadLeaderboards() {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboards`);
    const result = await response.json();
    
    if (result.success) {
      leaderboards = {
        weekly: result.data.weekly || [],
        monthly: result.data.monthly || []
      };
    } else {
      console.error('Failed to load leaderboards:', result.error);
      // Fallback to localStorage
      const savedLeaderboards = localStorage.getItem('leaderboards');
      if (savedLeaderboards) {
        leaderboards = JSON.parse(savedLeaderboards);
      }
    }
  } catch (error) {
    console.error('Error loading leaderboards:', error);
    // Fallback to localStorage
    const savedLeaderboards = localStorage.getItem('leaderboards');
    if (savedLeaderboards) {
      leaderboards = JSON.parse(savedLeaderboards);
    }
  }
  
  updateLeaderboards();
}

// Set up real-time leaderboard updates
function setupRealTimeLeaderboards() {
  // Update leaderboards every 30 seconds
  setInterval(async () => {
    try {
      console.log('Updating leaderboards...');
      await loadLeaderboards();
      updateLeaderboards();
    } catch (error) {
      console.error('Error updating leaderboards:', error);
    }
  }, 30000); // 30 seconds
  
  // Also update when the page becomes visible (user switches back to tab)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('Page became visible, updating leaderboards...');
      try {
        await loadLeaderboards();
        updateLeaderboards();
      } catch (error) {
        console.error('Error updating leaderboards on visibility change:', error);
      }
    }
  });
}

// Set up manual refresh buttons
function setupRefreshButtons() {
  const refreshBtn = document.getElementById('refresh-leaderboards');
  const refreshBtnMonthly = document.getElementById('refresh-leaderboards-monthly');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '⏳';
      refreshBtn.disabled = true;
      
      try {
        console.log('Manual refresh triggered...');
        await loadLeaderboards();
        updateLeaderboards();
        console.log('Leaderboards refreshed successfully');
      } catch (error) {
        console.error('Error refreshing leaderboards:', error);
      } finally {
        refreshBtn.textContent = '🔄';
        refreshBtn.disabled = false;
      }
    });
  }
  
  if (refreshBtnMonthly) {
    refreshBtnMonthly.addEventListener('click', async () => {
      refreshBtnMonthly.textContent = '⏳';
      refreshBtnMonthly.disabled = true;
      
      try {
        console.log('Manual refresh triggered...');
        await loadLeaderboards();
        updateLeaderboards();
        console.log('Leaderboards refreshed successfully');
      } catch (error) {
        console.error('Error refreshing leaderboards:', error);
      } finally {
        refreshBtnMonthly.textContent = '🔄';
        refreshBtnMonthly.disabled = false;
      }
    });
  }
}

// Update leaderboards
async function updateLeaderboards() {
  const username = localStorage.getItem('username') || 'Guest';
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Update weekly leaderboard
  await updateLeaderboard('weekly', weekStart, 'weekly-leaderboard');
  
  // Update monthly leaderboard
  await updateLeaderboard('monthly', monthStart, 'monthly-leaderboard');
  
  // Save leaderboards as backup
  localStorage.setItem('leaderboards', JSON.stringify(leaderboards));
}

// Update a specific leaderboard
async function updateLeaderboard(type, startDate, containerId) {
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
    
    // Update global leaderboard via API
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          points: userEntry.points,
          type
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Global leaderboard updated successfully');
        // Reload leaderboards from API
        await loadLeaderboards();
      } else {
        console.error('Failed to update global leaderboard:', result.error);
      }
    } catch (error) {
      console.error('Error updating global leaderboard:', error);
    }
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
  
  // Add bookmark animation
  addBookmarkAnimation(bookmarkBtn);
  
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

// Add animations to page elements
function addAnimations() {
  // Wait a bit to ensure all elements are loaded
  setTimeout(() => {
    // Don't animate stats cards - keep them static
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card) => {
      if (card) {
        // Ensure card is visible but no animation
        card.style.opacity = '1';
        card.style.visibility = 'visible';
      }
    });
    
    // Animate question container
    const questionContainer = document.querySelector('.question-container');
    if (questionContainer) {
      questionContainer.style.opacity = '1';
      questionContainer.style.visibility = 'visible';
      setTimeout(() => {
        questionContainer.classList.add('slide-in');
      }, 200);
    }
    
    // Animate leaderboards
    const leaderboards = document.querySelectorAll('.leaderboard');
    leaderboards.forEach((leaderboard, index) => {
      if (leaderboard) {
        leaderboard.style.opacity = '1';
        leaderboard.style.visibility = 'visible';
        setTimeout(() => {
          leaderboard.classList.add('bounce-in');
        }, 400 + index * 100);
      }
    });
    
    // Add hover animations to choice options
    const choiceOptions = document.querySelectorAll('#choices-container div');
    choiceOptions.forEach(option => {
      if (option) {
        option.classList.add('choice-option');
      }
    });
  }, 100);
}

// Setup change name functionality
function setupChangeName() {
  const changeNameBtn = document.getElementById('change-name-btn');
  if (changeNameBtn) {
    changeNameBtn.addEventListener('click', () => {
      const newName = prompt('Enter your new name:', localStorage.getItem('username') || 'Guest');
      if (newName && newName.trim() !== '') {
        localStorage.setItem('username', newName.trim());
        document.getElementById('username-display').textContent = newName.trim();
        
        // Add animation to show name change
        const usernameDisplay = document.getElementById('username-display');
        usernameDisplay.classList.add('pulse');
        setTimeout(() => {
          usernameDisplay.classList.remove('pulse');
        }, 300);
      }
    });
  }
}

// Add animation to choice selection
function addChoiceAnimation(choiceDiv) {
  choiceDiv.addEventListener('click', () => {
    choiceDiv.classList.add('glow');
    setTimeout(() => {
      choiceDiv.classList.remove('glow');
    }, 300);
  });
}

// Add animation to submit button
function addSubmitAnimation() {
  const submitBtn = document.getElementById('submit-answer');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      submitBtn.classList.add('pulse');
      setTimeout(() => {
        submitBtn.classList.remove('pulse');
      }, 300);
    });
  }
}

// Add animation to bookmark button
function addBookmarkAnimation(bookmarkBtn) {
  bookmarkBtn.addEventListener('click', () => {
    bookmarkBtn.classList.add('bounce-in');
    setTimeout(() => {
      bookmarkBtn.classList.remove('bounce-in');
    }, 600);
  });
}
