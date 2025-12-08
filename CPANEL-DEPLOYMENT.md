# WhatsApp Server - cPanel Deployment Guide

## Problem: Puppeteer on cPanel
cPanel's CloudLinux environment me Chrome browser launch nahi hota due to security restrictions.

## Solution Options:

### Option 1: Remote Chrome Service (RECOMMENDED for cPanel)
Use a remote Chrome service like Browserless.io:

**Setup:**
1. Sign up at https://browserless.io (Free tier available)
2. Get your API endpoint: `wss://chrome.browserless.io?token=YOUR_TOKEN`
3. Update package.json:
   ```json
   "dependencies": {
     "puppeteer-core": "^22.0.0",
     "whatsapp-web.js": "^1.24.0"
   }
   ```
4. Update server.js:
   ```javascript
   puppeteer: {
     browserWSEndpoint: 'wss://chrome.browserless.io?token=YOUR_TOKEN'
   }
   ```

**Pros:**
- Works perfectly on cPanel
- No Chrome installation needed
- Reliable 24/7 uptime
- Auto-scaling

**Cons:**
- Free tier limited (6 hours/month)
- Requires internet connection

---

### Option 2: VPS Deployment (BEST for Production)
Deploy on a VPS where you have full control:

**Recommended Services:**
1. **DigitalOcean Droplet** ($6/month)
   - Ubuntu 22.04
   - 1GB RAM minimum
   - Full Chrome support

2. **Render.com** (Free tier available)
   - Automatic deployments from GitHub
   - Built-in Chrome support
   - Auto-restart on crashes

3. **Railway.app** ($5/month after free tier)
   - Easy deployment
   - Chrome pre-installed
   - Good for Node.js apps

**Setup on VPS:**
```bash
# SSH into VPS
ssh root@your-vps-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Chrome dependencies
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libasound2

# Clone repo
git clone https://github.com/spjokker1-png/whatsapp-server.git
cd whatsapp-server

# Install dependencies
npm install

# Create systemd service for auto-restart
sudo nano /etc/systemd/system/whatsapp.service
```

**systemd service file:**
```ini
[Unit]
Description=WhatsApp Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/whatsapp-server
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR

[Install]
WantedBy=multi-user.target
```

**Start service:**
```bash
sudo systemctl enable whatsapp
sudo systemctl start whatsapp
sudo systemctl status whatsapp
```

---

### Option 3: Keep Laptop Running (Temporary Only)
Only for testing, NOT recommended for production:

**Windows Power Settings:**
1. Control Panel → Power Options
2. Choose "High Performance"
3. Advanced Settings:
   - Turn off hard disk: Never
   - Sleep: Never
   - Hibernate: Never
   - When I close the lid: Do nothing

**Keep XAMPP Running:**
1. Open XAMPP Control Panel
2. Start Apache, MySQL
3. Open Terminal in whatsapp-server folder
4. Run: `node server.js`
5. Keep laptop plugged in and connected to internet

**Problems:**
- If internet disconnects, WhatsApp disconnects
- If laptop restarts, manual start required
- Power outage will disconnect WhatsApp
- Not suitable for 24/7 production use

---

## Current Setup Status

✅ **Completed:**
- WhatsApp server code created
- cPanel Node.js app configured
- Files uploaded to public_html/whatsapp-server
- npm install successful (103 packages)
- Environment variables set (API_KEY, PORT)

❌ **Blocked:**
- Puppeteer Chrome launch failing on CloudLinux
- Error: partition_allocator/partition_address_space.cc(94)

---

## Recommended Action Plan

**For Production (Best):**
1. Deploy to DigitalOcean VPS ($6/month)
2. Full Chrome support guaranteed
3. 24/7 uptime with systemd auto-restart
4. Update PHP app to point to VPS URL

**For cPanel (Alternative):**
1. Use Browserless.io remote Chrome
2. Free tier: 6 hours/month
3. Paid: $50/month unlimited
4. Update puppeteer config to use WSS endpoint

**For Testing Only:**
1. Keep laptop running with power settings
2. Run local Node.js server
3. Test WhatsApp integration
4. Then deploy to production

---

## Cost Comparison

| Service | Cost | Chrome Support | Uptime | Recommendation |
|---------|------|----------------|--------|----------------|
| cPanel Shared | Included | ❌ No | 99.9% | ⚠️ Needs Remote Chrome |
| Browserless.io Free | $0 | ✅ Yes | Limited | 🧪 Testing Only |
| Browserless.io Paid | $50/mo | ✅ Yes | 99.9% | ⚠️ Expensive |
| VPS (DigitalOcean) | $6/mo | ✅ Yes | 99.99% | ✅ **BEST** |
| Render.com Free | $0 | ✅ Yes | 75% uptime | 🧪 Testing |
| Render.com Paid | $7/mo | ✅ Yes | 99.9% | ✅ Good |
| Railway.app | $5/mo | ✅ Yes | 99.9% | ✅ Good |
| Laptop 24/7 | $0 | ✅ Yes | ❌ Unreliable | ❌ Not Production |

---

## Next Steps

1. **Test Login Fix First:**
   - Clear browser cookies
   - Test if login session fix worked
   - Verify sidebar shows for logged-in users

2. **Choose WhatsApp Deployment:**
   - VPS: Best for production, full control
   - Browserless: Quick solution for cPanel
   - Laptop: Testing only

3. **Update PHP Integration:**
   - Point to chosen server URL
   - Test QR code generation
   - Test payment notifications
