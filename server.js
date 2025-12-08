import express from 'express';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR';

let client = null;
let qrCode = null;
let connected = false;

// Middleware
app.use(express.json());

// Initialize WhatsApp with persistent session
console.log('Starting WhatsApp with persistent session...');

client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session',
        clientId: 'whatsapp-payment-bot'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// QR Code event
client.on('qr', async (qr) => {
    console.log('QR Code received! Scan to authenticate.');
    qrCode = await qrcode.toDataURL(qr);
});

// Ready event
client.on('ready', () => {
    console.log('✅ WhatsApp connected successfully!');
    console.log('Session saved - will auto-reconnect on restart');
    connected = true;
    qrCode = null;
});

// Authenticated event (session loaded from disk)
client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated using saved session');
});

// Authentication failure
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    console.log('Please scan QR code again');
    connected = false;
    qrCode = null;
});

// Disconnected event with auto-reconnect
client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp disconnected:', reason);
    connected = false;
    qrCode = null;
    
    // Auto-reconnect after 5 seconds with retry logic
    let retryCount = 0;
    const maxRetries = 5;
    
    const attemptReconnect = () => {
        retryCount++;
        console.log(`Attempting to reconnect (${retryCount}/${maxRetries})...`);
        
        client.initialize().catch(err => {
            console.error('Reconnection failed:', err.message);
            
            if (retryCount < maxRetries) {
                const delay = Math.min(retryCount * 10000, 60000); // Max 1 minute
                console.log(`Retrying in ${delay/1000} seconds...`);
                setTimeout(attemptReconnect, delay);
            } else {
                console.error('❌ Max reconnection attempts reached. Manual restart required.');
            }
        });
    };
    
    setTimeout(attemptReconnect, 5000);
});

// Initialize
client.initialize();

// Connection health monitoring - check every 30 seconds
let lastHealthCheck = Date.now();
setInterval(async () => {
    try {
        if (connected && client) {
            const state = await client.getState();
            console.log(`Health check: ${state}`);
            lastHealthCheck = Date.now();
            
            // If state is not CONNECTED, try to reconnect
            if (state !== 'CONNECTED') {
                console.log('⚠️ Connection state not healthy, attempting reconnect...');
                connected = false;
                await client.initialize();
            }
        }
    } catch (error) {
        console.error('Health check failed:', error.message);
        
        // If health check fails for more than 2 minutes, reconnect
        if (Date.now() - lastHealthCheck > 120000) {
            console.log('⚠️ No successful health check in 2 minutes, forcing reconnect...');
            connected = false;
            try {
                await client.destroy();
                await client.initialize();
            } catch (err) {
                console.error('Force reconnect failed:', err.message);
            }
        }
    }
}, 30000); // Check every 30 seconds

// Keep client alive - send ping every 5 minutes to prevent timeout
setInterval(() => {
    if (connected && client) {
        console.log('Sending keepalive ping...');
        client.getState().then(state => {
            console.log(`Keepalive OK - State: ${state}`);
        }).catch(err => {
            console.error('Keepalive failed:', err.message);
        });
    }
}, 300000); // Every 5 minutes

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API Key check
const checkAuth = (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query['api_key'];
    if (API_KEY && key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Get QR Code
app.get('/api/qr-code', checkAuth, (req, res) => {
    if (connected) {
        return res.json({ qr: null, message: 'Already connected' });
    }
    if (!qrCode) {
        return res.json({ qr: null, message: 'Waiting for QR...' });
    }
    res.json({ qr: qrCode });
});

// Status
app.get('/api/status', checkAuth, (req, res) => {
    res.json({
        connected: connected,
        hasQR: qrCode ? true : false
    });
});

// Send message
app.post('/api/send-message', checkAuth, async (req, res) => {
    const { phone, message } = req.body;
    
    if (!connected) {
        return res.status(400).json({ success: false, error: 'Not connected' });
    }
    
    try {
        const chatId = phone.replace(/[^0-9]/g, '') + '@c.us';
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
