// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();
console.log('API Key:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/explain', async (req, res) => {
    const { question, user_answer, correct_answer, set, question_number } = req.body;

    if (!question || !user_answer || !correct_answer || !set || !question_number) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const prompt = `
You are a biology tutor. A student answered a multiple choice question incorrectly.

Question from set "${set}", number ${question_number}:
${question}

The student selected: ${user_answer}
Explain why this answer is incorrect, and what the correct answer is with reasoning.

Be detailed but concise, using simple language suitable for high school biology students.
`;

    try {
        const chat = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        });

        const explanation = chat.choices[0].message.content;
        res.json({ explanation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch explanation' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
