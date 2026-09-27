# Image Upload Issue Fix

## Problem
Properties were sometimes failing to upload with the error:
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause
The error occurred when the image service at `http://localhost:3001` was:
1. Not running
2. Returning HTML error pages (404/500) instead of JSON responses
3. The code was trying to parse HTML as JSON without checking the content type first

## Solution Applied

### 1. Updated `imageService.ts`
- Changed to use local API proxy endpoint (`/api/crm/upload`) instead of direct external service
- Added content-type validation before parsing JSON
- Improved error messages to help diagnose connectivity issues
- Added proper error handling for fetch failures

### 2. Updated `/api/crm/upload/route.ts`
- Added content-type check before parsing JSON responses from image service
- Better error messages indicating when the image service is not responding
- Prevents the "Unexpected token '<'" error by catching HTML responses

### 3. Updated `CreateListingForm.tsx`
- Enhanced error messaging to show service URL when connectivity fails
- Better user feedback about what went wrong

## How It Works Now

1. **Client** → Uploads images via `ImageService.uploadImages()`
2. **ImageService** → Sends to `/api/crm/upload` (local Next.js API)
3. **Local API** → Proxies to external image service at `IMAGE_SERVICE_URL`
4. **Response** → Content-type is checked before parsing
5. **Error Handling** → If HTML is returned, shows clear error message

## Environment Variables Required

```env
IMAGE_SERVICE_URL=https://uat.com.vectorafriqproperties.co.ke
```

## Testing the Fix

1. Ensure the image service is running at the configured URL
2. Try uploading a property with images
3. If the service is down, you'll now see a clear error message instead of JSON parse error

## Fallback Behavior

If the image service is unavailable:
- Clear error message is shown to the user
- Form stays on the media step for retry
- No property is created without images (validation prevents it)

## Next Steps (Optional Improvements)

1. Consider implementing a local file storage fallback
2. Add retry logic for transient network failures
3. Implement batch upload with progress tracking
4. Add image optimization before upload
