import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { device_id } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer <token>

    if (!token || !device_id) {
        return res.status(401).json({ status: 'inactive', message: 'Token ou Device ID ausente.' });
    }

    try {
        // Verificar status no Supabase
        const { data: activation, error: fetchError } = await supabase
            .from('activations')
            .select('*')
            .eq('id', token)
            .single();

        if (fetchError || !activation) {
            return res.status(401).json({ status: 'inactive', message: 'Sessão inválida.' });
        }

        // Verificar se o dispositivo bate
        if (activation.device_id !== device_id) {
            return res.status(403).json({
                status: 'blocked',
                message: 'Acesso negado: Este código pertence a outro dispositivo.'
            });
        }

        return res.status(200).json({
            status: activation.status,
            message: activation.status === 'blocked' ? 'Acesso bloqueado pelo administrador.' : undefined
        });

    } catch (error: any) {
        console.error('Validation Error:', error);
        return res.status(500).json({ error: 'Erro de validação.' });
    }
}
