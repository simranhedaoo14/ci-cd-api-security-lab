const express = require('express');
const { URL } = require('url');
const net = require('net');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

function isPrivateOrLocalAddress(hostname) {
    const ipVersion = net.isIP(hostname);

    // Resolve obvious local hostnames
    const blockedHostnames = [
        'localhost',
        'localhost.localdomain'
    ];

    if (blockedHostnames.includes(hostname.toLowerCase())) {
        return true;
    }

    // For IP literals, block loopback/private/link-local ranges
    if (ipVersion === 4) {
        const parts = hostname.split('.').map(Number);

        return (
            parts[0] === 127 ||                         // Loopback
            parts[0] === 10 ||                          // 10.0.0.0/8
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
            (parts[0] === 192 && parts[1] === 168) ||   // 192.168.0.0/16
            (parts[0] === 169 && parts[1] === 254)      // Link-local
        );
    }

    if (ipVersion === 6) {
        return (
            hostname === '::1' ||
            hostname.toLowerCase().startsWith('fc') ||
            hostname.toLowerCase().startsWith('fd') ||
            hostname.toLowerCase().startsWith('fe80:')
        );
    }

    return false;
}

router.post('/fetch-url', authenticateToken, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            error: 'URL is required'
        });
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch {
        return res.status(400).json({
            error: 'Invalid URL'
        });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({
            error: 'Only HTTP and HTTPS URLs are allowed'
        });
    }

    if (isPrivateOrLocalAddress(parsedUrl.hostname)) {
        return res.status(403).json({
            error: 'Requests to private or local addresses are not allowed'
        });
    }

    try {
        const response = await fetch(parsedUrl.toString(), {
            redirect: 'error'
        });

        const body = await response.text();

        res.json({
            status: response.status,
            content: body.substring(0, 2000)
        });
    } catch (error) {
        res.status(502).json({
            error: 'Unable to fetch the requested resource'
        });
    }
});

module.exports = router;