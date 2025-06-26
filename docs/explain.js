// explain.js

async function getExplanation(question, userAnswer, correctAnswer) {
    const url = 'https://8888-35-197-125-131.ngrok-free.app/explain';

    const payload = {
        question: question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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

// Example usage: call this function and display the explanation
async function explainExample() {
    const question = "Why does the sky appear blue?";
    const userAnswer = "Because the ocean is blue.";
    const correctAnswer = "Because sunlight scatters in the atmosphere.";

    const explanation = await getExplanation(question, userAnswer, correctAnswer);
    if (explanation) {
        console.log("Explanation:", explanation);
        // You could also update the webpage, e.g.:
        // document.getElementById('explanation').textContent = explanation;
    }
}

// Run example on page load or on some event
explainExample();
  