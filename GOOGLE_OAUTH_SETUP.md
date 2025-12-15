# Google OAuth Setup Guide

## Step 1: Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if needed
6. Application type: "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5000`
   - Your production domain
8. Copy the Client ID

## Step 2: Update Frontend

Edit `frontend/script.js` line 3:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
```

## Step 3: Test

1. Start backend: `cd backend && npm run dev`
2. Open frontend: Open `frontend/index.html` in browser
3. Click "Sign in with Google" button
4. Select your Google account
5. You'll be logged in automatically!

## How It Works

- Frontend shows Google Sign-In button
- User clicks and selects Google account
- Google returns credential token
- Frontend sends token to backend (`/api/auth/google`)
- Backend verifies token and creates/finds user
- Backend returns JWT token
- User is logged in!

## Features

✅ One-click sign in with Google
✅ Automatic account creation
✅ No password needed
✅ Works for both login and register
✅ Secure JWT authentication

## Note

The current implementation uses a demo Google Client ID. Replace it with your own for production use.
