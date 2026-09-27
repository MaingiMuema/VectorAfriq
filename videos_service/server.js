const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://vectorafriqproperties.co.ke',
    'https://www.vectorafriqproperties.co.ke',
    'http://localhost:3000',
    'https://uat.vectorafriqproperties.co.ke',
    'https://uat.com.vectorafriqproperties.co.ke'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Storage configuration
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { propertyId } = req.body;
        const dir = path.join(__dirname, 'uploads', 'Properties', propertyId);
        try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const fileId = `${Date.now()}-${uuidv4().slice(0, 8)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${fileId}-${cleanName}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 5
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload MP4 videos only.'));
        }
    }
});

const VIDEOS_ROOT = path.join(__dirname, 'uploads', 'Properties');

const ensureDir = async (dir) => {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({ success: false, error: 'Property ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No video file uploaded' });
        }

        const filename = req.file.filename;
        const videoUrl = `/api/videos/${propertyId}/${filename}`;

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            filesUploaded: 1,
            urls: [videoUrl],
            files: [{
                filename,
                originalName: req.file.originalname,
                url: videoUrl,
                size: req.file.size
            }]
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

const getMimeType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.ogv': 'video/ogg',
    };
    return mimeTypes[ext] || 'video/mp4';
};

// Serve videos with Range support
app.get('/videos/:propertyId/:filename', async (req, res) => {
    try {
        const { propertyId, filename } = req.params;
        const filepath = path.join(VIDEOS_ROOT, propertyId, filename);
        const mimeType = getMimeType(filename);

        try {
            const stats = await fs.stat(filepath);
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
                const chunksize = (end - start) + 1;

                const file = await fs.open(filepath, 'r');
                const buffer = Buffer.alloc(chunksize);
                await file.read(buffer, 0, chunksize, start);
                await file.close();

                res.status(206).set({
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': mimeType,
                }).send(buffer);
            } else {
                res.set({
                    'Content-Length': stats.size,
                    'Content-Type': mimeType,
                });
                const data = await fs.readFile(filepath);
                res.send(data);
            }
        } catch (err) {
            res.status(404).json({ error: 'Video not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'VectorAfriq Video Service' });
});

app.listen(PORT, () => {
    console.log(`Video service running on port ${PORT}`);
});
