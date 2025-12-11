# LinkNote - Full Stack Link Manager

A complete full-stack application for storing and managing unlimited links with user authentication.

## 🏗️ Architecture

**Frontend**: HTML, CSS, JavaScript (Vanilla)  
**Backend**: Node.js + Express  
**Database**: PostgreSQL  
**Authentication**: JWT (JSON Web Tokens)  
**Deployment**: AWS (EC2 + RDS)

## 📁 Project Structure

```
linknote/
├── backend/
│   ├── config/
│   │   └── database.js       # PostgreSQL connection
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication routes (register, login)
│   │   └── links.js          # Links CRUD routes
│   ├── scripts/
│   │   └── initDatabase.js   # Database initialization script
│   ├── .env.example          # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js             # Express server entry point
└── frontend/
    ├── index.html            # Main HTML with auth modal
    ├── style.css             # Complete styling
    └── script.js             # Frontend logic + API calls
```

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Step 1: Database Setup

1. Install PostgreSQL on your machine
2. Create a new database:
```sql
CREATE DATABASE linknote;
```

### Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
copy .env.example .env
```

4. Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=linknote
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_random_secret_key_min_32_chars
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

5. Initialize the database (create tables):
```bash
npm run init-db
```

6. Start the development server:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

### Step 3: Frontend Setup

1. Navigate to frontend directory and open `index.html` in your browser or use a local server:
```bash
# Using Python
python -m http.server 3000

# Or using Node.js http-server
npx http-server -p 3000
```

Frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Links
All link endpoints require `Authorization: Bearer <token>` header

- `GET /api/links` - Get all links for user (supports search, category filter, sorting)
- `GET /api/links/:id` - Get specific link
- `POST /api/links` - Create new link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `GET /api/links/categories/list` - Get all categories

## 🌐 AWS Deployment Guide

### Setting up RDS (PostgreSQL)

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose PostgreSQL
4. Configure:
   - DB instance identifier: `linknote-db`
   - Master username: `admin`
   - Master password: (create secure password)
   - Public access: Yes (restrict later via security groups)
5. Note down the endpoint URL

### Deploy Backend to EC2

1. Launch EC2 Instance (Ubuntu Server 22.04 LTS, t2.micro)
2. Configure security group (ports: 22, 80, 443, 5000)
3. Connect and install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

4. Upload backend files and install:
```bash
cd /home/ubuntu/linknote/backend
npm install --production
```

5. Create production `.env` file with RDS credentials

6. Initialize database:
```bash
npm run init-db
```

7. Use PM2 for process management:
```bash
sudo npm install -g pm2
pm2 start server.js --name linknote-api
pm2 startup
pm2 save
```

### Deploy Frontend

1. Update `frontend/script.js` API_URL to your EC2 IP or domain
2. Upload frontend files to EC2
3. Configure nginx to serve frontend and proxy API

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use strong, random strings (min 32 characters)
3. **Database**: Restrict RDS security group to only EC2 instance
4. **HTTPS**: Use Let's Encrypt or AWS Certificate Manager
5. **CORS**: Configure appropriate CORS settings in production

## 📊 Database Schema

### Users Table
- id, username, email, password, created_at, updated_at

### Links Table
- id, user_id, url, title, description, category, created_at, updated_at

## 🎯 Features

- ✅ User authentication (register/login)
- ✅ JWT-based authorization
- ✅ Secure password hashing (bcrypt)
- ✅ CRUD operations for links
- ✅ Search across all fields
- ✅ Filter by category
- ✅ Sort by date or title
- ✅ Export links to JSON
- ✅ Responsive design
- ✅ Input validation
- ✅ Each user sees only their own links

## 📝 Usage

1. Open the application in your browser
2. Register a new account or login
3. Add links with title, URL, description, and category
4. Search, filter, and organize your links
5. Edit or delete links as needed
6. Export your links for backup

## 📄 License

MIT
