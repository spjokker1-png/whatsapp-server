# Render.com Deployment Guide

## Railway Alternative (Free Tier Available)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your GitHub repository `spjokker1-png/whatsapp-server`

### Step 2: Create New Web Service
1. Dashboard → "New" → "Web Service"
2. Select your `whatsapp-server` repository
3. Configure:
   - **Name**: `whatsapp-server`
   - **Region**: Choose closest to Pakistan (Singapore or Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (automatically sleeps after 15 min inactivity)

### Step 3: Environment Variables
Add these in "Environment" section:
```
NODE_ENV=production
API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait 2-3 minutes for build to complete
3. Copy the generated URL: `https://whatsapp-server-xxxx.onrender.com`

### Step 5: Update cPanel
Edit `c:\xampp\htdocs\.env`:
```
NODE_BASE=https://whatsapp-server-xxxx.onrender.com
API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR
```

### Step 6: Test
```bash
# Health check
curl https://whatsapp-server-xxxx.onrender.com/health

# Status check (with API key)
curl -H "x-api-key: aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR" \
  https://whatsapp-server-xxxx.onrender.com/api/status
```

## Notes
- **Free tier limitation**: Service sleeps after 15 minutes of inactivity; first request after sleep takes 30-60 seconds to wake up
- **Solution**: Use a free uptime monitor (UptimeRobot.com) to ping `/health` every 5 minutes
- **Chromium**: Render includes Chromium by default, so whatsapp-web.js puppeteer will work

## Troubleshooting
If Puppeteer fails on Render, add this to `server.js` puppeteer args:
```javascript
'--disable-blink-features=AutomationControlled',
'--disable-extensions'
```

Already added in current server.js.
