const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { HfInference } = require('@huggingface/inference');
const url = require('url');



const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = 'AIzaSyChrQgfRDdNinm6Sv9hN9R9ZAvQQiGvs74';
const crawledUrls = new Set();
let allContent = ''; 

app.use(bodyParser.json());
app.use(express.static('public'));

function removeHash(url) {
    try{
        const parsedUrl = url.split('#')[0];
        console.log("parsedURL" + parsedUrl);
        return parsedUrl;
    }
    catch(e){
        return url;
    }
}

async function crawl(baseUrl, currentUrl, depth) {
    if (depth === 0 || crawledUrls.has(currentUrl)) {
        return ''; 
    }

    try {
        const response = await axios.get(currentUrl);
        const $ = cheerio.load(response.data);

        $('script').remove();
        $('style').remove();
        $('header').remove();
        $('footer').remove();
        $('.ads, .advertisement').remove();
        $('nav').remove();
        $('aside').remove();

        const content = $('body').text().trim().replace(/\s+/g, ' ');
        console.log(currentUrl);
        allContent += content;
        crawledUrls.add(currentUrl);

        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            console.log("href", href);
            const abc = url.resolve(baseUrl, href); // Create absolute URL
            const absoluteUrl= removeHash(abc);

            // Only crawl if the URL is within the same base URL
            if (!crawledUrls.has(absoluteUrl)) {
                crawl(baseUrl, absoluteUrl, depth - 1); // Recursive call with reduced depth
            }
        });

        return allContent;
    } catch (error) {
        console.error(`Error fetching ${currentUrl}: ${error.message}`);
        return '';
    }
}

async function startCrawling(baseUrl) {
    const content = await crawl(baseUrl, baseUrl, 1);
    const size = Buffer.byteLength(allContent, 'utf8');
    console.log('Crawled content:', size);
    return allContent;
}


app.post('/crawl', async (req, res) => {
    const { url } = req.body;
    console.log("Muskan crawling url" + url);
    const content = await startCrawling(url); 
    res.json({ content });
});


app.post('/ask', async (req, res) => {
    const { question, crawledContent } = req.body;
    console.log('Ques in server', question);
    console.log('Context in server', crawledContent);
    const answer = await getLLMResponse(question, crawledContent);
    console.log("Response:", answer);
});

async function getLLMResponse(question, context) {
    
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}',{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ 
            role: "user", 
            parts: [{ text: question }] 
          }] 
        }),
      });

    return response.data.choices[0].message.content.trim(); // Adjust according to your API response
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
