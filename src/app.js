require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const duelSocket = require('./socket/duel.socket.v2');
const liveSocket = require('./socket/live.socket');
const clanSocket = require('./socket/clan.socket');
const inactivityJob = require('./jobs/inactivity.job');
const seasonJob = require('./jobs/season.job');
const tournamentJob = require('./jobs/tournament.job');

const app = express();
const server = http.createServer(app);

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const allowedOrigins = [
    APP_URL,
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:19006',
    'capacitor://localhost',
    'http://localhost',
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, { cors: corsOptions });

app.set('trust proxy', 1);

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
}));

app.use(compression());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(mongoSanitize());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/users',        require('./routes/user.routes'));
app.use('/api/users',        require('./routes/follow.routes'));
app.use('/api/duels',        require('./routes/duel.routes'));
app.use('/api/clans',        require('./routes/clan.routes'));
app.use('/api/tournaments',  require('./routes/tournament.routes'));
app.use('/api/live',         require('./routes/live.routes'));
app.use('/api/questions',    require('./routes/question.routes'));
app.use('/api/admin',        require('./routes/admin.routes'));
app.use('/api/competitions', require('./routes/competition.routes'));
app.use('/api/quiz',         require('./routes/quiz.routes'));

app.get('/api/config', (req, res) => {
    res.json({
        APP_URL,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
        CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || 'shinken_unsigned',
    });
});

app.get('/health', (req, res) =>
    res.json({ status: 'ok', app: 'SHINKEN', version: '2.0.0', timestamp: new Date().toISOString() })
);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
});

duelSocket(io);
liveSocket(io);
clanSocket(io);

inactivityJob();
seasonJob();
tournamentJob();

const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`\n⛩️  SHINKEN v2 — port ${PORT}`);
        console.log(`🌐 Health: http://localhost:${PORT}/health`);
        console.log(`📱 APP_URL: ${APP_URL}\n`);
    });
};

start();

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    server.close(() => { console.log('Graceful shutdown.'); process.exit(0); });
});

module.exports = { app, server };
