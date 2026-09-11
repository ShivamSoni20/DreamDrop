import { Loader2, Wallet } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/wallet";
import { shortAddress } from "@/lib/format";

export function WalletButton({ className }: { className?: string }) {
  const { status, address, connect, disconnect, switchNetwork } = useWallet();
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      await connect();
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed.");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    void navigate({ to: "/", replace: true });
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Network switch failed.");
    }
  };

  if (status === "connecting") {
    return (
      <Button disabled variant="outline" className={className}>
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Connecting…
      </Button>
    );
  }

  if (status === "wrong-network") {
    return (
      <Button
        variant="destructive"
        onClick={() => void handleSwitchNetwork()}
        className={className}
      >
        Wrong network — switch to Somnia
      </Button>
    );
  }

  if (status === "connected" && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            <span className="size-2 rounded-full bg-live" aria-hidden="true" />
            {shortAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>Somnia Shannon</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect}>Disconnect</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => void handleConnect()} className={className}>
      <Wallet className="size-4" aria-hidden="true" />
      Connect wallet
    </Button>
  );
}
