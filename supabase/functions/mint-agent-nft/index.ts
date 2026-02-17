import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOTAL_AVATARS = 37;
const SITE_URL = "https://xdrop.lovable.app";

function getAvatarIndex(name: string): number {
  const hash = Array.from(name || "bot").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % TOTAL_AVATARS) + 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

    // 2. Pick a bot avatar deterministically based on agent name
    const avatarIndex = getAvatarIndex(agentName);
    const avatarUrl = `${SITE_URL}/avatars/bot-${avatarIndex}.png`;
    console.log(`Using bot avatar #${avatarIndex} for NFT: ${avatarUrl}`);

    // Fetch the avatar image
    const avatarResponse = await fetch(avatarUrl);
    if (!avatarResponse.ok) {
      throw new Error(`Failed to fetch avatar image: ${avatarResponse.status}`);
    }
    const imageBytes = new Uint8Array(await avatarResponse.arrayBuffer());

    // 3. Upload image to Supabase Storage
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

    // 5. NFT minting - store metadata only (on-chain minting handled separately)
    const nftStatus = "metadata_ready";
    const mintAddress = null;
    const mintTxHash = null;

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
        minted_at: null,
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
