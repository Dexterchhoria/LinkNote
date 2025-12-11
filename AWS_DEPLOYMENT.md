# AWS Deployment Checklist

## 📋 Pre-Deployment

- [ ] AWS Account created
- [ ] AWS CLI installed (optional but helpful)
- [ ] Domain name ready (optional)
- [ ] Code tested locally

## 🗄️ Step 1: Setup RDS PostgreSQL

### Create Database Instance
- [ ] Login to AWS Console
- [ ] Go to RDS → Create database
- [ ] Select PostgreSQL
- [ ] Choose instance size:
  - Development: db.t3.micro (free tier)
  - Production: db.t3.small or larger
- [ ] Configuration:
  - DB name: `linknote`
  - Master username: `admin`
  - Password: (save securely!)
  - Storage: 20GB (free tier)
  - Public access: Yes (temporary)
- [ ] Create database
- [ ] Copy endpoint address: `xxxx.region.rds.amazonaws.com`

### Initialize Database
From your local machine:
```bash
# Install PostgreSQL client if not already installed
psql -h your-rds-endpoint.region.rds.amazonaws.com -U admin -d postgres

# Create database
CREATE DATABASE linknote;
\q
```

Update backend `.env` with RDS credentials:
```
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=linknote
DB_USER=admin
DB_PASSWORD=your_rds_password
DB_SSL=true
```

Run initialization:
```bash
cd backend
npm run init-db
```

## 🖥️ Step 2: Setup EC2 Instance

### Launch Instance
- [ ] Go to EC2 → Launch Instance
- [ ] Select: Ubuntu Server 22.04 LTS
- [ ] Instance type: t2.micro (free tier)
- [ ] Create new key pair (save `.pem` file securely!)
- [ ] Configure Security Group:
  - SSH (22): Your IP
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0
  - Custom TCP (5000): 0.0.0.0/0
- [ ] Launch instance
- [ ] Note public IP address

### Connect to EC2
```bash
# Windows (use Git Bash or WSL)
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# If permission error on Windows:
icacls "your-key.pem" /inheritance:r
icacls "your-key.pem" /grant:r "%username%:R"
```

### Install Node.js and Dependencies
```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install Git
sudo apt-get install -y git

# Install PM2 globally
sudo npm install -g pm2
```

### Upload Backend Code
Option 1 - Using SCP (from your local machine):
```bash
scp -i "your-key.pem" -r backend ubuntu@your-ec2-ip:/home/ubuntu/linknote/
```

Option 2 - Using Git:
```bash
# On EC2
cd /home/ubuntu
git clone your-repository-url linknote
cd linknote/backend
```

### Setup Backend on EC2
```bash
cd /home/ubuntu/linknote/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste production environment variables (RDS credentials)
# Press Ctrl+X, then Y, then Enter to save

# Start with PM2
pm2 start server.js --name linknote-api

# Make PM2 start on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs linknote-api
```

## 🌐 Step 3: Setup Nginx (Optional but Recommended)

### Install and Configure Nginx
```bash
# Install
sudo apt-get install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/linknote
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-ec2-ip;  # or your-domain.com

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Frontend
    location / {
        root /home/ubuntu/linknote/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and start:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/linknote /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 📱 Step 4: Deploy Frontend

### Update API URL
Edit `frontend/script.js` locally:
```javascript
// Change from:
const API_URL = 'http://localhost:5000/api';

// To:
const API_URL = 'http://your-ec2-ip/api';
// Or with domain:
const API_URL = 'https://yourdomain.com/api';
```

### Upload Frontend
```bash
# From your local machine
scp -i "your-key.pem" -r frontend ubuntu@your-ec2-ip:/home/ubuntu/linknote/
```

## 🔒 Step 5: Security Hardening

### Update RDS Security Group
- [ ] Go to RDS → Your database → Connectivity
- [ ] Click on VPC security group
- [ ] Edit inbound rules
- [ ] Change PostgreSQL (5432) source from "Anywhere" to EC2 security group

### Update EC2 Security Group
- [ ] Restrict SSH (22) to your IP only
- [ ] If using nginx, remove port 5000 from public access

### SSL Certificate (Optional)
Using Let's Encrypt (free):
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

## ✅ Step 6: Testing

- [ ] Visit `http://your-ec2-ip` (or your domain)
- [ ] Register a new account
- [ ] Add a test link
- [ ] Test search, edit, delete
- [ ] Test logout and login
- [ ] Check mobile responsiveness

## 📊 Step 7: Monitoring

### Setup CloudWatch (Optional)
- [ ] Enable monitoring in EC2 console
- [ ] Set up billing alerts
- [ ] Create alarms for CPU, memory, disk

### PM2 Monitoring
```bash
# Check logs
pm2 logs linknote-api

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart linknote-api
```

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Pull changes
cd /home/ubuntu/linknote/backend
git pull  # if using git

# Restart
pm2 restart linknote-api
```

### Database Backup
```bash
# From local machine
pg_dump -h your-rds-endpoint.region.rds.amazonaws.com -U admin -d linknote > backup.sql

# Restore if needed
psql -h your-rds-endpoint.region.rds.amazonaws.com -U admin -d linknote < backup.sql
```

## 💰 Cost Estimation (AWS)

**Free Tier (First 12 months):**
- EC2 t2.micro: Free (750 hours/month)
- RDS db.t3.micro: Free (750 hours/month)
- 30GB storage: Free
- Data transfer: 15GB/month free

**After Free Tier:**
- EC2 t2.micro: ~$8.50/month
- RDS db.t3.micro: ~$15/month
- Storage: ~$3/month
- **Total: ~$26.50/month**

## 🆘 Troubleshooting

**Can't connect to EC2:**
- Check security group allows SSH from your IP
- Verify key permissions: `chmod 400 your-key.pem` (Linux/Mac)

**Can't connect to RDS:**
- Check security group allows PostgreSQL from EC2
- Verify credentials in `.env`
- Check RDS is publicly accessible (temporary during setup)

**App not loading:**
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs`
- Check nginx: `sudo systemctl status nginx`
- Verify API URL in frontend code

**Database errors:**
- Run init-db script again
- Check RDS connection string
- Verify SSL settings

## 📞 Need Help?

- AWS Documentation: https://docs.aws.amazon.com/
- PM2 Documentation: https://pm2.keymetrics.io/
- Nginx Documentation: https://nginx.org/en/docs/

---

**🎉 Congratulations! Your LinkNote app is now live on AWS!**
