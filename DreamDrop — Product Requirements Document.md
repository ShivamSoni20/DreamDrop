# DreamDrop

## Product Requirements Document

**Product:** DreamDrop  
**Tagline:** Airdrops that are live predictions.  
**Category:** Prediction Markets / Consumer Crypto / Growth Infrastructure  
**Network:** Somnia  
**Core Integration:** DreamDEX Event Contracts  
**Initial Environment:** Somnia Shannon Testnet  
**Primary Build Strategy:** Frontend-first visual prototyping → backend and blockchain integration

---

# 1. Product Summary

DreamDrop allows creators, communities, protocols, brands, and event organizers to distribute real DreamDEX Event Contract positions as promotional rewards.

Instead of giving somebody a normal token, coupon, NFT, or points balance, the creator gives them a live prediction position.

Example:

A creator deposits collateral into a BTC UP/DOWN Event Contract.

DreamDrop mints complete-set positions:

- BTC UP
- BTC DOWN

DreamDrop then divides those positions into individual claimable Prediction Drops.

Recipients scan a QR code or open a claim link.

Instead of being asked to:

1. understand prediction markets,
2. deposit money,
3. discover a market,
4. understand odds,
5. place an order,

the recipient immediately receives a real Event Contract position.

Example recipient experience:

> YOU GOT BTC UP  
> Potential payout: $1.00  
> Current market price: $0.57  
> Cash-out available: $0.54  
> Market ends in 08:21

Actions:

- Hold
- Cash Out
- Redeem after settlement

DreamDrop therefore turns promotional spending directly into DreamDEX position holders.

---

# 2. Product Vision

Turn Event Contract positions into a new internet distribution primitive.

Traditional crypto acquisition:

Marketing campaign  
→ token reward  
→ user receives token  
→ user often immediately sells or ignores it

DreamDrop:

Marketing campaign  
→ live prediction position  
→ user watches its value change  
→ user has a reason to return  
→ user holds, sells, or redeems through DreamDEX  
→ user becomes an active prediction-market participant

The position itself becomes the acquisition experience.

---

# 3. Problem

Prediction markets have high onboarding friction.

A new user usually has to:

- create/connect a wallet;
- obtain funds;
- understand the market;
- understand probabilities;
- understand UP/DOWN positions;
- choose a side;
- place an order;
- understand settlement;
- return later to claim winnings.

For somebody who has never used a prediction market, that is too much work before they experience the product.

At the same time, brands, protocols, creators, communities, conferences, sports communities, and Web3 projects continuously spend money acquiring users through:

- airdrops;
- giveaways;
- coupons;
- NFT claims;
- points;
- token campaigns.

Most of those rewards are static.

Prediction-market positions are different because the reward itself changes value in real time.

---

# 4. Solution

DreamDrop converts creator-funded Event Contract positions into shareable claim objects.

A campaign creator can:

1. connect wallet;
2. choose a live DreamDEX Event Contract;
3. choose campaign budget;
4. choose drop size;
5. mint complete-set UP/DOWN positions;
6. distribute those positions across unique claims;
7. generate QR codes and URLs;
8. share the campaign.

Recipients can:

1. scan;
2. connect wallet;
3. sign a claim authorization;
4. receive the real position;
5. watch its live value;
6. hold;
7. cash out through DreamDEX;
8. redeem after settlement.

---

# 5. Core Product Principle

## Don't make the user buy their first prediction.

Give them one.

This principle should guide every UX and engineering decision.

---

# 6. Target Users

## Persona A — Campaign Creator

Examples:

- Web3 protocol
- creator
- community manager
- hackathon organizer
- conference
- influencer
- crypto project
- gaming community
- trading community

Goal:

> “I want an interesting reward campaign that gets people interacting with my community and DreamDEX.”

Needs:

- easy campaign creation;
- predictable budget;
- QR codes;
- shareable links;
- claim analytics;
- no manual distribution;
- clear campaign status.

---

## Persona B — First-Time Recipient

Potentially knows nothing about DreamDEX.

Goal:

> “I scanned something that says I received a prediction. Show me what I got.”

Needs:

- no jargon;
- no deposit;
- minimal wallet friction;
- clear potential outcome;
- obvious timer;
- clear hold/cash-out choices.

---

## Persona C — Existing DreamDEX User

Goal:

> “I received a free position. Let me inspect the market and trade it.”

Needs:

- current probability;
- executable market price;
- liquidity;
- position size;
- settlement status;
- transaction links.

---

# 7. Jobs To Be Done

## Creator

“When I want to acquire or engage users, let me turn my campaign budget into live prediction rewards so recipients have something interactive rather than another static giveaway.”

## Recipient

“When somebody gives me a prediction reward, let me understand what I received immediately without first learning how prediction-market trading works.”

## DreamDEX Ecosystem

“When outside communities run promotions, let those campaigns naturally create DreamDEX position holders, trades, settlements, and repeat visitors.”

---

# 8. MVP Scope

The MVP must support:

### Creator

- wallet connection;
- live Event Contract discovery;
- choose market;
- choose campaign budget;
- choose position size per drop;
- choose number of drops;
- preview UP/DOWN allocation;
- approve/mint Event Contract positions;
- fund DreamDrop campaign;
- generate unique claims;
- generate QR codes;
- export/share claim links;
- campaign dashboard;
- claim analytics.

### Recipient

- open claim URL;
- see campaign branding;
- connect wallet;
- sign ownership message;
- claim position;
- see claim success;
- see received side;
- see position quantity;
- see current market probability;
- see executable cash-out quote;
- see maximum possible payout;
- see time remaining;
- hold position;
- initiate cash-out;
- redeem winning position after settlement.

### Platform

- campaign state;
- one-time claim protection;
- secure claim secrets;
- market state synchronization;
- position balances;
- executable quotes;
- transaction status;
- on-chain receipts;
- basic campaign analytics.

---

# 9. Explicitly Out of Scope for MVP

Do NOT build these initially:

- AI prediction engine;
- automated trading bot;
- account abstraction stack;
- social graph;
- token incentives;
- referral token;
- NFT system;
- multi-chain support;
- fiat payments;
- secondary DreamDrop marketplace;
- complex campaign templates;
- custom Event Contract creation;
- DAO governance;
- copy trading;
- yield generation;
- advanced market-making;
- mobile native application.

The strength of the project is the distribution mechanic.

Do not bury it under features.

---

# 10. Core User Journey — Creator

## Step 1 — Landing Page

Creator clicks:

**Create a DreamDrop**

If wallet is disconnected:

**Connect Wallet**

---

## Step 2 — Creator Dashboard

Display:

- active campaigns;
- total drops created;
- claimed drops;
- total campaign collateral;
- positions distributed;
- resulting cash-outs/trades;
- recent campaigns.

Primary CTA:

**Create Campaign**

---

## Step 3 — Select Event

Show live DreamDEX Event Contracts.

Each card:

- BTC / ETH asset;
- UP/DOWN question;
- strike/reference value if applicable;
- current UP probability;
- current DOWN probability;
- time remaining;
- liquidity status;
- market status.

Filters:

- BTC
- ETH
- ending soon
- highest liquidity

Only permit campaign creation on markets confirmed as actively trading.

---

## Step 4 — Configure Campaign

Fields:

### Campaign name

Example:

Somnia Hacker Night Drop

### Campaign budget

Example:

10 collateral units

### Drop size

Example:

1 contract per recipient

### Side allocation

Default:

50% UP  
50% DOWN

For MVP sides are preassigned when claims are generated.

Recipients do not choose the side.

This preserves the “mystery prediction” mechanic.

### Campaign branding

Optional:

- logo
- campaign title
- message
- accent image

---

# 11. Drop Calculation

Example:

Creator funds:

10 collateral units

DreamDEX complete set produces:

10 UP  
10 DOWN

At one contract per DreamDrop:

10 UP drops  
10 DOWN drops

Total:

20 DreamDrops

UI should make this calculation extremely obvious.

Example visualization:

$10 Campaign Budget

↓

10 UP + 10 DOWN positions

↓

20 Prediction Drops

---

# 12. Campaign Review

Before creation display:

Market:
BTC — Current Window

Budget:
10 collateral

Position size:
1 contract

Drops:
20

UP:
10

DOWN:
10

Expiry:
12 minutes

Estimated transactions:

1. authorize/mint positions
2. fund DreamDrop campaign

CTA:

**Create 20 DreamDrops**

---

# 13. Campaign Creation Success

Success screen should feel celebratory.

Headline:

**Your DreamDrops are live.**

Show:

20 Drops

0 Claimed

12:04 Remaining

Actions:

- Show Master QR
- View Individual Drops
- Copy Campaign Link
- Download QR Pack
- Open Campaign Dashboard

---

# 14. Claim Distribution Model

Every DreamDrop must be redeemable only once.

Recommended architecture:

Each campaign generates cryptographically random claim secrets.

Each claim represents:

- campaign ID;
- claim index;
- token side;
- token ID;
- quantity;
- secret commitment;
- claimed status.

Generate a Merkle root covering all valid claims.

Only the root is required on-chain.

The private claim URL contains the secret associated with that particular drop.

Example:

`dreamdrop.xyz/c/abc123`

The claim must be bound to the recipient wallet during redemption.

Recipient signs a message containing at minimum:

- campaign;
- claim;
- recipient address;
- chain;
- deadline.

The relayer verifies the authorization and submits the claim transaction.

This prevents a simple URL interception from redirecting the claim to an arbitrary wallet.

---

# 15. Recipient Journey

## Step 1 — Open Claim

Recipient scans:

QR

or opens:

DreamDrop URL

---

## Step 2 — Reveal Screen

Do NOT immediately overwhelm them with blockchain details.

Display:

**Someone sent you a live prediction.**

BTC · 15 minute market

Mystery side

Worth up to:

$1.00

CTA:

**Reveal My DreamDrop**

Small text:

No purchase required.

---

# 16. Wallet Connection

After reveal CTA:

Connect Wallet

Support:

- MetaMask
- WalletConnect-compatible wallets

Later additional embedded-wallet support can be added.

---

# 17. Gasless Claim UX

Preferred experience:

Recipient signs a message.

DreamDrop relayer pays the STT gas for the claim.

User does not need to acquire testnet/native gas just to receive the position.

Flow:

QR

→ Connect wallet

→ Sign claim

→ Relayer transaction

→ ERC-6909 position transferred

→ Success screen

---

# 18. Claim Reveal

Animation:

sealed prediction ticket

↓

reveal

↓

**YOU GOT**

### BTC UP ↑

Potential payout:

$1.00

Current market probability:

57%

Cash-out available:

$0.54

Ends in:

08:21

Actions:

**HOLD**

**CASH OUT $0.54**

Secondary:

View transaction

---

# 19. Important Price Distinction

Never equate:

market probability

with:

cash-out value.

Display separately.

Example:

Market probability  
57%

Best executable cash-out  
$0.54

This prevents misleading users when liquidity is thin.

---

# 20. Cash-Out Flow

When recipient selects:

**Cash Out**

Backend obtains live DreamDEX CLOB data.

Return:

- best executable bid;
- quantity available;
- estimated proceeds;
- slippage;
- quote expiration;
- market status.

Confirmation screen:

Cash out BTC UP

1 contract

Expected proceeds:

$0.54

Minimum received:

$0.53

Quote expires:

8 seconds

CTA:

**Confirm Sale**

Execute through the current DreamDEX Event Contract trading interface.

Use IOC-style execution or equivalent safe immediate execution behavior.

Never promise a cash-out when no executable liquidity exists.

If no buyer exists:

**No cash-out liquidity is currently available. You can continue holding until settlement.**

---

# 21. Hold Flow

Hold requires no action.

Position page continuously updates:

- market probability;
- best cash-out;
- countdown;
- market status.

Once market locks:

Disable cash-out.

State:

**Market resolving**

---

# 22. Settlement Flow

Possible states:

### Winner

**YOU WON**

Your BTC UP prediction settled successfully.

Redeemable:
$1.00 minus applicable settlement fees

CTA:

**Redeem Payout**

---

### Loser

**Market Settled**

BTC DOWN won this window.

Your BTC UP position settled at $0.

CTA:

**Explore DreamDEX**

---

### Voided

**Market Voided**

Display protocol-defined redemption result.

CTA:

**Redeem Position**

---

# 23. Recipient Position Page

Route:

`/position/:campaignId/:claimId`

Display:

- campaign;
- asset;
- side;
- quantity;
- live probability;
- executable cash-out;
- potential settlement payout;
- expiry timer;
- market status;
- claim transaction;
- cash-out/redeem history.

---

# 24. Creator Dashboard

Main route:

`/dashboard`

Header metrics:

### Total Campaigns

### Drops Created

### Drops Claimed

### Claim Rate

### Positions Distributed

### Resulting Trades

Campaign table:

| Campaign | Market | Drops | Claimed | Remaining | Status |
|---|---|---|---|---|---|

Campaign status:

- Draft
- Funding
- Live
- Ended
- Settled
- Closed

---

# 25. Campaign Detail Dashboard

Route:

`/dashboard/campaign/:id`

Hero:

Campaign name

BTC Window

LIVE

Time remaining

Metrics:

- Budget
- Total Drops
- Claimed
- Unclaimed
- UP distributed
- DOWN distributed
- Cash-outs
- Redeemed positions

Claim progress:

14 / 20 claimed

Visual allocation:

UP — 7  
DOWN — 7  
Remaining — 6

Actions:

- Show QR
- Copy Link
- Download QR
- View Claims

---

# 26. QR Experience

Support two modes.

## Campaign QR

One QR routes users into the next available unclaimed drop.

Useful for:

- events;
- posters;
- conferences;
- livestreams.

## Individual QR

Each QR represents exactly one claim.

Useful for:

- printed cards;
- giveaway bags;
- direct gifting.

MVP can prioritize Individual QR if Campaign QR concurrency creates unnecessary complexity.

---

# 27. Landing Page

The landing page must explain the concept within five seconds.

## Hero

Eyebrow:

**POWERED BY DREAMDEX · BUILT ON SOMNIA**

Headline:

# Airdrops that are live predictions.

Supporting text:

Turn your campaign budget into real DreamDEX positions. Give people BTC or ETH predictions they can hold, trade, or redeem.

Primary CTA:

**Create a DreamDrop**

Secondary:

**Try a Demo Drop**

Hero visual:

Interactive prediction ticket:

FREE DREAMDROP

BTC UP

57%

Potential payout $1

08:21 remaining

Live animation showing:

$0.48 → $0.52 → $0.57

---

# 28. Landing Page — How It Works

Three steps.

### 1. Fund

Choose a DreamDEX Event Contract and campaign budget.

### 2. Drop

DreamDrop converts complete-set positions into unique QR claims.

### 3. Predict

Recipients scan and instantly become DreamDEX position holders.

Visual:

Creator

→ DreamDrop

→ QR

→ Recipient

→ Hold / Sell / Redeem

---

# 29. Landing Page — Before vs DreamDrop

Traditional prediction onboarding:

Connect wallet  
→ Fund wallet  
→ Find market  
→ Understand CLOB  
→ Pick side  
→ Trade

DreamDrop:

Scan  
→ Claim  
→ You own a prediction

Headline:

**Their first trade shouldn't be the onboarding.**

---

# 30. Landing Page — Live Demo

Show an interactive mock DreamDrop.

BTC

UP

Live probability:
57%

Current cash-out:
54¢

Potential payout:
$1

Timer:
08:21

Button:

**Reveal Demo Drop**

---

# 31. Landing Page — Use Cases

Cards:

### Community Giveaways

Reward members with live positions instead of static tokens.

### Conferences

Put prediction QR cards inside attendee packs.

### Creator Campaigns

Let followers claim opposing sides of the same market.

### Protocol Growth

Turn ecosystem incentives into actual DreamDEX participation.

### Watch Parties

Give communities predictions before BTC/ETH market windows.

### Social Campaigns

Share prediction claims directly through links.

---

# 32. Landing Page — Why DreamDrop

Three value pillars.

### Zero-Cost First Experience

Users own a real position before depositing money.

### Live Reward

The reward changes value as the market changes.

### Built-In Conversion

Every position creates a reason to hold, trade, or redeem through DreamDEX.

---

# 33. Navigation

Public:

- DreamDrop
- How It Works
- Use Cases
- Explore
- Create Drop
- Connect Wallet

Authenticated:

- Dashboard
- Campaigns
- Create Drop
- My Drops
- Wallet

---

# 34. Route Map

Public:

`/`
`/explore`
`/claim/:claimCode`
`/demo`

Creator:

`/dashboard`
`/dashboard/campaigns`
`/dashboard/campaign/:campaignId`
`/create`
`/create/market`
`/create/configure`
`/create/review`
`/create/success`

Recipient:

`/my-drops`
`/position/:positionId`

Utility:

`/transaction/:hash`
`/404`

---

# 35. Frontend Architecture

Recommended:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- wagmi
- viem
- TanStack Query
- Zustand only if necessary
- Recharts for simple dashboard analytics
- QR generation library
- responsive mobile-first implementation

Frontend should separate:

`components`
`features`
`pages`
`hooks`
`lib`
`services`
`types`
`mocks`

All blockchain access must pass through service abstractions.

Examples:

`marketService`

`campaignService`

`claimService`

`positionService`

`walletService`

This makes it easy to build the complete UI with mocks first and replace them later.

---

# 36. Frontend Mock Service Contract

While building the frontend, create interfaces for:

```ts
getLiveMarkets()
getMarket(marketId)

createCampaign(input)
getCampaign(campaignId)
getCampaigns(wallet)

getClaim(claimCode)
claimDrop(claimCode, wallet)

getPosition(positionId)
getPositionQuote(positionId)

cashOut(positionId, quote)
redeem(positionId)
```

Initially these return mock data.

Do not embed fake API behavior throughout components.

Centralize mocks behind services.

Codex will later replace each implementation.

---

# 37. Backend Architecture

Recommended services:

## API Layer

TypeScript backend.

Responsibilities:

- campaigns;
- claim metadata;
- creator analytics;
- quote generation;
- market discovery;
- relayer endpoints.

## DreamDEX Integration Service

Responsibilities:

- discover Event Contracts;
- validate market status;
- retrieve market metadata;
- retrieve order book;
- calculate executable quote;
- execute or prepare trades;
- detect settlement;
- retrieve transaction status.

## Campaign Service

Responsibilities:

- create campaign records;
- calculate claims;
- generate secrets;
- generate Merkle tree;
- persist claim metadata;
- campaign analytics.

## Relayer Service

Responsibilities:

- verify signed claim authorization;
- enforce replay protection;
- submit claim transaction;
- pay gas;
- return tx hash.

## Indexer / Event Listener

Listen to:

- campaign creation;
- claim events;
- token transfers;
- Event Contract settlement;
- relevant DreamDEX fills.

Use on-chain state as authoritative before actions.

---

# 38. Suggested Database

PostgreSQL / Supabase.

Tables:

## users

- id
- wallet_address
- created_at

## campaigns

- id
- creator_wallet
- name
- market_id
- pool_address
- outcome_token
- yes_token_id
- no_token_id
- collateral_token
- collateral_amount
- drop_size
- total_drops
- merkle_root
- status
- expiry
- campaign_message
- image_url
- created_at

## claims

- id
- campaign_id
- index
- side
- token_id
- amount
- secret_hash
- leaf_hash
- claimed
- recipient_wallet
- claim_tx
- claimed_at

Never store the raw secret where public/client access can expose every claim.

## positions

- id
- campaign_id
- claim_id
- owner_wallet
- token_id
- side
- amount
- claim_tx
- status
- cashout_tx
- redemption_tx

## relayer_requests

- id
- wallet
- claim_id
- nonce
- signature
- tx_hash
- status
- created_at

## market_snapshots

Optional.

- market_id
- up_probability
- down_probability
- best_up_bid
- best_down_bid
- liquidity
- timestamp

---

# 39. Smart Contract Layer

Recommended MVP contracts:

## DreamDropCampaignDistributor

Responsibilities:

- custody campaign outcome tokens;
- store campaign root;
- prevent double claims;
- verify claim;
- transfer appropriate ERC-6909 outcome token;
- emit claim event.

Required events:

```solidity
event CampaignCreated(...)
event DropClaimed(...)
event CampaignClosed(...)
```

Claim function conceptually receives:

- campaign ID
- claim index
- token ID
- amount
- claim secret
- Merkle proof
- recipient
- recipient authorization/signature

Security requirements:

- claim once only;
- proof must be valid;
- secret must match commitment;
- authorization must bind recipient;
- signature deadline;
- chain ID/domain separation;
- replay protection;
- exact token ID and amount from Merkle leaf;
- no arbitrary token withdrawal through claim method.

Before implementation, Codex must verify the exact live ERC-6909 transfer ABI exposed by the deployed DreamDEX outcome token.

---

# 40. Creator Funding Flow

Prefer a transparent transaction sequence over clever abstraction.

Conceptual flow:

Creator wallet

→ chooses Event Contract

→ authorizes collateral

→ calls DreamDEX mintSet

→ receives UP + DOWN outcome positions

→ authorizes DreamDrop Distributor

→ campaign creation transfers predetermined positions into distributor

→ claims become active

Do not build complex EIP-7702 batching for MVP unless everything else is complete.

---

# 41. DreamDEX Data Rules

Never hard-code:

- collateral addresses;
- token decimals;
- venue IDs;
- token IDs;
- current live market addresses;
- tick size;
- quantity/lot configuration.

Discover them dynamically.

Before any write action:

- confirm market is trading;
- confirm not finalized;
- confirm sufficient time remains;
- confirm token quantity;
- confirm quote;
- confirm liquidity.

---

# 42. Quote Engine

Endpoint:

`GET /api/positions/:id/quote`

Return:

```json
{
  "marketProbability": 0.57,
  "bestExecutablePrice": 0.54,
  "quantity": 1,
  "estimatedProceeds": 0.54,
  "minimumProceeds": 0.53,
  "availableLiquidity": 5,
  "expiresAt": "...",
  "canCashOut": true
}
```

Quotes must expire quickly.

Frontend should refresh while cash-out modal is open.

---

# 43. API Design

## Markets

`GET /api/markets`

`GET /api/markets/:id`

## Campaigns

`POST /api/campaigns/prepare`

`POST /api/campaigns`

`GET /api/campaigns/:id`

`GET /api/creators/:wallet/campaigns`

## Claims

`GET /api/claims/:code`

`POST /api/claims/:code/challenge`

`POST /api/claims/:code/claim`

## Positions

`GET /api/positions/:id`

`GET /api/positions/:id/quote`

`POST /api/positions/:id/cashout/prepare`

`POST /api/positions/:id/redeem/prepare`

## Transactions

`GET /api/transactions/:hash`

---

# 44. Campaign Analytics

MVP metrics:

- total drops;
- claims;
- unclaimed;
- claim rate;
- UP positions distributed;
- DOWN positions distributed;
- wallets acquired;
- cash-outs;
- redemptions;
- campaign completion.

Later:

- unique new DreamDEX wallets;
- trading volume generated;
- repeat trading;
- referral acquisition;
- campaign conversion;
- cost per active user.

---

# 45. Design Principles

DreamDrop should NOT look like a traditional trading terminal.

The recipient experience should feel like:

- opening a gift;
- scratching a card;
- receiving a ticket;
- discovering an outcome.

Creator experience should feel like:

- modern campaign software;
- Stripe;
- Linear;
- Vercel;
- high-quality fintech dashboard.

Avoid:

- excessive crypto jargon;
- giant price charts;
- dense order books on first screen;
- neon-casino styling;
- unnecessary wallet terminology.

---

# 46. UX Language

Prefer:

**Prediction**

instead of:

binary derivative

Prefer:

**Cash Out**

instead of:

submit IOC sell

Prefer:

**Potential Payout**

instead of:

settlement redemption value

Prefer:

**Market Ends**

instead of:

expiry timestamp

Advanced technical information can live behind:

“Details”

---

# 47. Critical UX States

Design all of these.

### Claim

- loading;
- valid;
- already claimed;
- expired;
- invalid;
- wallet disconnected;
- signing;
- relaying;
- confirmed;
- failed.

### Position

- active;
- no liquidity;
- cash-out quote;
- quote expired;
- transaction pending;
- sold;
- resolving;
- won;
- lost;
- voided;
- redeemed.

### Campaign

- draft;
- preparing;
- wallet approval;
- minting;
- funding;
- live;
- ending;
- settled;
- closed.

---

# 48. Security Requirements

### Claims

- cryptographically random secrets;
- one-time redemption;
- Merkle proofs;
- recipient-bound authorization;
- signature expiry;
- anti-replay;
- rate limiting.

### Relayer

- per-wallet limits;
- per-IP abuse controls;
- transaction simulation;
- allowlisted contract methods only;
- never expose relayer private key.

### Creator

- validate all amounts server side;
- validate contract addresses against discovered market;
- never trust client-supplied token IDs.

### Trading

- short quote expiration;
- slippage controls;
- market-status revalidation;
- fail closed on stale data.

---

# 49. Non-Functional Requirements

### Performance

Landing page should feel immediate.

Claim page should become interactive quickly on mobile networks.

### Mobile

Recipient claim flow is mobile-first.

Minimum responsive targets:

- 375px
- 390px
- 430px
- tablet
- desktop

### Accessibility

- WCAG-friendly contrast;
- keyboard navigation;
- semantic buttons;
- non-color indicators for UP/DOWN;
- readable timer;
- accessible modal focus.

### Reliability

On-chain transaction status must never be represented as complete before confirmation.

---

# 50. Frontend Success Criteria

Frontend phase is complete when:

- every defined route works;
- all screens are responsive;
- creator can complete campaign creation using mocked data;
- campaign appears in dashboard;
- QR/link screen works;
- recipient can complete mocked claim;
- position appears in My Drops;
- live-value simulation works;
- cash-out modal works;
- settlement states work;
- all error/empty/loading states exist;
- blockchain calls exist only through service interfaces.

---

# 51. Backend Success Criteria

Backend phase is complete when:

1. live DreamDEX markets appear;
2. creator can select a real Event Contract;
3. creator can mint complete-set positions;
4. campaign can custody those positions;
5. secure claim links can be generated;
6. second wallet can claim a position;
7. claimed ERC-6909 balance is verifiable on Somnia;
8. frontend reads real position balance;
9. executable CLOB quote appears;
10. user can sell position when liquidity exists;
11. settlement is detected;
12. winning position can be redeemed;
13. transaction hashes are visible throughout the flow.

---

# 52. Hackathon Demo Script

## Scene 1 — Problem

“Prediction markets ask new users to deposit money before they've experienced the product.”

Show traditional onboarding complexity.

---

## Scene 2 — Creator

Open DreamDrop dashboard.

Create Campaign.

BTC · live Event Contract

Budget:
10 collateral

Drop size:
1

DreamDrop displays:

10 UP  
10 DOWN  
20 DreamDrops

Click:

**Create DreamDrops**

---

## Scene 3 — QR

Campaign goes live.

Show QR.

“Instead of giving somebody a token, I'm giving them a live prediction.”

---

## Scene 4 — Recipient

Use phone / incognito browser / second wallet.

Scan QR.

Reveal.

### YOU GOT BTC UP

Show:

- actual position;
- token ID;
- transaction;
- live value;
- timer.

---

## Scene 5 — On-Chain Proof

Open Somnia explorer.

Show:

DreamDrop distributor

→ recipient wallet

→ actual Event Contract outcome token.

---

## Scene 6 — Market Moves

Position:

54¢ → 59¢

Explain:

“The reward itself changes value.”

---

## Scene 7 — Cash Out

Click:

Cash Out

Show actual executable DreamDEX quote.

Confirm.

Show transaction.

---

## Scene 8 — Vision

“DreamDrop turns marketing campaigns into DreamDEX users.”

Final graphic:

Creator

→ 20 DreamDrops

→ 20 wallets

→ positions

→ trading

→ settlement

→ DreamDEX adoption

---

# 53. Core Pitch

## Short Version

DreamDrop turns prediction-market positions into airdrops.

Creators fund a DreamDEX Event Contract, generate claimable UP and DOWN positions, and distribute them through QR codes or links.

Recipients don't need to fund their first prediction. They scan, claim a real position, then hold, cash out, or redeem it.

---

# 54. One-Line Positioning

**Don't ask users to buy their first prediction. Airdrop it.**

---

# 55. Product North Star

**Number of people who become Event Contract position holders through DreamDrop.**

Secondary:

**DreamDEX activity generated by distributed positions.**

---

# 56. Build Order

## Phase A — Full Mock Frontend

Build:

1. design system;
2. landing page;
3. dashboard;
4. market selection;
5. campaign configuration;
6. review;
7. campaign success;
8. QR screen;
9. claim flow;
10. claim reveal;
11. position page;
12. cash-out flow;
13. settlement states;
14. responsive/mobile polish.

Use mocked services.

---

## Phase B — Infrastructure

Build:

1. database schema;
2. market service;
3. campaign APIs;
4. claim generation;
5. relayer;
6. event listener.

---

## Phase C — Smart Contracts

Build:

1. distributor;
2. Merkle verification;
3. claim replay protection;
4. ERC-6909 distribution;
5. events;
6. tests.

---

## Phase D — DreamDEX

Replace:

mock markets → DreamDEX markets

mock probabilities → live data

mock position → ERC-6909 balance

mock cash-out → executable DreamDEX quote

mock settlement → Event Contract settlement

mock redeem → real redemption

---

# 57. Final MVP Definition

DreamDrop is successful when the following sequence works end-to-end:

**Creator funds Event Contract → DreamDrop creates prediction drops → QR is generated → second wallet scans → real outcome position is claimed → live value is displayed → recipient can hold/sell → settlement can be redeemed.**

Everything else is secondary.
