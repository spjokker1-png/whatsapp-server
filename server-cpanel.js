import express from 'express';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR';

let client = null;
let qrCode = null;
let connected = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Middleware
app.use(express.json());

// Function to find Chrome executable in cPanel
async function findChrome() {
    const possiblePaths = [
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/snap/bin/chromium',
        process.env.PUPPETEER_EXECUTABLE_PATH,
        executablePath()
    ];
    
    const fs = await import('fs');
    for (const path of possiblePaths) {
        if (path && fs.existsSync(path)) {
            console.log(`Found Chrome at: ${path}`);
            return path;
        }
    }
    
    console.log('No Chrome found, using default');
    return null;
}

// Initialize WhatsApp with error handling
async function initializeWhatsApp() {
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.error('Max initialization attempts reached. Server will continue without WhatsApp.');
        return;
    }
    
    initializationAttempts++;
    console.log(`Starting WhatsApp (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`);
    
    try {
        const chromePath = await findChrome();
        
        const puppeteerConfig = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                '--disable-component-extensions-with-background-pages',
                '--disable-default-apps',
                '--disable-features=TranslateUI',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-renderer-backgrounding',
                '--disable-sync',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                '--no-first-run',
                '--enable-automation',
                '--password-store=basic',
                '--use-mock-keychain'
            ]
        };
        
        // Use custom Chrome path if found
        if (chromePath) {
            puppeteerConfig.executablePath = chromePath;
        }
        
        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session'
            }),
            puppeteer: puppeteerConfig
        });

        // QR Code event
        client.on('qr', async (qr) => {
            console.log('QR Code received!');
            qrCode = await qrcode.toDataURL(qr);
        });

        // Ready event
        client.on('ready', () => {
            console.log('✅ WhatsApp connected successfully!');
            connected = true;
            qrCode = null;
            initializationAttempts = 0; // Reset on success
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            console.log('WhatsApp disconnected:', reason);
            connected = false;
            qrCode = null;
            
            // Auto-reconnect after 5 seconds
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                initializeWhatsApp();
            }, 5000);
        });

        // Authentication failure
        client.on('auth_failure', (msg) => {
            console.error('Authentication failure:', msg);
            connected = false;
            qrCode = null;
        });

        // Initialize
        await client.initialize();
        
    } catch (error) {
        console.error('WhatsApp initialization error:', error.message);
        
        // Retry after delay
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            console.log('Retrying in 10 seconds...');
            setTimeout(() => initializeWhatsApp(), 10000);
        }
    }
}

// Start WhatsApp initialization
initializeWhatsApp();

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        whatsapp_connected: connected,
        initialization_attempts: initializationAttempts
    });
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
        return res.json({ qr: null, message: 'Already connected', connected: true });
    }
    if (!qrCode) {
        return res.json({ qr: null, message: 'Waiting for QR code...', connected: false });
    }
    res.json({ qr: qrCode, message: 'Scan QR to connect', connected: false });
});

// Status
app.get('/api/status', checkAuth, (req, res) => {
    res.json({
        connected: connected,
        hasQR: qrCode ? true : false,
        client_ready: client !== null,
        initialization_attempts: initializationAttempts
    });
});

// Force reconnect
app.post('/api/reconnect', checkAuth, async (req, res) => {
    try {
        if (client) {
            await client.destroy();
        }
        initializationAttempts = 0;
        await initializeWhatsApp();
        res.json({ success: true, message: 'Reconnection initiated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send message
app.post('/api/send-message', checkAuth, async (req, res) => {
    const { phone, message } = req.body;
    
    if (!connected || !client) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }
    
    try {
        // Format phone number
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        
        // Remove leading 0 if exists
        if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
        }
        
        // Add country code if not present (assuming Pakistan +92)
        if (!formattedPhone.startsWith('92')) {
            formattedPhone = '92' + formattedPhone;
        }
        
        const chatId = formattedPhone + '@c.us';
        await client.sendMessage(chatId, message);
        
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 WhatsApp initialization in progress...`);
});
