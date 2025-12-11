# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- During installation, remember your password
- Default port: 5432

### 2. Create Database
Open Command Prompt and run:
```bash
psql -U postgres
CREATE DATABASE linknote;
\q
```

### 3. Setup Backend
```bash
cd backend
npm install
copy .env.example .env
```

Edit `.env` file and add your PostgreSQL password.

### 4. Initialize Database
```bash
npm run init-db
```

### 5. Start Backend Server
```bash
npm run dev
```

Server runs at: http://localhost:5000

### 6. Open Frontend

**Option 1: Direct Open (Easiest)**
Simply double-click `frontend/index.html` or right-click → Open with → Your browser

**Option 2: Using Live Server (Recommended for development)**
```bash
cd frontend
npx http-server -p 3000
```
Visit: http://localhost:3000

**Option 3: Python (if you have it installed)**
```bash
cd frontend
python -m http.server 3000
```

## ✅ First Steps

1. Click "Register" to create an account
2. Enter username, email, and password
3. Start adding links!

## 🐛 Common Issues

**Error: Database connection failed**
- Make sure PostgreSQL is running
- Check password in `.env` file
- Verify database `linknote` exists

**Error: Port 5000 already in use**
- Change PORT in `.env` to another port (e.g., 5001)
- Update API_URL in `frontend/script.js` to match

**CORS Error**
- Make sure backend is running on port 5000
- Check console for errors

## 📦 What's Included

✅ Complete backend API with authentication  
✅ PostgreSQL database  
✅ User registration & login  
✅ Link management (add, edit, delete, search)  
✅ Modern, responsive UI  
✅ Ready for AWS deployment  

## 🌐 Deploy to AWS

See detailed AWS deployment instructions in `README.md`

Need help? Check the main README.md for detailed documentation!
