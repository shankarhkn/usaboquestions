// explain.js

// Replace this with your current ngrok URL each time it changes
const EXPLAIN_API_URL = 'https://233d-34-125-70-186.ngrok-free.app/explain';

async function getExplanation(question, userAnswer, correctAnswer, setName, questionNumber) {
    const payload = {
        question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        setName,
        questionNumber
    };

    try {
        const response = await fetch(EXPLAIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.explanation;
    } catch (error) {
        console.error('Error fetching explanation:', error);
        return null;
    }
}

// Example usage (you can remove this or call from your UI)
async function explainExample() {
    const question = "Why does the sky appear blue?";
    const userAnswer = "Because the ocean is blue.";
    const correctAnswer = "Because sunlight scatters in the atmosphere.";
    const setName = "Sample Set";
    const questionNumber = 1;

    const explanation = await getExplanation(question, userAnswer, correctAnswer, setName, questionNumber);
    if (explanation) {
        console.log("Explanation:", explanation);
        // Example: update DOM element
        // document.getElementById('explanation-text').textContent = explanation;
    } else {
        console.log("Failed to get explanation.");
    }
}

// Run example if you want
// explainExample();
