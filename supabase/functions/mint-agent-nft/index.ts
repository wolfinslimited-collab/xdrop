import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const tatumApiKey = Deno.env.get("TATUM_API_KEY") ?? "";

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  if (!tatumApiKey) {
    return new Response(JSON.stringify({ error: "TATUM_API_KEY not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("Not authenticated");

    const { agentId, agentName, agentDescription, agentCategory, agentAvatar, pricePaid } = await req.json();
    if (!agentId || !agentName) throw new Error("Missing agent data");

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get serial number
    const { data: serialData } = await serviceClient.rpc("next_nft_serial", { p_agent_name: agentName });
    const serialNumber = serialData || 1;

    const tokenName = `${agentName} #${serialNumber}`;
    const tokenSymbol = "XCLAW";

    // 2. Generate AI art for the NFT card
    console.log("Generating AI art for NFT...");
    const artPrompt = `Create a premium digital collectible NFT card art for an AI agent called "${agentName}". Category: ${agentCategory || "AI Agent"}. Description: ${agentDescription || agentName}. The card should have a futuristic cyberpunk aesthetic with glowing neon accents, dark background, circuit board patterns, and a central holographic icon representing the agent. Include text "${tokenName}" at the bottom. Style: high-quality digital art, trading card format, portrait orientation. Ultra high resolution.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: artPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI image generation failed: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error("No image generated from AI");
    }

    // 3. Upload image to Supabase Storage
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const imagePath = `${agentId}/${serialNumber}.png`;

    const { error: uploadError } = await serviceClient.storage
      .from("nft-images")
      .upload(imagePath, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) throw new Error("Failed to upload NFT image: " + uploadError.message);

    const { data: publicUrlData } = serviceClient.storage.from("nft-images").getPublicUrl(imagePath);
    const imageUrl = publicUrlData.publicUrl;

    // 4. Create NFT metadata (Metaplex standard)
    const metadata = {
      name: tokenName,
      symbol: tokenSymbol,
      description: `OpenClaw AI Agent NFT - ${agentDescription || agentName}. Serial #${serialNumber}. Purchased for $${pricePaid || 100} USDC.`,
      image: imageUrl,
      external_url: "https://xdrop.lovable.app/marketplace",
      attributes: [
        { trait_type: "Agent Name", value: agentName },
        { trait_type: "Category", value: agentCategory || "General" },
        { trait_type: "Serial Number", value: serialNumber.toString() },
        { trait_type: "Price Paid (USDC)", value: (pricePaid || 100).toString() },
        { trait_type: "Avatar", value: agentAvatar || "🤖" },
        { trait_type: "Platform", value: "OpenClaw / XDROP" },
      ],
      properties: {
        category: "image",
        creators: [{ address: "", share: 100 }],
      },
    };

    // Upload metadata JSON to storage
    const metadataPath = `${agentId}/${serialNumber}_metadata.json`;
    const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));

    await serviceClient.storage
      .from("nft-images")
      .upload(metadataPath, metadataBytes, { contentType: "application/json", upsert: true });

    const { data: metadataUrlData } = serviceClient.storage.from("nft-images").getPublicUrl(metadataPath);
    const metadataUri = metadataUrlData.publicUrl;

    // 5. Mint NFT via Tatum API on Solana
    let mintAddress = null;
    let mintTxHash = null;
    let nftStatus = "metadata_ready";

    try {
      // Get user's wallet address
      const { data: wallet } = await serviceClient
        .from("wallets")
        .select("address")
        .eq("user_id", user.id)
        .eq("network", "solana")
        .single();

      if (wallet?.address) {
        const mintResponse = await fetch("https://api.tatum.io/v3/nft/mint", {
          method: "POST",
          headers: {
            "x-api-key": tatumApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chain: "SOL",
            to: wallet.address,
            url: metadataUri,
          }),
        });

        if (mintResponse.ok) {
          const mintData = await mintResponse.json();
          mintAddress = mintData.nftAddress || mintData.contractAddress || null;
          mintTxHash = mintData.txId || mintData.signatureId || null;
          nftStatus = "minted";
          console.log("NFT minted successfully:", mintData);
        } else {
          const mintErr = await mintResponse.text();
          console.error("Tatum mint failed (non-fatal):", mintErr);
          nftStatus = "mint_failed";
        }
      } else {
        console.log("No wallet found, storing metadata only");
        nftStatus = "no_wallet";
      }
    } catch (mintErr) {
      console.error("Minting error (non-fatal):", mintErr);
      nftStatus = "mint_failed";
    }

    // 6. Save NFT record to database
    const { data: nftRecord, error: nftError } = await serviceClient
      .from("agent_nfts")
      .insert({
        agent_id: agentId,
        user_id: user.id,
        mint_address: mintAddress,
        metadata_uri: metadataUri,
        image_url: imageUrl,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        serial_number: serialNumber,
        status: nftStatus,
        mint_tx_hash: mintTxHash,
        minted_at: nftStatus === "minted" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (nftError) throw new Error("Failed to save NFT record: " + nftError.message);

    return new Response(
      JSON.stringify({
        success: true,
        nft: nftRecord,
        imageUrl,
        metadataUri,
        mintAddress,
        status: nftStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("mint-agent-nft error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
