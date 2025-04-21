const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Hardcoded USABO-style questions
const questions = [
  {
    id: 1,
    question: "What organelle is primarily responsible for ATP production?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
    answer: "Mitochondria"
  },
  {
    id: 2,
    question: "Which phase of mitosis involves the alignment of chromosomes along the equator?",
    options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    answer: "Metaphase"
  }
];

app.get('/questions', (req, res) => {
  res.json(questions);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
