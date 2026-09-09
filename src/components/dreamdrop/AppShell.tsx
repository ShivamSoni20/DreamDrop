import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main
        className={`mx-auto w-full flex-1 px-4 py-8 sm:py-12 ${
          wide ? "max-w-7xl" : "max-w-6xl"
        }`}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
