import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateCode() {
    // Gera um código único de 10 caracteres (ex: KV-A1B2C3D4)
    return `KV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Habilitar CORS para evitar problemas (opcional para webhooks mas boa prática)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { order_status, customer_email, customer_name, product_name } = req.body;

    console.log(`Recebido Webhook Kiwify: ${customer_email} - Status: ${order_status}`);

    // Kiwify statuses para venda confirmada: 'paid' ou 'approved'
    if (order_status !== 'paid' && order_status !== 'approved') {
        return res.status(200).json({ message: `Status ${order_status} ignorado.` });
    }

    if (!customer_email) {
        return res.status(400).json({ error: 'customer_email não fornecido.' });
    }

    try {
        const activationCode = generateCode();

        // Salvar no Supabase
        const { error } = await supabase
            .from('activations')
            .insert([
                {
                    code: activationCode,
                    email: customer_email,
                    status: 'inactive'
                }
            ]);

        if (error) throw error;

        console.log(`Sucesso: Código ${activationCode} gerado para ${customer_email}`);

        return res.status(200).json({
            success: true,
            message: 'Código gerado e salvo!',
            code: activationCode
        });

    } catch (error: any) {
        console.error('Kiwify Webhook Error:', error);
        return res.status(500).json({ error: 'Erro interno ao processar webhook.' });
    }
}
