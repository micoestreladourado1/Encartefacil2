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
        // Updated UA to iPhone 11 (more modern but still gets legacy HTML with sout=1)
        const modernMobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch&sout=1`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': modernMobileUA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/'
            }
        });

        if (!response.ok) {
            throw new Error(`Google returned status ${response.status}`);
        }

        const html = await response.text();
        const urls: string[] = [];

        // Pattern 1: Match encrypted thumbnails with or without quotes
        // Matches: src="https://..." OR src='https://...' OR src=https://...
        const imgPatterns = [
            /src=['"]?(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^'"\s>]+)/g,
            /src=['"]?(https?:\/\/[^'"\s>]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^'"\s>]+)?)['"]?/g,
            /["'](https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"']+)["']/g
        ];

        imgPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null && urls.length < 40) {
                const url = match[1];
                // Clean up any trailing characters if regex was too broad
                const cleanUrl = url.split('"')[0].split("'")[0].split('\\')[0];
                if (cleanUrl.startsWith('http') && !urls.includes(cleanUrl)) {
                    if (!cleanUrl.includes('favicon') && !cleanUrl.includes('logo')) {
                        urls.push(cleanUrl);
                    }
                }
            }
        });

        // Debug: if no results, check if we got a "Blocked" page
        if (urls.length === 0 && html.length < 2000) {
            console.error('Possible blocking detected. HTML Length:', html.length);
            // If the HTML is very short, it might be a robot check
            if (html.includes('detected unusual traffic')) {
                return res.status(429).json({ error: 'Blocked by Google (Unusual Traffic)', results: [] });
            }
        }

        return res.status(200).json({
            results: urls,
            _meta: {
                count: urls.length,
                query: q,
                version: '1.3'
            }
        });
    } catch (error: any) {
        console.error('Search Proxy v13 Error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch images (v13)', details: error.message });
    }
}
