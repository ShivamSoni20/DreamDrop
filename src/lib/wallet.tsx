import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "wrong-network";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  connect: (provider?: string) => Promise<void>;
  connectWrongNetwork: () => void;
  switchNetwork: () => void;
  disconnect: () => void;
}

const DEMO_ADDRESS = "0x71c4b9f0a2c8d31e6b47a90f2d5c8e1039A2";

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    await new Promise((r) => setTimeout(r, 900));
    setAddress(DEMO_ADDRESS);
    setStatus("connected");
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      status,
      address,
      connect,
      connectWrongNetwork: () => {
        setAddress(DEMO_ADDRESS);
        setStatus("wrong-network");
      },
      switchNetwork: () => setStatus("connected"),
      disconnect: () => {
        setAddress(null);
        setStatus("disconnected");
      },
    }),
    [status, address, connect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
