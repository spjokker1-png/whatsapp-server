# WhatsApp Node Server - Local Testing Guide

## Yahan local par test karein (before Railway)

### Step 1: Node.js install hai na?

PowerShell mein check karein:
```powershell
node --version
npm --version
```

Agar install nahi hai:
- Download: https://nodejs.org (LTS version)
- Install karein
- PowerShell restart karein

---

### Step 2: .env file banayein

Folder mein: `C:\xampp\htdocs\whatsapp-server\.env`

Add karein:
```
API_KEY=sk_live_test_key_12345678
NODE_ENV=development
PORT=3001
```

---

### Step 3: Dependencies install karein

PowerShell mein:
```powershell
cd C:\xampp\htdocs\whatsapp-server

# sab packages install karein
npm install
```

Wait karein — 1-2 minutes lag sakta hai.

---

### Step 4: Server start karein

```powershell
npm start
# ya directly:
node server.js
```

Aapko dikhna chahye:
```
[TIME] 📱 Initializing WhatsApp...
[TIME] ✅ Server running on http://localhost:3001
[TIME] 📱 Waiting for WhatsApp connection...
```

---

### Step 5: QR code local se test karein

Browser mein:
```
http://localhost:3001/api/status
```

Agar API_KEY check nahin aa raha (401), toh:
1. `.env` file mein API_KEY dekho
2. Ya API_KEY middleware comment karein (testing ke liye temporary)

---

### Step 6: whatsapp-connect.php local se test karein

1. Browser mein:
```
http://localhost/whatsapp-connect.php
```

2. Ye automatically Node server se connect karega (localhost:3001)

3. Aapko dikhna chahye:
   - ❌ Disconnected (ya ✅ Connected)
   - QR code (agar disconnected)

---

### Step 7: api-proxy.php local par update karein

`C:\xampp\htdocs\api-proxy.php` edit karein:

```php
// LOCAL TESTING (change before uploading to cPanel)
$NODE_BASE = 'http://localhost:3001';
$API_KEY   = 'sk_live_test_key_12345678'; // same as .env

// PRODUCTION (after Railway setup)
// $NODE_BASE = 'https://whatsapp-server-production-xxxxx.up.railway.app';
// $API_KEY   = 'sk_live_your_actual_key';
```

---

### Step 8: Full local test karein

1. **Node server chalao:**
   ```powershell
   cd C:\xampp\htdocs\whatsapp-server
   node server.js
   # ya pm2 se: pm2 start server.js --name whatsapp
   ```

2. **XAMPP start karein** (if not running)
   - XAMPP Control Panel → Apache + MySQL start

3. **Browser mein open karein:**
   ```
   http://localhost/whatsapp-connect.php
   ```

4. **Test karein:**
   - Status dikhni chahye (live updates every 5s)
   - QR code show hona chahye (disconnected state mein)
   - Manual QR upload kar sakte ho (form dekho)

5. **QR code scan karein:**
   - WhatsApp mobile mein open karein
   - Settings → Linked Devices → Link a device
   - QR scan karein
   - Connected ho jayega!

---

## Troubleshooting Local

**Q: Cannot find module?**
```powershell
npm install
```

**Q: Port 3001 already in use?**
```powershell
# PORT variable change karein .env mein
PORT=3002
```

**Q: 401 Unauthorized?**
- API_KEY mismatch check karein
- `.env` file mein same key use karein

**Q: QR nahi aa raha?**
- Node logs dekho — errors hain?
- WhatsApp-web.js initialize ho raha hai?

**Q: Connection refused?**
- Node server chal raha hai?
- Port 3001 open hai?
- Check: `netstat -ano | findstr :3001` (PowerShell)

---

## After local testing successful — Railway pe deploy

1. GitHub pe push karein (code update)
2. Railway auto-deploy hoga
3. cPanel mein .env values update karein (Railway URL + same API_KEY)

---

## Local Commands Recap

```powershell
# Install deps
npm install

# Start server
node server.js

# OR use pm2 (background + auto-restart)
npm install -g pm2
pm2 start server.js --name whatsapp-server
pm2 logs whatsapp-server
pm2 stop whatsapp-server
```

---

**Ready to start?** Pehle local par test karein — phir production ready!
