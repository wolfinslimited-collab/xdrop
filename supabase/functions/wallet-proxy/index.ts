import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WOLFINS_BASE = "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api";

async function sendWithdrawalEmail(
  to: string,
  amount: string,
  toAddress: string,
  fromAddress: string,
  txHash: string
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111111;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 24px 16px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">📤</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Withdrawal Sent</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#888888;">xDrop Wallet Notification</p>
        </td></tr>
        <tr><td style="padding:8px 24px 24px;text-align:center;">
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #222;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Amount</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#ef4444;font-family:'Space Grotesk',monospace;">
              -$${amount}
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#666;">USDC on Solana</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 24px 24px;">
          <table width="100%" style="background:#1a1a1a;border-radius:12px;border:1px solid #222;">
            <tr>
              <td style="padding:14px 16px;border-bottom:1px solid #222;">
                <p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">From</p>
                <p style="margin:4px 0 0;font-size:12px;color:#fff;font-family:monospace;word-break:break-all;">${fromAddress}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 16px;border-bottom:1px solid #222;">
                <p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">To</p>
                <p style="margin:4px 0 0;font-size:12px;color:#fff;font-family:monospace;word-break:break-all;">${toAddress}</p>
              </td>
            </tr>
            ${txHash ? `<tr>
              <td style="padding:14px 16px;">
                <p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Transaction</p>
                <p style="margin:4px 0 0;font-size:12px;color:#fff;font-family:monospace;word-break:break-all;">${txHash}</p>
              </td>
            </tr>` : ""}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 28px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#555;">This is an automated notification from xDrop.<br/>If you didn't initiate this transaction, please contact support immediately.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "xDrop Wallet <wallet@xdrop.one>",
        to: [to],
        subject: `📤 Withdrawal Sent — -$${amount} USDC`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
    } else {
      console.log(`Withdrawal email sent to ${to}`);
    }
  } catch (err) {
    console.error("Failed to send withdrawal email:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userEmail = user.email;

    // Parse request
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Handle get-balance from local DB ──
    if (action === "get-balance") {
      const { data: walletRow } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .eq("currency", "USDC")
        .maybeSingle();

      return new Response(
        JSON.stringify({ balance: String(walletRow?.balance ?? "0") }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Wolfins API request
    const wolfinsParams = new URLSearchParams({ action });
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "action") {
        wolfinsParams.set(key, value);
      }
    }

    const wolfinsUrl = `${WOLFINS_BASE}?${wolfinsParams}`;
    const wolfinsHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: Deno.env.get("WOLFINS_ANON_KEY")!,
      "x-api-key": Deno.env.get("WOLFINS_API_KEY")!,
    };

    let requestBody: Record<string, unknown> | null = null;

    const fetchOptions: RequestInit = {
      method: req.method === "POST" ? "POST" : "GET",
      headers: wolfinsHeaders,
    };

    if (req.method === "POST") {
      requestBody = await req.json();
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const wolfinsRes = await fetch(wolfinsUrl, fetchOptions);
    const data = await wolfinsRes.json();

    // ── Save wallet to local DB on generate ──
    if (action === "generate-user-wallet" && wolfinsRes.ok && data?.address) {
      await supabaseAdmin.from("wallets").upsert(
        {
          user_id: userId,
          address: data.address,
          balance: 0,
          currency: "USDC",
          network: "solana",
          derivation_index: data.derivation_index ?? null,
        },
        { onConflict: "user_id,address", ignoreDuplicates: true }
      );
      console.log(`Saved wallet ${data.address} for user ${userId}`);
    }

    // ── Update local balance on send-transaction ──
    if (
      action === "send-transaction" &&
      wolfinsRes.ok &&
      data?.txId &&
      requestBody
    ) {
      const sendAmount = parseFloat(String(requestBody.amount || "0"));
      if (sendAmount > 0) {
        const { data: walletRow } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("user_id", userId)
          .eq("currency", "USDC")
          .maybeSingle();

        if (walletRow) {
          const newBalance = Math.max(0, walletRow.balance - sendAmount);
          await supabaseAdmin
            .from("wallets")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", walletRow.id);
          console.log(`Deducted ${sendAmount} from wallet ${walletRow.id}, new balance: ${newBalance}`);
        }
      }

      // Send withdrawal email (fire-and-forget)
      if (userEmail) {
        sendWithdrawalEmail(
          userEmail,
          String(requestBody.amount || "0"),
          String(requestBody.toAddress || ""),
          String(requestBody.fromAddress || ""),
          String(data.txId || "")
        ).catch((err) => console.error("Email send error:", err));
      }
    }

    return new Response(JSON.stringify(data), {
      status: wolfinsRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Wallet proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
