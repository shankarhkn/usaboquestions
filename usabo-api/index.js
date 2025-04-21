const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS to allow frontend to make requests
app.use(cors());

// Serve the questions data
const questions = require('./questions.json');

// API endpoint to get the questions
app.get('/questions', (req, res) => {
  res.json(questions);
});

// Serve static files if needed
app.use(express.static(path.join(__dirname, 'frontend')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
