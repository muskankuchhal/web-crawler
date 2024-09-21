const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline-sync');
const { HfInference } = require('@huggingface/inference');
const https = require('https');

const hf = new HfInference('<YOUR_HUGGING_FACE_API_TOKEN>'); // Replace with your token
let crawledText = [];

/**
 * Function to clean the crawled text.
 * @param {string} text - The raw crawled text.
 * @returns {string} - The cleaned text.
 */
function preprocessText(text) {
    let cleanedText = text.replace(/<[^>]*>/g, ' ');
    cleanedText = cleanedText.replace(/(?:<script.*?>.*?<\/script>|<style.*?>.*?<\/style>)/g, ' ');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    return cleanedText.toLowerCase();
}

/**
 * Function to crawl a web page and extract text.
 * @param {string} url - The URL of the page to crawl.
 */
async function crawl(url) {
    try {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const response = await axios.get(url, { httpsAgent: agent });
        const html = response.data;
        const $ = cheerio.load(html);

        const rawText = $('body').text();
        crawledText = preprocessText(rawText).split('.').map(s => s.trim()).filter(s => s);
        console.log('Web page crawled and preprocessed successfully.');
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
    }
}

/**
 * Function to find an answer based on a question using the RAG model.
 * @param {string} question - The user's question.
 * @returns {string} - A response based on RAG's understanding.
 */
async function answerQuestion(question) {
    try {
        const results = await hf.retrievalAugmentedGeneration({
            model: 'facebook/rag-token-nq', // You can choose a different RAG model
            inputs: { 
                context: crawledText.join('. '), // Use the preprocessed context
                question: question 
            }
        });

        return results.generated_text || "I'm sorry, I couldn't find an answer to that.";
    } catch (error) {
        console.error('Error during RAG inference:', error);
        return "I'm sorry, something went wrong.";
    }
}

// Main function to run the chatbot
async function startChatbot() {
    const startUrl = 'https://help.gohighlevel.com/support/solutions'; // Replace with your URL
    await crawl(startUrl);

    console.log('Welcome to the Chatbot! Ask me anything about the crawled page.');

    while (true) {
        const question = readline.question('You: ');
        hf.retrievalAugmentedGeneration
        if (question.toLowerCase() === 'exit') {
            console.log('Chatbot: Goodbye!');
            break;
        }

        const answer = await answerQuestion(question);
        console.log(`Chatbot: ${answer}`);
    }
}

startChatbot();