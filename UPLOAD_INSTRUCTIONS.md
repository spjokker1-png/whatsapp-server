# cPanel Upload Instructions

## Files Ko Upload Karne Ka Tareeqa

### Step 1: Ye Files Select Karo
Upload karne ke liye sirf ye files/folders chahiye:

**Required Files:**
- server.js ✓
- package.json ✓
- .htaccess ✓ (ab ban gaya)

**Optional:**
- messages.json (agar hai to)
- README files (zaruri nahi)

**Upload MAT Karna:**
- node_modules/ (cPanel khud install karega)
- .git/ (zaruri nahi)
- .wwebjs_auth/ (zaruri nahi)

### Step 2: cPanel File Manager Upload Process

1. **cPanel login karo**
2. **File Manager** kholo
3. **Home directory** mein jao
4. **whatsapp-server** folder dhundo (pehle se register ho gaya hai)
5. Folder ke andar jao
6. **Upload** button dabao
7. Local files select karo:
   - `C:\xampp\htdocs\whatsapp-server\server.js`
   - `C:\xampp\htdocs\whatsapp-server\package.json`
   - `C:\xampp\htdocs\whatsapp-server\.htaccess`

### Step 3: Terminal Commands (cPanel Terminal)

```bash
cd ~/whatsapp-server
npm install
```

Wait 2-3 minutes (dependencies install honge)

### Step 4: Application Manager mein Restart

1. Application Manager kholo
2. "WhatsApp Server" ke saamne **Restart** button dabao
3. Status "Running" hona chahiye

### Step 5: Test Karo

Browser mein kholo:
```
https://no1smmpanel.com/whatsapp-api/health
```

Expected response:
```json
{"status":"ok","connected":false}
```

### Step 6: cPanel Main Site ke .env Update

File Manager → public_html folder → `.env` file edit/banao:
```
NODE_BASE=https://no1smmpanel.com/whatsapp-api
API_KEY=aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR
```

### Step 7: Test WhatsApp Connection

Browser:
```
https://no1smmpanel.com/whatsapp-connect.php
```

QR code dikhai dega! Scan karo WhatsApp se.

## Troubleshooting

### Application Start Nahi Ho Raha
1. Terminal mein jao: `cd ~/whatsapp-server`
2. Manual check: `node server.js`
3. Error messages dekho
4. Agar Puppeteer/Chromium error aaye → cPanel support nahi karta
   - Solution: Free hosting (Render.com) use karo Node ke liye

### Permission Errors
```bash
chmod 755 ~/whatsapp-server
chmod 644 ~/whatsapp-server/*.js
```

### Port Conflicts
.htaccess mein PORT change mat karo, Passenger khud handle karega

## Summary

**Upload karne ke liye sirf 3 files:**
1. server.js
2. package.json  
3. .htaccess

**Baad mein:**
- Terminal: `npm install`
- Application Manager: Restart
- Test: `/health` endpoint

Done! 🎉
