# Melaa Nepal — social commerce development foundation

An installable, responsive social-commerce web app and Node.js/SQLite API for discovering Nepalese makers through image and video stories, then shopping a tagged product without leaving the feed. This is a functional **development preview**, not a production marketplace or native Android/iOS release.

## Run on Windows in `C:\Codex\Melaa`

1. Install Node.js 24 or newer.
2. Extract the archive so `C:\Codex\Melaa\package.json` exists.
3. Open PowerShell in `C:\Codex\Melaa` and run `npm start`.
4. Open `http://localhost:3000` on the same computer.

Run `npm test` to exercise social actions, seller approval, catalog governance, moderation, protected chat, shipping, commission, order, and contribution controls.

No `npm install` is needed. The server uses Node's built-in SQLite. A fresh database is created at `data/melaa.sqlite` on first run. The UI is a progressive web app; compatible browsers can install it. For phone access on the same network, use the computer's LAN address and set appropriate firewall rules; installability and service workers generally require HTTPS outside localhost.

Demo accounts for local development only:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@melaa.local` | `ChangeMe-Melaa-2026!` |
| Seller | `maker@melaa.local` | `DemoSeller-2026!` |

Set `MELAA_ADMIN_PASSWORD` and `MELAA_SELLER_PASSWORD` **before the initial database creation** to change these seed passwords. Existing database passwords are not reset when environment variables change. Never expose the development server to the public Internet. The production mode refuses to start without `MELAA_ADMIN_PASSWORD`; further security and deployment work is still required.

## What works in this version

- Customer registration and login, seller and admin roles, server-side sessions.
- Strong-password rules, login throttling, strict session cookies, security headers, prepared SQL, server-side role/state enforcement, API rate limits, and moderation/audit records.
- Seller onboarding in a pending state; only an admin-verified seller can upload or create products and stories.
- Mobile-first, Instagram-style discovery feed with maker story circles and Following / For You views.
- Shoppable image and video posts with an in-post product card, price, stock state, one-tap add, product quick view and buy-now basket handoff.
- Social actions: follow makers, like, comment, save, share, and open a lightweight maker profile without losing the feed.
- Seller-friendly creation from the feed or account: mobile camera/file selection, local image/video upload, preview, caption, product tag and occasion tag.
- Buyer/seller Messenger with product-linked threads, mobile chat layout, reporting, off-platform contact/payment blocking, admin visibility, message hiding, and conversation closure APIs.
- A 58-category directory spanning culture/occasion, season/region, community/ethnicity, food/agriculture, and craft/fashion/home, plus 39 starter commodity guides linked to official editorial sources.
- Signed-in category and commodity proposals held for admin approval.
- Product and story review queues: pending content never reaches the public marketplace/feed.
- Product creation with a product photo and approved category; occasion browsing, global search, marketplace search and category filters.
- Wholesale quote requests and an in-place basket with provisional delivery quotes.
- Cart and provisional shipping quote using actual versus volumetric weight, admin-configured zones and rates.
- Pending order recording, configurable retail/wholesale commission and payout-hold settings, per-line projected commission, and account history.
- Personal event saving with an illustrative order-by planning date.
- Community occasion suggestions held for research; admin-cited, BS-year-specific Gregorian dates with review audit entries.
- Recipient applications held in an admin review queue. Contributions are intentionally disabled.
- Consolidated admin queues for seller identity, products, stories, catalog proposals and recorded moderation events.
- Product and post reporting, account suspension, administrator media review, and restricted access to unapproved uploads.
- SQLite persistence and a PWA shell.

## Deliberate launch gates

No payment is taken, no donation is transferred, and no recipient is presented as approved. Checkout records `awaiting_payment` orders without reserving inventory. Rates and products are illustrative; the international zone is indicative only. Occasion records are research candidates unless a specific year is reviewed and cited. Text moderation is deliberately a baseline and cannot guarantee detection of fake people/products, pornography or every evasion. The project does not yet include legally sufficient KYC/KYB, specialist image/video/hash moderation, livestreaming, media transcoding or cloud quarantine, notification delivery, carrier integration, country-specific product eligibility, refunds, payout reconciliation, tax invoices, recommender ranking, or native mobile binaries.

Before public deployment, follow [SECURITY.md](SECURITY.md), [CONTENT_SAFETY.md](CONTENT_SAFETY.md), [MARKETPLACE_OPERATIONS.md](MARKETPLACE_OPERATIONS.md), and [ADMIN_GUIDE.md](ADMIN_GUIDE.md). The prototype's styles, source-backed taxonomy and example content are design scaffolding, not a verified seller inventory.

## Social-commerce design direction

The redesign treats content as the primary storefront: every story can tag a product, and commerce actions remain beside the maker, caption, comments and occasion. The marketplace and occasion catalog remain available for high-intent browsing, while the homepage is optimized for one-thumb discovery.

The interaction model follows current product-tagged social content, catalog-backed product information, visual-first seller creation, shoppable short video and touch-friendly controls. The included demo craft photographs are original AI-generated development assets in `public/media/`; replace them with seller-owned, consented and moderated media before launch.

Uploaded preview media is stored under `data/uploads` by default. Set `MELAA_UPLOADS_PATH` to isolate that directory in tests or another environment. Accepted preview types are JPG, PNG and WebP up to 10 MB, and MP4 up to 25 MB. Basic signatures are checked and unapproved uploads require the owner's or admin's session. Production should use quarantined object storage, complete decoder validation, signed URLs, malware scanning, specialist content checks, derivative generation and lifecycle rules.

## Suggested next milestones

1. Complete the researched BS/Gregorian occasion database, citations, year-specific dates, and cultural review workflow.
2. Connect accredited seller identity/business verification, media consent/moderation/transcoding, production object storage, catalog variants and product eligibility by destination.
3. Add fulfillment and shipping provider adapters, rate versioning, parcel consolidation and final quote approval.
4. Integrate payment through a licensed provider; reconcile payment, seller proceeds, commission, refunds, and shipment charges.
5. Add vetted recipient onboarding and lawful payout rails. Enable optional contributions only after end-to-end settlement and privacy testing.
6. Add notifications, multilingual chat/content classifiers, moderation appeals, feed ranking, livestream commerce, Android/iOS wrappers or a native client, and deployment automation.

## API map

Core: `GET /api/bootstrap`, `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`, `POST /api/media`, `POST /api/quote-shipping`, `POST /api/checkout`, `POST /api/events`, `POST /api/quotes`.

Social/catalog: `POST /api/products`, `POST /api/posts`, `POST /api/posts/like`, `POST /api/posts/save`, `POST /api/posts/comment`, `GET /api/posts/comments`, `POST /api/follows`, `POST /api/reports`, `POST /api/categories/propose`, `POST /api/commodities/propose`, `POST /api/occasions/suggest`, `GET /api/occasions/dates`.

Messenger: `GET /api/conversations`, `POST /api/conversations/start`, `GET /api/conversations/messages`, `POST /api/conversations/message`, `POST /api/conversations/report`.

Admin: `GET /api/admin`, `POST /api/admin/review`, `POST /api/admin/user`, `POST /api/admin/message`, `POST /api/admin/conversation`, `POST /api/admin/settings`, `POST /api/admin/rates`, `POST /api/admin/causes`, `POST /api/admin/occasion-date`.

Money is stored in whole NPR for this preview. Shipping is provisional: `ceil(max(total actual kg, total volumetric kg, minimum kg))`, then base plus per-kg rate. Actual production parcelization will require a carrier and packaging model.
