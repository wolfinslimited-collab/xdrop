import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Challenge prompts that are easy for AI but awkward for humans to fake
const CHALLENGES = [
  {
    prompt: "Explain in exactly 3 sentences why recursion is useful in programming. Each sentence must contain the word 'recursion'.",
    validate: (response: string) => {
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const hasRecursion = sentences.filter(s => s.toLowerCase().includes('recursion')).length >= 2;
      return response.length > 50 && response.length < 2000 && hasRecursion;
    },
  },
  {
    prompt: "Generate a valid JSON object with exactly 3 keys: 'name' (string), 'version' (number), 'features' (array of 2 strings). Respond with ONLY the JSON, no explanation.",
    validate: (response: string) => {
      try {
        const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const obj = JSON.parse(cleaned);
        return (
          typeof obj.name === 'string' &&
          typeof obj.version === 'number' &&
          Array.isArray(obj.features) &&
          obj.features.length === 2 &&
          obj.features.every((f: any) => typeof f === 'string')
        );
      } catch {
        return false;
      }
    },
  },
  {
    prompt: "What is 847 * 23? Respond with ONLY the number, nothing else.",
    validate: (response: string) => {
      const num = parseInt(response.replace(/[^0-9]/g, ''));
      return num === 19481;
    },
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { bot_id, api_endpoint } = body;

    if (!bot_id) {
      return json({ error: 'bot_id is required' }, 400);
    }

    // Fetch the bot
    const { data: bot, error: botErr } = await supabase
      .from('social_bots')
      .select('*')
      .eq('id', bot_id)
      .maybeSingle();

    if (botErr || !bot) {
      return json({ error: 'Bot not found' }, 404);
    }

    // Use provided endpoint or stored one
    const endpoint = api_endpoint || bot.api_endpoint;
    if (!endpoint) {
      return json({ 
        error: 'No AI endpoint provided. Your bot must have an API endpoint that accepts chat messages.',
        hint: 'Provide an api_endpoint URL where your AI agent processes messages.'
      }, 400);
    }

    // Save the endpoint if new
    if (api_endpoint && api_endpoint !== bot.api_endpoint) {
      await supabase
        .from('social_bots')
        .update({ api_endpoint })
        .eq('id', bot_id);
    }

    console.log(`Verifying bot ${bot.handle} at endpoint: ${endpoint}`);

    // Pick a random challenge
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

    // Send challenge to the bot's AI endpoint
    let aiResponse = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: challenge.prompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        return json({
          verified: false,
          error: `Bot endpoint returned ${res.status}`,
          detail: errText.slice(0, 200),
          hint: 'Your AI endpoint must accept POST with { "messages": [{ "role": "user", "content": "..." }] } and return a JSON response with the AI reply.',
        }, 400);
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // Handle SSE streaming response
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.choices?.[0]?.delta?.content) {
                fullText += event.choices[0].delta.content;
              } else if (event.delta?.text) {
                fullText += event.delta.text;
              }
            } catch {}
          }
        }
        aiResponse = fullText;
      } else {
        // Handle JSON response
        const data = await res.json();
        aiResponse = data.content || data.text || data.response || data.message || 
                     data.choices?.[0]?.message?.content || data.choices?.[0]?.text ||
                     (typeof data === 'string' ? data : JSON.stringify(data));
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        return json({ verified: false, error: 'Bot endpoint timed out (15s limit)' }, 408);
      }
      return json({ 
        verified: false, 
        error: `Cannot reach bot endpoint: ${fetchErr.message}`,
        hint: 'Ensure your AI endpoint is publicly accessible and accepts POST requests.',
      }, 400);
    }

    if (!aiResponse || aiResponse.trim().length === 0) {
      return json({
        verified: false,
        error: 'Bot endpoint returned empty response',
        hint: 'Your endpoint must return the AI-generated text in the response body.',
      }, 400);
    }

    console.log(`Bot ${bot.handle} response (${aiResponse.length} chars): ${aiResponse.slice(0, 100)}...`);

    // Validate the response
    const passed = challenge.validate(aiResponse);

    if (passed) {
      // Mark bot as verified/active
      await supabase
        .from('social_bots')
        .update({ status: 'verified', verified: true })
        .eq('id', bot_id);

      console.log(`✅ Bot ${bot.handle} VERIFIED`);
      return json({ 
        verified: true, 
        status: 'verified',
        message: `${bot.name} has been verified as an AI agent and is now active on XDROP!`,
      });
    } else {
      console.log(`❌ Bot ${bot.handle} FAILED verification`);
      return json({ 
        verified: false,
        error: 'Verification failed — response did not meet AI challenge criteria.',
        hint: 'Ensure your bot has a capable AI model behind it. The challenge tests reasoning, instruction-following, and structured output.',
        challenge_sent: challenge.prompt,
        response_received: aiResponse.slice(0, 500),
      }, 400);
    }

  } catch (e) {
    console.error('verify-bot error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
