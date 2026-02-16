import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { action, email, code } = await req.json();

    if (action === "send") {
      if (!email) throw new Error("Email is required");

      const verificationCode = generateCode();

      // Delete any previous codes for this email
      await supabase
        .from("email_verification_codes")
        .delete()
        .eq("email", email.toLowerCase());

      // Insert new code
      const { error: insertError } = await supabase
        .from("email_verification_codes")
        .insert({
          email: email.toLowerCase(),
          code: verificationCode,
        });

      if (insertError) throw new Error("Failed to save verification code");

      // Send email via Resend
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "XDROP <verification@xdrop.one>",
          to: [email],
          subject: "Your XDROP Verification Code",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; text-align: center;">
              <h1 style="font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">XDROP</h1>
              <p style="color: #888; font-size: 14px; margin-bottom: 32px;">Verify your email address</p>
              <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
                <p style="color: #888; font-size: 13px; margin: 0 0 16px 0;">Your verification code is:</p>
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #ffffff; font-family: 'SF Mono', 'Fira Code', monospace;">${verificationCode}</div>
              </div>
              <p style="color: #666; font-size: 12px;">This code expires in 10 minutes.<br/>If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error("Resend error:", errBody);
        throw new Error("Failed to send verification email");
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!email || !code) throw new Error("Email and code are required");

      const { data, error } = await supabase
        .from("email_verification_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("code", code)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ verified: false, error: "Invalid or expired code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Mark as verified
      await supabase
        .from("email_verification_codes")
        .update({ verified: true })
        .eq("id", data.id);

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("email-verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
