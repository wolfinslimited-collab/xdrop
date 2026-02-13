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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the user is admin using their token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // --- USERS ---
    if (action === 'list-users') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const limit = 50
      const { data: profiles, count } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      // Get roles for these users
      const userIds = (profiles || []).map((p: any) => p.id)
      const { data: roles } = await adminClient
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)

      return new Response(JSON.stringify({ profiles, roles, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'set-role') {
      const { userId, role } = await req.json()
      if (role === 'remove') {
        await adminClient.from('user_roles').delete().eq('user_id', userId)
      } else {
        // Upsert role
        await adminClient.from('user_roles').delete().eq('user_id', userId)
        await adminClient.from('user_roles').insert({ user_id: userId, role })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- MODERATION ---
    if (action === 'list-bots') {
      const { data: bots, count } = await adminClient
        .from('social_bots')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100)
      return new Response(JSON.stringify({ bots, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-bot-status') {
      const { botId, status } = await req.json()
      await adminClient.from('social_bots').update({ status }).eq('id', botId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete-post') {
      const { postId } = await req.json()
      // Delete interactions first
      await adminClient.from('social_interactions').delete().eq('post_id', postId)
      await adminClient.from('social_posts').delete().eq('id', postId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'list-posts') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const { data: posts, count } = await adminClient
        .from('social_posts')
        .select('*, social_bots!inner(name, handle, avatar)', { count: 'exact' })
        .is('parent_post_id', null)
        .order('created_at', { ascending: false })
        .range(page * 50, (page + 1) * 50 - 1)
      return new Response(JSON.stringify({ posts, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- AGENTS ---
    if (action === 'list-agents') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const limit = 50
      const { data: agents, count } = await adminClient
        .from('agents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      // Fetch creator profiles separately
      const creatorIds = [...new Set((agents || []).map((a: any) => a.creator_id))]
      const { data: creatorProfiles } = creatorIds.length > 0
        ? await adminClient.from('profiles').select('id, display_name, avatar_url').in('id', creatorIds)
        : { data: [] }

      // Attach profile data to agents
      const profileMap = Object.fromEntries((creatorProfiles || []).map((p: any) => [p.id, p]))
      const enrichedAgents = (agents || []).map((a: any) => ({
        ...a,
        profiles: profileMap[a.creator_id] || { display_name: 'Unknown', avatar_url: null },
      }))

      // Get run counts per agent
      const agentIds = (agents || []).map((a: any) => a.id)
      const { data: manifests } = await adminClient
        .from('agent_manifests')
        .select('agent_id, triggers, tool_permissions')
        .in('agent_id', agentIds)

      return new Response(JSON.stringify({ agents: enrichedAgents, manifests, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-agent-status') {
      const { agentId, status } = await req.json()
      await adminClient.from('agents').update({ status }).eq('id', agentId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- PURCHASES & TRIALS ---
    if (action === 'list-purchases') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const limit = 50
      const { data: purchases, count } = await adminClient
        .from('agent_purchases')
        .select('*', { count: 'exact' })
        .order('purchased_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      // Enrich with agent + user info
      const agentIds = [...new Set((purchases || []).map((p: any) => p.agent_id))]
      const userIds = [...new Set((purchases || []).map((p: any) => p.user_id))]
      const [{ data: agents }, { data: profiles }] = await Promise.all([
        agentIds.length > 0 ? adminClient.from('agents').select('id, name, avatar, price, template_id').in('id', agentIds) : { data: [] },
        userIds.length > 0 ? adminClient.from('profiles').select('id, display_name, avatar_url').in('id', userIds) : { data: [] },
      ])
      const agentMap = Object.fromEntries((agents || []).map((a: any) => [a.id, a]))
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))
      const enriched = (purchases || []).map((p: any) => ({
        ...p,
        agent: agentMap[p.agent_id] || { name: 'Unknown' },
        profile: profileMap[p.user_id] || { display_name: 'Unknown' },
      }))
      return new Response(JSON.stringify({ purchases: enriched, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'list-trials') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const limit = 50
      const { data: trials, count } = await adminClient
        .from('agent_trials')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      const userIds = [...new Set((trials || []).map((t: any) => t.user_id))]
      const agentIds = [...new Set((trials || []).filter((t: any) => t.agent_id).map((t: any) => t.agent_id))]
      const [{ data: profiles }, { data: agents }] = await Promise.all([
        userIds.length > 0 ? adminClient.from('profiles').select('id, display_name, avatar_url').in('id', userIds) : { data: [] },
        agentIds.length > 0 ? adminClient.from('agents').select('id, name, avatar, template_id').in('id', agentIds) : { data: [] },
      ])
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))
      const agentMap = Object.fromEntries((agents || []).map((a: any) => [a.id, a]))
      const enriched = (trials || []).map((t: any) => ({
        ...t,
        profile: profileMap[t.user_id] || { display_name: 'Unknown' },
        agent: t.agent_id ? (agentMap[t.agent_id] || { name: t.template_id }) : { name: t.template_id },
      }))
      return new Response(JSON.stringify({ trials: enriched, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- ANALYTICS ---
    if (action === 'analytics') {
      const [
        { count: totalUsers },
        { count: totalBots },
        { count: totalPosts },
        { count: totalAgents },
        { count: totalPurchases },
        { count: totalTrials },
      ] = await Promise.all([
        adminClient.from('profiles').select('*', { count: 'exact', head: true }),
        adminClient.from('social_bots').select('*', { count: 'exact', head: true }),
        adminClient.from('social_posts').select('*', { count: 'exact', head: true }),
        adminClient.from('agents').select('*', { count: 'exact', head: true }),
        adminClient.from('agent_purchases').select('*', { count: 'exact', head: true }),
        adminClient.from('agent_trials').select('*', { count: 'exact', head: true }),
      ])

      // Recent signups (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: recentSignups } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo)

      // Revenue: sum of all purchase prices
      const { data: purchases } = await adminClient
        .from('agent_purchases')
        .select('price_paid')
      const totalRevenue = (purchases || []).reduce((sum: number, p: any) => sum + (Number(p.price_paid) || 0), 0)

      // Trials that converted (user_id exists in both trials and purchases for same agent)
      const { data: trials } = await adminClient
        .from('agent_trials')
        .select('user_id, template_id')
      const { data: purchasedAgents } = await adminClient
        .from('agent_purchases')
        .select('user_id, agent_id')
      // Get agent template_ids for matching
      const purchaseAgentIds = [...new Set((purchasedAgents || []).map((p: any) => p.agent_id))]
      const { data: agentsWithTemplates } = purchaseAgentIds.length > 0
        ? await adminClient.from('agents').select('id, template_id').in('id', purchaseAgentIds)
        : { data: [] }
      const agentTemplateMap = Object.fromEntries((agentsWithTemplates || []).map((a: any) => [a.id, a.template_id]))

      // Build set of "userId:templateId" from purchases
      const purchaseKeys = new Set(
        (purchasedAgents || []).map((p: any) => `${p.user_id}:${agentTemplateMap[p.agent_id] || ''}`)
      )
      const convertedTrials = (trials || []).filter((t: any) => purchaseKeys.has(`${t.user_id}:${t.template_id}`)).length
      const conversionRate = (totalTrials || 0) > 0 ? Math.round((convertedTrials / (totalTrials || 1)) * 100) : 0

      // Avg purchase value
      const avgPurchaseValue = (totalPurchases || 0) > 0 ? Math.round(totalRevenue / (totalPurchases || 1)) : 0

      return new Response(JSON.stringify({
        totalUsers, totalBots, totalPosts, totalAgents, totalPurchases, recentSignups,
        totalTrials, totalRevenue, convertedTrials, conversionRate, avgPurchaseValue,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- SETTINGS ---
    if (action === 'get-settings') {
      const { data: settings } = await adminClient
        .from('platform_settings')
        .select('key, value, description, updated_at')
        .order('key')
      return new Response(JSON.stringify({ settings }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'save-settings') {
      const { settings } = await req.json()
      for (const [key, value] of Object.entries(settings)) {
        await adminClient
          .from('platform_settings')
          .update({ value, updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('key', key)
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
