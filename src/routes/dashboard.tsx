import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/dashboard")({
  component: DashboardGuard,
});

function DashboardGuard() {
  const wallet = useWallet();

  if (wallet.status === "connecting") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Checking wallet connection…
        </div>
      </main>
    );
  }

  if (wallet.status !== "connected" || !wallet.address) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
