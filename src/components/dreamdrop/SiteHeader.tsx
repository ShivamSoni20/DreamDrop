import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useWallet } from "@/lib/wallet";
import { WalletButton } from "./WalletButton";

const publicLinks = [
  { to: "/", label: "How it works", hash: "how-it-works" },
  { to: "/", label: "Use cases", hash: "use-cases" },
  { to: "/explore", label: "Explore" },
] as const;

const appLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/create", label: "Create drop" },
  { to: "/my-drops", label: "My drops" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-brand">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      DreamDrop
    </Link>
  );
}

export function SiteHeader() {
  const { status } = useWallet();
  const [open, setOpen] = useState(false);
  const links = status === "connected" ? appLinks : publicLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Button key={link.label} asChild variant="ghost" size="sm">
              <Link to={link.to} {...("hash" in link ? { hash: link.hash } : {})}>
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link to="/create">Create drop</Link>
          </Button>
          <WalletButton className="hidden sm:inline-flex" />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="size-4" aria-hidden="true" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-xs p-6">
              <SheetTitle className="font-display">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                {[...publicLinks, ...appLinks].map((link) => (
                  <Button
                    key={link.label}
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <Link
                      to={link.to}
                      {...("hash" in link ? { hash: link.hash } : {})}
                    >
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </nav>
              <div className="mt-6">
                <WalletButton className="w-full" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
