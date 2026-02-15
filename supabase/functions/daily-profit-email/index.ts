import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const adminClient = createClient(supabaseUrl, serviceKey)

    // Get all users who have purchased agents
    const { data: purchases } = await adminClient
      .from('agent_purchases')
      .select('user_id, agent_id, price_paid')

    if (!purchases || purchases.length === 0) {
      return new Response(JSON.stringify({ message: 'No purchases found, no emails sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group purchases by user
    const userPurchases: Record<string, string[]> = {}
    for (const p of purchases) {
      if (!userPurchases[p.user_id]) userPurchases[p.user_id] = []
      userPurchases[p.user_id].push(p.agent_id)
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    let emailsSent = 0

    for (const [userId, agentIds] of Object.entries(userPurchases)) {
      // Get user email from auth
      const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
      if (!user?.email) continue

      // Get user profile
      const { data: profile } = await adminClient
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle()

      // Get agents info
      const { data: agents } = await adminClient
        .from('agents')
        .select('id, name, usdc_earnings, total_runs, reliability_score, avatar')
        .in('id', agentIds)

      if (!agents || agents.length === 0) continue

      // Get runs from last 24h for these agents
      const { data: recentRuns } = await adminClient
        .from('agent_runs')
        .select('agent_id, earnings, status, completed_at')
        .in('agent_id', agentIds)
        .gte('created_at', yesterday)

      // Calculate daily stats
      const dailyEarnings = (recentRuns || [])
        .filter(r => r.status === 'completed' && r.earnings)
        .reduce((sum, r) => sum + Number(r.earnings || 0), 0)

      const dailyRuns = (recentRuns || []).length
      const successfulRuns = (recentRuns || []).filter(r => r.status === 'completed').length

      const totalPortfolioEarnings = agents.reduce((sum, a) => sum + Number(a.usdc_earnings || 0), 0)
      const totalPortfolioRuns = agents.reduce((sum, a) => sum + Number(a.total_runs || 0), 0)

      // Find top performer
      const agentDailyEarnings: Record<string, number> = {}
      for (const run of (recentRuns || [])) {
        if (run.status === 'completed' && run.earnings) {
          agentDailyEarnings[run.agent_id] = (agentDailyEarnings[run.agent_id] || 0) + Number(run.earnings)
        }
      }
      const topAgentId = Object.entries(agentDailyEarnings).sort((a, b) => b[1] - a[1])[0]?.[0]
      const topAgent = agents.find(a => a.id === topAgentId)

      const displayName = profile?.display_name || user.email.split('@')[0]

      // Build email HTML
      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Agent Report</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e5e5;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">x</span><span style="font-size:20px;font-weight:700;color:#a3a3a3;letter-spacing:-0.5px;">Drop</span>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding-bottom:28px;font-size:15px;line-height:1.5;color:#a3a3a3;">
          Hi <span style="color:#ffffff;font-weight:600;">${displayName}</span> — here's your daily summary.
        </td></tr>

        <!-- Daily Earnings Card -->
        <tr><td style="padding-bottom:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:12px;">
            <tr><td style="padding:24px;text-align:center;">
              <div style="font-size:11px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;">Today's Earnings</div>
              <div style="font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1.5px;line-height:1;">$${dailyEarnings.toFixed(2)}</div>
              <div style="font-size:12px;color:#525252;margin-top:6px;">${dailyRuns} run${dailyRuns !== 1 ? 's' : ''} completed</div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Metrics Row -->
        <tr><td style="padding-bottom:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding-right:5px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:10px;">
                  <tr><td style="padding:14px 8px;text-align:center;">
                    <div style="font-size:18px;font-weight:700;color:#ffffff;">${successfulRuns}</div>
                    <div style="font-size:9px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">Success</div>
                  </td></tr>
                </table>
              </td>
              <td width="33%" style="padding:0 3px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:10px;">
                  <tr><td style="padding:14px 8px;text-align:center;">
                    <div style="font-size:18px;font-weight:700;color:#ffffff;">${dailyRuns - successfulRuns}</div>
                    <div style="font-size:9px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">Failed</div>
                  </td></tr>
                </table>
              </td>
              <td width="33%" style="padding-left:5px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:10px;">
                  <tr><td style="padding:14px 8px;text-align:center;">
                    <div style="font-size:18px;font-weight:700;color:#ffffff;">${agents.length}</div>
                    <div style="font-size:9px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">Agents</div>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Portfolio -->
        <tr><td style="padding-bottom:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:12px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#737373;">All-Time Earnings</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;">$${totalPortfolioEarnings.toFixed(2)}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#737373;">Total Runs</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;">${totalPortfolioRuns.toLocaleString()}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#737373;">Active Agents</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;">${agents.length}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        ${topAgent ? `
        <!-- Top Performer -->
        <tr><td style="padding-bottom:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:12px;">
            <tr><td style="padding:20px;">
              <div style="display:inline-block;background-color:#1f1f1f;border-radius:100px;padding:4px 12px;font-size:10px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.8px;">Top Performer</div>
              <div style="font-size:15px;font-weight:600;color:#ffffff;margin-top:10px;">${topAgent.name}</div>
              <div style="font-size:13px;color:#737373;margin-top:2px;">+$${(agentDailyEarnings[topAgentId!] || 0).toFixed(2)} earned today</div>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- CTA -->
        <tr><td align="center" style="padding:8px 0 32px;">
          <a href="https://xdrop.lovable.app/dashboard" style="display:inline-block;background-color:#ffffff;color:#0a0a0a;font-size:13px;font-weight:600;padding:11px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">View Dashboard</a>
        </td></tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:24px;text-align:center;">
          <div style="font-size:11px;color:#404040;line-height:1.7;">
            You're receiving this because you own agents on xDrop.<br>
            &copy; ${new Date().getFullYear()} xDrop
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

      // Send via Resend
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'xDrop <summary@xdrop.one>',
          to: [user.email],
          subject: `Your xDrop Agent Report for ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          html: emailHtml,
        }),
      })

      if (resendRes.ok) {
        emailsSent++
      } else {
        const err = await resendRes.text()
        console.error(`Failed to send email to ${user.email}:`, err)
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Daily profit email error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
