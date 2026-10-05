# Melaa Nepal — social commerce development foundation

An installable, responsive social-commerce web app and SQLite-compatible API for discovering Nepalese makers through image and video stories, then shopping a tagged product without leaving the feed. Local development uses a SQLite file; Vercel uses Turso and private Vercel Blob storage. Production is a **publicly accessible development preview**, not a payment-enabled marketplace or native Android/iOS release.

## Run on Windows in `C:\Codex\Melaa`

1. Install Node.js 24 or newer.
2. Run `npm install` in `C:\Codex\Melaa`.
3. Run `npm start`.
4. Open `http://localhost:3000` on the same computer.

Run `npm test` to exercise social actions, seller approval, catalog governance, moderation, protected chat, shipping, commission, order, and contribution controls.

A fresh local database is created at `data/melaa.sqlite` on first run. The UI is a progressive web app; compatible browsers can install it. For phone access on the same network, use the computer's LAN address and set appropriate firewall rules; installability and service workers generally require HTTPS outside localhost.

Demo accounts for local development only:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@melaa.local` | `ChangeMe-Melaa-2026!` |
| Seller | `maker@melaa.local` | `DemoSeller-2026!` |

Set `MELAA_ADMIN_PASSWORD` and `MELAA_SELLER_PASSWORD` **before the initial database creation** to change these seed passwords. Existing database passwords are not reset when environment variables change. Never expose the development server to the public Internet. The production mode refuses to start without `MELAA_ADMIN_PASSWORD`; further security and deployment work is still required.

The public production preview can expose two **read-only** accounts when `MELAA_ENABLE_PUBLIC_DEMO=1` is set in Vercel Production: buyer `buyer@melaa.local` / `DemoBuyer-2026!` and seller `maker@melaa.local` / `DemoSeller-2026!`. The login page offers one-click access. These accounts cannot publish, message, order, or change saved data. The public site does **not** use the local demo admin password; its admin password is a private Vercel secret. Existing local databases may have passwords changed after initial seeding, so the table above applies only to a fresh local database.

## What works in this version

- A visible **Log in / Register** action and one short account form at a time. New members can use an email address (including Gmail) or an international-format phone number such as `+977…`, plus a Melaa password. This is **not Google OAuth or SMS login**; contact ownership is not yet verified and password recovery is not available.
- Customer registration and login, seller and admin roles, server-side sessions. Seller registration requires explicit acceptance of concise versioned terms; any actual fee requires a separate mutual written agreement before paid selling.
- 15+ character passphrases without composition rules, login throttling, strict session cookies, security headers, prepared SQL, server-side role/state enforcement, API rate limits, and moderation/audit records.
- Seller onboarding in a pending state; only an admin-verified seller can upload or create products and stories.
- Mobile-first, Instagram-style discovery feed with maker story circles and Following / For You views. The feed loads reviewed posts in pages as people scroll, with an explicit search term, followed makers, limited engagement and recency used for ranking. It does not track hidden search history or promise limitless inventory.
- Shoppable image and video posts with an in-post product card, price, stock state, one-tap add, product quick view and buy-now basket handoff.
- Social actions: follow makers, like, comment, save, share, recommend, send private suggestions to sellers, and open a lightweight maker profile without losing the feed. Recommendations are community signals, **not** verified-purchase reviews. Sellers and admins can review suggestions.
- Seller-friendly creation **inline on the feed** from its composer or the Create button: mobile camera/file selection, local or private-cloud image/video upload, preview, caption, product tag and occasion tag. Account/Profile retains product management, but is no longer a separate story-posting surface.
- Buyer/seller Messenger with product-linked threads, mobile chat layout, unread counts, periodic refresh, message/conversation reporting, a prioritized admin report queue, off-platform contact/payment blocking, admin visibility, message hiding, and conversation closure APIs.
- A 58-category directory spanning culture/occasion, season/region, community/ethnicity, food/agriculture, and craft/fashion/home, plus 39 starter commodity guides linked to official editorial sources.
- Signed-in category and commodity proposals held for admin approval.
- Product and story review queues: pending content never reaches the public marketplace/feed.
- Product creation with a product photo and approved category; occasion browsing, global search, marketplace search and category filters.
- Wholesale quote requests and an in-place basket with provisional delivery quotes.
- Cart and provisional shipping quote using actual versus volumetric weight, admin-configured zones and rates.
- Pending order recording, configurable internal retail/wholesale planning rates (initially 5% retail and 3% wholesale) and payout-hold settings, per-line projected retail commission, seller fee disclosure, and account history. These are accounting projections, not agreed or collected fees; wholesale requests are not settled orders.
- Personal event saving, in-app planning reminders for saved dates and admin-reviewed annual occasions, and an explicitly illustrative reminder demo. No email or push reminders are delivered.
- Community occasion suggestions held for research; admin-cited, BS-year-specific Gregorian dates with review audit entries.
- Recipient applications held in an admin review queue. Contributions are intentionally disabled.
- Consolidated admin queues for seller identity, products, stories, catalog proposals and recorded moderation events.
- Product and post reporting, account suspension, administrator media review, and restricted access to unapproved uploads.
- SQLite-compatible persistence (local SQLite or hosted Turso), private Vercel Blob uploads, and a PWA shell.

## Deliberate launch gates

No payment is taken, no donation is transferred, and no recipient is presented as approved. Checkout records `awaiting_payment` orders without reserving inventory. Rates and products are illustrative; the international zone is indicative only. Occasion records are research candidates unless a specific year is reviewed and cited. Text moderation is deliberately a baseline and cannot guarantee detection of fake people/products, pornography or every evasion. The project does not yet include legally sufficient KYC/KYB, specialist image/video/hash moderation, livestreaming, media transcoding or cloud quarantine, delivered notifications, carrier integration, country-specific product eligibility, refunds, payout reconciliation, tax invoices, verified-purchase reviews, password recovery/email verification, or native mobile binaries. Current feed ranking is a simple transparent rule, not a mature recommender system.

Before accepting real transactions or broadly promoting seller onboarding, follow [SECURITY.md](SECURITY.md), [CONTENT_SAFETY.md](CONTENT_SAFETY.md), [MARKETPLACE_OPERATIONS.md](MARKETPLACE_OPERATIONS.md), and [ADMIN_GUIDE.md](ADMIN_GUIDE.md). The prototype's styles, source-backed taxonomy and example content are design scaffolding, not a verified seller inventory.

The GitHub repository and Vercel project are connected; see [FEATURE_STATUS.md](FEATURE_STATUS.md) for completed versus remaining functions and [DEPLOYMENT.md](DEPLOYMENT.md) for the deployment, migration procedure, and launch gates.

## Social-commerce design direction

The redesign treats content as the primary storefront: every story can tag a product, and commerce actions remain beside the maker, caption, comments and occasion. The marketplace and occasion catalog remain available for high-intent browsing, while the homepage is optimized for one-thumb discovery.

The interaction model follows current product-tagged social content, catalog-backed product information, visual-first seller creation, shoppable short video and touch-friendly controls. The included demo craft photographs are original AI-generated development assets in `public/media/`; replace them with seller-owned, consented and moderated media before launch.

Local preview media is stored under `data/uploads` by default. Set `MELAA_UPLOADS_PATH` to isolate that directory in tests or another environment. Vercel uses a private Blob store and browser-direct uploads up to 25 MB, followed by a signature check. Unapproved uploads require the owner's or admin's session; public access requires listing/post approval. Complete decoder validation, malware and specialist content scans, safe derivatives, lifecycle rules, and media-range/performance testing remain public-launch gates.

## Suggested next milestones

1. Complete the researched BS/Gregorian occasion database, citations, year-specific dates, and cultural review workflow.
2. Connect accredited seller identity/business verification, media consent/moderation/transcoding, production object storage, catalog variants and product eligibility by destination.
3. Add fulfillment and shipping provider adapters, rate versioning, parcel consolidation and final quote approval.
4. Integrate payment through a licensed provider; reconcile payment, seller proceeds, commission, refunds, and shipment charges.
5. Add vetted recipient onboarding and lawful payout rails. Enable optional contributions only after end-to-end settlement and privacy testing.
6. Add opted-in delivered notifications, multilingual chat/content classifiers, moderation appeals, privacy-tested recommendation models, separately hosted moderated livestream commerce, Android/iOS wrappers or a native client, and deployment automation.

## API map

Core: `GET /api/bootstrap`, `POST /api/register`, `POST /api/seller-terms/accept`, `POST /api/login`, `POST /api/logout`, `GET /api/me`, `GET /api/reminders`, `POST /api/media`, `POST /api/quote-shipping`, `POST /api/checkout`, `POST /api/events`, `POST /api/quotes`.

Social/catalog: `GET /api/feed`, `POST /api/products`, `POST /api/posts`, `POST /api/posts/like`, `POST /api/posts/save`, `POST /api/posts/recommend`, `POST /api/posts/suggest`, `POST /api/suggestions/status`, `POST /api/posts/comment`, `GET /api/posts/comments`, `POST /api/follows`, `POST /api/reports`, `POST /api/categories/propose`, `POST /api/commodities/propose`, `POST /api/occasions/suggest`, `GET /api/occasions/dates`.

Messenger: `GET /api/conversations`, `POST /api/conversations/start`, `GET /api/conversations/messages`, `POST /api/conversations/message`, `POST /api/conversations/report`.

Admin: `GET /api/admin`, `POST /api/admin/review`, `POST /api/admin/user`, `POST /api/admin/message`, `POST /api/admin/conversation`, `POST /api/admin/settings`, `POST /api/admin/rates`, `POST /api/admin/causes`, `POST /api/admin/occasion-date`.

Money is stored in whole NPR for this preview. Shipping is provisional: `ceil(max(total actual kg, total volumetric kg, minimum kg))`, then base plus per-kg rate. Actual production parcelization will require a carrier and packaging model.
