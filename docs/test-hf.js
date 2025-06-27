const { HfInference } = require("@huggingface/inference");
require('dotenv').config();

const hf = new HfInference(process.env.HF_API_TOKEN);

async function test() {
    try {
        const response = await hf.textGeneration({
            model: "facebook/bart-large-cnn",
            inputs: "Explain photosynthesis in simple terms."
        });
        console.log(response);
    } catch (e) {
        console.error("Error calling HF inference:", e);
    }
}

test();
