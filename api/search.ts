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

    const finalResults = new Set<string>();
    const debug: any[] = [];

    // --- ENGINE 1: BING (Very stable for scraping) ---
    try {
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`;
        const bResp = await fetch(bingUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' }
        });
        if (bResp.ok) {
            const html = await bResp.text();
            // Bing stores image metadata in murl="URL"
            const murlRegex = /murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;/g;
            let m;
            while ((m = murlRegex.exec(html)) !== null && finalResults.size < 30) {
                finalResults.add(m[1]);
            }
            debug.push({ engine: 'bing', count: finalResults.size });
        }
    } catch (e: any) {
        debug.push({ engine: 'bing', error: e.message });
    }

    // --- ENGINE 2: GOOGLE (Legacy Fallback) ---
    if (finalResults.size < 5) {
        try {
            const gUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch&sout=1`;
            const gResp = await fetch(gUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4' }
            });
            if (gResp.ok) {
                const html = await gResp.text();
                const gRegex = /src="(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"]+)"/g;
                let m;
                while ((m = gRegex.exec(html)) !== null && finalResults.size < 50) {
                    finalResults.add(m[1]);
                }
                debug.push({ engine: 'google', count: finalResults.size });
            }
        } catch (e: any) {
            debug.push({ engine: 'google', error: e.message });
        }
    }

    const results = Array.from(finalResults);

    return res.status(200).json({
        results: results.slice(0, 50),
        _meta: {
            count: results.length,
            engines: debug,
            version: '1.7-multi'
        }
    });
}
