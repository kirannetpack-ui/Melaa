# Melaa administrator guide

## End-to-end flow

### 1. Registration and login

A visitor chooses buyer or maker/seller, supplies a name, email, and strong password, and receives a server-side session. A buyer is active immediately. A seller is active as an account but remains `pending` as a seller: they can explore and message but cannot upload or publish seller content.

The admin signs in with an admin account and opens **Profile → Admin control center**. Replace the development admin credentials before any shared deployment.

### 2. Seller verification

The seller-verification queue lists new seller applications. Outside this prototype, collect and verify identity, business/payout ownership, address, prohibited-party checks, and risk indicators. Approve only when evidence is complete; reject with a concise non-sensitive reason. Approval changes the seller profile to `verified`, unlocking media, product, and story creation.

### 3. Product and story publication

A verified seller creates a product using an approved category and can upload a photo. The product enters `review` and is invisible to buyers. Admin checks authenticity evidence, title/description, material/ingredient labels, origin, price, prohibited-goods rules, image rights, and delivery eligibility, then approves or rejects it.

The seller creates an image/video story and can tag one of their already approved products. The story also enters `review`. After approval it appears in the social feed, where a buyer can like, save, comment, message the seller, view the product, and add it to the basket without leaving the experience.

### 4. Catalog governance

The seed directory contains reviewed cultural/occasion, seasonal/regional, community/ethnicity, food/agriculture, and craft/fashion/home categories, plus starter commodity descriptions. Any signed-in member can propose a category or commodity. A proposal remains hidden until the admin approves it. Review its wording, community attribution, duplication, evidence URL, product-safety implications, and respectful cultural context.

The seed sources are Nepal Tourism Board, NFDIN, and the Ministry of Industry, Commerce and Supplies. They justify the initial taxonomy but do not certify individual seller claims.

### 5. Messaging and safety

Buyer starts a protected conversation from a product. Baseline checks block obvious sexual/counterfeit/fraud language and contact or off-platform payment instructions. Participants can report the conversation. Admin opens **Messages** to inspect all marketplace conversations, hide/restore a specific message, or close the conversation through the admin API. Access should be limited, logged, purpose-bound, and covered by a published privacy/retention policy.

### 6. Order and revenue

The buyer adds approved products, receives a provisional delivery quote, signs in, and records checkout. In this development build the order stays `awaiting_payment`; no money is collected and stock is not reserved. The configured retail commission is recorded per order line and displayed as projected revenue.

Admin can change commission and payout-hold settings in the control center. These settings become financially enforceable only after a marketplace payment provider, ledger, signed webhooks, settlement, refund, dispute, and payout processes are integrated.

### 7. Monitoring routine

Daily: review seller/product/story/catalog queues, safety events, user reports, failed payments, orders, refund/dispute alerts, high-risk account changes, and unusual velocity. Weekly: review false positives/appeals, repeat offenders, fee/revenue reconciliation, payout holds, counterfeit patterns, moderation response time, backups, and access logs. Monthly: sample approved listings, restore-test backups, review administrator access, tune risk rules, update restricted-goods and destination rules, and publish transparency metrics.

## Status meanings

- `pending`: seller identity decision not yet complete.
- `review`: listing, story, category, or commodity is not public and awaits admin action.
- `active` / `verified`: approved for the relevant surface.
- `rejected`: not public; seller should receive an actionable reason and appeal path.
- `open` / `closed`: conversation allows or blocks new participant messages.
- `awaiting_payment`: development order record only; not a paid sale.

## Launch warning

The UI and server implement the workflow, queues, gates, and audit foundation. They do not provide legally sufficient KYC, automated image/video safety, payment custody, tax, consumer-protection compliance, export screening, or guaranteed fake detection. See `SECURITY.md`, `CONTENT_SAFETY.md`, and `MARKETPLACE_OPERATIONS.md` before deployment.
