# VectorAfriq Images Service

A standalone Node.js service for handling image uploads and serving for the VectorAfriq application.

## Features

- Image upload with validation
- Automatic image processing and optimization using Sharp
- Secure file serving
- Support for JPEG, PNG, and WebP formats
- File size limits and security checks

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Upload Images
`POST /upload`

Form data:
- `propertyId`: Property identifier
- `files`: Array of image files

### Serve Images
`GET /images/:propertyId/:filename`

### Health Check
`GET /health`

## Deployment

The service can be deployed independently on any Node.js hosting platform.

### Environment Variables
- `PORT`: Service port (default: 3001)
- `FRONTEND_URL`: Frontend application URL for CORS
- `NODE_ENV`: Environment (development/production)