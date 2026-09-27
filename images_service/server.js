const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://vectorafriqproperties.co.ke',
  'https://www.vectorafriqproperties.co.ke',
  'http://localhost:3000',
  'https://uat.vectorafriqproperties.co.ke',
  'https://uat.com.vectorafriqproperties.co.ke'
];

console.log('Allowed CORS origins:', allowedOrigins);

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
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 20
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Image directories
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'Properties');
const MIGRATED_DIR = path.join(__dirname, 'public', 'Properties', 'Properties', 'properties');
const PARTNERS_DIR = path.join(__dirname, 'public', 'Properties', 'Properties', 'partners');
const BLOGS_DIR = path.join(__dirname, 'public', 'Properties', 'Properties', 'blogs');
const TARGET_UPLOAD_DIR = MIGRATED_DIR; // Upload directly to the migrated directory structure

// Cache for filename to folder mapping
let filenameCache = new Map();
let cacheBuilt = false;

// Optimization: Cache resolved file paths to avoid repeated disk I/O checks
// Key: req.params[0] (fullPath), Value: resolved absolute filepath
const pathCache = new Map();
const MAX_PATH_CACHE = 10000;

const fsSync = require('fs'); // For createReadStream

// Helper to check file existence without throwing
const checkFile = async (filepath) => {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
};

// Build filename cache
const buildFilenameCache = async () => {
  if (cacheBuilt) return;

  try {
    console.log('Building filename cache...');
    const folders = await fs.readdir(MIGRATED_DIR);

    for (const folder of folders) {
      const folderPath = path.join(MIGRATED_DIR, folder);
      try {
        const stat = await fs.stat(folderPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(folderPath);
          files.forEach(file => {
            filenameCache.set(file, folder);
            // Also add decoded variant if different
            const decoded = decodeURIComponent(file);
            if (decoded !== file) filenameCache.set(decoded, folder);
          });
        }
      } catch (e) { /* ignore */ }
    }

    cacheBuilt = true;
    console.log(`Built filename cache with ${filenameCache.size} files`);
  } catch (error) {
    console.error('Error building filename cache:', error.message);
  }
};

const ensureDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Image processing function
const processImage = async (buffer, filename) => {
  const ext = path.extname(filename).toLowerCase();

  // Basic optimization options
  const options = {
    quality: 80,
    mozjpeg: true
  };

  if (ext === '.webp') {
    return sharp(buffer).webp(options).toBuffer();
  }
  return sharp(buffer).jpeg(options).toBuffer();
};

// Upload endpoint
app.post('/upload', upload.array('files', 20), async (req, res) => {
  const startTime = Date.now();
  try {
    const { propertyId } = req.body;

    if (!propertyId || !req.files?.length) {
      return res.status(400).json({ success: false, error: 'Property ID and files are required' });
    }

    // Determine upload directory based on propertyId
    const isBlog = propertyId.startsWith('blogs/');
    const baseDir = isBlog ? BLOGS_DIR : TARGET_UPLOAD_DIR;
    const folderName = isBlog ? propertyId.replace('blogs/', '') : propertyId;
    const propertyDir = path.join(baseDir, folderName);
    await ensureDir(propertyDir);

    const uploadedFiles = [];
    const errors = [];

    await Promise.all(req.files.map(async (file) => {
      try {
        const fileId = `${Date.now()}-${uuidv4().slice(0, 8)}`;
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const baseFilename = file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${fileId}-${baseFilename}${ext}`;
        const filepath = path.join(propertyDir, filename);

        // Process and save image
        const processedBuffer = await processImage(file.buffer, filename);
        await fs.writeFile(filepath, processedBuffer);

        // Update caches
        filenameCache.set(filename, propertyId);
        // Clear potential negative cache or update for this specific path
        // We can't easily predict the exact request URL here, so we let it miss and re-populate naturally

        uploadedFiles.push({
          filename,
          originalName: file.originalname,
          url: `/api/images/${isBlog ? propertyId : propertyId}/${filename}`,
          size: processedBuffer.length
        });
      } catch (error) {
        errors.push(`Failed to process ${file.originalname}: ${error.message}`);
      }
    }));

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} image(s)`,
      filesUploaded: uploadedFiles.length,
      urls: uploadedFiles.map(f => f.url),
      files: uploadedFiles,
      warnings: errors.length > 0 ? errors.join(', ') : undefined
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Serve images endpoint
app.get('/images/*', async (req, res) => {
  try {
    const fullPath = req.params[0];

    // 1. Check Path Cache (Fastest Path)
    if (pathCache.has(fullPath)) {
      const cachedPath = pathCache.get(fullPath);
      // Quick verify it still exists (async to verify, but we could assume it's there for max speed)
      // For robustness, if we get read errors, we clear cache. For now, trust the cache.
      const ext = path.extname(cachedPath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });

      const stream = fsSync.createReadStream(cachedPath);
      stream.on('error', () => {
        pathCache.delete(fullPath); // Invalid cache entry
        res.status(404).end();
      });
      stream.pipe(res);
      return;
    }

    const pathParts = fullPath.split('/');
    let propertyId, filename;

    // Parse URL
    if (pathParts[0] === 'blogs' && pathParts.length >= 3) {
      propertyId = `blogs/${pathParts[1]}`;
      filename = pathParts.slice(2).join('/');
    } else if (pathParts.length >= 2) {
      propertyId = pathParts[0];
      filename = pathParts.slice(1).join('/');
    } else {
      return res.status(400).json({ error: 'Invalid image path' });
    }

    let filepath = null;
    let found = false;

    // Define search strategies
    const searches = [
      () => path.join(TARGET_UPLOAD_DIR, propertyId, filename),
      () => path.join(UPLOADS_DIR, propertyId, filename),
      () => path.join(MIGRATED_DIR, propertyId, filename)
    ];

    if (propertyId === 'partners') {
      searches.push(() => path.join(PARTNERS_DIR, filename));
    }

    if (propertyId.startsWith('blogs/')) {
      searches.push(() => path.join(BLOGS_DIR, propertyId.replace('blogs/', ''), filename));
    }

    // 2. Direct folder checks (Parallel-ish or Sequential)
    // We do them sequentially to prioritize "correct" locations over fallback ones
    for (const getPath of searches) {
      const p = getPath();
      if (await checkFile(p)) {
        filepath = p;
        found = true;
        break;
      }
    }

    // 3. Fallback: Filename Cache
    if (!found) {
      if (!cacheBuilt) await buildFilenameCache();

      // Try resolving via filename cache
      const cachedFolder = filenameCache.get(filename) ||
        filenameCache.get(decodeURIComponent(filename));

      if (cachedFolder) {
        // Try exact filename in cached folder
        const p = path.join(MIGRATED_DIR, cachedFolder, filename);
        if (await checkFile(p)) {
          filepath = p;
          found = true;
        } else {
          // Try variations if exact fail
          const variations = [decodeURIComponent(filename), encodeURIComponent(filename)];
          for (const v of variations) {
            const pv = path.join(MIGRATED_DIR, cachedFolder, v);
            if (await checkFile(pv)) {
              filepath = pv;
              found = true;
              break;
            }
          }
        }
      }
    }

    if (!found) {
      console.log(`[Images] Not found: ${fullPath} (Prop: ${propertyId}, File: ${filename})`);
      return res.status(404).json({ error: 'Image not found' });
    }

    // 4. Success - Update Cache and Serve
    // Add to path cache (with simple LRU-like protection)
    if (pathCache.size >= MAX_PATH_CACHE) {
      const keys = pathCache.keys();
      pathCache.delete(keys.next().value); // Delete oldest inserted
    }
    pathCache.set(fullPath, filepath);

    const ext = path.extname(filepath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    });

    const stream = fsSync.createReadStream(filepath);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    });
    stream.pipe(res);

  } catch (error) {
    console.error(`[Images] Serve error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve images endpoint with /serve path (for FeaturedListings compatibility)
app.get('/serve/*', async (req, res) => {
  // Redirect to main images endpoint
  const fullPath = req.params[0];
  req.url = `/images/${fullPath}`;
  return app._router.handle(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'VectorAfriq Images Service' });
});

app.listen(PORT, () => {
  console.log(`Images service running on port ${PORT}`);
});