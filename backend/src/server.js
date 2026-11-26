// server.js - starts the Express app
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const currentUser = require('./middleware/currentUser');
const todoRoutes = require('./routes/todos');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(cors());           // allow the React dev server to call this API
app.use(express.json());   // parse JSON request bodies
app.use(currentUser);      // sets req.user from the X-User header

app.use('/api/todos', todoRoutes);
app.use('/api/audit', auditRoutes);

// Error handler: any error passed to next(err) ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
