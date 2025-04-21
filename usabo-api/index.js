const express = require('express');
const cors = require('cors');
const app = express();

// Sample questions (hardcoded)
const questions = [
  {
    id: 1,
    question: "What is the powerhouse of the cell?",
    options: [
      "a) Nucleus",
      "b) Mitochondria",
      "c) Ribosomes",
      "d) Chloroplasts"
    ],
    answer: "b"
  },
  {
    id: 2,
    question: "Which organelle is responsible for protein synthesis?",
    options: [
      "a) Nucleus",
      "b) Ribosome",
      "c) Mitochondria",
      "d) Chloroplasts"
    ],
    answer: "b"
  },
  // More questions...
];

app.use(cors());

// Serve static files (optional if you're serving front-end assets)
app.use(express.static('public'));

// API route to serve the questions
app.get('/questions', (req, res) => {
  res.json(questions);
});

// Define the port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
