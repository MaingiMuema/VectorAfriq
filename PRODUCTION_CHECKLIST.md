# Production Image Upload Fix - Checklist

## Problem Summary
✅ **Identified**: Images upload locally but not in production because `NEXT_PUBLIC_IMAGE_SERVICE_URL` points to `localhost:3001` which doesn't exist in production.

## Root Cause
- Frontend trying to connect to `http://localhost:3001` in production
- Image service not deployed/accessible in production
- CORS configuration only allowing localhost

## Solution Checklist

### 1. Environment Configuration ✅ (COMPLETED)
- [x] Updated `.env` with production image service URL
- [x] Updated `images_service/.env` with production frontend URL
- [x] Added comments for local development settings

### 2. Image Service Deployment (TO DO)

#### Option A: Deploy on Production Server
- [ ] SSH into production server
- [ ] Copy `images_service` folder to server
- [ ] Install Node.js dependencies: `npm install --production`
- [ ] Create required directories (see deployment guide)
- [ ] Start service with PM2: `pm2 start server.js --name image-service`
- [ ] Save PM2 config: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup`

#### Option B: Use Deployment Script
- [ ] Copy `images_service` folder to production server
- [ ] Make script executable: `chmod +x deploy-production.sh`
- [ ] Run deployment script: `./deploy-production.sh`

### 3. Network Configuration (TO DO)
Choose one option:

#### Option A: Direct Access (Port 3001)
- [ ] Open firewall port 3001: `sudo ufw allow 3001/tcp`
- [ ] Update DNS: Create A record for `images.vectorafriqproperties.co.ke` → Server IP
- [ ] Setup SSL certificate: `sudo certbot --nginx -d images.vectorafriqproperties.co.ke`
- [ ] Set `NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.vectorafriqproperties.co.ke`

#### Option B: Reverse Proxy (Recommended)
- [ ] Configure nginx/Apache to proxy `/image-service/` to `localhost:3001`
- [ ] Reload web server: `sudo systemctl reload nginx`
- [ ] Set `NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.vectorafriqproperties.co.ke/image-service`

### 4. Main Application Update (TO DO)
- [ ] Update production `.env` with correct `NEXT_PUBLIC_IMAGE_SERVICE_URL`
- [ ] Rebuild Next.js app: `npm run build`
- [ ] Restart application
- [ ] Clear any CDN/cache if applicable

### 5. Verification (TO DO)
- [ ] Test health endpoint: `curl https://images.vectorafriqproperties.co.ke/health`
- [ ] Check CORS: Test from browser console on production site
- [ ] Upload test image through production UI
- [ ] Verify image saved in database
- [ ] Verify image displays correctly
- [ ] Check PM2 logs: `pm2 logs image-service`

### 6. Monitoring Setup (RECOMMENDED)
- [ ] Setup PM2 log rotation: `pm2 install pm2-logrotate`
- [ ] Configure log retention
- [ ] Setup monitoring/alerts
- [ ] Document service location and access

## Quick Commands Reference

### Check Service Status
```bash
pm2 status
pm2 logs image-service --lines 50
```

### Restart Service
```bash
pm2 restart image-service
```

### Test Connectivity
```bash
# Health check
curl http://localhost:3001/health

# From external
curl https://images.vectorafriqproperties.co.ke/health

# Test CORS
curl -H "Origin: https://uat.vectorafriqproperties.co.ke" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://images.vectorafriqproperties.co.ke/upload -v
```

### View Logs
```bash
# Real-time logs
pm2 logs image-service

# Last 100 lines
pm2 logs image-service --lines 100

# Error logs only
pm2 logs image-service --err
```

## Environment Variables Summary

### Production Settings

**Main App (.env)**
```env
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.vectorafriqproperties.co.ke
# OR with reverse proxy:
# NEXT_PUBLIC_IMAGE_SERVICE_URL=https://uat.vectorafriqproperties.co.ke/image-service
```

**Image Service (images_service/.env)**
```env
PORT=3001
FRONTEND_URL=https://vectorafriqproperties.co.ke
NODE_ENV=production
```

### Local Development Settings

**Main App (.env)**
```env
NEXT_PUBLIC_IMAGE_SERVICE_URL=http://localhost:3001
```

**Image Service (images_service/.env)**
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Troubleshooting

### Issue: CORS Error in Browser Console
**Solution**: 
1. Check `FRONTEND_URL` in `images_service/.env`
2. Ensure it matches your production domain
3. Restart image service: `pm2 restart image-service`

### Issue: Connection Refused
**Solution**:
1. Check service is running: `pm2 status`
2. Check firewall: `sudo ufw status`
3. Test locally: `curl http://localhost:3001/health`

### Issue: 404 Not Found
**Solution**:
1. Verify `NEXT_PUBLIC_IMAGE_SERVICE_URL` in main app
2. Check URL format (with/without trailing slash)
3. Rebuild main app: `npm run build`

### Issue: Images Upload but Don't Save
**Solution**:
1. Check PM2 logs: `pm2 logs image-service`
2. Verify directory permissions: `ls -la images_service/uploads/`
3. Check disk space: `df -h`

## Files Modified
- ✅ `.env` - Updated image service URL
- ✅ `images_service/.env` - Updated frontend URL and NODE_ENV
- ✅ `IMAGE_SERVICE_DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `images_service/deploy-production.sh` - Linux deployment script
- ✅ `images_service/deploy-production.bat` - Windows deployment script
- ✅ `PRODUCTION_CHECKLIST.md` - This checklist

## Next Steps
1. Deploy image service to production server (see deployment guide)
2. Configure domain/reverse proxy
3. Update main app environment variables
4. Test image upload in production
5. Monitor logs for any issues

## Support Resources
- Deployment Guide: `IMAGE_SERVICE_DEPLOYMENT.md`
- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Image Service Code: `images_service/server.js`
- Frontend Upload Code: `src/components/listings/CreateListingForm.tsx`
