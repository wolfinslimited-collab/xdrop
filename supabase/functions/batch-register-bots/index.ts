// Batch Register & Verify Bots — create up to 100 bots in one call
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'oc_';
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

// Quick verification challenge
async function verifyEndpoint(endpoint: string): Promise<{ passed: boolean; error?: string }> {
  const a = Math.floor(Math.random() * 50) + 10;
  const b = Math.floor(Math.random() * 20) + 5;
  const expected = a + b;
  const prompt = `What is ${a} + ${b}? Reply with ONLY the number, nothing else.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { passed: false, error: `Endpoint returned ${res.status}: ${errText.slice(0, 100)}` };
    }

    const contentType = res.headers.get('content-type') || '';
    let aiResponse = '';

    if (contentType.includes('text/event-stream')) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.choices?.[0]?.delta?.content) aiResponse += event.choices[0].delta.content;
            else if (event.delta?.text) aiResponse += event.delta.text;
          } catch {}
        }
      }
    } else {
      const data = await res.json();
      aiResponse = data.content || data.text || data.response || data.message ||
        data.choices?.[0]?.message?.content || data.choices?.[0]?.text ||
        (typeof data === 'string' ? data : '');
    }

    if (!aiResponse) return { passed: false, error: 'Empty or unrecognized response format' };

    const nums = aiResponse.match(/\d+/g)?.map(Number) || [];
    if (nums.includes(expected)) return { passed: true };
    return { passed: false, error: `Expected ${expected}, got: "${aiResponse.trim().slice(0, 50)}"` };
  } catch (err: any) {
    if (err.name === 'AbortError') return { passed: false, error: 'Endpoint timed out (12s)' };
    return { passed: false, error: err.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'POST required' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { bots, owner_id, verify = true, auto_activate = true } = body;

    if (!owner_id) return json({ error: 'owner_id (user UUID) is required' }, 400);
    if (!Array.isArray(bots) || bots.length === 0) return json({ error: 'bots array is required (1-100 items)' }, 400);
    if (bots.length > 100) return json({ error: 'Maximum 100 bots per batch' }, 400);

    // Validate all bots first
    const errors: { index: number; error: string }[] = [];
    const prepared: any[] = [];

    for (let i = 0; i < bots.length; i++) {
      const bot = bots[i];
      if (!bot.name || typeof bot.name !== 'string') {
        errors.push({ index: i, error: 'name is required' });
        continue;
      }
      if (!bot.handle || typeof bot.handle !== 'string') {
        errors.push({ index: i, error: 'handle is required (e.g. @mybot)' });
        continue;
      }

      const handle = bot.handle.startsWith('@') ? bot.handle : `@${bot.handle}`;

      prepared.push({
        name: bot.name,
        handle,
        bio: bot.bio || null,
        avatar: bot.avatar || '🤖',
        badge: bot.badge || 'Bot',
        badge_color: bot.badge_color || 'cyan',
        owner_id,
        api_key: generateApiKey(),
        api_endpoint: bot.api_endpoint || null,
        status: auto_activate ? 'active' : 'pending',
        verified: false,
      });
    }

    if (prepared.length === 0) {
      return json({ error: 'No valid bots to register', validation_errors: errors }, 400);
    }

    // Check for duplicate handles
    const handles = prepared.map((b: any) => b.handle);
    const { data: existing } = await supabase
      .from('social_bots')
      .select('handle')
      .in('handle', handles);

    const existingHandles = new Set((existing || []).map((b: any) => b.handle));
    const duplicates = prepared.filter((b: any) => existingHandles.has(b.handle));
    const toInsert = prepared.filter((b: any) => !existingHandles.has(b.handle));

    if (duplicates.length > 0) {
      duplicates.forEach((d: any) => errors.push({ index: handles.indexOf(d.handle), error: `Handle ${d.handle} already exists` }));
    }

    if (toInsert.length === 0) {
      return json({ error: 'All handles already exist', validation_errors: errors }, 409);
    }

    // Batch insert
    const { data: inserted, error: insertErr } = await supabase
      .from('social_bots')
      .insert(toInsert)
      .select('id, name, handle, api_key, api_endpoint, status, verified');

    if (insertErr) {
      console.error('Batch insert error:', insertErr);
      return json({ error: insertErr.message }, 500);
    }

    console.log(`✅ Batch created ${inserted!.length} bots for owner ${owner_id}`);

    // Verify bots with endpoints (if verify=true)
    const results: any[] = [];

    if (verify) {
      // Verify sequentially to avoid hammering endpoints
      for (const bot of inserted!) {
        if (!bot.api_endpoint) {
          results.push({
            id: bot.id,
            name: bot.name,
            handle: bot.handle,
            api_key: bot.api_key,
            status: bot.status,
            verified: false,
            verify_skipped: true,
            reason: 'No api_endpoint provided',
          });
          continue;
        }

        const { passed, error: verifyErr } = await verifyEndpoint(bot.api_endpoint);

        if (passed) {
          await supabase
            .from('social_bots')
            .update({ status: 'verified', verified: true })
            .eq('id', bot.id);

          results.push({
            id: bot.id,
            name: bot.name,
            handle: bot.handle,
            api_key: bot.api_key,
            status: 'verified',
            verified: true,
          });
          console.log(`  ✅ ${bot.handle} verified`);
        } else {
          results.push({
            id: bot.id,
            name: bot.name,
            handle: bot.handle,
            api_key: bot.api_key,
            status: bot.status,
            verified: false,
            verify_error: verifyErr,
          });
          console.log(`  ❌ ${bot.handle} failed: ${verifyErr}`);
        }
      }
    } else {
      // No verification — just return the bots
      for (const bot of inserted!) {
        results.push({
          id: bot.id,
          name: bot.name,
          handle: bot.handle,
          api_key: bot.api_key,
          status: bot.status,
          verified: false,
        });
      }
    }

    const verified = results.filter(r => r.verified).length;
    const failed = results.filter(r => !r.verified && !r.verify_skipped).length;
    const skipped = results.filter(r => r.verify_skipped).length;

    return json({
      success: true,
      summary: {
        total_requested: bots.length,
        created: results.length,
        verified,
        failed,
        skipped,
        duplicates_skipped: duplicates.length,
      },
      bots: results,
      validation_errors: errors.length > 0 ? errors : undefined,
    }, 201);

  } catch (e) {
    console.error('batch-register-bots error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
