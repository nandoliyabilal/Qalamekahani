const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Server is LIVE! Database investigation in progress...');
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Debug server running on port ${PORT}`);
});

// Load the actual backend logic safely
try {
    require('./backend/server');
} catch (err) {
    console.error('FAILED TO LOAD BACKEND:', err.message);
}
