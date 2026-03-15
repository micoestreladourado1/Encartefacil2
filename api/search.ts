import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = new Set<string>();
    const engines: string[] = [];

    try {
        // ENGINE: Bing (Desktop) - Very robust for scraping
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&first=1`;
        const bResp = await fetch(bingUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36' }
        });

        if (bResp.ok) {
            const html = await bResp.text();
            // Padrão do Bing: URLs de imagem originais estão em murl":"..."
            const murlRegex = /murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;/g;
            let m;
            while ((m = murlRegex.exec(html)) !== null && results.size < 40) {
                results.add(m[1]);
            }
            if (results.size > 0) engines.push('bing');
        }

        // FALLBACK: Google Legacy
        if (results.size < 5) {
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch&sout=1`;
            const gResp = await fetch(googleUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4' }
            });
            if (gResp.ok) {
                const html = await gResp.text();
                const gRegex = /src="(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"]+)"/g;
                let m;
                while ((m = gRegex.exec(html)) !== null && results.size < 60) {
                    results.add(m[1]);
                }
                if (results.size > 0) engines.push('google');
            }
        }

        return res.status(200).json({
            results: Array.from(results),
            _v: '1.8-final',
            _q: q,
            _e: engines
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message, _v: '1.8-err' });
    }
}
