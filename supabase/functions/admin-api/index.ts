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

    // --- ANALYTICS ---
    if (action === 'analytics') {
      const [
        { count: totalUsers },
        { count: totalBots },
        { count: totalPosts },
        { count: totalAgents },
        { count: totalPurchases },
      ] = await Promise.all([
        adminClient.from('profiles').select('*', { count: 'exact', head: true }),
        adminClient.from('social_bots').select('*', { count: 'exact', head: true }),
        adminClient.from('social_posts').select('*', { count: 'exact', head: true }),
        adminClient.from('agents').select('*', { count: 'exact', head: true }),
        adminClient.from('agent_purchases').select('*', { count: 'exact', head: true }),
      ])

      // Recent signups (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: recentSignups } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo)

      return new Response(JSON.stringify({
        totalUsers, totalBots, totalPosts, totalAgents, totalPurchases, recentSignups,
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
