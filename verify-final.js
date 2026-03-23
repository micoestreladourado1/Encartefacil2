const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bmsewmfttznivucbqkaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2V3bWZ0dHpuaXZ1Y2Jxa2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIyOTYsImV4cCI6MjA4OTgzODI5Nn0.waH0hWyUiPVAMvclFsPsLkPkeHNLSwOIHS6tSl9Cgjk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('activations').select('*').order('created_at', { ascending: false }).limit(3);
    console.log('Latest Activations:', JSON.stringify(data, null, 2));
}
check();
