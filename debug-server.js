#!/usr/bin/env node

// Simple wrapper to debug WhatsApp server
const http = require('http');
const url = require('url');

const TARGET_URL = 'http://localhost:3002';  // Change to actual port

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    
    // Simple response
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
        connected: false,
        hasQR: false,
        message: 'Debug server running',
        timestamp: new Date().toISOString()
    }));
});

server.listen(3001, () => {
    console.log('Debug server listening on http://localhost:3001');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});
