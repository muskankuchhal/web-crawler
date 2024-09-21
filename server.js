const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

async function crawl(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const textContent = $('body').text().trim();
        return textContent;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return '';
    }
}

app.post('/crawl', async (req, res) => {
    const { url } = req.body;
    const content = await crawl(url);
    res.json({ content });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
