import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Definir CORS para permitir requisições do App Mobile
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        // User-Agent de um navegador móvel real para evitar bloqueios
        const mobileUA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36';

        // URL da busca de imagens do Google com parâmetros de estabilidade
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch&udm=2`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': mobileUA,
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            throw new Error(`Google search returned status ${response.status}`);
        }

        const html = await response.text();
        const urls: string[] = [];

        // Padrão 1: Tags de imagem clássicas
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = imgRegex.exec(html)) !== null && urls.length < 30) {
            const url = match[1];
            if (url.startsWith('http') && !url.includes('favicon') && !url.includes('menu_icon')) {
                if (!urls.includes(url)) urls.push(url);
            }
        }

        // Padrão 2: Fallback para data-src ou miniaturas gstatic
        const dataSrcRegex = /data-src="([^">]+)"/g;
        while ((match = dataSrcRegex.exec(html)) !== null && urls.length < 50) {
            const url = match[1];
            if (url.startsWith('http') && !urls.includes(url)) {
                urls.push(url);
            }
        }

        const thumbRegex = /"(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"]+)"/g;
        let tMatch;
        while ((tMatch = thumbRegex.exec(html)) !== null && urls.length < 60) {
            const url = tMatch[1];
            if (!urls.includes(url)) urls.push(url);
        }

        return res.status(200).json({ results: urls });
    } catch (error: any) {
        console.error('Search Proxy Error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch images', details: error.message });
    }
}
