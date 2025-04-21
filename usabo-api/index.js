const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// Enable CORS for all origins
app.use(cors());

// Serve the static files (if any)
app.use(express.static(path.join(__dirname, 'public')));

// Load questions from the JSON file
function loadQuestions() {
  const questionsFilePath = path.join(__dirname, 'questions.json');
  try {
    const rawData = fs.readFileSync(questionsFilePath);
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}

// API endpoint to fetch questions
app.get('/questions', (req, res) => {
  const questions = loadQuestions();
  res.json(questions);
});

// Define the port
const PORT = process.env.PORT || 10000;  // Default to 10000 if PORT isn't defined (e.g., for local development)

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
