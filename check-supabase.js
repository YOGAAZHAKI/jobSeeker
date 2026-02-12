import https from 'https';

const url = 'https://anpamecirtwweumelxph.supabase.co';

console.log(`Checking connection to ${url}...`);

const req = https.get(url, (res) => {
    console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);

    res.on('data', (d) => {
        // Just consume data
    });
});

req.on('error', (e) => {
    console.error('Connection error:', e);
});

req.end();
