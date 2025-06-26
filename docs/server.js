const express = require('express');
const app = express();
const port = 3000;

const explanationsDB = {
    "2018 USABO Open": {
        "26": {
            "A": "Explanation for answer A...",
            "B": "Explanation for answer B...",
            "C": "Explanation for answer C (correct).",
            "D": "Explanation for answer D..."
        }
    }
};

app.get('/api/explanation', (req, res) => {
    const { set, question_number, answer } = req.query;

    if (!set || !question_number || !answer) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const setExplanations = explanationsDB[set];
    if (!setExplanations) {
        return res.status(404).json({ error: 'Set not found' });
    }

    const questionExplanations = setExplanations[question_number];
    if (!questionExplanations) {
        return res.status(404).json({ error: 'Question not found' });
    }

    const explanation = questionExplanations[answer];
    if (!explanation) {
        return res.status(404).json({ error: 'Explanation not found for given answer' });
    }

    res.json({ explanation });
});

app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
});
