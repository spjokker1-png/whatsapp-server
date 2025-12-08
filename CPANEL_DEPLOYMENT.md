# cPanel Application Deployment Guide

## Step-by-Step Instructions

### 1. Upload Code to cPanel
Using File Manager or FTP:
1. Create folder: `whatsapp-server` in home directory
2. Upload all files:
   - server.js
   - package.json
   - .gitignore
   - etc.

**Important**: Do NOT upload:
- node_modules folder (cPanel will install)
- .git folder
- .wwebjs_auth folder

### 2. Register Application in cPanel
Go to: **Applications → Register**

Fill in:
- **Application Name**: `WhatsApp Server`
- **Deployment Domain**: Select your domain (e.g., `yourdomain.com`)
- **Application Path**: `/whatsapp-server`
- **Deployment Environment**: `Production`

Click **Register Application**

### 3. Set Environment Variables
After registration, find "Environment Variables" section:

Add these variables:
```
NODE_ENV=production
API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR
PORT=3001
```

### 4. Configure Start Command
In Application Settings:
- **Start Command**: `node server.js`
- **Node Version**: 18.x or latest

### 5. Install Dependencies
SSH into cPanel or use Terminal in File Manager:
```bash
cd ~/whatsapp-server
npm install
```

### 6. Start Application
In Applications panel:
- Click "Start" or "Deploy"
- Wait 1-2 minutes
- Check status (should show "Running")

### 7. Get Application URL
cPanel will provide URL like:
- `https://yourdomain.com:3001/health`
- Or subdomain: `https://whatsapp.yourdomain.com/health`

### 8. Update PHP Proxy
Edit `public_html/.env`:
```
NODE_BASE=https://yourdomain.com:3001
API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR
```

Or if using subdomain:
```
NODE_BASE=https://whatsapp.yourdomain.com
API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR
```

### 9. Test
```bash
# Health check
curl https://yourdomain.com:3001/health

# Status with API key
curl -H "x-api-key: aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR" \
  https://yourdomain.com:3001/api/status
```

### 10. Test from PHP
Visit: `https://yourdomain.com/whatsapp-connect.php`
Should show QR code.

## Troubleshooting

### Application Won't Start
1. Check Node version (needs 16+)
2. Check file permissions (755 for directories, 644 for files)
3. Check logs in cPanel Applications panel

### Port Already in Use
Change PORT in environment variables to different value:
```
PORT=3002
```
Update `.env` accordingly.

### Puppeteer/Chromium Issues
cPanel might not have Chromium. In that case:
1. Use free hosting (Render) for Node server
2. Keep PHP on cPanel
3. PHP proxy connects both

## Notes
- Keep application "Running" status
- Restart after code changes
- Monitor logs for errors
- Some cPanel hosts don't support long-running Node apps
- If issues persist, use Render.com + cPanel PHP combo (recommended)
