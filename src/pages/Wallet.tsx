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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Wallet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const wallet = useWallet();

  const [myWallet, setMyWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState("wallet");

  // Send form
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  const loadWallet = useCallback(async () => {
    const result = await wallet.listWallets();
    if (result && result.length > 0) {
      setMyWallet(result[0]);
    } else {
      setMyWallet(null);
    }
  }, [wallet]);

  const loadTransactions = useCallback(async () => {
    const result = await wallet.getTransactions();
    if (result) setTransactions(result);
  }, [wallet]);

  useEffect(() => {
    if (!user) return;
    loadWallet();
    loadTransactions();
  }, [user]);

  const refreshBalance = useCallback(async () => {
    if (!myWallet) return;
    const result = await wallet.getBalance(myWallet.chain, myWallet.address);
    if (result) setBalance(result.balance);
  }, [myWallet, wallet]);

  useEffect(() => {
    if (myWallet) refreshBalance();
  }, [myWallet]);

  const handleGenerate = async () => {
    if (myWallet) {
      toast({ title: "Limit reached", description: "Only one wallet per user", variant: "destructive" });
      return;
    }
    const result = await wallet.generateWallet("SOL", 1);
    if (result) {
      toast({ title: "Wallet created", description: "Your USDC wallet is ready" });
      loadWallet();
    } else if (wallet.error) {
      toast({ title: "Error", description: wallet.error, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!myWallet || !sendTo || !sendAmount) {
      toast({ title: "Missing fields", description: "Fill in all fields", variant: "destructive" });
      return;
    }
    const result = await wallet.sendTransaction(myWallet.chain, myWallet.address, sendTo, sendAmount);
    if (result) {
      toast({ title: "Transaction sent", description: `TX: ${result.txId}` });
      setSendTo("");
      setSendAmount("");
      loadTransactions();
      refreshBalance();
    } else if (wallet.error) {
      toast({ title: "Transaction failed", description: wallet.error, variant: "destructive" });
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
            <p className="text-muted-foreground mb-4">Connect your account to manage your USDC wallet.</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead title="Wallet — xDrop" description="Manage your USDC wallet" />
      <div className="flex-1 max-w-md w-full mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Wallet</h1>
          {myWallet && (
            <Button variant="outline" size="sm" onClick={refreshBalance} disabled={wallet.loading}>
              <RefreshCw className={`h-4 w-4 ${wallet.loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {/* No wallet yet */}
        {!myWallet && !wallet.loading && (
          <Card className="p-8 text-center space-y-4 border-dashed border-2 border-border">
            <WalletIcon className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">You don't have a wallet yet.</p>
            <Button onClick={handleGenerate} disabled={wallet.loading}>
              <Plus className="h-4 w-4 mr-1" /> Create USDC Wallet
            </Button>
          </Card>
        )}

        {/* Wallet exists */}
        {myWallet && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="send">Send</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* ── Wallet / Deposit Tab ── */}
            <TabsContent value="wallet" className="mt-4 space-y-4">
              {/* Balance card */}
              <Card className="p-5 text-center space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">USDC Balance</p>
                <p className="text-3xl font-bold font-['Space_Grotesk']">
                  {balance !== null ? `$${balance}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Solana Network</p>
              </Card>

              {/* QR Deposit */}
              <Card className="p-5 flex flex-col items-center gap-4">
                <p className="text-sm font-medium">Deposit USDC (Solana)</p>
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={myWallet.address} size={180} />
                </div>
                <p className="text-xs font-mono text-muted-foreground text-center break-all px-2">
                  {myWallet.address}
                </p>
                <Button variant="outline" size="sm" onClick={() => copyAddress(myWallet.address)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy Address
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Only send USDC on Solana to this address. Other tokens may be lost.
                </p>
              </Card>
            </TabsContent>

            {/* ── Send Tab ── */}
            <TabsContent value="send" className="mt-4">
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Send className="h-4 w-4" /> Send USDC
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>To Address</Label>
                    <Input
                      placeholder="Recipient Solana address"
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Amount (USDC)</Label>
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
                    {wallet.loading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* ── History Tab ── */}
            <TabsContent value="history" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Transactions</h3>
                <Button variant="ghost" size="sm" onClick={loadTransactions} disabled={wallet.loading}>
                  <RefreshCw className={`h-4 w-4 ${wallet.loading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {transactions.length === 0 && (
                <p className="text-muted-foreground text-center py-8 text-sm">No transactions yet.</p>
              )}

              {transactions.map((tx) => (
                <Card key={tx.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tx.direction === "incoming" ? (
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.direction}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${tx.direction === "incoming" ? "text-emerald-400" : ""}`}>
                        {tx.direction === "incoming" ? "+" : "-"}${tx.amount}
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
        )}
      </div>
    </PageLayout>
  );
}
