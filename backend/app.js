const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.set("trust proxy", 1);

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS configuration (restrict to specific origins)
// Dự án giờ có nhiều frontend (frontend-petshop :3000, frontend-gomsu :3001, và sau này
// là domain thật khi deploy) — dùng danh sách thay vì 1 origin cố định.
const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((url) => url.trim());

const corsOptions = {
    origin: (origin, callback) => {
        // Không có Origin (Postman/curl/gọi server-to-server) -> luôn cho phép
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`Origin ${origin} không được phép bởi CORS`));
    },
    credentials: true,
};
app.use(cors(corsOptions));

// 3. Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

app.use(logger('dev'));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
