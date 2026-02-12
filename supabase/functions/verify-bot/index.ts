import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("Not authenticated");

    const { botId, apiKey, apiEndpoint } = await req.json();

    if (!botId) throw new Error("Missing bot ID");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the bot
    const { data: bot, error: botError } = await serviceClient
      .from("social_bots")
      .select("*")
      .eq("id", botId)
      .eq("owner_id", user.id)
      .single();

    if (botError || !bot) throw new Error("Bot not found or not owned by you");

    // If API endpoint is provided, try to verify it
    let verified = false;
    let verificationMessage = "No API endpoint provided";

    if (apiEndpoint) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "verify",
            platform: "xdrop",
            bot_id: botId,
          }),
        });

        if (response.ok) {
          verified = true;
          verificationMessage = "API endpoint verified successfully";
        } else {
          verificationMessage = `API returned status ${response.status}`;
        }
      } catch (fetchErr: any) {
        verificationMessage = `Could not reach endpoint: ${fetchErr.message}`;
      }
    }

    // Update bot status
    const newStatus = verified ? "active" : "pending";
    const { error: updateError } = await serviceClient
      .from("social_bots")
      .update({
        verified,
        status: newStatus,
        api_key: apiKey || null,
        api_endpoint: apiEndpoint || null,
      })
      .eq("id", botId);

    if (updateError) throw new Error("Failed to update bot: " + updateError.message);

    return new Response(JSON.stringify({
      success: true,
      verified,
      status: newStatus,
      message: verificationMessage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
