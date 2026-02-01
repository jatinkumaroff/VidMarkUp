# Deployment Guide

This guide provides instructions for deploying the Video Annotator application to various platforms.

## Prerequisites

- Node.js 16+ installed
- Git repository
- Platform-specific account (Heroku, Vercel, etc.)

## Option 1: Deploy to Heroku

### Backend Deployment

1. **Prepare the backend**
   ```bash
   cd server
   # Create Procfile
   echo "web: node src/server.js" > Procfile
   ```

2. **Create Heroku app**
   ```bash
   heroku create video-annotator-api
   ```

3. **Set environment variables**
   ```bash
   heroku config:set PORT=3001
   heroku config:set STORAGE_PATH=./storage
   heroku config:set CLIENT_URL=https://your-frontend-url.vercel.app
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Run seed script**
   ```bash
   heroku run npm run seed
   ```

**Note**: Heroku's ephemeral filesystem will lose uploaded files on restart. For production, use cloud storage (see below).

### Frontend Deployment (Vercel)

1. **Update API URL**
   Create `client/.env.production`:
   ```
   VITE_API_URL=https://video-annotator-api.herokuapp.com
   ```

2. **Update vite.config.js**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     define: {
       'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001')
     }
   });
   ```

3. **Update api.js**
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
   ```

4. **Deploy to Vercel**
   ```bash
   cd client
   vercel --prod
   ```

## Option 2: Deploy to Railway

Railway handles both frontend and backend easily.

### Backend

1. Create `railway.json` in server directory:
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm start",
       "healthcheckPath": "/api/health"
     }
   }
   ```

2. Push to Railway (they'll detect Node.js automatically)

### Frontend

Similar process, Railway will auto-detect Vite config.

## Option 3: Deploy to DigitalOcean App Platform

1. Create `app.yaml` in root:
   ```yaml
   name: video-annotator
   services:
   - name: api
     source:
       dir: server
     build_command: npm install
     run_command: npm start
     envs:
     - key: PORT
       value: "8080"
     - key: STORAGE_PATH
       value: "./storage"
   - name: web
     source:
       dir: client
     build_command: npm install && npm run build
     run_command: npm run preview
     envs:
     - key: VITE_API_URL
       value: "${api.PRIVATE_URL}"
   ```

## Option 4: Self-Hosted (VPS)

### Using PM2 and Nginx

1. **Install dependencies on server**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   sudo npm install -g pm2
   ```

2. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd video-annotator
   
   # Backend
   cd server
   npm install
   npm run seed
   
   # Frontend
   cd ../client
   npm install
   npm run build
   ```

3. **Start backend with PM2**
   ```bash
   cd server
   pm2 start src/server.js --name video-annotator-api
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   Create `/etc/nginx/sites-available/video-annotator`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /path/to/video-annotator/client/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Storage files
       location /storage {
           proxy_pass http://localhost:3001;
       }
   }
   ```

5. **Enable site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/video-annotator /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Cloud Storage Integration

### Using AWS S3

1. **Install AWS SDK**
   ```bash
   cd server
   npm install aws-sdk
   ```

2. **Update annotations.js**
   ```javascript
   import AWS from 'aws-sdk';
   
   const s3 = new AWS.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     region: process.env.AWS_REGION
   });
   
   // In upload route, replace fs.writeFile with:
   const params = {
     Bucket: process.env.S3_BUCKET,
     Key: `videos/${videoId}/annotations/${annotationId}/image.png`,
     Body: req.file.buffer,
     ContentType: 'image/png'
   };
   
   await s3.upload(params).promise();
   ```

3. **Update paths to use S3 URLs**

### Using Cloudinary

1. **Install Cloudinary**
   ```bash
   npm install cloudinary
   ```

2. **Configure and upload**
   ```javascript
   import { v2 as cloudinary } from 'cloudinary';
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   });
   
   // Upload
   const result = await cloudinary.uploader.upload_stream({
     folder: `video-annotator/${videoId}/${annotationId}`,
     resource_type: 'image'
   });
   ```

## Database Migration to MongoDB

### MongoDB Atlas Setup

1. **Create MongoDB Atlas account** and cluster

2. **Install Mongoose**
   ```bash
   cd server
   npm install mongoose
   ```

3. **Create model** (`server/src/models/Annotation.js`):
   ```javascript
   import mongoose from 'mongoose';
   
   const annotationSchema = new mongoose.Schema({
     videoId: { type: String, required: true, index: true },
     timestamp_ms: { type: Number, required: true },
     timecode: String,
     image_path: String,
     thumb_path: String,
     notes: String,
     created_at: { type: Date, default: Date.now }
   });
   
   export default mongoose.model('Annotation', annotationSchema);
   ```

4. **Update db.js**
   ```javascript
   import mongoose from 'mongoose';
   
   export async function connectDB() {
     try {
       await mongoose.connect(process.env.MONGODB_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true
       });
       console.log('MongoDB connected');
     } catch (error) {
       console.error('MongoDB connection error:', error);
       process.exit(1);
     }
   }
   ```

5. **Update routes** to use Mongoose methods:
   ```javascript
   import Annotation from '../models/Annotation.js';
   
   // Create
   const annotation = new Annotation({
     videoId,
     timestamp_ms,
     // ... other fields
   });
   await annotation.save();
   
   // List
   const annotations = await Annotation.find({ videoId }).sort('timestamp_ms');
   
   // Get one
   const annotation = await Annotation.findOne({ _id: annotationId, videoId });
   
   // Delete
   await Annotation.findByIdAndDelete(annotationId);
   ```

## Environment Variables for Production

### Backend (.env)
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/video-annotator
CLIENT_URL=https://your-frontend.com
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=video-annotator-storage
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-api.com
```

## Performance Optimizations for Production

1. **Enable gzip compression**
   ```javascript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Add rate limiting**
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/', limiter);
   ```

3. **Cache static assets**
   ```javascript
   app.use(express.static('public', {
     maxAge: '1d',
     etag: true
   }));
   ```

4. **Add helmet for security**
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

## Monitoring and Logging

1. **Add logging middleware**
   ```javascript
   import morgan from 'morgan';
   app.use(morgan('combined'));
   ```

2. **Error tracking with Sentry**
   ```javascript
   import * as Sentry from "@sentry/node";
   
   Sentry.init({ dsn: process.env.SENTRY_DSN });
   app.use(Sentry.Handlers.errorHandler());
   ```

3. **Health check endpoint** (already included)
   ```javascript
   app.get('/api/health', (req, res) => {
     res.json({ 
       status: 'ok', 
       timestamp: new Date().toISOString() 
     });
   });
   ```

## Backup Strategy

1. **Database backups** (MongoDB Atlas has automatic backups)

2. **Storage backups** (S3 versioning or automated scripts)

3. **Regular exports**
   ```bash
   # MongoDB
   mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
   
   # S3
   aws s3 sync s3://your-bucket /backup/s3/$(date +%Y%m%d)
   ```

## Troubleshooting Production Issues

1. **Check logs**
   ```bash
   # PM2
   pm2 logs video-annotator-api
   
   # Heroku
   heroku logs --tail
   
   # Railway
   railway logs
   ```

2. **Memory issues**: Increase memory limits or optimize image processing

3. **Storage issues**: Implement cleanup scripts for old annotations

4. **CORS issues**: Verify CLIENT_URL matches frontend domain exactly

## Cost Estimates (Monthly)

- **Heroku Hobby**: $7 (backend)
- **Vercel Free**: $0 (frontend)
- **MongoDB Atlas Free Tier**: $0 (512MB)
- **S3 Storage**: ~$0.50/GB
- **Total for demo**: ~$7-10/month

For production with more traffic, scale accordingly.
