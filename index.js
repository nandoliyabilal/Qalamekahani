console.log('--- [STARTUP DEBUG] ---');
console.log('Time:', new Date().toISOString());
console.log('Current Directory:', process.cwd());

try {
    console.log('Attempting to load backend/server.js...');
    require('./backend/server');
    console.log('Backend loaded successfully.');
} catch (err) {
    console.error('!!! FATAL ERROR DURING REQUIRE !!!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
}
