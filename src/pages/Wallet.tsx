import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet, WalletInfo, Transaction } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  Wallet as WalletIcon,
  Copy,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUPPORTED_CHAINS = [
  { label: "SOL", name: "Solana" },
  { label: "USDC-SOL", name: "USDC (Solana)" },
];

export default function Wallet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const wallet = useWallet();

  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [activeTab, setActiveTab] = useState("wallets");

  // Send form state
  const [sendChain, setSendChain] = useState("");
  const [sendFrom, setSendFrom] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  // Generate wallet state removed - always Solana

  const loadWallets = useCallback(async () => {
    const result = await wallet.listWallets();
    if (result) setWallets(result);
  }, [wallet]);

  const loadTransactions = useCallback(async () => {
    const result = await wallet.getTransactions();
    if (result) setTransactions(result);
  }, [wallet]);

  useEffect(() => {
    if (!user) return;
    loadWallets();
    loadTransactions();
  }, [user]);

  const refreshBalance = async (w: WalletInfo) => {
    const result = await wallet.getBalance(w.chain, w.address);
    if (result) {
      setBalances((prev) => ({ ...prev, [w.id]: result.balance }));
    }
  };

  const refreshAllBalances = async () => {
    for (const w of wallets) {
      await refreshBalance(w);
    }
  };

  const handleGenerate = async () => {
    if (wallets.length > 0) {
      toast({ title: "Limit reached", description: "Only one wallet per user is allowed", variant: "destructive" });
      return;
    }
    const chain = "SOL";
    const derivationIndex = 1;
    const result = await wallet.generateWallet(chain, derivationIndex);
    if (result) {
      toast({ title: "Wallet created", description: "Solana wallet generated successfully" });
      loadWallets();
    } else if (wallet.error) {
      toast({ title: "Error", description: wallet.error, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!sendChain || !sendFrom || !sendTo || !sendAmount) {
      toast({ title: "Missing fields", description: "Fill in all fields", variant: "destructive" });
      return;
    }
    const result = await wallet.sendTransaction(sendChain, sendFrom, sendTo, sendAmount);
    if (result) {
      toast({ title: "Transaction sent", description: `TX: ${result.txId}` });
      setSendTo("");
      setSendAmount("");
      loadTransactions();
      refreshAllBalances();
    } else if (wallet.error) {
      toast({ title: "Transaction failed", description: wallet.error, variant: "destructive" });
    }
  };

  const handleDelete = async (walletId: string) => {
    const result = await wallet.deleteWallet(walletId);
    if (result?.success) {
      toast({ title: "Wallet deleted" });
      loadWallets();
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied", description: "Address copied to clipboard" });
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="p-8 text-center max-w-md">
            <WalletIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign in to access your wallet</h2>
            <p className="text-muted-foreground mb-4">Connect your account to manage crypto wallets.</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead title="Wallet — xDrop" description="Manage your crypto wallets" />
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Wallet</h1>
          <Button variant="outline" size="sm" onClick={refreshAllBalances} disabled={wallet.loading}>
            <RefreshCw className={`h-4 w-4 ${wallet.loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* ── Wallets Tab ── */}
          <TabsContent value="wallets" className="space-y-4 mt-4">
            {/* Generate new wallet */}
            {wallets.length === 0 && (
              <Card className="p-4 border-dashed border-2 border-border">
                <Button onClick={handleGenerate} disabled={wallet.loading} className="w-full">
                  <Plus className="h-4 w-4 mr-1" /> Generate Solana Wallet
                </Button>
              </Card>
            )}

            {wallets.length === 0 && !wallet.loading && (
              <p className="text-muted-foreground text-center py-8">
                No wallets yet. Generate one above to get started.
              </p>
            )}

            {wallets.map((w) => (
              <Card
                key={w.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-secondary/50 ${
                  selectedWallet?.id === w.id ? "ring-1 ring-accent" : ""
                }`}
                onClick={() => setSelectedWallet(selectedWallet?.id === w.id ? null : w)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{w.chain}</span>
                      <span className="text-xs text-muted-foreground">{w.label}</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{w.address}</p>
                    <p className="text-lg font-bold">
                      {balances[w.id] !== undefined ? `${balances[w.id]} ${w.chain}` : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAddress(w.address);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshBalance(w);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(w.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Expanded: show QR deposit address */}
                {selectedWallet?.id === w.id && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">Deposit Address</p>
                    <div className="bg-white p-3 rounded-lg">
                      <QRCodeSVG value={w.address} size={160} />
                    </div>
                    <p className="text-xs font-mono text-center break-all max-w-xs">{w.address}</p>
                    <Button variant="outline" size="sm" onClick={() => copyAddress(w.address)}>
                      <Copy className="h-3 w-3 mr-1" /> Copy Address
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* ── Send Tab ── */}
          <TabsContent value="send" className="space-y-4 mt-4">
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Crypto
              </h3>

              <div className="space-y-3">
                <div>
                  <Label>Chain</Label>
                  <Select value={sendChain} onValueChange={(v) => {
                    setSendChain(v);
                    const match = wallets.find((w) => w.chain === v);
                    if (match) setSendFrom(match.address);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CHAINS.map((c) => (
                        <SelectItem key={c.label} value={c.label}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>From Wallet</Label>
                  <Select value={sendFrom} onValueChange={setSendFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets
                        .filter((w) => !sendChain || w.chain === sendChain)
                        .map((w) => (
                          <SelectItem key={w.id} value={w.address}>
                            {w.chain} — {w.address.slice(0, 10)}...{w.address.slice(-6)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>To Address</Label>
                  <Input
                    placeholder="Recipient address"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Amount</Label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    step="any"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleSend} disabled={wallet.loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {wallet.loading ? "Sending..." : "Send Transaction"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ── History Tab ── */}
          <TabsContent value="history" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Transaction History</h3>
              <Button variant="ghost" size="sm" onClick={loadTransactions} disabled={wallet.loading}>
                <RefreshCw className={`h-4 w-4 ${wallet.loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {transactions.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
            )}

            {transactions.map((tx) => (
              <Card key={tx.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {tx.direction === "incoming" ? (
                      <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                        <ArrowDownLeft className="h-4 w-4 text-success" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.direction}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.chain} • {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.direction === "incoming" ? "text-success" : ""}`}>
                      {tx.direction === "incoming" ? "+" : "-"}
                      {tx.amount} {tx.chain}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                  </div>
                </div>
                {tx.tx_hash && (
                  <p className="text-xs font-mono text-muted-foreground mt-2 truncate">
                    TX: {tx.tx_hash}
                  </p>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
