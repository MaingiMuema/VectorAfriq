# Blog Images Migration to Images Service

## Summary
Successfully migrated blog image storage and retrieval from FTP to the images_service infrastructure.

## Changes Made

### 1. Images Service (images_service/server.js)
- Added `BLOGS_DIR` constant for blog-specific image storage
- Updated upload endpoint to detect blog uploads via `propertyId` starting with `blogs/`
- Modified image serving endpoint to handle blog image paths
- Blog images are stored in: `public/Properties/Properties/blogs/{blog-id}/`

### 2. Blog Editor (src/app/admin/blogs/[id]/page.tsx)
- Updated featured image upload to use `propertyId: blogs/{id}` format
- Simplified URL handling - images_service now returns complete URLs
- Removed manual URL construction with origin and /api/images prefix

### 3. Blog Listing (src/app/admin/blogs/page.tsx)
- Removed unnecessary image URL formatting logic
- Images are now served directly from the database URLs

### 4. Editor Component (src/components/editor/Editor.tsx)
- Updated content image uploads to use `blogs/content-{timestamp}` format
- Simplified URL handling to use images_service returned URLs directly

## Image Storage Structure

```
images_service/
└── public/
    └── Properties/
        └── Properties/
            └── blogs/
                ├── {blog-id}/           # Featured images
                │   └── {timestamp}-{filename}.jpg
                └── content-{timestamp}/ # Content images
                    └── {timestamp}-{filename}.jpg
```

## API Flow

1. **Upload**: 
   - Frontend → `/api/crm/upload` → Images Service `/upload`
   - propertyId format: `blogs/{blog-id}` or `blogs/content-{timestamp}`

2. **Serve**: 
   - Frontend → `/api/images/blogs/{blog-id}/{filename}` → Images Service `/images/blogs/{blog-id}/{filename}`

## Benefits

- ✅ Centralized image management through images_service
- ✅ No FTP dependencies
- ✅ Consistent image handling across the application
- ✅ Automatic image optimization (85% quality JPEG/WebP)
- ✅ Proper caching headers (max-age=31536000)
- ✅ File size validation (5MB limit)
- ✅ Support for JPEG, PNG, and WebP formats

## Testing Checklist

- [ ] Create new blog post with featured image
- [ ] Upload images in blog content editor
- [ ] Edit existing blog post and change featured image
- [ ] Verify images display correctly in blog listing
- [ ] Verify images display correctly in blog editor
- [ ] Test image serving from `/api/images/blogs/...` endpoint
- [ ] Verify image caching works properly
