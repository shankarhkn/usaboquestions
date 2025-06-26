const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// POST /explain endpoint
app.post('/explain', (req, res) => {
    const { question, answer, setName, questionNumber } = req.body;

    if (!question || !answer || !setName || !questionNumber) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    // Here: Replace this mock explanation with your LLM call
    const correctAnswer = 'B'; // For demo, hardcoded correct answer, ideally fetched per question
    const explanation = `You answered '${answer}'. The correct answer is '${correctAnswer}'. Explanation: This is a mock explanation for question ${questionNumber} in set '${setName}'.`;

    // Respond with explanation
    res.json({ explanation });
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
