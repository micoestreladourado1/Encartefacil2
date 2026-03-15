import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        let results: string[] = [];

        // --- STEP 1: GOOGLE SCRAPE (LEGACY) ---
        try {
            const googleUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4';
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch&sout=1`;

            const gResp = await fetch(googleUrl, {
                headers: { 'User-Agent': googleUA },
                signal: AbortSignal.timeout(5000)
            });

            if (gResp.ok) {
                const html = await gResp.text();
                const gRegex = /src="(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"]+)"/g;
                let m;
                while ((m = gRegex.exec(html)) !== null && results.length < 20) {
                    if (!results.includes(m[1])) results.push(m[1]);
                }
            }
        } catch (e) {
            console.error('Google Step Failed:', e);
        }

        // --- STEP 2: DUCKDUCKGO FALLBACK (If Google returns nothing or is blocked) ---
        if (results.length < 3) {
            try {
                const ddgUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

                // 1. Get the VQD token
                const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`;
                const tResp = await fetch(tokenUrl, {
                    headers: { 'User-Agent': ddgUA },
                    signal: AbortSignal.timeout(5000)
                });

                const tText = await tResp.text();
                const vqdMatch = tText.match(/vqd=['"](.*?)['"]/);

                if (vqdMatch) {
                    const vqd = vqdMatch[1];
                    // 2. Fetch image JSON using the token
                    const apiUrl = `https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(q)}&vqd=${vqd}`;
                    const aResp = await fetch(apiUrl, {
                        headers: { 'User-Agent': ddgUA },
                        signal: AbortSignal.timeout(5000)
                    });

                    if (aResp.ok) {
                        const data = await aResp.json();
                        if (data.results && Array.isArray(data.results)) {
                            data.results.forEach((item: any) => {
                                if (item.thumbnail && results.length < 50) {
                                    if (!results.includes(item.thumbnail)) results.push(item.thumbnail);
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('DuckDuckGo Step Failed:', e);
            }
        }

        return res.status(200).json({
            results,
            _meta: {
                count: results.length,
                engine: results.length > 0 ? (results[0].includes('gstatic') ? 'google' : 'ddg') : 'none',
                version: '1.6-hybrid'
            }
        });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
