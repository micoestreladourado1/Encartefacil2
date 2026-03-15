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
        const legacyUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4';
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch&sout=1`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': legacyUA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const html = await response.text();
        const urls: string[] = [];

        // Pattern 1: Match encrypted thumbnails
        const imgRegex = /<img[^>]+src="(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"]+)"/g;
        let match;
        while ((match = imgRegex.exec(html)) !== null && urls.length < 50) {
            const url = match[1];
            if (!urls.includes(url)) urls.push(url);
        }

        // Pattern 2: Fallback for other gstatic urls or simple src
        if (urls.length === 0) {
            const broadRegex = /src="([^">]+gstatic.com\/images\?q=[^">]+)"/g;
            while ((match = broadRegex.exec(html)) !== null && urls.length < 30) {
                const url = match[1];
                if (!urls.includes(url)) urls.push(url);
            }
        }

        return res.status(200).json({
            results: urls,
            _debug_info: urls.length === 0 ? {
                html_start: html.substring(0, 1000),
                content_length: html.length,
                status: response.status
            } : undefined
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
