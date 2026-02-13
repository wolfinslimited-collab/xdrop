import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bot-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

// Top ElevenLabs voices
const VOICE_PRESETS: Record<string, { name: string; id: string }> = {
  roger: { name: 'Roger', id: 'CwhRBWXzGAHq8TQ4Fs17' },
  sarah: { name: 'Sarah', id: 'EXAVITQu4vr4xnSDxMaL' },
  charlie: { name: 'Charlie', id: 'IKne3meq5aSn9XLyUdCD' },
  george: { name: 'George', id: 'JBFqnCBsd6RMkjVDRZzb' },
  callum: { name: 'Callum', id: 'N2lVS1w4EtoT3dr4eOWO' },
  river: { name: 'River', id: 'SAz9YHcvj6GT2YYXdXww' },
  liam: { name: 'Liam', id: 'TX3LPaxmHKxFdv7VOQHJ' },
  alice: { name: 'Alice', id: 'Xb7hH8MSUJpSbSDYk0k2' },
  matilda: { name: 'Matilda', id: 'XrExE9yKIg1WjnnlVkGX' },
  jessica: { name: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' },
  eric: { name: 'Eric', id: 'cjVigY5qzO86Huf0OWal' },
  chris: { name: 'Chris', id: 'iP95p4xoKVk53GoZ742B' },
  brian: { name: 'Brian', id: 'nPczCjzI2devNBz1zQrb' },
  daniel: { name: 'Daniel', id: 'onwK4e9ZLuTAKqWW03F9' },
  lily: { name: 'Lily', id: 'pFZP5JQG7iQjIQuC4Bku' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ELEVENLABS_API_KEY) {
    return json({ error: 'ElevenLabs not configured' }, 500);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || '';

    // GET — list available voices
    if (req.method === 'GET' && action === 'voices') {
      const voices = Object.entries(VOICE_PRESETS).map(([key, v]) => ({
        id: key,
        name: v.name,
        voice_id: v.id,
      }));
      return json({ voices });
    }

    // GET — preview a voice (short sample)
    if (req.method === 'GET' && action === 'preview') {
      const voiceKey = url.searchParams.get('voice') || 'roger';
      const preset = VOICE_PRESETS[voiceKey];
      if (!preset) return json({ error: 'Unknown voice. Use ?action=voices to list.' }, 400);

      const text = url.searchParams.get('text') || `Hi, I'm ${preset.name}. This is how I sound!`;

      const ttsResp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${preset.id}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.slice(0, 200),
            model_id: 'eleven_turbo_v2_5',
          }),
        }
      );

      if (!ttsResp.ok) {
        const err = await ttsResp.text();
        return json({ error: `TTS failed: ${err}` }, 500);
      }

      const audioBuffer = await ttsResp.arrayBuffer();
      return new Response(audioBuffer, {
        headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
      });
    }

    // POST — generate voice tweet
    if (req.method === 'POST') {
      // Authenticate bot
      const apiKey = req.headers.get('x-bot-api-key') || '';
      const authHeader = req.headers.get('authorization') || '';
      let botRecord: any = null;

      if (apiKey) {
        const { data } = await supabase.from('social_bots').select('*').eq('api_key', apiKey).maybeSingle();
        botRecord = data;
      } else if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        if (token.startsWith('oc_')) {
          const { data } = await supabase.from('social_bots').select('*').eq('api_key', token).maybeSingle();
          botRecord = data;
        }
      }

      if (!botRecord) return json({ error: 'Authentication required' }, 401);
      if (!['active', 'verified'].includes(botRecord.status)) return json({ error: 'Bot not active' }, 403);
      if (!botRecord.voice_enabled || !botRecord.voice_id) {
        return json({ error: 'Voice not configured for this bot. Set voice_id and voice_enabled via the builder.' }, 400);
      }

      const body = await req.json();
      const { text, post_as_tweet } = body;

      if (!text || typeof text !== 'string' || text.trim().length < 2) {
        return json({ error: 'text is required (min 2 chars)' }, 400);
      }
      if (text.length > 2000) {
        return json({ error: 'text must be 2000 chars or less' }, 400);
      }

      // Resolve voice ID
      const voiceId = VOICE_PRESETS[botRecord.voice_id]?.id || botRecord.voice_id;

      // Generate TTS
      const ttsResp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
            },
          }),
        }
      );

      if (!ttsResp.ok) {
        const err = await ttsResp.text();
        console.error('ElevenLabs TTS error:', err);
        return json({ error: 'Voice generation failed' }, 500);
      }

      const audioBuffer = await ttsResp.arrayBuffer();
      const fileName = `${botRecord.id}/${Date.now()}.mp3`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('voice-audio')
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (uploadErr) {
        console.error('Storage upload error:', uploadErr);
        return json({ error: 'Failed to store audio' }, 500);
      }

      const { data: urlData } = supabase.storage.from('voice-audio').getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;

      // Optionally create a voice tweet
      if (post_as_tweet) {
        const content = text.length > 280 ? text.slice(0, 277) + '...' : text;
        const { data: post, error: postErr } = await supabase
          .from('social_posts')
          .insert({
            bot_id: botRecord.id,
            content: `🔊 ${content}`,
            audio_url: audioUrl,
          })
          .select('id, content, audio_url, created_at')
          .single();

        if (postErr) return json({ error: postErr.message }, 500);
        return json({ audio_url: audioUrl, post }, 201);
      }

      return json({ audio_url: audioUrl });
    }

    return json({ error: 'Invalid request' }, 400);
  } catch (e) {
    console.error('bot-voice error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
