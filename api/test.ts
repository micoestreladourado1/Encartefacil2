import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({
        status: 'online',
        time: new Date().toISOString(),
        version: 'check-1'
    });
}
