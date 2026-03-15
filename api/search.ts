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
        // Modern Desktop UA to get the full JS payload (which we can then scrape as string)
        const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

        // Remove sout=1 and use modern search if legacy fails
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': desktopUA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/'
            }
        });

        const html = await response.text();
        const urlsSet = new Set<string>();

        // Brute Force Pattern 1: Look for encrypted thumbnails anywhere in the source (common in JS payloads)
        const bruteTbnRegex = /https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=tbn:[^"'\s\\]+/g;
        let tbnMatches = html.match(bruteTbnRegex);
        if (tbnMatches) {
            tbnMatches.forEach(url => {
                // Clean up common URL escapes in JS strings
                const cleanUrl = url.replace(/\\u003d/g, '=').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
                if (urlsSet.size < 60) urlsSet.add(cleanUrl);
            });
        }

        // Brute Force Pattern 2: Look for direct image links in the AF_initDataCallback arrays
        // These URLs often end in jpg/png/etc and are inside quotes
        const directImgRegex = /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^"]+)?)",\d+,\d+/g;
        let directMatch;
        while ((directMatch = directImgRegex.exec(html)) !== null && urlsSet.size < 80) {
            const url = directMatch[1];
            if (!url.includes('google') || url.includes('gstatic')) {
                urlsSet.add(url.replace(/\\u003d/g, '=').replace(/\\u0026/g, '&').replace(/&amp;/g, '&'));
            }
        }

        const results = Array.from(urlsSet);

        // Final Fallback: if still empty, try the old mobile scraping one last time
        if (results.length === 0) {
            return res.status(200).json({
                results: [],
                _meta: {
                    error: 'No images found in v1.5 brute force',
                    length: html.length,
                    snippet: html.substring(0, 500)
                }
            });
        }

        return res.status(200).json({
            results: results.slice(0, 50),
            _meta: {
                count: results.length,
                query: q,
                version: '1.5'
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
