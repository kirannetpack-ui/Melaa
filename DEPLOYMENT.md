# GitHub and Vercel deployment state

The source repository is [kirannetpack-ui/Melaa](https://github.com/kirannetpack-ui/Melaa) on `main`. The Vercel project is [Kiran Thapa's projects / melaa](https://vercel.com/kiran-thapa-s-projects/melaa), connected to that repository and its `main` branch.

The Vercel production deployment is deliberately **paused**. Vercel's automatic build serves the static `public/` folder, but the current Node/SQLite backend does not run there. A check of `/api/bootstrap` on the Vercel deployment returned 404. Vercel documents that serverless functions do not provide a shared persistent local filesystem for SQLite; uploading this source unchanged would make registration, chat, admin decisions, orders, and uploads unreliable or unavailable. Do not resume or advertise the production URL as an operating marketplace.

The local development app remains usable with Node 24 and `npm start`. The full source, tests, data schema, demo media, and operating guides are in GitHub. Local `data/` and `.vercel/` are ignored and were not pushed.

## Work needed for a Vercel launch

1. Choose a persistent managed database. Vercel Marketplace supports Postgres integrations such as Neon, Supabase and Aurora, and a Turso integration for remotely hosted SQLite. Migrate this synchronous `node:sqlite` API to the chosen remote client and use formal schema migrations.
2. Convert the Node HTTP server to Vercel Functions or another durable backend behind the Vercel frontend. Preserve server-side authorization, moderation, and rate controls.
3. Move photo/video uploads to quarantined object storage with signed access, virus scanning, image/video moderation and approved-publication gates. A local upload folder is not durable on Vercel.
4. Configure production secrets and identity verification. The app currently refuses to start in production without unique `MELAA_ADMIN_PASSWORD` and `MELAA_SELLER_PASSWORD`; remove seed accounts and demo content before real onboarding.
5. Connect a licensed marketplace payment provider, tax/fulfillment rules, signed webhooks, ledger/reconciliation, refunds, disputes and payout holds. Checkout intentionally does not collect money yet.
6. Run the security, content-safety, accessibility, privacy and legal reviews in the other guides; verify all endpoints on a protected preview, then resume the Vercel project.

Vercel references: [SQLite limitation](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel), [Marketplace storage](https://vercel.com/docs/marketplace-storage), [Git deployments](https://vercel.com/docs/git), [pause and resume](https://vercel.com/docs/projects/managing-projects).
