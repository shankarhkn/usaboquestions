const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Enable CORS for all origins
app.use(cors());

// Serve the static files (if any)
app.use(express.static(path.join(__dirname, 'public')));

// Sample questions
const questions = [
  { id: 1, question: "What organelle is responsible for photosynthesis?", answer: "Chloroplast" },
  { id: 2, question: "Which hormone regulates blood sugar levels?", answer: "Insulin" },
  // Add more questions here
];

// API endpoint to fetch questions
app.get('/questions', (req, res) => {
  res.json(questions);
});

// Define the port
const PORT = process.env.PORT || 10000;  // Default to 10000 if PORT isn't defined (e.g., for local development)

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
