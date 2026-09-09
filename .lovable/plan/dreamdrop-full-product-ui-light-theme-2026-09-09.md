# DreamDrop — full product UI (light theme)

Build the complete clickable DreamDrop experience from your brief, with one deliberate change: a **light-first** interface instead of the dark-first one described in the document. Everything else — copy, pages, states, product rules — follows the brief.

## Look and feel

- Light canvas: soft off-white background, white raised cards, thin hairline borders, generous space.
- Electric blue/violet accent for brand moments and main buttons.
- UP = confident green-teal treatment with a "↑ UP" label; DOWN = warm coral with "↓ DOWN". Never colour alone.
- Restrained soft-shadow lift (instead of dark-mode glow) on live tickets, reveals and key buttons.
- No neon, no casino, no glassmorphism, no generic coin art.
- The **Prediction Ticket** is the signature object: event-ticket/wallet-pass feel with a subtle perforated edge, reused everywhere.

## Pages

1. Landing (`/`) — hero with animated live ticket, "don't ask users to buy their first prediction", how it works, interactive reveal demo, six use cases, why DreamDrop, mock campaign, final CTA, footer.
2. Creator dashboard (`/dashboard`) — metrics, campaign list, activity feed.
3. Create wizard (`/create`) — market pick, configure with live preview, review, simulated transaction progress modal.
4. Campaign success — celebration, QR, tabs, copy/download actions.
5. Campaign detail (`/dashboard/campaign/:id`) — metrics, claim progress, recent claims, QR actions.
6. Claim flow (`/claim/:code`) — mobile-first sealed ticket, wallet choice incl. demo wallet, claim progress, reveal WOW screen.
7. Position detail (`/position/:id`) — ticket, probability timeline, details, actions.
8. Cash-out — quote modal with expiring countdown, no-liquidity state, success screen.
9. My Drops (`/my-drops`) — Active / Settled / All tabs.
10. Settlement — winner, loser, redeem success.
11. Claim errors — already claimed, expired, invalid, failed.
12. Explore (`/explore`) — light market cards, not a trading terminal.

Every async screen gets loading, empty and error states. Wallet states: disconnected, connecting, connected, wrong network.

## Product rules honoured

- Market probability and cash-out available always shown as separate figures.
- Nothing implies a confirmed transaction before confirmation.
- Recipient screens hide chain jargon; creator screens may show more.

## Technical notes

- TanStack Start routes under `src/routes`, React + TypeScript, Tailwind v4 tokens in `src/styles.css`, shadcn components.
- Light palette defined as semantic tokens in `:root`; no hardcoded colour utilities in components.
- Typed mock data behind `marketService`, `campaignService`, `claimService`, `positionService` with small artificial delays, so a real backend can replace them later. No mock values inline in pages.
- Shared components: PredictionTicket, MarketCard, CampaignCard, MetricCard, LiveBadge, Countdown, ProbabilityDisplay, CashoutQuote, ClaimProgress, WalletButton, TransactionProgress, QRCard, StatusBadge, ActivityItem, EmptyState, ErrorState, ConfirmModal, PageHeader, MobileBottomAction.
- Mobile tuned at 375/390/430px: full-width ticket, sticky bottom actions, modals as bottom sheets, no horizontal overflow.
- Accessibility: semantic HTML, focus rings, keyboard-navigable dialogs, text labels beside icons.
- Per-page titles and descriptions for search/social previews.

## Build order

1. Light design tokens + Prediction Ticket + shared components + mock services.
2. Landing page.
3. Creator side: dashboard, create wizard, success, campaign detail.
4. Recipient side: claim, reveal, position, cash-out, My Drops, settlement, errors.
5. Explore, error/empty states, mobile and accessibility pass.
