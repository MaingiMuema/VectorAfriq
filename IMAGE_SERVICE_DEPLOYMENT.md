# Image Service Deployment Guide

## Problem Identified

Images upload successfully locally but fail in production because:

1. **Frontend is pointing to localhost**: `NEXT_PUBLIC_IMAGE_SERVICE_URL=http://localhost:3001` only works locally
2. **CORS configuration**: Image service only allows `http://localhost:3000` in production
3. **Service not accessible**: Production frontend cannot reach `localhost:3001`

## Solution

### 1. Deploy Image Service to Production

The `images_service` needs to be deployed and accessible via a public URL. You have several options:

#### Option A: Deploy on Same Server (Recommended)
- Run image service on port 3001 on your production server
- Access via: `https://uat.vectorafriqproperties.co.ke:3001` or `https://images.vectorafriqproperties.co.ke`

#### Option B: Separate Server
- Deploy image service on a dedicated server
- Use subdomain: `https://images.vectorafriqproperties.co.ke`

#### Option C: Reverse Proxy (Best Practice)
Configure nginx/Apache to proxy requests:
```nginx
# In your nginx config
location /image-service/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 2. Update Environment Variables

#### Main Application (.env)
```env
# Production
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.vectorafriqproperties.co.ke
# OR if using reverse proxy:
# NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.vectorafriqproperties.co.ke/image-service

# Local Development (comment out in production)
# NEXT_PUBLIC_IMAGE_SERVICE_URL=http://localhost:3001
```

#### Image Service (images_service/.env)
```env
PORT=3001

# Production
FRONTEND_URL=https://vectorafriqproperties.co.ke
NODE_ENV=production

# Local Development (comment out in production)
# FRONTEND_URL=http://localhost:3000
# NODE_ENV=development
```

### 3. Update CORS Configuration

The image service already includes your production URLs in the CORS whitelist:
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://vectorafriqproperties.co.ke',
  'https://www.vectorafriqproperties.co.ke',
  'https://uat.vectorafriqproperties.co.ke'
];
```

Make sure `FRONTEND_URL` is set correctly in production.

### 4. Deployment Steps

#### Step 1: Prepare Image Service for Production
```bash
cd images_service
npm install --production
```

#### Step 2: Start Image Service (Using PM2 - Recommended)
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the service
pm2 start server.js --name "image-service"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### Step 3: Verify Service is Running
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs image-service

# Test health endpoint
curl http://localhost:3001/health
```

#### Step 4: Configure Firewall (if needed)
```bash
# Allow port 3001 (if accessing directly)
sudo ufw allow 3001/tcp
```

#### Step 5: Setup SSL Certificate (if using subdomain)
```bash
# Using certbot for Let's Encrypt
sudo certbot --nginx -d images.vectorafriqproperties.co.ke
```

### 5. Verify Deployment

#### Test Image Upload
1. Go to your production site: `https://uat.vectorafriqproperties.co.ke`
2. Navigate to Create Listing
3. Upload images
4. Check browser console for any errors
5. Verify images are saved in database

#### Check Image Service Logs
```bash
pm2 logs image-service --lines 100
```

#### Test Image Retrieval
```bash
# Replace with actual property ID and filename
curl https://images.vectorafriqproperties.co.ke/images/PROPERTY_ID/FILENAME.jpg
```

### 6. Troubleshooting

#### Images Still Not Uploading?

1. **Check Frontend Console**:
   - Open browser DevTools → Console
   - Look for CORS errors or connection errors
   - Verify the URL being called

2. **Check Image Service Logs**:
   ```bash
   pm2 logs image-service --lines 50
   ```

3. **Verify Environment Variables**:
   ```bash
   # In your Next.js app
   echo $NEXT_PUBLIC_IMAGE_SERVICE_URL
   
   # In image service directory
   cat .env
   ```

4. **Test Service Connectivity**:
   ```bash
   # From production server
   curl http://localhost:3001/health
   
   # From external
   curl https://images.vectorafriqproperties.co.ke/health
   ```

5. **Check CORS Headers**:
   ```bash
   curl -H "Origin: https://uat.vectorafriqproperties.co.ke" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://images.vectorafriqproperties.co.ke/upload -v
   ```

#### Common Issues

**Issue**: CORS Error
- **Solution**: Ensure `FRONTEND_URL` in image service `.env` matches your production domain

**Issue**: Connection Refused
- **Solution**: Verify image service is running (`pm2 status`) and port is accessible

**Issue**: 404 Not Found
- **Solution**: Check `NEXT_PUBLIC_IMAGE_SERVICE_URL` is correct in main app `.env`

**Issue**: Images Upload but Don't Display
- **Solution**: Verify image paths in database match the serving pattern

### 7. Directory Structure

Ensure these directories exist and have proper permissions:
```bash
cd images_service

# Create directories if they don't exist
mkdir -p uploads/Properties
mkdir -p public/Properties/Properties/properties
mkdir -p public/Properties/Properties/partners
mkdir -p public/Properties/Properties/blogs

# Set permissions
chmod -R 755 uploads/
chmod -R 755 public/
```

### 8. Monitoring

#### Setup Monitoring with PM2
```bash
# Monitor in real-time
pm2 monit

# View logs
pm2 logs image-service

# Restart if needed
pm2 restart image-service
```

#### Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Quick Reference

### Local Development
```env
# .env
NEXT_PUBLIC_IMAGE_SERVICE_URL=http://localhost:3001

# images_service/.env
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Production
```env
# .env
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.vectorafriqproperties.co.ke

# images_service/.env
FRONTEND_URL=https://vectorafriqproperties.co.ke
NODE_ENV=production
```

### PM2 Commands
```bash
pm2 start server.js --name "image-service"  # Start
pm2 stop image-service                       # Stop
pm2 restart image-service                    # Restart
pm2 logs image-service                       # View logs
pm2 delete image-service                     # Remove
```

## Next Steps

1. ✅ Update `.env` files (already done)
2. ⬜ Deploy image service to production server
3. ⬜ Configure domain/subdomain for image service
4. ⬜ Setup SSL certificate
5. ⬜ Test image upload in production
6. ⬜ Setup monitoring and log rotation

## Support

If issues persist after following this guide:
1. Check PM2 logs: `pm2 logs image-service`
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure firewall allows traffic on port 3001 (or configured port)
