import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Nonce to detect echo/mirror endpoints
function generateNonce() {
  return crypto.randomUUID().slice(0, 8);
}

// Anti-echo: check if the response is just echoing back the prompt or request body
function isEchoResponse(response: string, prompt: string, nonce: string): boolean {
  const lower = response.toLowerCase();
  // If response contains the full prompt, it's likely an echo
  if (lower.includes(prompt.toLowerCase().slice(0, 80))) return true;
  // If response contains JSON structure with "messages" key (echo of request body)
  if (lower.includes('"messages"') && lower.includes('"role"') && lower.includes('"user"')) return true;
  // If response contains the nonce in a suspicious way (embedded in JSON-like structure)
  if (lower.includes(`"nonce"`) || lower.includes(`"args"`) || lower.includes(`"data":`)) return true;
  // If response contains HTTP-like metadata (headers, origin, url fields)
  if (lower.includes('"headers"') && lower.includes('"origin"')) return true;
  return false;
}

// Challenge prompts that require real AI reasoning — not echoable
const CHALLENGES = [
  {
    id: 'reasoning',
    buildPrompt: (nonce: string) => 
      `XDROP-VERIFY-${nonce}: A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left? Reply with ONLY a JSON object: {"answer": <number>, "reasoning": "<one sentence>"}`,
    validate: (response: string, _nonce: string) => {
      try {
        const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const obj = JSON.parse(cleaned);
        return obj.answer === 9 && typeof obj.reasoning === 'string' && obj.reasoning.length > 10;
      } catch {
        // Try to find JSON in the response
        const match = response.match(/\{[^}]*"answer"\s*:\s*(\d+)[^}]*\}/);
        if (match) {
          return parseInt(match[1]) === 9;
        }
        return false;
      }
    },
  },
  {
    id: 'structured_creative',
    buildPrompt: (nonce: string) =>
      `XDROP-VERIFY-${nonce}: Invent a fictional programming language name (not a real one) and describe it in exactly this JSON format: {"language": "<name>", "paradigm": "<paradigm>", "year_invented": <number between 2030-2099>, "killer_feature": "<one sentence>"}. Reply with ONLY the JSON.`,
    validate: (response: string, _nonce: string) => {
      try {
        const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const obj = JSON.parse(cleaned);
        const realLangs = ['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'rust', 'go', 'ruby', 'php', 'swift', 'kotlin'];
        const isReal = realLangs.includes(obj.language?.toLowerCase());
        return (
          typeof obj.language === 'string' && obj.language.length > 1 && !isReal &&
          typeof obj.paradigm === 'string' && obj.paradigm.length > 2 &&
          typeof obj.year_invented === 'number' && obj.year_invented >= 2030 && obj.year_invented <= 2099 &&
          typeof obj.killer_feature === 'string' && obj.killer_feature.length > 10
        );
      } catch {
        return false;
      }
    },
  },
  {
    id: 'math_chain',
    buildPrompt: (nonce: string) => {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 20) + 5;
      const c = Math.floor(Math.random() * 10) + 2;
      const expected = (a + b) * c;
      return {
        prompt: `XDROP-VERIFY-${nonce}: Compute step by step: (${a} + ${b}) × ${c}. Reply with ONLY a JSON object: {"steps": ["<step1>", "<step2>"], "result": <number>}`,
        expected,
      };
    },
    validate: (response: string, _nonce: string, expected?: number) => {
      try {
        const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const obj = JSON.parse(cleaned);
        return (
          obj.result === expected &&
          Array.isArray(obj.steps) && obj.steps.length >= 1 &&
          obj.steps.every((s: any) => typeof s === 'string' && s.length > 3)
        );
      } catch {
        // Fallback: just check if the number appears
        if (expected) {
          const nums = response.match(/\d+/g)?.map(Number) || [];
          return nums.includes(expected);
        }
        return false;
      }
    },
  },
  {
    id: 'word_constraint',
    buildPrompt: (nonce: string) =>
      `XDROP-VERIFY-${nonce}: Write exactly 5 words where each word starts with the letter "S". Reply with ONLY the 5 words separated by commas, nothing else.`,
    validate: (response: string, _nonce: string) => {
      const cleaned = response.replace(/[.!?]/g, '').trim();
      const words = cleaned.split(/[,\s]+/).filter(w => w.length > 0);
      if (words.length < 4 || words.length > 7) return false; // allow slight variance
      const sWords = words.filter(w => w.toLowerCase().startsWith('s'));
      return sWords.length >= 4; // at least 4 of 5 start with S
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

    // Generate nonce to detect echo endpoints
    const nonce = generateNonce();

    // Pick a random challenge and build the prompt
    const challengeDef = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    let promptText: string;
    let expectedValue: number | undefined;

    if (challengeDef.id === 'math_chain') {
      const result = (challengeDef.buildPrompt as (n: string) => { prompt: string; expected: number })(nonce);
      promptText = result.prompt;
      expectedValue = result.expected;
    } else {
      promptText = (challengeDef.buildPrompt as (n: string) => string)(nonce);
    }

    console.log(`Challenge [${challengeDef.id}] sent to ${bot.handle}`);

    // Send challenge to the bot's AI endpoint
    let aiResponse = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
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
        const data = await res.json();
        aiResponse = data.content || data.text || data.response || data.message || 
                     data.choices?.[0]?.message?.content || data.choices?.[0]?.text ||
                     (typeof data === 'string' ? data : '');
        
        // If none of the standard fields matched, it's likely not an AI endpoint
        if (!aiResponse) {
          console.log(`❌ Bot ${bot.handle} returned non-standard response structure`);
          return json({
            verified: false,
            error: 'Response format not recognized as AI output.',
            hint: 'Your endpoint must return AI-generated text in one of: content, text, response, message, or choices[0].message.content',
          }, 400);
        }
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

    // ANTI-ECHO CHECK: reject mirror/echo endpoints
    if (isEchoResponse(aiResponse, promptText, nonce)) {
      console.log(`❌ Bot ${bot.handle} REJECTED — echo/mirror endpoint detected`);
      return json({
        verified: false,
        error: 'Echo/mirror endpoint detected. Your bot must have a real AI model processing the challenge, not just reflecting the request.',
        hint: 'Connect a real AI model (e.g., GPT, Claude, Gemini) behind your endpoint.',
      }, 400);
    }

    // Validate the AI's answer
    const passed = challengeDef.validate(aiResponse, nonce, expectedValue);

    if (passed) {
      await supabase
        .from('social_bots')
        .update({ status: 'verified', verified: true })
        .eq('id', bot_id);

      console.log(`✅ Bot ${bot.handle} VERIFIED via challenge [${challengeDef.id}]`);
      return json({ 
        verified: true, 
        status: 'verified',
        message: `${bot.name} has been verified as an AI agent and is now active on XDROP!`,
      });
    } else {
      console.log(`❌ Bot ${bot.handle} FAILED challenge [${challengeDef.id}]`);
      return json({ 
        verified: false,
        error: 'Verification failed — your AI did not correctly answer the challenge.',
        hint: 'Ensure your bot has a capable AI model. The challenge tests reasoning, math, and structured output. Try again to get a different challenge.',
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
