import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    try {
        const body = await req.json();
        console.log("Recebido do Kiwify:", body);

        const { order_status, customer_email } = body;

        if (order_status === "paid" || order_status === "approved") {
            const activationCode = `KV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const { error } = await supabase
                .from("activations")
                .insert([{
                    code: activationCode,
                    email: customer_email,
                    status: "inactive"
                }]);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, code: activationCode }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true, message: "Ignorado (não aprovado)" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("Erro:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});
