const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const generateContent = async (userPrompt) => {
    try {
        console.log("dd")
        if (!process.env.API_KEY || !process.env.API_URL) {
            throw new Error("Missing API_KEY or API_URL in environment variables.");
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_KEY}`
        };

        const payload = {
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an AI assistant who provides concise and succinct answers.' },
                { role: 'user', content: userPrompt }
            ]
        };

        console.log("Sending request to AI model...");

        const response = await axios.post(process.env.API_URL, payload, { headers });

        if (response.status === 200) {
            const result = response.data;
            if (result.choices && result.choices.length > 0) {
                console.log("Content generated successfully.");
                return result.choices[0].message.content;
            } else {
                console.warn("No content generated. Response was empty.");
                return "No content generated. Please check the input data.";
            }
        } else {
            throw new Error(`Request failed with status code ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        return `Error: ${error.message}`;
    }
}

module.exports = generateContent;
