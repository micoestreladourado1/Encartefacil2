import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        });
    }

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };

    try {
        const body = await req.json();

        // ACTION 1: Kiwify Webhook (Receber venda)
        if (path.endsWith("/webhook") || (!path.includes("activate") && !path.includes("validate"))) {
            const { order_status, customer_email } = body;
            if (order_status === "paid" || order_status === "approved" || body.status === "paid") {
                const activationCode = `KV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                const { error } = await supabase
                    .from("activations")
                    .insert([{ code: activationCode, email: customer_email, status: "inactive" }]);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true, code: activationCode }), { status: 200, headers: corsHeaders });
            }
            return new Response(JSON.stringify({ success: true, message: "Aguardando" }), { status: 200, headers: corsHeaders });
        }

        // ACTION 2: Ativação Mágica (ou por código)
        if (path.includes("activate")) {
            const { code, device_id, email } = body;
            let targetCode = code;

            // Lógica Mágica: Se não tiver código mas tiver e-mail, busca o código inativo do e-mail
            if (!targetCode && email) {
                const { data: act } = await supabase
                    .from("activations")
                    .select("code")
                    .eq("email", email)
                    .eq("status", "inactive")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                if (act) targetCode = act.code;
            }

            if (!targetCode || !device_id) {
                return new Response(JSON.stringify({ status: "error", message: "E-mail não encontrado ou compra ainda não processada." }), { status: 400, headers: corsHeaders });
            }

            const { data: activation } = await supabase.from("activations").select("*").eq("code", targetCode).single();

            if (!activation) return new Response(JSON.stringify({ status: "error", message: "Código inválido." }), { status: 404, headers: corsHeaders });
            if (activation.status === "active" && activation.device_id !== device_id) {
                return new Response(JSON.stringify({ status: "blocked", message: "Código já em uso em outro aparelho." }), { status: 403, headers: corsHeaders });
            }

            const { error: upError } = await supabase.from("activations").update({
                device_id,
                email: email || activation.email,
                status: "active",
                activated_at: new Date().toISOString()
            }).eq("code", targetCode);

            if (upError) throw upError;
            return new Response(JSON.stringify({ status: "active", token: activation.id, message: "Ativado!" }), { status: 200, headers: corsHeaders });
        }

        // ACTION 3: Validação de Status
        if (path.includes("validate")) {
            const { device_id } = body;
            const auth = req.headers.get("authorization");
            const token = auth?.split(" ")[1];
            if (!token || !device_id) return new Response(JSON.stringify({ status: "inactive" }), { status: 401, headers: corsHeaders });

            const { data: activation } = await supabase.from("activations").select("*").eq("id", token).single();
            if (!activation || activation.device_id !== device_id) return new Response(JSON.stringify({ status: "inactive" }), { status: 401, headers: corsHeaders });

            return new Response(JSON.stringify({ status: activation.status }), { status: 200, headers: corsHeaders });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders });
});
