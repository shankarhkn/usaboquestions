const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Load questions from JSON file
const questionsPath = path.join(__dirname, 'usabo-api/questions.json');
let questions = [];

try {
  const data = fs.readFileSync(questionsPath, 'utf8');
  questions = JSON.parse(data);
  console.log(`Loaded ${questions.length} questions from questions.json`);
} catch (err) {
  console.error('Error loading questions:', err.message);
}

app.get('/questions', (req, res) => {
  if (!questions || questions.length === 0) {
    return res.status(500).json({ error: 'No questions available' });
  }
  res.json(questions);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
