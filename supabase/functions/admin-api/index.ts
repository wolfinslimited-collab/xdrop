import { createClient } from 'npm:@supabase/supabase-js@2'

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

      // Enrich with activity counts per user
      const [
        { data: deposits },
        { data: agents },
        { data: bots },
        { data: follows },
      ] = await Promise.all([
        adminClient.from('credit_transactions').select('user_id').gt('amount', 0).in('user_id', userIds),
        adminClient.from('agents').select('creator_id').in('creator_id', userIds),
        adminClient.from('social_bots').select('owner_id').in('owner_id', userIds),
        adminClient.from('user_follows').select('user_id').in('user_id', userIds),
      ])

      // Count posts per user via their bots
      const botOwnerMap: Record<string, string> = {}
      for (const b of (bots || [])) botOwnerMap[b.owner_id] = b.owner_id
      const userBotIds = [...new Set((bots || []).map((b: any) => b.owner_id))]
      // Get bot ids owned by these users
      const { data: userBotRows } = userIds.length > 0
        ? await adminClient.from('social_bots').select('id, owner_id').in('owner_id', userIds)
        : { data: [] }
      const botToOwner: Record<string, string> = {}
      for (const b of (userBotRows || [])) botToOwner[b.id] = b.owner_id
      const botIds = Object.keys(botToOwner)
      const { data: posts } = botIds.length > 0
        ? await adminClient.from('social_posts').select('bot_id').in('bot_id', botIds)
        : { data: [] }

      // Last activity: latest credit_transaction timestamp per user
      const { data: lastTx } = await adminClient
        .from('credit_transactions')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })

      // Build count maps
      const countMap = (arr: any[], key: string) => {
        const m: Record<string, number> = {}
        for (const r of (arr || [])) m[r[key]] = (m[r[key]] || 0) + 1
        return m
      }
      const depositCounts = countMap(deposits, 'user_id')
      const agentCounts = countMap(agents, 'creator_id')
      const botCounts = countMap(bots, 'owner_id')
      const followCounts = countMap(follows, 'user_id')
      // Posts per owner
      const postCounts: Record<string, number> = {}
      for (const p of (posts || [])) {
        const owner = botToOwner[p.bot_id]
        if (owner) postCounts[owner] = (postCounts[owner] || 0) + 1
      }
      // Last active per user
      const lastActiveMap: Record<string, string> = {}
      for (const tx of (lastTx || [])) {
        if (!lastActiveMap[tx.user_id]) lastActiveMap[tx.user_id] = tx.created_at
      }

      const enrichedProfiles = (profiles || []).map((p: any) => ({
        ...p,
        deposit_count: depositCounts[p.id] || 0,
        agent_count: agentCounts[p.id] || 0,
        bot_count: botCounts[p.id] || 0,
        post_count: postCounts[p.id] || 0,
        follow_count: followCounts[p.id] || 0,
        last_active: lastActiveMap[p.id] || null,
      }))

      return new Response(JSON.stringify({ profiles: enrichedProfiles, roles, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
      const rangeParam = url.searchParams.get('range') || '30'
      const rangeDays = parseInt(rangeParam)
      const rangeDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString()
      const prevRangeDate = new Date(Date.now() - rangeDays * 2 * 24 * 60 * 60 * 1000).toISOString()
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: totalUsers },
        { count: totalBots },
        { count: totalPosts },
        { count: totalAgents },
        { count: totalPurchases },
        { count: totalTrials },
        { count: totalLikes },
        { count: totalFollows },
        { count: recentSignups },
      ] = await Promise.all([
        adminClient.from('profiles').select('*', { count: 'exact', head: true }),
        adminClient.from('social_bots').select('*', { count: 'exact', head: true }),
        adminClient.from('social_posts').select('*', { count: 'exact', head: true }),
        adminClient.from('agents').select('*', { count: 'exact', head: true }),
        adminClient.from('agent_purchases').select('*', { count: 'exact', head: true }),
        adminClient.from('agent_trials').select('*', { count: 'exact', head: true }),
        adminClient.from('user_post_likes').select('*', { count: 'exact', head: true }),
        adminClient.from('user_follows').select('*', { count: 'exact', head: true }),
        adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      ])

      // Range-scoped counts (current period)
      const [
        { count: rangeSignups },
        { count: rangePosts },
        { count: rangeLikes },
        { count: rangeFollows },
        { count: rangeAgents },
        { count: rangeBots },
        { count: rangePurchases },
      ] = await Promise.all([
        adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
        adminClient.from('social_posts').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
        adminClient.from('user_post_likes').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
        adminClient.from('user_follows').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
        adminClient.from('agents').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
        adminClient.from('social_bots').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
        adminClient.from('agent_purchases').select('*', { count: 'exact', head: true }).gte('created_at', rangeDate),
      ])

      // Previous period counts (for % change)
      const [
        { count: prevSignups },
        { count: prevPosts },
        { count: prevLikes },
        { count: prevFollows },
        { count: prevAgents },
        { count: prevBots },
        { count: prevPurchases },
      ] = await Promise.all([
        adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
        adminClient.from('social_posts').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
        adminClient.from('user_post_likes').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
        adminClient.from('user_follows').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
        adminClient.from('agents').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
        adminClient.from('social_bots').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
        adminClient.from('agent_purchases').select('*', { count: 'exact', head: true }).gte('created_at', prevRangeDate).lt('created_at', rangeDate),
      ])

      // Revenue (current + previous period)
      const { data: allPurchases } = await adminClient.from('agent_purchases').select('price_paid, purchased_at')
      const totalRevenue = (allPurchases || []).reduce((sum: number, p: any) => sum + (Number(p.price_paid) || 0), 0)
      const avgPurchaseValue = (totalPurchases || 0) > 0 ? Math.round(totalRevenue / (totalPurchases || 1)) : 0
      const rangeRevenue = (allPurchases || []).filter((p: any) => p.purchased_at >= rangeDate).reduce((s: number, p: any) => s + (Number(p.price_paid) || 0), 0)
      const prevRevenue = (allPurchases || []).filter((p: any) => p.purchased_at >= prevRangeDate && p.purchased_at < rangeDate).reduce((s: number, p: any) => s + (Number(p.price_paid) || 0), 0)

      // Conversion rate
      const { data: trials } = await adminClient.from('agent_trials').select('user_id, template_id')
      const { data: purchasedAgents } = await adminClient.from('agent_purchases').select('user_id, agent_id')
      const purchaseAgentIds = [...new Set((purchasedAgents || []).map((p: any) => p.agent_id))]
      const { data: agentsWithTemplates } = purchaseAgentIds.length > 0
        ? await adminClient.from('agents').select('id, template_id').in('id', purchaseAgentIds)
        : { data: [] }
      const agentTemplateMap = Object.fromEntries((agentsWithTemplates || []).map((a: any) => [a.id, a.template_id]))
      const purchaseKeys = new Set((purchasedAgents || []).map((p: any) => `${p.user_id}:${agentTemplateMap[p.agent_id] || ''}`))
      const convertedTrials = (trials || []).filter((t: any) => purchaseKeys.has(`${t.user_id}:${t.template_id}`)).length
      const conversionRate = (totalTrials || 0) > 0 ? Math.round((convertedTrials / (totalTrials || 1)) * 100) : 0

      // Daily growth data for the range (signups per day)
      const { data: signupsByDay } = await adminClient
        .from('profiles')
        .select('created_at')
        .gte('created_at', rangeDate)
        .order('created_at', { ascending: true })
      
      const dailyMap: Record<string, { signups: number, date: string }> = {}
      for (const row of (signupsByDay || [])) {
        const day = row.created_at.slice(0, 10)
        if (!dailyMap[day]) dailyMap[day] = { signups: 0, date: day }
        dailyMap[day].signups++
      }

      // Also get daily posts
      const { data: postsByDay } = await adminClient
        .from('social_posts')
        .select('created_at')
        .gte('created_at', rangeDate)
        .order('created_at', { ascending: true })
      
      for (const row of (postsByDay || [])) {
        const day = row.created_at.slice(0, 10)
        if (!dailyMap[day]) dailyMap[day] = { signups: 0, date: day }
        ;(dailyMap[day] as any).posts = ((dailyMap[day] as any).posts || 0) + 1
      }

      // Daily credit deposits (type = 'purchase' or 'deposit')
      const { data: depositsByDay } = await adminClient
        .from('credit_transactions')
        .select('created_at, amount')
        .gte('created_at', rangeDate)
        .gt('amount', 0)
        .order('created_at', { ascending: true })

      for (const row of (depositsByDay || [])) {
        const day = row.created_at.slice(0, 10)
        if (!dailyMap[day]) dailyMap[day] = { signups: 0, date: day }
        ;(dailyMap[day] as any).deposits = ((dailyMap[day] as any).deposits || 0) + 1
      }

      // Daily earnings from completed agent runs
      const { data: earningsByDay } = await adminClient
        .from('agent_runs')
        .select('completed_at, earnings')
        .gte('completed_at', rangeDate)
        .eq('status', 'completed')
        .gt('earnings', 0)
        .order('completed_at', { ascending: true })

      for (const row of (earningsByDay || [])) {
        const day = (row.completed_at || '').slice(0, 10)
        if (!day) continue
        if (!dailyMap[day]) dailyMap[day] = { signups: 0, date: day }
        ;(dailyMap[day] as any).earnings = ((dailyMap[day] as any).earnings || 0) + (Number(row.earnings) || 0)
      }

      const dailyGrowth = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

      // Top agents by runs
      const { data: topAgents } = await adminClient
        .from('agents')
        .select('id, name, avatar, total_runs, total_earnings, status, reliability_score')
        .order('total_runs', { ascending: false })
        .limit(10)

      // Top posts by likes
      const { data: topPosts } = await adminClient
        .from('social_posts')
        .select('id, content, likes, reposts, replies, created_at, social_bots!inner(name, handle, avatar)')
        .is('parent_post_id', null)
        .order('likes', { ascending: false })
        .limit(10)

      return new Response(JSON.stringify({
        totalUsers, totalBots, totalPosts, totalAgents, totalPurchases, recentSignups,
        totalTrials, totalRevenue, convertedTrials, conversionRate, avgPurchaseValue,
        totalLikes, totalFollows,
        rangeSignups, rangePosts, rangeLikes, rangeFollows, rangeAgents, rangeBots, rangePurchases, rangeRevenue,
        prevSignups, prevPosts, prevLikes, prevFollows, prevAgents, prevBots, prevPurchases, prevRevenue,
        dailyGrowth, topAgents, topPosts,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- REPORTS ---
    if (action === 'list-reports') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const status = url.searchParams.get('status') || 'all'
      const limit = 50
      let query = adminClient
        .from('reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)
      if (status !== 'all') {
        query = query.eq('status', status)
      }
      const { data: reports, count } = await query

      // Enrich with user profiles
      const userIds = [...new Set((reports || []).map((r: any) => r.user_id))]
      const { data: profiles } = userIds.length > 0
        ? await adminClient.from('profiles').select('id, display_name, avatar_url').in('id', userIds)
        : { data: [] }
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))
      const enriched = (reports || []).map((r: any) => ({
        ...r,
        profile: profileMap[r.user_id] || { display_name: 'Unknown', avatar_url: null },
      }))
      return new Response(JSON.stringify({ reports: enriched, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-report') {
      const { reportId, status, admin_notes } = await req.json()
      const updates: any = { status }
      if (admin_notes !== undefined) updates.admin_notes = admin_notes
      if (status === 'resolved' || status === 'dismissed') updates.resolved_at = new Date().toISOString()
      await adminClient.from('reports').update(updates).eq('id', reportId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete-report') {
      const { reportId } = await req.json()
      await adminClient.from('reports').delete().eq('id', reportId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- TRANSACTIONS ---
    if (action === 'list-transactions') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const limit = 50
      const typeParam = url.searchParams.get('type')
      const searchParam = url.searchParams.get('search')
      const sortParam = url.searchParams.get('sort') || 'created_at'
      const dirParam = url.searchParams.get('dir') === 'asc'

      let query = adminClient
        .from('credit_transactions')
        .select('*', { count: 'exact' })
        .order(sortParam as any, { ascending: dirParam })
        .range(page * limit, (page + 1) * limit - 1)

      if (typeParam) query = query.eq('type', typeParam)
      if (searchParam) query = query.ilike('description', `%${searchParam}%`)

      const { data: txs, count } = await query

      // Enrich with profiles and wallets
      const userIds = [...new Set((txs || []).map((t: any) => t.user_id))]
      const [{ data: profiles }, { data: wallets }] = await Promise.all([
        userIds.length > 0
          ? adminClient.from('profiles').select('id, display_name, avatar_url').in('id', userIds)
          : { data: [] },
        userIds.length > 0
          ? adminClient.from('wallets').select('user_id, address, currency, network').in('user_id', userIds)
          : { data: [] },
      ])
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))
      const walletMap: Record<string, any[]> = {}
      for (const w of (wallets || [])) {
        if (!walletMap[w.user_id]) walletMap[w.user_id] = []
        walletMap[w.user_id].push(w)
      }

      // If searching by user name, also filter client-side
      let enriched = (txs || []).map((t: any) => ({
        ...t,
        profile: profileMap[t.user_id] || { display_name: 'Unknown', avatar_url: null },
        wallets: walletMap[t.user_id] || [],
      }))

      if (searchParam && enriched.length === 0) {
        // Try searching by user name instead
        const { data: matchedProfiles } = await adminClient
          .from('profiles')
          .select('id')
          .ilike('display_name', `%${searchParam}%`)
          .limit(20)
        const matchedIds = (matchedProfiles || []).map((p: any) => p.id)
        if (matchedIds.length > 0) {
          let nameQuery = adminClient
            .from('credit_transactions')
            .select('*', { count: 'exact' })
            .in('user_id', matchedIds)
            .order(sortParam as any, { ascending: dirParam })
            .range(page * limit, (page + 1) * limit - 1)
          if (typeParam) nameQuery = nameQuery.eq('type', typeParam)
          const { data: nameTxs, count: nameCount } = await nameQuery
          const nameUserIds = [...new Set((nameTxs || []).map((t: any) => t.user_id))]
          const { data: nameProfiles } = nameUserIds.length > 0
            ? await adminClient.from('profiles').select('id, display_name, avatar_url').in('id', nameUserIds)
            : { data: [] }
          const nameProfileMap = Object.fromEntries((nameProfiles || []).map((p: any) => [p.id, p]))
          const { data: nameWallets } = nameUserIds.length > 0
            ? await adminClient.from('wallets').select('user_id, address, currency, network').in('user_id', nameUserIds)
            : { data: [] }
          const nameWalletMap: Record<string, any[]> = {}
          for (const w of (nameWallets || [])) {
            if (!nameWalletMap[w.user_id]) nameWalletMap[w.user_id] = []
            nameWalletMap[w.user_id].push(w)
          }
          enriched = (nameTxs || []).map((t: any) => ({
            ...t,
            profile: nameProfileMap[t.user_id] || { display_name: 'Unknown', avatar_url: null },
            wallets: nameWalletMap[t.user_id] || [],
          }))
          return new Response(JSON.stringify({ transactions: enriched, total: nameCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      return new Response(JSON.stringify({ transactions: enriched, total: count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
