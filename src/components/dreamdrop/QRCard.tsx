import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function QRCard({
  value,
  label,
  caption,
  size = 208,
}: {
  value: string;
  label: string;
  caption?: string;
  size?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = wrapper.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${label.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success("Claim link copied");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <div ref={wrapper} className="mx-auto mt-4 w-fit rounded-xl border border-border bg-card p-3">
        <QRCodeCanvas value={value} size={size} level="M" marginSize={1} />
      </div>
      {caption ? <p className="mt-3 text-sm text-muted-foreground">{caption}</p> : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="outline" onClick={copy}>
          <Copy className="size-4" aria-hidden="true" />
          Copy link
        </Button>
        <Button variant="outline" onClick={download}>
          <Download className="size-4" aria-hidden="true" />
          Download QR
        </Button>
      </div>
    </div>
  );
}
