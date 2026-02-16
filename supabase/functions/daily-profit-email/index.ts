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

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: profiles } = await adminClient.from('profiles').select('id, display_name, credits')
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No profiles found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let emailsSent = 0

    for (const profile of profiles) {
      const userId = profile.id
      const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
      if (!user?.email) continue

      // --- 1. ALL USER'S AGENTS (created by them, includes template-based "purchased" ones) ---
      const { data: allAgents } = await adminClient
        .from('agents')
        .select('id, name, status, usdc_earnings, total_runs, reliability_score, avatar, created_at, purchased_at, price, monthly_return_min, monthly_return_max, template_id')
        .eq('creator_id', userId)

      const agents = allAgents || []
      if (agents.length === 0) continue

      // Separate: template-based (purchased/pre-built) vs custom-created
      const purchasedAgents = agents.filter(a => a.template_id)
      const customAgents = agents.filter(a => !a.template_id)

      // Calculate simulated earnings for purchased agents
      for (const agent of purchasedAgents) {
        const sim = getSimulatedEarnings(agent)
        agent._simTotal = sim.total
        agent._simDaily = sim.dailyRate
      }

      // Purchased agent totals
      const purchasedSimTotal = purchasedAgents.reduce((s, a) => s + (a._simTotal || 0), 0)
      const purchasedSimDaily = purchasedAgents.reduce((s, a) => s + (a._simDaily || 0), 0)
      const purchasedRealTotal = purchasedAgents.reduce((s, a) => s + Number(a.usdc_earnings || 0), 0)
      const purchasedTotalEarnings = purchasedRealTotal > 0 ? purchasedRealTotal : purchasedSimTotal
      const purchasedDailyEarnings = purchasedSimDaily // always show simulated daily

      // Custom agent totals
      const customTotalEarnings = customAgents.reduce((s, a) => s + Number(a.usdc_earnings || 0), 0)

      // --- 2. DAILY CREDIT USAGE ---
      const { data: creditTxns } = await adminClient
        .from('credit_transactions')
        .select('amount, type, description')
        .eq('user_id', userId)
        .gte('created_at', yesterday)

      let creditsSpent = 0
      let creditsEarned = 0
      const usageBreakdown: Record<string, number> = {}

      for (const tx of (creditTxns || [])) {
        if (tx.amount < 0) {
          creditsSpent += Math.abs(tx.amount)
          const label = formatCreditType(tx.type)
          usageBreakdown[label] = (usageBreakdown[label] || 0) + Math.abs(tx.amount)
        } else {
          creditsEarned += tx.amount
        }
      }

      const displayName = profile.display_name || user.email.split('@')[0]
      const totalDailyEarnings = purchasedDailyEarnings
      const totalAllTimeEarnings = purchasedTotalEarnings + customTotalEarnings

      const emailHtml = buildEmailHtml({
        displayName,
        purchasedAgents,
        purchasedDailyEarnings,
        purchasedTotalEarnings,
        customAgents,
        customTotalEarnings,
        totalDailyEarnings,
        totalAllTimeEarnings,
        currentCredits: profile.credits,
        creditsSpent,
        creditsEarned,
        usageBreakdown,
      })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'xDrop <summary@xdrop.one>',
          to: [user.email],
          subject: `Your xDrop Daily Summary — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
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

function getSimulatedEarnings(agent: any): { total: number; monthly: number; dailyRate: number } {
  if (!agent.purchased_at || !agent.monthly_return_min) return { total: 0, monthly: 0, dailyRate: 0 }
  const purchasedDate = new Date(agent.purchased_at)
  const now = new Date()
  const daysSincePurchase = Math.max(1, Math.floor((now.getTime() - purchasedDate.getTime()) / (1000 * 60 * 60 * 24)))
  const avgMonthlyReturn = ((agent.monthly_return_min || 0) + (agent.monthly_return_max || 0)) / 2
  const dailyRate = (avgMonthlyReturn / 30) / 100 * (agent.price || 100)
  const total = +(dailyRate * daysSincePurchase).toFixed(2)
  const monthly = +(dailyRate * 30).toFixed(2)
  return { total, monthly, dailyRate: +dailyRate.toFixed(2) }
}

function formatCreditType(type: string): string {
  const map: Record<string, string> = {
    agent_run: 'Agent Runs',
    chat_message: 'AI Chat',
    voice_message: 'Voice',
    agent_creation: 'Agent Creation',
    purchase: 'Purchase',
    marketplace_listing: 'Marketplace',
  }
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function avatarText(avatar: string | null): string {
  if (!avatar || avatar.includes('/')) return '🤖'
  return avatar
}

function buildEmailHtml(d: any): string {
  const sectionTitle = (text: string) =>
    `<div style="font-size:10px;font-weight:700;color:#525252;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;">${text}</div>`

  const metricBox = (value: string, label: string) => `
    <td width="33%" style="padding:0 3px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:10px;">
        <tr><td style="padding:14px 8px;text-align:center;">
          <div style="font-size:18px;font-weight:700;color:#ffffff;">${value}</div>
          <div style="font-size:9px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">${label}</div>
        </td></tr>
      </table>
    </td>`

  const statRow = (label: string, value: string, isLast = false) => `
    <tr><td style="padding:14px 20px;${isLast ? '' : 'border-bottom:1px solid #1a1a1a;'}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#737373;">${label}</td>
          <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;">${value}</td>
        </tr>
      </table>
    </td></tr>`

  const creditRows = Object.entries(d.usageBreakdown)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([label, amount], i, arr) => statRow(label, `${amount} credits`, i === arr.length - 1))
    .join('')

  const hasPurchased = d.purchasedAgents.length > 0
  const hasCustom = d.customAgents.length > 0
  const hasCredits = d.creditsSpent > 0 || d.creditsEarned > 0

  // Per-agent breakdown for purchased agents
  const purchasedAgentRows = hasPurchased ? d.purchasedAgents
    .filter((a: any) => (a._simTotal || 0) > 0 || Number(a.usdc_earnings || 0) > 0)
    .sort((a: any, b: any) => (b._simTotal || 0) - (a._simTotal || 0))
    .map((a: any, i: number, arr: any[]) => {
      const total = Number(a.usdc_earnings || 0) > 0 ? Number(a.usdc_earnings) : (a._simTotal || 0)
      const daily = a._simDaily || 0
      return `
      <tr><td style="padding:12px 20px;${i < arr.length - 1 ? 'border-bottom:1px solid #1a1a1a;' : ''}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#ffffff;font-weight:500;">${avatarText(a.avatar)} ${a.name}</td>
            <td align="right" style="font-size:13px;font-weight:600;color:#22c55e;">$${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#525252;padding-top:2px;">+$${daily.toFixed(2)}/day · ${a.total_runs || 0} runs</td>
            <td></td>
          </tr>
        </table>
      </td></tr>`
    }).join('') : ''

  // Created agents summary — just count, no individual list
  const customAgentCount = d.customAgents.length

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your xDrop Daily Summary</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">x</span><span style="font-size:20px;font-weight:700;color:#a3a3a3;letter-spacing:-0.5px;">Drop</span>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding-bottom:24px;font-size:15px;line-height:1.5;color:#a3a3a3;">
          Hi <span style="color:#ffffff;font-weight:600;">${d.displayName}</span> — here's your daily summary.
        </td></tr>

        <!-- Overview Metrics -->
        <tr><td style="padding-bottom:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:12px;">
            <tr><td style="padding:24px;text-align:center;">
              <div style="font-size:11px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;">Total Earnings</div>
              <div style="font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1.5px;line-height:1;">$${d.totalAllTimeEarnings.toFixed(2)}</div>
              <div style="font-size:12px;color:#22c55e;margin-top:6px;">+$${d.totalDailyEarnings.toFixed(2)} today</div>
            </td></tr>
          </table>
        </td></tr>

        ${hasPurchased ? `
        <!-- PURCHASED AGENTS WITH PER-AGENT BREAKDOWN -->
        <tr><td style="padding:20px 0 8px;">
          ${sectionTitle('Purchased Agents')}
        </td></tr>

        <tr><td style="padding-bottom:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${metricBox('$' + d.purchasedTotalEarnings.toFixed(2), 'All-Time')}
              ${metricBox('$' + d.purchasedDailyEarnings.toFixed(2), 'Today')}
              ${metricBox(String(d.purchasedAgents.length), 'Agents')}
            </tr>
          </table>
        </td></tr>

        ${purchasedAgentRows ? `
        <tr><td style="padding-bottom:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:12px;">
            ${purchasedAgentRows}
          </table>
        </td></tr>` : ''}
        ` : ''}

        ${hasCustom ? `
        <!-- CREATED AGENTS SUMMARY (no individual listing) -->
        <tr><td style="padding:20px 0 8px;">
          ${sectionTitle('Your Created Agents')}
        </td></tr>

        <tr><td style="padding-bottom:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${metricBox('$' + d.customTotalEarnings.toFixed(2), 'Earned')}
              ${metricBox(String(customAgentCount), 'Total')}
              ${metricBox(String(d.customAgents.filter((a: any) => a.status === 'published').length), 'Live')}
            </tr>
          </table>
        </td></tr>
        ` : ''}

        ${hasCredits ? `
        <!-- CREDIT USAGE SECTION -->
        <tr><td style="padding:20px 0 8px;">
          ${sectionTitle('Credit Usage (24h)')}
        </td></tr>

        <tr><td style="padding-bottom:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${metricBox(String(d.creditsSpent), 'Spent')}
              ${metricBox(String(d.creditsEarned), 'Earned')}
              ${metricBox(String(d.currentCredits), 'Balance')}
            </tr>
          </table>
        </td></tr>

        ${creditRows ? `
        <tr><td style="padding-bottom:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f1f1f;border-radius:12px;">
            ${creditRows}
          </table>
        </td></tr>` : ''}
        ` : ''}

        <!-- CTA -->
        <tr><td align="center" style="padding:8px 0 32px;">
          <a href="https://xdrop.lovable.app/dashboard" style="display:inline-block;background-color:#ffffff;color:#0a0a0a;font-size:13px;font-weight:600;padding:11px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">View Dashboard</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:24px;text-align:center;">
          <div style="font-size:11px;color:#404040;line-height:1.7;">
            You're receiving this because you have an account on xDrop.<br>
            &copy; ${new Date().getFullYear()} xDrop
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
