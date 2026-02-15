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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e5e5e5; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1a1a1a; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 700; color: #00e5ff; letter-spacing: -0.5px; }
    .greeting { font-size: 15px; color: #a3a3a3; margin-top: 8px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 16px; text-align: center; }
    .stat-card.highlight { border-color: #00e5ff33; background: #00e5ff08; }
    .stat-value { font-size: 24px; font-weight: 700; color: #fff; }
    .stat-value.green { color: #22c55e; }
    .stat-label { font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .section-title { font-size: 12px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .top-performer { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .top-badge { background: #00e5ff15; color: #00e5ff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .agent-name { font-size: 14px; font-weight: 600; color: #fff; }
    .agent-earnings { font-size: 13px; color: #22c55e; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid #1a1a1a; }
    .footer-text { font-size: 11px; color: #525252; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ xDrop Daily Report</div>
      <div class="greeting">Hey ${displayName}, here's your portfolio summary</div>
    </div>

    <div class="section-title">Today's Performance</div>
    <div class="stat-grid">
      <div class="stat-card highlight">
        <div class="stat-value green">$${dailyEarnings.toFixed(2)}</div>
        <div class="stat-label">Daily Profit</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${dailyRuns}</div>
        <div class="stat-label">Runs Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${successfulRuns}</div>
        <div class="stat-label">Successful</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${agents.length}</div>
        <div class="stat-label">Active Agents</div>
      </div>
    </div>

    <div class="section-title">Portfolio Totals</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value green">$${totalPortfolioEarnings.toFixed(2)}</div>
        <div class="stat-label">All-Time Earnings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalPortfolioRuns.toLocaleString()}</div>
        <div class="stat-label">Total Runs</div>
      </div>
    </div>

    ${topAgent ? `
    <div class="section-title">Top Performer</div>
    <div class="top-performer">
      <div>
        <div class="top-badge">🏆 Best Today</div>
        <div class="agent-name" style="margin-top: 6px">${topAgent.name}</div>
        <div class="agent-earnings">+$${(agentDailyEarnings[topAgentId!] || 0).toFixed(2)} USDC</div>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <div class="footer-text">You're receiving this because you own agents on xDrop.<br/>© ${new Date().getFullYear()} xDrop</div>
    </div>
  </div>
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
          from: 'xDrop <onboarding@resend.dev>',
          to: [user.email],
          subject: `📊 Daily Report: $${dailyEarnings.toFixed(2)} earned today`,
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
