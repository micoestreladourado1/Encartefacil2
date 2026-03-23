import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.URL_SUPABASE || '';
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

    const { code, device_id, email } = req.body;

    if (!code || !device_id) {
        return res.status(400).json({ error: 'Code and device_id are required' });
    }

    try {
        // 1. Verificar se o código existe e está disponível
        const { data: activation, error: fetchError } = await supabase
            .from('activations')
            .select('*')
            .eq('code', code)
            .single();

        if (fetchError || !activation) {
            return res.status(404).json({ status: 'error', message: 'Código de ativação inválido.' });
        }

        // 2. Se já estiver ativo em outro dispositivo
        if (activation.status === 'active' && activation.device_id !== device_id) {
            return res.status(403).json({
                status: 'blocked',
                message: 'Este código já está em uso em outro aparelho.'
            });
        }

        // 3. Se estiver bloqueado
        if (activation.status === 'blocked') {
            return res.status(403).json({
                status: 'blocked',
                message: 'Este código foi bloqueado. Entre em contato com o suporte.'
            });
        }

        // 4. Se for a primeira ativação ou re-ativação no mesmo aparelho
        const { error: updateError } = await supabase
            .from('activations')
            .update({
                device_id,
                email: email || activation.email,
                status: 'active',
                activated_at: new Date().toISOString()
            })
            .eq('code', code);

        if (updateError) {
            throw updateError;
        }

        return res.status(200).json({
            status: 'active',
            token: activation.id, // Usamos o ID da linha como token simples
            message: 'Aplicativo ativado com sucesso!'
        });

    } catch (error: any) {
        console.error('Activation Error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor de ativação.' });
    }
}
