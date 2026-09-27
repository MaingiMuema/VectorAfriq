# Production Image Upload Fix - Summary

## Issue Found
Images upload locally but not in production due to **CORS blocking** the upload request.

## Root Cause
Your production frontend URL `https://uat.com.vectorafriqproperties.co.ke` was **NOT** in the image service's CORS allowed origins list.

## Fix Applied
✅ Added `https://uat.com.vectorafriqproperties.co.ke` to CORS allowed origins in `images_service/server.js`

## Deployment Steps

### 1. Update Image Service on Production Server
```bash
# SSH into your production server
ssh your-server

# Navigate to image service directory
cd /path/to/images_service

# Pull latest changes or copy the updated server.js file
# Make sure server.js has the updated CORS configuration

# Restart the service
pm2 restart image-service

# Verify it's running
pm2 logs image-service --lines 20
```

### 2. Verify CORS Configuration
When the service starts, you should see in the logs:
```
Allowed CORS origins: [
  'https://vectorafriqproperties.co.ke/',
  'https://vectorafriqproperties.co.ke',
  'https://www.vectorafriqproperties.co.ke',
  'https://uat.vectorafriqproperties.co.ke',
  'https://uat.com.vectorafriqproperties.co.ke'
]
```

### 3. Test Image Upload
1. Go to `https://uat.com.vectorafriqproperties.co.ke/crm/create-listing`
2. Fill in property details
3. Upload images
4. Submit the form
5. Check that images are saved and displayed

### 4. Check Logs if Issues Persist
```bash
# Image service logs
pm2 logs image-service

# Check for CORS errors or upload errors
pm2 logs image-service --err
```

## Quick Verification Commands

```bash
# Check service is running
pm2 status

# Test health endpoint
curl https://uat.com.vectorafriqproperties.co.ke/health

# Check CORS from your domain
curl -H "Origin: https://uat.com.vectorafriqproperties.co.ke" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://uat.com.vectorafriqproperties.co.ke/upload -v
```

## Files Changed
- ✅ `images_service/server.js` - Added `https://uat.com.vectorafriqproperties.co.ke` to CORS

## Expected Result
After restarting the image service, uploads from `https://uat.com.vectorafriqproperties.co.ke` should work without CORS errors.

## If Still Not Working

1. **Check browser console** for CORS errors
2. **Verify image service URL** in main app `.env`:
   ```
   NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.com.vectorafriqproperties.co.ke
   ```
3. **Check image service is accessible**:
   ```bash
   curl https://uat.com.vectorafriqproperties.co.ke/health
   ```
4. **Verify FRONTEND_URL** in `images_service/.env`:
   ```
   FRONTEND_URL=https://vectorafriqproperties.co.ke/
   ```
5. **Check PM2 logs** for errors:
   ```bash
   pm2 logs image-service --lines 50
   ```
