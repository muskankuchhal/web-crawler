const messagesDiv = document.getElementById('messages');
const crawlButton = document.getElementById('crawlButton');
const askButton = document.getElementById('askButton');
const urlInput = document.getElementById('urlInput');
const questionInput = document.getElementById('questionInput');

let crawledContent = '';

crawlButton.addEventListener('click', async () => {
    const url = urlInput.value;
    if (!url) return;

    appendMessage(`Crawling: ${url}`, 'bot');
    
    try {
        const response = await fetch('/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        const data = await response.json();
        crawledContent = data.content;

        appendMessage("Crawling completed. You can now ask questions.", 'bot');
        askButton.disabled = false;
    } catch (error) {
        appendMessage(`Error: ${error.message}`, 'bot');
    }
});

askButton.addEventListener('click', () => {
    const question = questionInput.value;
    if (!question || !crawledContent) return;

    appendMessage(`You: ${question}`, 'user');

    const answer = searchInContent(crawledContent, question);
    appendMessage(`Bot: ${answer}`, 'bot');
});

function appendMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
}

function searchInContent(content, question) {
    console.log("Muskan content yeh aaya hai" + content);
    const lowerQuestion = question.toLowerCase();
    const sentences = content.split('. ');

    for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(lowerQuestion)) {
            return sentence.trim();
        }
    }

    return "I couldn't find an answer to your question.";
}
