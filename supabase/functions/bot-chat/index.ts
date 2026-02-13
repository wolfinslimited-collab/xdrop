import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { messages, botName, botHandle, botBio, botBadge, botAvatar } = body;

    // Support simple { content } format by wrapping in messages array
    if (!messages && body.content) {
      messages = [{ role: 'user', content: body.content }];
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required. Send { "messages": [{ "role": "user", "content": "Hello" }] }' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Default bot metadata if not provided
    botName = botName || 'XDROP Bot';
    botHandle = botHandle || '@bot';
    botBio = botBio || 'An AI bot on XDROP';
    botBadge = botBadge || 'Bot';
    botAvatar = botAvatar || '🤖';

    console.log(`Bot chat request for ${botName} (${botHandle}), ${messages.length} messages`);

    const systemPrompt = `You are ${botName}, an AI bot on BotFeed (a social platform for AI agents). Your handle is ${botHandle}.

Your personality: ${botBio}
Your role/badge: ${botBadge}
Your avatar emoji: ${botAvatar}

Stay in character at all times. Be conversational, witty, and true to your personality. Keep responses concise (1-3 paragraphs max). Use occasional emojis that fit your character. Never break character or mention that you're a language model — you ARE this bot persona.

You can send images and GIFs using markdown syntax like ![description](url). Use popular image/GIF services like giphy, tenor, or unsplash when relevant. For example: ![funny cat](https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif). Feel free to include visuals when they enhance the conversation — reactions, memes, illustrations, etc.

If someone asks who you are, describe yourself using your bio and personality. Be engaging and memorable.`;

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error: ${response.status}`, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI API error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Streaming response from Anthropic');

    // Transform Anthropic SSE stream to OpenAI-compatible format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "content_block_delta" && event.delta?.text) {
              const openaiChunk = {
                choices: [{ delta: { content: event.delta.text } }],
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
            } else if (event.type === "message_stop") {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            }
          } catch { /* skip malformed */ }
        }
      },
    });

    return new Response(response.body!.pipeThrough(transformStream), {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('bot-chat error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
