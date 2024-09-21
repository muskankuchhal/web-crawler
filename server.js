const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { HfInference } = require('@huggingface/inference');

const app = express();
const PORT = process.env.PORT || 5000;

// Replace with your Gemini API key
const GEMINI_API_KEY = 'AIzaSyDQ-GPa2Ukrx_vNrRdPjB3_U5kEJ-le5-k';

app.use(bodyParser.json());
app.use(express.static('public'));

async function crawl(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        $('script').remove(); // Remove all <script> tags
        $('style').remove();  // Remove all <style> tags
        $('header').remove(); // Remove header sections
        $('footer').remove(); // Remove footer sections
        $('.ads, .advertisement').remove(); // Remove elements with class 'ads' or 'advertisement'
        $('nav').remove(); // Remove navigation bars
        $('aside').remove(); // Remove sidebars

        // Get the cleaned text content
        const content = $('body').text().trim();

        // Optionally: Remove excessive whitespace
        return content.replace(/\s+/g, ' '); // Normalize whitespace
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return '';
    }
}

app.post('/crawl', async (req, res) => {
    const { url } = req.body;
    console.log("Muskan crawling url" + url);
    const content = await crawl(url);
    res.json({ content });
});

// Endpoint to ask a question using the crawled content with Gemini API
app.post('/ask', async (req, res) => {
    const { question, context } = req.body;

    try {
        const response = await axios.post('https://gemini-api-endpoint-url', {
            question: question,
            context: context,
        }, {
            headers: {
                'Authorization': `Bearer ${GEMINI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const answer = response.data.answer; // Adjust based on actual API response structure
        res.json({ answer });
    } catch (error) {
        console.error(`Error answering question: ${error.message}`);
        res.status(500).json({ error: 'Error processing your question' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
