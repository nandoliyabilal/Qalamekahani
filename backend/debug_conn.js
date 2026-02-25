const https = require('https');

const options = {
    hostname: 'irtsycfpwsjxrodwpthw.supabase.co',
    port: 443,
    path: '/',
    method: 'GET',
    timeout: 10000
};

console.log('Starting request to Supabase...');

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.on('timeout', () => {
    console.error('Request Timed Out');
    req.destroy();
});

req.end();
