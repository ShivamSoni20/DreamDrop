import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { pct, usd } from "@/lib/format";
import type { CashoutQuote, Position } from "@/lib/types";
import { getCashoutQuote } from "@/services/positionService";
import { MoneyRow } from "./primitives";
import { isCashoutQuoteUsable } from "@/lib/campaign-rules";

export function CashoutDialog({
  position,
  open,
  onOpenChange,
  onConfirmed,
}: {
  position: Position;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: (price: number) => Promise<void> | void;
}) {
  const [quote, setQuote] = useState<CashoutQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadQuote = async () => {
    setLoading(true);
    const next = await getCashoutQuote(position.id);
    setQuote(next);
    setSeconds(Math.max(0, Math.ceil((next.expiresAt - Date.now()) / 1000)));
    setLoading(false);
  };

  useEffect(() => {
    if (open) void loadQuote();
    else {
      setQuote(null);
      setSeconds(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, position.id]);

  useEffect(() => {
    if (!quote?.canCashOut || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [quote, seconds]);

  const expired = Boolean(quote?.canCashOut) && seconds <= 0;
  const fullFill = quote ? quote.executableQuantity >= position.quantity : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {loading || !quote ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Fetching best price…
          </div>
        ) : !quote.canCashOut || !fullFill ? (
          <>
            <DialogHeader>
              <DialogTitle>No cash-out liquidity right now</DialogTitle>
              <DialogDescription>
                There isn't currently an executable buyer for your full position. You can continue
                holding until settlement.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Keep holding</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Cash out {position.asset} {position.side}?
              </DialogTitle>
              <DialogDescription>
                Market probability and executable price are separate numbers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Position</span>
                <span className="text-sm font-medium">{position.quantity} contract</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Market probability</span>
                <span className="text-sm font-medium">{pct(quote.marketProbability)}</span>
              </div>
              <MoneyRow label="Best executable price" value={quote.bestExecutablePrice ?? 0} />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Available at this price</span>
                <span className="text-sm font-medium">{quote.executableQuantity} contract</span>
              </div>
              <MoneyRow label="Estimated proceeds" value={quote.estimatedProceeds ?? 0} emphasis />
              <MoneyRow label="Minimum received" value={quote.minimumProceeds ?? 0} />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Quote expires</span>
                <span className="font-mono text-sm tabular-nums">
                  {expired ? "expired" : `${String(seconds).padStart(2, "0")}s`}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Keep holding
              </Button>
              {expired ? (
                <Button onClick={() => void loadQuote()}>Refresh quote</Button>
              ) : (
                <Button
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      if (!isCashoutQuoteUsable(quote, position.quantity)) return;
                      await onConfirmed(quote.bestExecutablePrice!);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  Confirm cash out {usd(quote.bestExecutablePrice ?? 0)}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
