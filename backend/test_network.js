async function test() {
    const urls = [
        'https://www.google.com',
        'https://github.com',
        'https://api.github.com',
        'https://irtsycfpwsjxrodwpthw.supabase.co'
    ];
    for (const url of urls) {
        try {
            const start = Date.now();
            const res = await fetch(url, { method: 'HEAD' });
            console.log(`${url}: Status ${res.status} (${Date.now() - start}ms)`);
        } catch (e) {
            console.error(`${url}: Fetch error: ${e.message}`);
        }
    }
}
test();
