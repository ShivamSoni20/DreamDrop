import { Loader2, Wallet } from "lucide-react";
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
      <Button variant="destructive" onClick={switchNetwork} className={className}>
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
          <DropdownMenuItem onClick={disconnect}>Disconnect</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => void connect()} className={className}>
      <Wallet className="size-4" aria-hidden="true" />
      Connect wallet
    </Button>
  );
}
