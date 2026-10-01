# Vercel deployment and launch state

Source: [kirannetpack-ui/Melaa](https://github.com/kirannetpack-ui/Melaa), branch `main`. Vercel project: [kiran-thapa-s-projects/melaa](https://vercel.com/kiran-thapa-s-projects/melaa). Vercel project names must be lowercase, so the configured name is `melaa`.

The application is packaged as Vercel static assets plus a Node.js function at `api/index.js`. The function uses a persistent Turso/libSQL database; seller photos/videos use a private Vercel Blob store. A preview deployment has returned HTTP 200 from both `/` and `/api/bootstrap`, and unauthenticated `/api/admin` returns 401. The hosted database already contains 58 categories, 39 commodity guides and 12 occasion records, with no demo seller inventory. The Vercel project remains paused for general access while admin onboarding and safety checks are completed. Do not advertise it as an operating marketplace or resume it solely because the build reports Ready.

## Provisioned resources

- Turso Cloud `melaa-db`, Starter (free) plan, connected to Production, Preview and Development. Environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
- Private Vercel Blob store `melaa-media`, connected to the same project. Vercel supplies Blob credentials; do not commit them.
- `MELAA_ADMIN_PASSWORD` must be a non-empty, unique 12+ character Production secret before the next production build. The catalog-only migration intentionally did not create an admin account; the Vercel CLI redacts Secret values in pulled environment files, so a blank local placeholder does not establish that the saved Production value is blank. Never enter it into source control or chat. The production admin email is `admin@melaa.local`; replace it with a real controlled email and implement verified-email/MFA onboarding before a public release.

## Production migration

The production Vercel build runs `scripts/migrate.js` after bundling the browser uploader. This applies the schema and catalog and creates the first admin inside Vercel's environment, where the Production Secret is available. The migration is idempotent for the seed records, so subsequent production builds are safe, although a dedicated release migration job would be preferable as the project grows. A build fails if the Turso credentials or a 12+ character admin password are absent.

For a manual migration from a trusted environment, supply actual credentials there and run `node scripts/migrate.js`. Do not expect `vercel env pull` to provide a Secret's value: it writes a redacted placeholder. For local catalog-only maintenance, with Turso credentials pulled to an ignored file, run:

```powershell
vercel env pull .env.production.local --yes --environment production --scope kiran-thapa-s-projects
npm run migrate:catalog
```

The schema and catalog have already been initialized this way. Production omits local demo sellers/products/posts. Set the password **before** first full migration; changing the environment variable later does not change an existing account password.

The `data/`, `.env*`, `.vercel/` and generated browser bundle are ignored by Git. Never commit pulled credentials. `npm test` covers local persistence and production-mode seed behavior.

## Deployment verification

1. Run `npm test` and `npm run build` locally.
2. Deploy a protected preview (`vercel deploy --yes --scope kiran-thapa-s-projects`) or push to GitHub and inspect the automatic deployment.
3. Verify `/`, `/api/bootstrap` (58 categories, 39 commodities), `/api/admin` (401 when signed out), registration/login, seller pending/approval, private media upload, post/product approval, chat/reporting, order creation without payment, and admin audit views.
4. Check security headers, mobile layout, errors, logs and quota usage. Confirm that private media cannot be fetched before approval and that an unverified seller cannot upload.
5. Retain deployment protection until identity verification, automated media/malware scanning, independent security review, privacy/legal review and licensed payment/fulfillment integrations are complete. A working preview is **not** authorization to operate a public marketplace.

## Payments and moderation

Checkout intentionally records only `awaiting_payment` orders. No funds, donations or payouts are moved. Commission is a projected accounting field, not revenue collected. Private uploads and text rules plus admin review are baseline controls; they cannot guarantee that all counterfeit goods, fake identities or illegal content are detected.

References: [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js), [Turso on Vercel](https://vercel.com/marketplace/tursocloud/database), [private Blob storage](https://vercel.com/docs/vercel-blob/private-storage), [client uploads](https://vercel.com/docs/vercel-blob/client-upload), [Function body limits](https://vercel.com/docs/functions/limitations).
