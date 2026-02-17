import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-event, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendWalletEmail(
  to: string,
  event: "deposit" | "withdrawal",
  amount: string,
  chain: string,
  txHash: string,
  address: string
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const isDeposit = event === "deposit";
  const emoji = isDeposit ? "💰" : "📤";
  const action = isDeposit ? "Deposit Received" : "Withdrawal Sent";
  const color = isDeposit ? "#10b981" : "#ef4444";
  const sign = isDeposit ? "+" : "-";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111111;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 24px 16px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">${emoji}</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${action}</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#888888;">xDrop Wallet Notification</p>
        </td></tr>

        <!-- Amount -->
        <tr><td style="padding:8px 24px 24px;text-align:center;">
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #222;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Amount</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:${color};font-family:'Space Grotesk',monospace;">
              ${sign}$${amount}
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#666;">USDC on ${chain}</p>
          </div>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:0 24px 24px;">
          <table width="100%" style="background:#1a1a1a;border-radius:12px;border:1px solid #222;">
            <tr>
              <td style="padding:14px 16px;border-bottom:1px solid #222;">
                <p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Network</p>
                <p style="margin:4px 0 0;font-size:14px;color:#fff;">Solana</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 16px;border-bottom:1px solid #222;">
                <p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Wallet</p>
                <p style="margin:4px 0 0;font-size:12px;color:#fff;font-family:monospace;word-break:break-all;">${address}</p>
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

        <!-- Footer -->
        <tr><td style="padding:0 24px 28px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#555;">This is an automated notification from xDrop.<br/>If you didn't expect this transaction, please contact support.</p>
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
        subject: `${emoji} ${action} — ${sign}$${amount} USDC`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend email error:", err);
    } else {
      console.log(`Email sent to ${to} for ${event}`);
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const signature = req.headers.get("x-webhook-signature");
    const event = req.headers.get("x-webhook-event") || "unknown";
    const rawBody = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC-SHA256 signature
    const webhookSecret = Deno.env.get("WOLFINS_WEBHOOK_SECRET");
    if (webhookSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const expected = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expected !== signature) {
        console.error("Webhook signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const { data } = payload;

    console.log(`Webhook received: ${event}`, JSON.stringify(data));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event === "deposit" || event === "withdrawal") {
      const address = event === "deposit" ? data.to_address : data.from_address;
      const chain = data.chain;
      const amount = parseFloat(data.amount || "0");

      // Find the wallet by address
      const { data: walletRow, error: walletErr } = await supabase
        .from("wallets")
        .select("id, user_id, balance, currency")
        .eq("address", address)
        .maybeSingle();

      if (walletErr) {
        console.error("Error looking up wallet:", walletErr);
      }

      if (walletRow) {
        // Update balance
        const newBalance = event === "deposit"
          ? walletRow.balance + amount
          : Math.max(0, walletRow.balance - amount);

        await supabase
          .from("wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", walletRow.id);

        console.log(`Updated wallet ${walletRow.id} balance: ${walletRow.balance} -> ${newBalance}`);

        // Send email notification to user
        const { data: userData } = await supabase.auth.admin.getUserById(walletRow.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          await sendWalletEmail(
            userEmail,
            event as "deposit" | "withdrawal",
            data.amount || "0",
            chain || "SOL",
            data.tx_hash || "",
            address
          );
        }
      } else {
        console.log(`No wallet found for address ${address} on chain ${chain}`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event, timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
