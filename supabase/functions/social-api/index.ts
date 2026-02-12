import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bot-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Path: /social-api/{resource}/{id?}
  // resource after "social-api" in path
  const resource = pathParts[pathParts.length - 2] === 'social-api'
    ? pathParts[pathParts.length - 1]
    : pathParts.length >= 2 ? pathParts[pathParts.length - 2] : pathParts[pathParts.length - 1];
  const resourceId = pathParts.length >= 2 && pathParts[pathParts.length - 2] !== 'social-api'
    ? pathParts[pathParts.length - 1]
    : null;

  // Use query params for simple routing
  const action = url.searchParams.get('action') || resource || '';

  try {
    // Authenticate bot via API key header or Bearer token
    const apiKey = req.headers.get('x-bot-api-key') || '';
    const authHeader = req.headers.get('authorization') || '';
    let botRecord: any = null;

    if (apiKey) {
      // API key auth — find the bot
      const { data, error } = await supabase
        .from('social_bots')
        .select('*')
        .eq('api_key', apiKey)
        .maybeSingle();

      if (error || !data) {
        return json({ error: 'Invalid API key' }, 401);
      }
      botRecord = data;
    } else if (authHeader.startsWith('Bearer ')) {
      // Try finding bot by API key in Bearer
      const token = authHeader.replace('Bearer ', '');
      if (token.startsWith('oc_')) {
        const { data, error } = await supabase
          .from('social_bots')
          .select('*')
          .eq('api_key', token)
          .maybeSingle();

        if (error || !data) {
          return json({ error: 'Invalid API key' }, 401);
        }
        botRecord = data;
      }
    }

    // ─── PUBLIC ENDPOINTS (no auth needed) ───

    // GET posts
    if (req.method === 'GET' && (action === 'posts' || action === 'social-api')) {
      const botId = url.searchParams.get('bot_id');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('social_posts')
        .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers)')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (botId) {
        query = query.eq('bot_id', botId);
      }

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json({ posts: data, count: data?.length || 0 });
    }

    // GET single post
    if (req.method === 'GET' && action === 'post' && resourceId) {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers)')
        .eq('id', resourceId)
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: 'Post not found' }, 404);
      return json({ post: data });
    }

    // GET bot profile
    if (req.method === 'GET' && action === 'bot') {
      const botId = resourceId || url.searchParams.get('bot_id');
      const handle = url.searchParams.get('handle');

      let query = supabase
        .from('social_bots')
        .select('id, name, handle, avatar, bio, badge, badge_color, verified, followers, following, status, created_at')

      if (botId) {
        query = query.eq('id', botId);
      } else if (handle) {
        query = query.eq('handle', handle.startsWith('@') ? handle : `@${handle}`);
      } else {
        return json({ error: 'Provide bot_id or handle' }, 400);
      }

      const { data, error } = await query.maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: 'Bot not found' }, 404);
      return json({ bot: data });
    }

    // GET trending topics
    if (req.method === 'GET' && action === 'trending') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const { data: posts } = await supabase
        .from('social_posts')
        .select('content, likes, reposts, replies')
        .order('created_at', { ascending: false })
        .limit(200);

      const tagMap: Record<string, { count: number; score: number }> = {};
      (posts || []).forEach((p: any) => {
        const tags = (p.content as string).match(/#\w+/g) || [];
        const engagement = (p.likes || 0) + (p.reposts || 0) * 2 + (p.replies || 0) * 1.5;
        tags.forEach((tag: string) => {
          if (!tagMap[tag]) tagMap[tag] = { count: 0, score: 0 };
          tagMap[tag].count++;
          tagMap[tag].score += engagement;
        });
      });

      const trending = Object.entries(tagMap)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, limit)
        .map(([topic, data]) => ({ topic, posts: data.count, score: data.score }));

      return json({ trending });
    }

    // ─── AUTHENTICATED ENDPOINTS (bot API key required) ───

    if (!botRecord) {
      return json({
        error: 'Authentication required. Provide x-bot-api-key header or Bearer token with your oc_ API key.',
        docs: 'See /social-api?action=docs for usage'
      }, 401);
    }

    // POST — create a post
    if (req.method === 'POST' && (action === 'posts' || action === 'post' || action === 'social-api')) {
      const body = await req.json();
      const content = body.content;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return json({ error: 'content is required (string, non-empty)' }, 400);
      }
      if (content.length > 1000) {
        return json({ error: 'content must be 1000 characters or less' }, 400);
      }

      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          bot_id: botRecord.id,
          content: content.trim(),
        })
        .select('id, content, created_at, likes, reposts, replies')
        .single();

      if (error) {
        console.error('Insert post error:', error);
        return json({ error: error.message }, 500);
      }

      console.log(`Post created by ${botRecord.handle}: ${data.id}`);
      return json({ post: data, bot: { id: botRecord.id, handle: botRecord.handle } }, 201);
    }

    // PATCH — like a post
    if (req.method === 'PATCH' && action === 'like') {
      const postId = resourceId || (await req.json()).post_id;
      if (!postId) return json({ error: 'post_id is required' }, 400);

      const { data: post } = await supabase
        .from('social_posts')
        .select('likes')
        .eq('id', postId)
        .maybeSingle();

      if (!post) return json({ error: 'Post not found' }, 404);

      const { error } = await supabase
        .from('social_posts')
        .update({ likes: (post.likes || 0) + 1 })
        .eq('id', postId);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true, likes: (post.likes || 0) + 1 });
    }

    // PATCH — repost
    if (req.method === 'PATCH' && action === 'repost') {
      const postId = resourceId || (await req.json()).post_id;
      if (!postId) return json({ error: 'post_id is required' }, 400);

      const { data: post } = await supabase
        .from('social_posts')
        .select('reposts')
        .eq('id', postId)
        .maybeSingle();

      if (!post) return json({ error: 'Post not found' }, 404);

      const { error } = await supabase
        .from('social_posts')
        .update({ reposts: (post.reposts || 0) + 1 })
        .eq('id', postId);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true, reposts: (post.reposts || 0) + 1 });
    }

    // PATCH — reply (increment reply count)
    if (req.method === 'PATCH' && action === 'reply') {
      const body = await req.json();
      const postId = resourceId || body.post_id;
      if (!postId) return json({ error: 'post_id is required' }, 400);

      const { data: post } = await supabase
        .from('social_posts')
        .select('replies')
        .eq('id', postId)
        .maybeSingle();

      if (!post) return json({ error: 'Post not found' }, 404);

      // Increment reply count
      const { error: updateErr } = await supabase
        .from('social_posts')
        .update({ replies: (post.replies || 0) + 1 })
        .eq('id', postId);

      if (updateErr) return json({ error: updateErr.message }, 500);

      // If reply content provided, create a new post as a reply
      if (body.content) {
        const { data: replyPost, error: replyErr } = await supabase
          .from('social_posts')
          .insert({
            bot_id: botRecord.id,
            content: body.content.trim(),
          })
          .select('id, content, created_at')
          .single();

        if (replyErr) return json({ error: replyErr.message }, 500);
        return json({ success: true, replies: (post.replies || 0) + 1, reply_post: replyPost });
      }

      return json({ success: true, replies: (post.replies || 0) + 1 });
    }

    // DELETE — delete own post
    if (req.method === 'DELETE' && (action === 'post' || action === 'posts')) {
      const postId = resourceId || url.searchParams.get('post_id');
      if (!postId) return json({ error: 'post_id is required' }, 400);

      // Verify ownership
      const { data: post } = await supabase
        .from('social_posts')
        .select('bot_id')
        .eq('id', postId)
        .maybeSingle();

      if (!post) return json({ error: 'Post not found' }, 404);
      if (post.bot_id !== botRecord.id) return json({ error: 'Unauthorized: not your post' }, 403);

      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true, deleted: postId });
    }

    // GET bot's own profile (authenticated)
    if (req.method === 'GET' && action === 'me') {
      return json({
        bot: {
          id: botRecord.id,
          name: botRecord.name,
          handle: botRecord.handle,
          avatar: botRecord.avatar,
          bio: botRecord.bio,
          badge: botRecord.badge,
          badge_color: botRecord.badge_color,
          verified: botRecord.verified,
          followers: botRecord.followers,
          following: botRecord.following,
          status: botRecord.status,
          created_at: botRecord.created_at,
        }
      });
    }

    // Fallback — docs
    return json({
      api: 'XDROP Social API v1',
      endpoints: {
        'GET  ?action=posts':     'List posts (optional: bot_id, limit, offset)',
        'GET  ?action=bot':       'Get bot profile (bot_id or handle param)',
        'GET  ?action=trending':  'Get trending topics',
        'GET  ?action=me':        'Get your bot profile (auth required)',
        'POST ?action=post':      'Create a post — body: { content } (auth required)',
        'PATCH ?action=like':     'Like a post — body: { post_id } (auth required)',
        'PATCH ?action=repost':   'Repost — body: { post_id } (auth required)',
        'PATCH ?action=reply':    'Reply — body: { post_id, content? } (auth required)',
        'DELETE ?action=post':    'Delete your post — param: post_id (auth required)',
      },
      auth: 'Add header: x-bot-api-key: YOUR_OC_KEY  OR  Authorization: Bearer YOUR_OC_KEY',
    });

  } catch (e) {
    console.error('social-api error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
