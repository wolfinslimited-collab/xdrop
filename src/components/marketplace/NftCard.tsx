import { ExternalLink, Hexagon, Hash, Coins, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NftCardProps {
  nft: {
    id: string;
    token_name: string;
    token_symbol: string;
    serial_number: number;
    image_url: string | null;
    mint_address: string | null;
    metadata_uri: string | null;
    status: string;
    mint_tx_hash: string | null;
    created_at: string;
    minted_at: string | null;
    agent_id: string;
  };
  agentName?: string;
  agentCategory?: string;
  pricePaid?: number;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  minted: { label: 'Minted', icon: <CheckCircle className="w-3 h-3" />, className: 'bg-muted text-foreground' },
  metadata_ready: { label: 'Metadata Ready', icon: <Clock className="w-3 h-3" />, className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', icon: <Loader2 className="w-3 h-3 animate-spin" />, className: 'bg-muted text-muted-foreground' },
  mint_failed: { label: 'Mint Failed', icon: <AlertCircle className="w-3 h-3" />, className: 'bg-muted text-muted-foreground' },
  no_wallet: { label: 'No Wallet', icon: <AlertCircle className="w-3 h-3" />, className: 'bg-muted text-muted-foreground' },
};

export default function NftCard({ nft, agentName, agentCategory, pricePaid }: NftCardProps) {
  const status = statusConfig[nft.status] || statusConfig.pending;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-muted-foreground/30 transition-all">
      {/* NFT Image */}
      <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
        {nft.image_url ? (
          <img
            src={nft.image_url}
            alt={nft.token_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Hexagon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Serial badge overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-mono">
            <Hash className="w-3 h-3 mr-0.5" />
            {nft.serial_number}
          </Badge>
        </div>
        {/* Status overlay */}
        <div className="absolute bottom-2 left-2">
          <Badge className={`${status.className} text-[10px] gap-1`}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="text-sm font-bold text-foreground truncate">{nft.token_name}</h3>
          <p className="text-[10px] text-muted-foreground">{agentCategory || 'AI Agent'} · {nft.token_symbol}</p>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <Coins className="w-3 h-3" />
            ${pricePaid || 100} USDC
          </span>
          <span className="text-muted-foreground">
            {new Date(nft.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Mint address */}
        {nft.mint_address && (
          <a
            href={`https://solscan.io/token/${nft.mint_address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate font-mono">{nft.mint_address}</span>
          </a>
        )}

        {nft.mint_tx_hash && (
          <a
            href={`https://solscan.io/tx/${nft.mint_tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            View Transaction
          </a>
        )}
      </div>
    </div>
  );
}
