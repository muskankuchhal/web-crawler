const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { HfInference } = require('@huggingface/inference');
const url = require('url');



const app = express();
const PORT = process.env.PORT || 5000;

// Replace with your Gemini API key
const GEMINI_API_KEY = 'AIzaSyDQ-GPa2Ukrx_vNrRdPjB3_U5kEJ-le5-k';
const crawledUrls = new Set(); // To keep track of visited URLs
let allContent = ''; 

app.use(bodyParser.json());
app.use(express.static('public'));

async function crawl(baseUrl, currentUrl, depth) {
    if (depth === 0 || crawledUrls.has(currentUrl)) {
        console.log("stop ho gya");
        return ''; // Stop if depth limit is reached or URL has already been visited
    }

    try {
        const response = await axios.get(currentUrl);
        const $ = cheerio.load(response.data);

        // Remove unwanted elements
        $('script').remove();
        $('style').remove();
        $('header').remove();
        $('footer').remove();
        $('.ads, .advertisement').remove();
        $('nav').remove();
        $('aside').remove();

        // Get the cleaned text content
        const content = $('body').text().trim().replace(/\s+/g, ' ');
        console.log(currentUrl);
        console.log(content.slice(100,150));
        console.log("\n");
        allContent += content;
        // Add the current URL to the set of visited URLs
        crawledUrls.add(currentUrl);

        // Extract and visit links within the same base URL
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            const absoluteUrl = url.resolve(baseUrl, href); // Create absolute URL

            // Only crawl if the URL is within the same base URL
            if (!crawledUrls.has(absoluteUrl)) {
                crawl(baseUrl, absoluteUrl, depth - 1); // Recursive call with reduced depth
            }
        });

        return content;
    } catch (error) {
        console.error(`Error fetching ${currentUrl}: ${error.message}`);
        return '';
    }
}

// Example of using the crawl function
async function startCrawling(baseUrl) {
    const content = await crawl(baseUrl, baseUrl, 3); // Start crawling with a depth of 2
    const size = Buffer.byteLength(allContent, 'utf8');
    console.log('Crawled content:', size);
}


app.post('/crawl', async (req, res) => {
    const { url } = req.body;
    console.log("Muskan crawling url" + url);
    const content = await startCrawling(url);
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
