const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const https = require('https');

// Custom fetch to bypass local DNS poison/block - DISABLED BY DEFAULT to prevent hangs
const isBypassNeeded = false; // Set to false manually if DNS is working

const customFetch = (url, options = {}) => {
    // Standard secure fetch (Default)
    if (!isBypassNeeded) {
        return fetch(url, options);
    }

    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        // Manual resolution to bypass broken local DNS
        const targetIp = '104.18.38.10';

        const normalizedHeaders = {};
        if (options.headers) {
            if (typeof options.headers.forEach === 'function') {
                options.headers.forEach((v, k) => normalizedHeaders[k] = v);
            } else {
                Object.assign(normalizedHeaders, options.headers);
            }
        }
        normalizedHeaders['Host'] = urlObj.hostname;

        const requestOptions = {
            hostname: targetIp,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: normalizedHeaders,
            servername: urlObj.hostname, // Required for SSL/SNI to match
            timeout: 15000
        };

        const req = https.request(requestOptions, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: async () => JSON.parse(body),
                    text: async () => body,
                    headers: {
                        get: (name) => res.headers[name.toLowerCase()]
                    }
                });
            });
        });

        req.on('error', (err) => {
            console.error('Direct IP Fetch Error:', err.message);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Direct IP Timeout'));
        });

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: customFetch
    }
});

module.exports = supabase;
