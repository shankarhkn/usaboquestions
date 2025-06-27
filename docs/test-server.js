// test-server.js
const express = require('express');
const app = express();
const PORT = 5000;

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});