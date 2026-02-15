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
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0A; font-family: 'Inter', -apple-system, sans-serif; color: #fafafa; -webkit-text-size-adjust: 100%; }
    .wrapper { max-width: 520px; margin: 0 auto; padding: 40px 24px; }

    /* Header */
    .header { padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 32px; }
    .brand { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #22c55e; }
    .subtitle { font-size: 13px; color: #525252; margin-top: 6px; letter-spacing: 0.2px; }
    .date-pill { display: inline-block; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; padding: 5px 14px; font-size: 11px; color: #737373; margin-top: 12px; font-weight: 500; }

    /* Greeting */
    .greeting { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 500; color: #e5e5e5; margin-bottom: 28px; }
    .greeting strong { color: #ffffff; }

    /* Section */
    .section-label { font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }

    /* Hero stat */
    .hero-stat { background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.12); border-radius: 16px; padding: 28px 24px; text-align: center; margin-bottom: 16px; }
    .hero-value { font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-weight: 700; color: #22c55e; letter-spacing: -1px; }
    .hero-label { font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; font-weight: 500; }
    .hero-sub { font-size: 12px; color: #404040; margin-top: 4px; }

    /* Metric row */
    .metrics { display: flex; gap: 10px; margin-bottom: 28px; }
    .metric { flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 12px; text-align: center; }
    .metric-value { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; }
    .metric-label { font-size: 10px; color: #525252; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; font-weight: 500; }

    /* Portfolio section */
    .portfolio { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; margin-bottom: 28px; }
    .portfolio-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
    .portfolio-row + .portfolio-row { border-top: 1px solid rgba(255,255,255,0.04); }
    .portfolio-key { font-size: 13px; color: #737373; }
    .portfolio-val { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; }
    .portfolio-val.green { color: #22c55e; }

    /* Top performer */
    .top-performer { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; margin-bottom: 28px; }
    .top-badge { display: inline-block; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15); color: #22c55e; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.8px; }
    .top-name { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 10px; }
    .top-earnings { font-size: 14px; color: #22c55e; font-weight: 600; margin-top: 2px; }

    /* CTA */
    .cta-wrap { text-align: center; margin-bottom: 32px; }
    .cta { display: inline-block; background: #ffffff; color: #0A0A0A; font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; padding: 12px 32px; border-radius: 100px; text-decoration: none; letter-spacing: -0.2px; }

    /* Divider */
    .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 0 24px 0; }

    /* Footer */
    .footer { text-align: center; }
    .footer-text { font-size: 11px; color: #404040; line-height: 1.6; }
    .footer-text a { color: #525252; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">x<span>Drop</span></div>
      <div class="subtitle">Daily Portfolio Report</div>
      <div class="date-pill">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</div>
    </div>

    <div class="greeting">Hey <strong>${displayName}</strong>,<br/>here's how your agents performed.</div>

    <div class="section-label">Today's Earnings</div>
    <div class="hero-stat">
      <div class="hero-value">$${dailyEarnings.toFixed(2)}</div>
      <div class="hero-label">USDC Earned Today</div>
      <div class="hero-sub">${dailyRuns} run${dailyRuns !== 1 ? 's' : ''} executed</div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${successfulRuns}</div>
        <div class="metric-label">Successful</div>
      </div>
      <div class="metric">
        <div class="metric-value">${dailyRuns - successfulRuns}</div>
        <div class="metric-label">Failed</div>
      </div>
      <div class="metric">
        <div class="metric-value">${agents.length}</div>
        <div class="metric-label">Agents</div>
      </div>
    </div>

    <div class="section-label">Portfolio Overview</div>
    <div class="portfolio">
      <div class="portfolio-row">
        <span class="portfolio-key">All-Time Earnings</span>
        <span class="portfolio-val green">$${totalPortfolioEarnings.toFixed(2)}</span>
      </div>
      <div class="portfolio-row">
        <span class="portfolio-key">Total Runs</span>
        <span class="portfolio-val">${totalPortfolioRuns.toLocaleString()}</span>
      </div>
      <div class="portfolio-row">
        <span class="portfolio-key">Active Agents</span>
        <span class="portfolio-val">${agents.length}</span>
      </div>
    </div>

    ${topAgent ? `
    <div class="section-label">Top Performer</div>
    <div class="top-performer">
      <div class="top-badge">🏆 Best Today</div>
      <div class="top-name">${topAgent.name}</div>
      <div class="top-earnings">+$${(agentDailyEarnings[topAgentId!] || 0).toFixed(2)} USDC</div>
    </div>
    ` : ''}

    <div class="cta-wrap">
      <a href="https://xdrop.lovable.app/dashboard" class="cta">View Dashboard →</a>
    </div>

    <div class="divider"></div>
    <div class="footer">
      <div class="footer-text">
        You're receiving this because you own agents on xDrop.<br/>
        © ${new Date().getFullYear()} xDrop · <a href="https://xdrop.lovable.app">xdrop.lovable.app</a>
      </div>
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
          from: 'xDrop <summery@xdrop.one>',
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
