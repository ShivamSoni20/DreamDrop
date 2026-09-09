import { Link } from "@tanstack/react-router";
import { Logo } from "./SiteHeader";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Explore markets", to: "/explore" as const },
      { label: "Create a drop", to: "/create" as const },
      { label: "My drops", to: "/my-drops" as const },
    ],
  },
];

const external = [
  { label: "Docs", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "DreamDEX", href: "#" },
  { label: "Somnia", href: "#" },
  { label: "Hackathon", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Built on Somnia. Powered by DreamDEX Event Contracts.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="text-sm font-semibold">Resources</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {external.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-foreground">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Try a drop</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Open a demo claim link and see the full recipient flow.
          </p>
          <Link
            to="/claim/$code"
            params={{ code: "demo" }}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Open demo drop →
          </Link>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        DreamDrop · Airdrops that are live predictions.
      </div>
    </footer>
  );
}
