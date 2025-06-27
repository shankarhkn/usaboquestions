require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const HF_TOKEN = process.env.HF_API_TOKEN;
const PORT = 9000;

app.post('/explain', async (req, res) => {
    const { question, user_answer, correct_answer, set, question_number } = req.body;

    // Compose prompt suitable for QA model
    const prompt = `
Question: ${question}
User's answer: ${user_answer}
Correct answer: ${correct_answer}

Explain why the correct answer is right and why the user's answer might be wrong in a short paragraph.
  `.trim();

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/allenai/unifiedqa-t5-small', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 150,
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HF API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();

        // The model returns an array with generated_text
        let explanation = 'No explanation returned.';
        if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
            explanation = data[0].generated_text.trim();
        } else if (data.generated_text) {
            explanation = data.generated_text.trim();
        }

        res.json({ explanation });

    } catch (error) {
        console.error('Error calling Hugging Face:', error);
        res.status(500).json({ error: 'Failed to fetch explanation from Hugging Face.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
