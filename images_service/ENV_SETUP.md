# Images Service - Environment Setup Guide

## Quick Start

### Development Setup

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Default configuration (already set):**
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

3. **Start the service:**
```bash
npm start
```

## Environment Variables

### PORT
- **Description:** Port number for the images service
- **Default:** 3001
- **Example:** `PORT=3001`

### FRONTEND_URL
- **Description:** URL of the frontend application (for CORS)
- **Development:** `http://localhost:3000`
- **Production:** `https://vectorafriqproperties.co.ke`
- **UAT:** `https://uat.vectorafriqproperties.co.ke`

### NODE_ENV
- **Description:** Application environment
- **Values:** `development` | `production`
- **Default:** `development`

## Environment-Specific Configurations

### Local Development
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### UAT/Staging
```env
PORT=3001
FRONTEND_URL=https://uat.vectorafriqproperties.co.ke
NODE_ENV=production
```

### Production
```env
PORT=3001
FRONTEND_URL=https://vectorafriqproperties.co.ke
NODE_ENV=production
```

## CORS Configuration

The service automatically allows requests from:
1. `FRONTEND_URL` (from environment variable)
2. `https://vectorafriqproperties.co.ke` (hardcoded)
3. `https://www.vectorafriqproperties.co.ke` (hardcoded)
4. `https://uat.vectorafriqproperties.co.ke` (hardcoded)

## Troubleshooting

### CORS Errors
**Problem:** Frontend can't connect to images service

**Solution:** 
1. Check `FRONTEND_URL` matches your frontend URL
2. Restart images service after changing .env
3. Check console logs for "Allowed CORS origins"

### Connection Refused
**Problem:** Cannot connect to images service

**Solution:**
1. Ensure images service is running: `npm start`
2. Check PORT is not in use: `netstat -ano | findstr :3001`
3. Verify `NEXT_PUBLIC_IMAGE_SERVICE_URL` in main app matches images service URL

### Images Not Uploading
**Problem:** Upload fails with 500 error

**Solution:**
1. Check images service logs
2. Verify directories exist: `uploads/Properties/`, `public/Properties/`
3. Check file permissions
4. Ensure disk space available

## Directory Structure

```
images_service/
├── uploads/
│   └── Properties/          # Legacy uploads
├── public/
│   └── Properties/
│       └── Properties/
│           ├── properties/  # New property images
│           ├── blogs/       # Blog images
│           └── partners/    # Partner logos
├── .env                     # Your configuration
├── .env.example            # Template
└── server.js               # Main service
```

## Health Check

Test if service is running:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "VectorAfriq Images Service"
}
```

## Integration with Main App

The main application needs this environment variable:
```env
NEXT_PUBLIC_IMAGE_SERVICE_URL=http://localhost:3001
```

For production:
```env
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.vectorafriqproperties.co.ke
```
