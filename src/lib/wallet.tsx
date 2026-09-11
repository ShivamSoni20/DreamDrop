import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { appConfig } from "./config";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "wrong-network";
interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}
interface WalletState {
  status: WalletStatus;
  address: string | null;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  disconnect: () => void;
}

const DEMO_ADDRESS = "0x71c4b9f0a2c8d31e6b47a90f2d5c8e1039A2";
const WalletContext = createContext<WalletState | null>(null);
const expectedChainHex = `0x${appConfig.chainId.toString(16)}`;
const getProvider = () => (typeof window === "undefined" ? undefined : window.ethereum);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>(() =>
    appConfig.dataMode === "live" ? "connecting" : "disconnected",
  );
  const [address, setAddress] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (appConfig.dataMode === "mock") return;
    const provider = getProvider();
    if (!provider) {
      setAddress(null);
      setStatus("disconnected");
      return;
    }
    const [accounts, chainId] = await Promise.all([
      provider.request({ method: "eth_accounts" }) as Promise<string[]>,
      provider.request({ method: "eth_chainId" }) as Promise<string>,
    ]);
    const nextAddress = accounts[0] ?? null;
    setAddress(nextAddress);
    setStatus(
      !nextAddress
        ? "disconnected"
        : chainId.toLowerCase() === expectedChainHex
          ? "connected"
          : "wrong-network",
    );
  }, []);

  useEffect(() => {
    void refresh();
    const provider = getProvider();
    if (!provider?.on) return;
    const listener = () => void refresh();
    provider.on("accountsChanged", listener);
    provider.on("chainChanged", listener);
    return () => {
      provider.removeListener?.("accountsChanged", listener);
      provider.removeListener?.("chainChanged", listener);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    if (appConfig.dataMode === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAddress(DEMO_ADDRESS);
      setStatus("connected");
      return;
    }
    const provider = getProvider();
    if (!provider) {
      setStatus("disconnected");
      throw new Error("No injected wallet found. Install MetaMask or another EVM wallet.");
    }
    await provider.request({ method: "eth_requestAccounts" });
    await refresh();
  }, [refresh]);

  const switchNetwork = useCallback(async () => {
    if (appConfig.dataMode === "mock") {
      setStatus("connected");
      return;
    }
    const provider = getProvider();
    if (!provider) throw new Error("No injected wallet found.");
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: expectedChainHex }],
      });
    } catch (error) {
      if ((error as { code?: number }).code !== 4902) throw error;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: expectedChainHex,
            chainName: "Somnia Shannon Testnet",
            nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
            rpcUrls: [appConfig.rpcUrl],
            blockExplorerUrls: [appConfig.explorerUrl],
          },
        ],
      });
    }
    await refresh();
  }, [refresh]);

  const value = useMemo<WalletState>(
    () => ({
      status,
      address,
      connect,
      switchNetwork,
      disconnect: () => {
        setAddress(null);
        setStatus("disconnected");
      },
    }),
    [status, address, connect, switchNetwork],
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}
