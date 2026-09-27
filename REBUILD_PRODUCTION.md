# Production Rebuild Required

## Problem
The application is using `http://localhost:3001` because that value was **baked into the JavaScript bundle** when you built the app locally.

Next.js embeds all `NEXT_PUBLIC_*` environment variables into the client-side JavaScript at **build time**, not runtime.

## Solution: Rebuild with Production Environment Variables

### Option 1: Build on Production Server (Recommended)

```bash
# SSH into production server
ssh your-server

# Navigate to project directory
cd /path/to/VectorAfriq

# Ensure .env has correct values
cat .env | grep NEXT_PUBLIC_IMAGE_SERVICE_URL
# Should show: NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.com.vectorafriqproperties.co.ke

# Install dependencies (if needed)
npm install

# Build with production environment variables
npm run build

# Restart the application
pm2 restart your-app-name
# OR if using different process manager:
# systemctl restart your-app
```

### Option 2: Build Locally with Production Variables

```bash
# In your local project directory

# Create a production .env file
echo "NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.com.vectorafriqproperties.co.ke" > .env.production

# Build with production environment
npm run build

# The build output is in .next/ folder
# Upload the entire .next/ folder to production server

# On production server, restart the app
pm2 restart your-app-name
```

### Option 3: Use Environment Variable During Build

```bash
# Build with inline environment variable
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.com.vectorafriqproperties.co.ke npm run build

# Upload .next/ folder to production
# Restart app
```

## Why This Happens

Next.js replaces `process.env.NEXT_PUBLIC_*` with the actual values during build:

**Before build (source code):**
```javascript
const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL;
```

**After build (bundled JavaScript):**
```javascript
const IMAGE_SERVICE_URL = "http://localhost:3001"; // ← Hardcoded!
```

This is why changing `.env` on the server doesn't work - the value is already in the JavaScript bundle.

## Verification

After rebuilding and restarting:

1. **Check browser console** - Should show:
   ```
   ImageService.uploadImages called: {
     serviceUrl: 'https://uat.com.vectorafriqproperties.co.ke'  // ✓ Correct!
   }
   ```

2. **Test upload** - Images should now upload successfully

3. **Check network tab** - Request should go to `https://uat.com.vectorafriqproperties.co.ke/upload`

## Quick Check Script

Create this file to verify environment variables before building:

```bash
#!/bin/bash
# check-env.sh

echo "Checking environment variables..."
echo ""

if [ -f .env ]; then
    echo "✓ .env file exists"
    
    IMAGE_URL=$(grep NEXT_PUBLIC_IMAGE_SERVICE_URL .env | cut -d '=' -f2)
    
    if [ -z "$IMAGE_URL" ]; then
        echo "✗ NEXT_PUBLIC_IMAGE_SERVICE_URL not found in .env"
        exit 1
    fi
    
    echo "✓ NEXT_PUBLIC_IMAGE_SERVICE_URL = $IMAGE_URL"
    
    if [[ $IMAGE_URL == *"localhost"* ]]; then
        echo "⚠ WARNING: Using localhost URL - this won't work in production!"
        exit 1
    fi
    
    echo "✓ URL looks good for production"
else
    echo "✗ .env file not found"
    exit 1
fi
```

Run before building:
```bash
chmod +x check-env.sh
./check-env.sh && npm run build
```

## Production .env Template

Your production `.env` should have:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=propwnzj_vector
DB_PASSWORD=<your-production-db-password>
DB_NAME=propwnzj_propertyfinder
DATABASE_URL="mysql://propwnzj_vector:<your-production-db-password>@localhost:3306/propwnzj_propertyfinder"

# Image Service - PRODUCTION URL
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.com.vectorafriqproperties.co.ke

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://vectorafriqproperties.co.ke/

# Other settings...
NEXT_PUBLIC_UPLOAD_URL=https://uat.vectorafriqproperties.co.ke
NEXT_PUBLIC_BASE_URL=https://uat.vectorafriqproperties.co.ke/
NEXT_PUBLIC_SITE_URL=https://vectorafriqproperties.co.ke
NODE_ENV=production
```

## Common Mistakes to Avoid

1. ❌ Changing `.env` on server without rebuilding
2. ❌ Building locally with localhost URL
3. ❌ Forgetting to restart app after rebuild
4. ❌ Using wrong environment file (`.env.local` vs `.env`)

## Deployment Checklist

- [ ] Update `.env` with production `NEXT_PUBLIC_IMAGE_SERVICE_URL`
- [ ] Verify environment variable: `grep NEXT_PUBLIC_IMAGE_SERVICE_URL .env`
- [ ] Run build: `npm run build`
- [ ] Check build output for errors
- [ ] Upload `.next/` folder to production (if building locally)
- [ ] Restart application: `pm2 restart app-name`
- [ ] Test in browser console - verify URL is correct
- [ ] Test image upload - should work now

## If Still Not Working

1. **Clear browser cache** - Old JavaScript might be cached
2. **Check build logs** - Look for environment variable warnings
3. **Verify .next folder** - Make sure it's the newly built version
4. **Check PM2 logs** - `pm2 logs app-name`
5. **Hard refresh browser** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
