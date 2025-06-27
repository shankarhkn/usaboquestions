// explain.js
export async function getExplanation(question, user_answer, correct_answer, set, question_number) {
    try {
        const response = await fetch('http://localhost:9000/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question,
                user_answer,
                correct_answer,
                set,
                question_number
            })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.explanation || 'No explanation returned.';
    } catch (error) {
        console.error('Error in getExplanation:', error);
        throw error;
    }
}
