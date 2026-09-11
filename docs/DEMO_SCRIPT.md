# DreamDrop 2–3 minute demo script

## 0:00–0:15 — Problem and hook

**Show:** DreamDrop landing page and headline.

**Say:** “Prediction markets usually ask a new user to fund a wallet, learn the market, and buy before they feel the product. DreamDrop flips that. Don’t ask users to buy their first prediction. Airdrop it.”

## 0:15–0:40 — Select a real Event Contract

**Show:** `/create`, connected Creator Wallet A on Shannon, and a current BTC or ETH DreamDEX market.

**Say:** “This is a current DreamDEX Event Contract, read through structured market data and revalidated on-chain before every write. The durable identity is the market ID, not a recycled pool address.”

## 0:40–1:05 — Create the campaign

**Show:** Budget, position size, real transaction phases, then the campaign dashboard.

**Say:** “Wallet A mints complete sets, giving the campaign equal UP and DOWN inventory. DreamDrop generates secure one-time claims, commits their Merkle root, approves the Distributor, and funds both sides. The campaign goes live only after every receipt, event, and inventory balance reconciles.”

## 1:05–1:25 — Private QR reveal

**Show:** Individual QR pack and one private claim link without exposing the URL in the recording.

**Say:** “Every recipient gets a unique claim. Before connection, the preview reveals no side, token ID, amount, secret, or Merkle proof. Opening it does not consume it.”

## 1:25–1:55 — Wallet B claims

**Show:** Open the link in a separate Wallet B session, switch to Shannon, connect, and sign.

**Say:** “Wallet B signs a short-lived EIP-712 authorization. The recipient spends no gas. The server verifies the signer, reserves the claim transactionally, and Wallet C relays it.”

## 1:55–2:15 — Reveal the real position

**Show:** Confirmed UP/DOWN ticket and My Drops.

**Say:** “Only after the receipt, `DropClaimed` event, and exact ERC-6909 balance increase does DreamDrop reveal the position. This is an actual DreamDEX outcome token, not points or a simulated prediction.”

## 2:15–2:30 — Explorer proof

**Show:** Somnia explorer transaction, Distributor address, and recipient token delta evidence.

**Say:** “Here is the Shannon transaction and the exact token transfer to Wallet B. Submission alone is never treated as success.”

## 2:30–2:50 — Architecture and growth primitive

**Show:** Architecture diagram, campaign dashboard, and optional cash-out dialog.

**Say:** “DreamDEX supplies the market primitive. DreamDrop supplies the distribution and growth primitive. Owners can hold, safely cash out only when the full position is executable, or redeem after settlement.”

## 2:50–3:00 — Close

**Show:** Landing-page closing CTA.

**Say:** “DreamDrop turns prediction-market acquisition into distribution: real markets, gasless first ownership, and one scan from curiosity to participation.”

## Recording checklist

- Use fresh current-market evidence; do not reuse a market that has expired.
- Keep private claim codes, wallet keys, Supabase keys, and environment files out of frame.
- Use distinct Wallet A and Wallet B profiles.
- Wait for confirmed receipts and show actual reconciled state.
- If full-fill cash-out liquidity is absent, show the honest hold state instead of forcing a trade.
