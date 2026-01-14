const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(morgan('tiny'));
app.use(cors());

// Health endpoint
app.get('/health', (_req, res) => res.status(200).send('OK'));

// Serve static build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend listening on http://localhost:${port}`);
});
