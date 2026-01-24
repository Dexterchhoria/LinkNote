# LinkNote AWS Deployment Guide

## Architecture
- **Backend**: AWS EC2 (Node.js + Express)
- **Database**: AWS RDS (PostgreSQL)
- **Frontend**: AWS S3 + CloudFront
- **Domain**: Optional (Route 53)

---

## Part 1: Database Setup (RDS PostgreSQL)

### 1.1 Create RDS PostgreSQL Instance
```bash
# Via AWS Console:
1. Go to RDS Console
2. Click "Create database"
3. Choose PostgreSQL
4. Template: Free tier (or Production based on needs)
5. DB instance identifier: linknote-db
6. Master username: postgres
7. Master password: [Create strong password]
8. DB instance class: db.t3.micro (free tier)
9. Storage: 20 GB
10. VPC: Default VPC
11. Public access: Yes (for initial setup, restrict later)
12. VPC security group: Create new (linknote-db-sg)
13. Database name: linknote
14. Backup retention: 7 days
15. Click "Create database"
```

### 1.2 Configure Security Group
```bash
# Add inbound rule to RDS security group:
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: EC2 security group (will create in next step)
```

### 1.3 Note RDS Endpoint
```
Example: linknote-db.xxxxx.us-east-1.rds.amazonaws.com
```

---

## Part 2: Backend Setup (EC2)

### 2.1 Launch EC2 Instance
```bash
# Via AWS Console:
1. Go to EC2 Console
2. Click "Launch Instance"
3. Name: linknote-backend
4. AMI: Ubuntu Server 22.04 LTS
5. Instance type: t2.micro (free tier)
6. Key pair: Create new or use existing
7. Security group: Create new (linknote-backend-sg)
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere
   - Custom TCP (5000) from anywhere (for API)
8. Storage: 8 GB
9. Click "Launch Instance"
```

### 2.2 Connect to EC2 Instance
```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 2.3 Install Node.js and Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install PostgreSQL client (for testing connection)
sudo apt install -y postgresql-client
```

### 2.4 Clone and Setup Backend
```bash
# Clone your repository or upload files
git clone <your-repo-url>
# OR upload via SCP:
# scp -i your-key.pem -r backend ubuntu@your-ec2-ip:/home/ubuntu/

cd linknote/backend

# Install dependencies
npm install

# Create production .env file
nano .env
```

### 2.5 Configure Production .env
```env
# Database Configuration (RDS)
DB_HOST=linknote-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=linknote
DB_USER=postgres
DB_PASSWORD=your_rds_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_strong_random_string
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net
```

### 2.6 Initialize Database
```bash
# Test RDS connection first
psql -h linknote-db.xxxxx.us-east-1.rds.amazonaws.com -U postgres -d linknote

# Run database initialization
node scripts/initDatabase.js
```

### 2.7 Start Backend with PM2
```bash
# Start the application
pm2 start server.js --name linknote-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
# Follow the command it outputs

# View logs
pm2 logs linknote-backend

# Check status
pm2 status
```

### 2.8 Configure Nginx (Optional but Recommended)
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/linknote
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or use EC2 public IP

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/linknote /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 2.9 Setup SSL with Certbot (Optional)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certificates auto-renew
sudo certbot renew --dry-run
```

---

## Part 3: Frontend Setup (S3 + CloudFront)

### 3.1 Update Frontend Configuration
```bash
# On your local machine
cd frontend-react

# Update API URL in types.ts
```

Edit `src/types.ts`:
```typescript
export const API_URL = 'http://your-ec2-ip:5000/api';
// OR if using domain with Nginx:
// export const API_URL = 'https://your-domain.com/api';
```

### 3.2 Build Frontend
```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# This creates a 'dist' folder with optimized files
```

### 3.3 Create S3 Bucket
```bash
# Via AWS Console:
1. Go to S3 Console
2. Click "Create bucket"
3. Bucket name: linknote-frontend (must be globally unique)
4. Region: us-east-1 (or your preferred region)
5. Uncheck "Block all public access"
6. Acknowledge the warning
7. Enable "Bucket Versioning" (optional)
8. Click "Create bucket"
```

### 3.4 Configure S3 Bucket for Static Website
```bash
# In S3 bucket:
1. Go to "Properties" tab
2. Scroll to "Static website hosting"
3. Click "Edit"
4. Enable "Static website hosting"
5. Index document: index.html
6. Error document: index.html (for React Router)
7. Save changes
```

### 3.5 Set Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::linknote-frontend/*"
    }
  ]
}
```

Apply this in: Bucket → Permissions → Bucket Policy

### 3.6 Upload Build Files to S3
```bash
# Install AWS CLI (if not installed)
# Download from: https://aws.amazon.com/cli/

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json

# Upload build files
cd dist
aws s3 sync . s3://linknote-frontend --delete

# OR via AWS Console:
# Go to your S3 bucket → Click "Upload" → Drag all files from dist folder
```

### 3.7 Create CloudFront Distribution
```bash
# Via AWS Console:
1. Go to CloudFront Console
2. Click "Create Distribution"
3. Origin domain: Select your S3 bucket
4. Origin access: Public
5. Viewer protocol policy: Redirect HTTP to HTTPS
6. Allowed HTTP methods: GET, HEAD, OPTIONS
7. Cache policy: CachingOptimized
8. Response headers policy: CORS-with-preflight-and-SecurityHeadersPolicy
9. Default root object: index.html
10. Click "Create Distribution"

# Note the CloudFront Distribution Domain Name (e.g., d111111abcdef8.cloudfront.net)
```

### 3.8 Configure Error Pages (Important for React Router)
```bash
# In CloudFront distribution:
1. Go to "Error pages" tab
2. Click "Create custom error response"
3. HTTP error code: 403
4. Customize error response: Yes
5. Response page path: /index.html
6. HTTP response code: 200
7. Click "Create"

# Repeat for 404 error:
1. HTTP error code: 404
2. Response page path: /index.html
3. HTTP response code: 200
```

### 3.9 Update Backend CORS
Update backend `.env`:
```env
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net
```

Update `backend/server.js` CORS configuration:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

Restart backend:
```bash
pm2 restart linknote-backend
```

---

## Part 4: Google OAuth Configuration

### 4.1 Update Google Cloud Console
```bash
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add Authorized JavaScript origins:
   - https://your-cloudfront-domain.cloudfront.net
4. Add Authorized redirect URIs:
   - https://your-cloudfront-domain.cloudfront.net
5. Save changes
```

---

## Part 5: Deploy Updates

### 5.1 Update Backend
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

cd linknote/backend

# Pull latest changes
git pull

# Install new dependencies (if any)
npm install

# Restart application
pm2 restart linknote-backend

# View logs
pm2 logs linknote-backend
```

### 5.2 Update Frontend
```bash
# On local machine
cd frontend-react

# Update API URL if changed
# Build
npm run build

# Upload to S3
cd dist
aws s3 sync . s3://linknote-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Part 6: Monitoring & Maintenance

### 6.1 View Backend Logs
```bash
# SSH into EC2
pm2 logs linknote-backend
pm2 monit
```

### 6.2 Database Backups
```bash
# RDS automatically creates daily backups
# To create manual snapshot:
# AWS Console → RDS → Select database → Actions → Take snapshot
```

### 6.3 Cost Optimization
```bash
# Free Tier includes:
- EC2: 750 hours/month (t2.micro)
- RDS: 750 hours/month (db.t2.micro)
- S3: 5GB storage, 20,000 GET requests
- CloudFront: 1TB data transfer out
```

---

## Quick Reference

### Backend URL
```
http://your-ec2-ip:5000/api
https://your-domain.com/api (with Nginx)
```

### Frontend URL
```
https://your-cloudfront-domain.cloudfront.net
```

### Useful Commands
```bash
# PM2
pm2 list
pm2 restart linknote-backend
pm2 logs linknote-backend
pm2 stop linknote-backend

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Database
psql -h RDS_ENDPOINT -U postgres -d linknote
```

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs linknote-backend
# Check .env configuration
# Verify RDS connection
```

### CORS errors
```bash
# Verify FRONTEND_URL in backend .env
# Check CloudFront domain is correct
# Restart backend: pm2 restart linknote-backend
```

### Frontend 404 errors
```bash
# Verify CloudFront error pages are configured
# Check S3 bucket policy allows public access
```

### Database connection failed
```bash
# Check RDS security group allows EC2 security group
# Verify RDS endpoint in .env
# Test: psql -h RDS_ENDPOINT -U postgres -d linknote
```
