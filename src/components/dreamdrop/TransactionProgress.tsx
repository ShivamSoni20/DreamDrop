import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepList({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  return (
    <ol className="space-y-3" aria-live="polite">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done
                  ? "border-transparent bg-up text-up-foreground"
                  : active
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : active ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium" : done ? "" : "text-muted-foreground",
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function useSimulatedSteps(steps: string[], running: boolean, stepMs = 850) {
  const [index, setIndex] = useState(0);
  const done = index >= steps.length;

  useEffect(() => {
    if (!running) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((prev) => (prev >= steps.length ? prev : prev + 1));
    }, stepMs);
    return () => clearInterval(id);
  }, [running, steps.length, stepMs]);

  return { index, done };
}

export function ClaimProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <StepList
      steps={["Signing claim", "Sending prediction", "Confirmed"]}
      activeIndex={activeIndex}
    />
  );
}
