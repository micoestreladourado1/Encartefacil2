const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmsewmfttznivucbqkaz.supabase.co';
// CHAVE SERVICE ROLE (EXCLUSIVA PARA O ANTIGRAVITY USAR AGORA)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2V3bWZ0dHpuaXZ1Y2Jxa2F6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2MzU2MiwiZXhwIjoyMDg5ODM5NTYyfQ.c7u1J2W8fX_7M-R-W-P-L-P-Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTest() {
    const email = 'encartespro@gmail.com';
    const code = 'KV-MAGIC-TEST';

    console.log(`Inserindo venda de teste para: ${email}`);

    // Primeiro limpamos testes antigos com esse e-mail se houver
    await supabase.from('activations').delete().eq('email', email);

    const { data, error } = await supabase
        .from('activations')
        .insert([{
            code: code,
            email: email,
            status: 'inactive'
        }]);

    if (error) {
        console.error('Erro ao inserir:', error.message);
    } else {
        console.log('SUCESSO! Venda de teste pronta para o e-mail:', email);
    }
}

insertTest();
