# Banner Adblocker Fix

## Problem
Adblockers were blocking both banner images and API requests because they contained the word "banners":
- Image URLs: `/api/images/banners/image.jpg`
- API endpoint: `/api/banners?active=true`

This is a common pattern that adblockers use to identify and block advertising content.

## Solution
1. **Image URLs**: Changed from `/api/images/banners/` to `/api/images/media/`
2. **API Endpoint**: Created alternative endpoint `/api/media-content` instead of `/api/banners`

This avoids triggering adblocker filters while maintaining the same functionality.

## Changes Made

### 1. Upload Endpoints Updated
- `src/app/api/admin/promotional-content/upload/route.ts`
- `src/app/api/admin/banners/upload/route.ts`

Both now:
- Create a `media` directory instead of `banners` on FTP
- Return URLs with `/api/images/media/` prefix

### 2. API Endpoint Created
- `src/app/api/media-content/route.ts` - Alternative to `/api/banners` to avoid adblocker blocking
- `src/components/banners/BannerSlideshow.tsx` - Updated to use new endpoint

### 2. Migration Scripts Created

#### Database Migration
```bash
# Run this SQL script to update existing banner URLs in database
mysql -u username -p database_name < src/scripts/migrate-banner-urls.sql
```

#### FTP File Migration
```bash
# Run this Node.js script to move files from banners/ to media/ directory on FTP
cd src/scripts
node migrate-ftp-banners.js
```

## Migration Steps

### For Existing Installations:

1. **Update the code** (already done in this commit)

2. **Migrate database URLs**:
   ```bash
   mysql -u your_username -p your_database < src/scripts/migrate-banner-urls.sql
   ```

3. **Migrate FTP files**:
   ```bash
   cd src/scripts
   node migrate-ftp-banners.js
   ```

4. **Verify migration**:
   - Check that banner images display correctly in admin panel
   - Test with adblocker enabled - images should now load
   - Verify new uploads use `/api/images/media/` URLs

### For New Installations:
No migration needed - new uploads will automatically use the `media` directory.

## Technical Details

- The general image handler at `/api/images/[...path]/route.ts` handles both old and new paths
- FTP directory structure: `media/` instead of `banners/`
- Database `imageUrl` field updated to use new path format
- No changes needed to frontend components - they use the URLs from the database

## Testing

1. Upload a new banner image
2. Verify the URL uses `/api/images/media/` format
3. Test image display with adblocker enabled
4. Confirm images load correctly in both admin panel and public slideshow
