import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "wallet-proxy";

async function walletCall(action: string, params: Record<string, string> = {}, body?: Record<string, unknown>) {
  const qp = new URLSearchParams({ action, ...params });
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    method: body ? "POST" : "GET",
    body: body ?? undefined,
    headers: { "x-action": action },
  });

  // supabase.functions.invoke doesn't support query params natively,
  // so we'll pass action in the body for POST, or use a workaround
  // Actually let's use the fetch approach for full control
  return { data, error };
}

// Direct fetch for full query param support
async function walletFetch(action: string, params: Record<string, string> = {}, body?: Record<string, unknown>) {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/${FUNCTION_NAME}`;
  const qp = new URLSearchParams({ action, ...params });

  const res = await fetch(`${baseUrl}?${qp}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

export interface WalletInfo {
  id: string;
  chain: string;
  address: string;
  label?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_id?: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  chain: string;
  status: string;
  direction: string;
  created_at: string;
}

export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = useCallback(async <T>(
    action: string,
    params: Record<string, string> = {},
    body?: Record<string, unknown>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await walletFetch(action, params, body);
      return result as T;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const listWallets = useCallback(() => callApi<WalletInfo[]>("list-wallets"), [callApi]);

  const generateWallet = useCallback(
    (chain: string, derivationIndex: number) =>
      callApi<WalletInfo>("generate-user-wallet", {}, { chain, derivationIndex }),
    [callApi]
  );

  const getBalance = useCallback(
    (chain: string, address: string) =>
      callApi<{ balance: string }>("get-balance", { chain, address }),
    [callApi]
  );

  const sendTransaction = useCallback(
    (chain: string, fromAddress: string, toAddress: string, amount: string) =>
      callApi<{ txId: string; transaction: Transaction }>(
        "send-transaction",
        {},
        { chain, fromAddress, toAddress, amount }
      ),
    [callApi]
  );

  const getTransactions = useCallback(
    (walletId?: string) =>
      callApi<Transaction[]>("get-transactions", walletId ? { walletId } : {}),
    [callApi]
  );

  const deleteWallet = useCallback(
    (walletId: string) => callApi<{ success: boolean }>("delete-wallet", { walletId }),
    [callApi]
  );

  return {
    loading,
    error,
    listWallets,
    generateWallet,
    getBalance,
    sendTransaction,
    getTransactions,
    deleteWallet,
  };
}
