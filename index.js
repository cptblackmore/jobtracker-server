require('dotenv').config();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const router = require('./lib/router');
const errorMiddleware = require('./lib/middleware/error-middleware');
const refererMiddleware = require('./lib/middleware/referer-middleware');

const PORT = process.env.PORT || 7000;
const app = express();

app.use(express.json());
app.use(refererMiddleware);
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL
}));
app.use(cookieParser());
app.use('/api', router);
app.use(errorMiddleware);

const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      tls: true
    }).then(() => console.log('\x1b[1m\x1b[32m' + 'DB connected' + '\x1b[0m'));
    app.listen(PORT, () => console.log('\x1b[1m\x1b[32m' + `Server started on port ${PORT}` + '\x1b[0m'));
  } catch (e) {
    console.log(e);
  }
}

start();
