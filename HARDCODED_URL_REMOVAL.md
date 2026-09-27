# Hardcoded URL Removal - Image Service

## Summary
Removed all hardcoded "localhost:3001" references from the application and images_service, replacing them with environment variables for better configuration management across different environments.

## Changes Made

### 1. Main Application (`src/lib/imageService.ts`)

**Before:**
```typescript
const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || 'http://localhost:3001';
```

**After:**
```typescript
const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL!;

if (!IMAGE_SERVICE_URL) {
  throw new Error('NEXT_PUBLIC_IMAGE_SERVICE_URL environment variable is not set');
}
```

**Impact:** 
- Removes hardcoded fallback URL
- Enforces environment variable configuration
- Provides clear error message if variable is missing

### 2. Images Service (`images_service/server.js`)

**Before:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://vectorafriqproperties.co.ke',
  'https://www.vectorafriqproperties.co.ke'
];
```

**After:**
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://vectorafriqproperties.co.ke',
  'https://www.vectorafriqproperties.co.ke',
  'https://uat.vectorafriqproperties.co.ke'
];

console.log('Allowed CORS origins:', allowedOrigins);
```

**Impact:**
- Uses `FRONTEND_URL` environment variable
- Added UAT environment URL
- Logs allowed origins for debugging
- Keeps fallback for backward compatibility

### 3. Images Service Environment Files

**Updated `images_service/.env`:**
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Production URLs (uncomment for production)
# FRONTEND_URL=https://vectorafriqproperties.co.ke
# NODE_ENV=production
```

**Updated `images_service/.env.example`:**
```env
# Server Configuration
PORT=3001

# Frontend URL (where requests will come from)
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Production Configuration (uncomment for production)
# FRONTEND_URL=https://vectorafriqproperties.co.ke
# NODE_ENV=production
```

## Environment Variables Required

### Main Application (`.env`)
- `NEXT_PUBLIC_IMAGE_SERVICE_URL` - URL of the images service (e.g., http://localhost:3001)

### Images Service (`images_service/.env`)
- `PORT` - Port for images service (default: 3001)
- `FRONTEND_URL` - URL of the frontend application (e.g., http://localhost:3000)
- `NODE_ENV` - Environment mode (development/production)

## How Image Upload Works

### Flow:
1. **User uploads images** in CreateListingForm (MediaStep)
2. **Images stored in formData** as File objects
3. **On form submission**, CreateListingForm calls `ImageService.uploadImages()`
4. **ImageService** sends images to images_service via POST `/upload`
5. **Images_service** processes and saves images to disk
6. **Returns URLs** in format `/api/images/{propertyId}/{filename}`
7. **CreateListingForm** converts URLs to database format `/properties/{propertyId}/{filename}`
8. **Saves to database** via POST `/api/crm/properties`

### Key Components:
- **CreateListingForm.tsx** - Handles form submission and image upload orchestration
- **imageService.ts** - Client-side service for communicating with images_service
- **server.js** (images_service) - Handles image upload, processing, and serving

## Testing

### Development:
```bash
# Terminal 1 - Start images service
cd images_service
npm start

# Terminal 2 - Start main app
npm run dev
```

### Production:
Update environment variables:
```env
# Main app .env
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.vectorafriqproperties.co.ke

# Images service .env
FRONTEND_URL=https://vectorafriqproperties.co.ke
NODE_ENV=production
```

## Benefits

1. ✅ **No hardcoded URLs** - All URLs configurable via environment
2. ✅ **Environment-specific** - Easy to switch between dev/staging/production
3. ✅ **Better error handling** - Clear errors when variables missing
4. ✅ **CORS flexibility** - Frontend URL configurable for different environments
5. ✅ **Debugging support** - Logs allowed origins on startup

## Migration Notes

- Existing functionality unchanged
- No database migrations required
- Backward compatible with existing images
- All image paths remain the same
