# LinkNote - Quick AWS Deployment Steps

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- SSH key pair for EC2
- Domain (optional)

## Step-by-Step Deployment

### 1️⃣ Database (RDS PostgreSQL)
```bash
# Create RDS instance via AWS Console
- Instance: db.t3.micro
- Database name: linknote
- Public access: Yes
- Note the endpoint: linknote-db.xxxxx.rds.amazonaws.com
```

### 2️⃣ Backend (EC2)
```bash
# Launch EC2 instance (Ubuntu 22.04, t2.micro)
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Upload backend folder or clone from git
cd linknote/backend
npm install

# Create .env file
nano .env
# Add your RDS credentials and config

# Initialize database
node scripts/initDatabase.js

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3️⃣ Frontend (S3 + CloudFront)
```bash
# On your local machine
cd frontend-react

# Update .env.production with your EC2 IP
VITE_API_URL=http://YOUR_EC2_IP:5000/api

# Build
npm run build

# Create S3 bucket via AWS Console
# Bucket name: linknote-frontend
# Enable static website hosting
# Set bucket policy for public read

# Upload to S3
aws s3 sync dist/ s3://linknote-frontend --delete

# Create CloudFront distribution
# Origin: Your S3 bucket
# Configure error pages (403, 404 → /index.html)
# Note CloudFront domain
```

### 4️⃣ Final Configuration
```bash
# Update backend CORS
# In backend/.env add:
FRONTEND_URL=https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net

# Restart backend
pm2 restart linknote-backend

# Update Google OAuth (if using)
# Add CloudFront URL to authorized origins
```

### 5️⃣ Test
```bash
# Visit your CloudFront URL
https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net

# Test API
http://YOUR_EC2_IP:5000/api/health
```

## Important Files Created
- `DEPLOYMENT.md` - Detailed deployment guide
- `frontend-react/.env.production` - Production API URL
- `backend/ecosystem.config.js` - PM2 configuration
- `deploy-frontend.sh` - Frontend deployment script

## Cost Estimate (Free Tier)
- EC2 t2.micro: Free for 12 months (750 hours/month)
- RDS db.t3.micro: Free for 12 months (750 hours/month)
- S3: Free (5GB storage)
- CloudFront: Free (1TB transfer/month)

## Security Checklist
- ✅ Change JWT_SECRET to strong random string
- ✅ Use strong RDS password
- ✅ Restrict RDS security group to EC2 only
- ✅ Configure HTTPS with Nginx + Certbot
- ✅ Enable CloudFront HTTPS
- ✅ Update Google OAuth URLs

## Need Help?
Check `DEPLOYMENT.md` for detailed instructions and troubleshooting.
