import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Read API key from environment for simple auth between PHP proxy and Node
const API_KEY = process.env.API_KEY || 'aFmMZeEzwdvtUbljVXNs3Co49TJBfL2OWPnYkGqR';

const PORT = process.env.PORT || 3001;
let client = null;
let isConnected = false;
let currentQRCode = null;
let lastState = 'unknown';
let initializing = false;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Logger helper
const log = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        'info': '📱',
        'success': '✅',
        'error': '❌',
        'warn': '⚠️'
    }[type] || '📱';
    console.log(`[${timestamp}] ${prefix} ${msg}`);
};

// Messages file
const messagesFile = path.join(__dirname, 'messages.json');
const getMessages = () => {
    if (fs.existsSync(messagesFile)) {
        try {
            return JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
        } catch (e) {
            return [];
        }
    }
    return [];
};

const saveMessage = (msg) => {
    const messages = getMessages();
    messages.push({ ...msg, timestamp: new Date().toISOString() });
    // صرف آخری 100 messages رکھیں
    const recentMessages = messages.slice(-100);
    fs.writeFileSync(messagesFile, JSON.stringify(recentMessages, null, 2));
};

// Initialize WhatsApp Client
function initWhatsApp() {
    try {
        log('Creating WhatsApp client...', 'info');
        // Avoid creating multiple clients simultaneously
        if (initializing) {
            log('Initialization already in progress, skipping duplicate init', 'warn');
            return;
        }
        initializing = true;

        if (client && typeof client.initialize === 'function') {
            // Try to re-use existing client instance
            log('Re-using existing client instance and calling initialize()', 'info');
            client.initialize().catch(err => {
                log('Re-initialize error: ' + err.message, 'error');
                // If re-init fails, create a fresh client after a delay
                setTimeout(() => {
                    initializing = false;
                    initWhatsApp();
                }, 5000);
            });
            initializing = false;
            return;
        }

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'default'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process'
                ]
            }
        });

        // QR Code Event
        client.on('qr', async (qr) => {
            try {
                currentQRCode = await qrcode.toDataURL(qr);
                log('QR Code Generated - Scan to connect', 'info');
            } catch (err) {
                log('QR Code generation error: ' + err.message, 'error');
            }
        });

        // Ready Event
        client.on('ready', () => {
            isConnected = true;
            lastState = 'ready';
            currentQRCode = null;
            log('WhatsApp Connected Successfully!', 'success');
        });

        // Disconnected Event
        client.on('disconnected', (reason) => {
            isConnected = false;
            lastState = 'disconnected';
            currentQRCode = null;
            log(`WhatsApp Disconnected: ${reason}`, 'warn');
            // Try to re-use the same client instance first (safer, keeps LocalAuth files intact)
            setTimeout(() => {
                try {
                    if (client && typeof client.initialize === 'function') {
                        log('Attempting client.initialize() after disconnect', 'info');
                        client.initialize().catch(err => {
                            log('client.initialize() failed: ' + err.message, 'error');
                            // fallback to full re-init
                            setTimeout(() => initWhatsApp(), 5000);
                        });
                    } else {
                        log('Client instance not usable, calling initWhatsApp()', 'info');
                        initWhatsApp();
                    }
                } catch (e) {
                    log('Reconnect attempt error: ' + e.message, 'error');
                    setTimeout(() => initWhatsApp(), 5000);
                }
            }, 5000);
        });

        // Auth Failure
        client.on('auth_failure', (msg) => {
            isConnected = false;
            lastState = 'auth_failure';
            currentQRCode = null;
            log('Authentication Failed: ' + msg, 'error');
            // Try a re-initialize after a short delay — do not delete auth files here
            setTimeout(() => {
                try {
                    if (client && typeof client.initialize === 'function') {
                        client.initialize().catch(err => log('Re-init after auth failure failed: ' + err.message, 'error'));
                    } else {
                        initWhatsApp();
                    }
                } catch (e) {
                    log('Error during auth_failure handling: ' + e.message, 'error');
                }
            }, 10000);
        });

        // Authenticated Event
        client.on('authenticated', () => {
            isConnected = true;
            lastState = 'authenticated';
            currentQRCode = null;
            log('Client authenticated', 'success');
        });

        // Change state (some internal state changes may be exposed here)
        try {
            client.on('change_state', (state) => {
                try {
                    lastState = state;
                    log('Client state changed: ' + state, 'info');
                    const st = String(state).toLowerCase();
                    if (st.indexOf('unpaired') !== -1 || st.indexOf('disconnected') !== -1 || st.indexOf('failed') !== -1) {
                        isConnected = false;
                    }
                    if (st.indexOf('connected') !== -1 || st.indexOf('ready') !== -1 || st.indexOf('authenticated') !== -1) {
                        isConnected = true;
                    }
                } catch (e) {
                    log('Error in change_state handler: ' + e.message, 'error');
                }
            });
        } catch (e) {
            // Not all versions of whatsapp-web.js emit change_state; ignore if not present
        }

        // Error Event
        client.on('error', (err) => {
            log('Client Error: ' + (err && err.message ? err.message : String(err)), 'error');
        });

        // Initialize client
        log('Initializing client...', 'info');
        client.initialize().catch(err => {
            log('Initialize error: ' + err.message, 'error');
        }).finally(() => {
            initializing = false;
        });

    } catch (err) {
        log('Init Error: ' + err.message, 'error');
        initializing = false;
        setTimeout(() => initWhatsApp(), 5000);
    }
}

// API Routes

// Health check (public, no auth needed)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', connected: isConnected });
});

// API Key Middleware for protected routes
const requireApiKey = (req, res, next) => {
    if (API_KEY) {
        const key = req.headers['x-api-key'] || req.query['api_key'];
        if (!key || String(key) !== String(API_KEY)) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
    }
    next();
};

// 1. Status Check (protected)
app.get('/api/status', requireApiKey, (req, res) => {
    log('Status request received', 'info');
    try {
        const response = {
            connected: isConnected,
            hasQR: currentQRCode ? true : false,
            state: lastState,
            timestamp: new Date().toISOString()
        };
        log('Sending status response: ' + JSON.stringify(response), 'info');
        res.json(response);
    } catch(err) {
        log('Status error: ' + err.message, 'error');
        res.status(500).json({ error: err.message });
    }
});

// 2. Get QR Code (protected)
app.get('/api/qr-code', requireApiKey, (req, res) => {
    if (!currentQRCode) {
        return res.json({
            qr: null,
            message: isConnected ? 'Already connected' : 'Initializing...'
        });
    }
    res.json({ qr: currentQRCode });
});

// 3. Send Message (protected)
app.post('/api/send-message', requireApiKey, async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({
            success: false,
            message: 'Phone and message required'
        });
    }

    if (!isConnected) {
        return res.status(400).json({
            success: false,
            error: 'WhatsApp not connected',
            state: lastState
        });
    }

    try {
        const chatId = phone.replace(/[^0-9]/g, '') + '@c.us';
        
        await client.sendMessage(chatId, message);
        
        saveMessage({
            phone: phone.replace(/[^0-9]/g, ''),
            message: message,
            status: 'sent',
            type: 'user-message'
        });

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        log('Send Error: ' + (err && err.message ? err.message : String(err)), 'error');
        res.status(500).json({ success: false, error: (err && err.message ? err.message : String(err)) });
    }
});

// 4. Send Bulk Messages (protected)
app.post('/api/send-bulk', requireApiKey, async (req, res) => {
    const { messages: msgList } = req.body;

    if (!Array.isArray(msgList) || msgList.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Messages array required'
        });
    }

    if (!isConnected) {
        return res.status(400).json({
            success: false,
            message: 'WhatsApp not connected'
        });
    }

    const results = [];

    for (const { phone, message } of msgList) {
        try {
            const chatId = phone.replace(/[^0-9]/g, '') + '@c.us';
            
            await client.sendMessage(chatId, message);
            
            saveMessage({
                phone: phone.replace(/[^0-9]/g, ''),
                message: message,
                status: 'sent',
                type: 'bulk-message'
            });
            
            results.push({ phone, success: true });
            
            // Delay 2 seconds between messages
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            results.push({ phone, success: false, error: err.message });
        }
    }

    res.json({ success: true, results });
});

// 5. Get Message Logs (protected)
app.get('/api/message-logs', requireApiKey, (req, res) => {
    const messages = getMessages();
    res.json({ messages });
});

// 6. Disconnect WhatsApp (protected)
app.post('/api/disconnect', requireApiKey, async (req, res) => {
    try {
        if (client) {
            await client.destroy();
            isConnected = false;
            currentQRCode = null;
            res.json({ success: true, message: 'Disconnected' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler middleware
app.use((err, req, res, next) => {
    log('Express error: ' + err.message, 'error');
    res.status(500).json({ error: err.message });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    log('Uncaught Exception: ' + err.message + ' ' + err.stack, 'error');
});

// Initialize and start
log('Initializing WhatsApp...', 'info');
initWhatsApp();

const server = app.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`, 'success');
    log('Waiting for WhatsApp connection...', 'info');
});

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
    log('Uncaught Exception: ' + err.message, 'error');
    log(err.stack, 'error');
    // Don't exit, try to keep running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    log('Unhandled Rejection at: ' + JSON.stringify(promise) + ' reason: ' + reason, 'error');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    log('Shutting down...', 'warn');
    if (client) {
        try {
            await client.destroy();
        } catch(err) {
            log('Error destroying client: ' + err.message, 'error');
        }
    }
    server.close(() => {
        log('Server closed', 'info');
        process.exit(0);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
        log('Force exiting...', 'warn');
        process.exit(1);
    }, 5000);
});
