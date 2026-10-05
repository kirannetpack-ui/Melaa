# Vercel deployment and launch state

Source: [kirannetpack-ui/Melaa](https://github.com/kirannetpack-ui/Melaa), branch `main`. Vercel project: [kiran-thapa-s-projects/melaa](https://vercel.com/kiran-thapa-s-projects/melaa). Vercel project names must be lowercase, so the configured name is `melaa`.

The application is packaged as Vercel static assets plus a Node.js function at `api/index.js`. The function uses a persistent Turso/libSQL database; seller photos/videos use a private Vercel Blob store. The protected production deployment has returned HTTP 200 through authenticated Vercel CLI checks of `/` and `/api/bootstrap`, and unauthenticated `/api/admin` returns 401. The hosted database contains 58 categories, 39 commodity guides and 12 occasion records, with no demo seller inventory. The first admin account was initialized during the production build. Vercel Authentication is set to **All Deployments**, including the production alias, so anonymous requests redirect to Vercel sign-in. Do not advertise this as an operating marketplace or remove protection solely because the build reports Ready.

The browser's Vercel passkey/sign-in prompt is **deployment protection**, not Melaa's account form. Melaa now has an on-page email-or-phone plus password flow, but a visitor still passes Vercel Authentication first. Replacing that outer gate with only Melaa login would publicly expose the whole preview, including anonymous registration and browsing. Keep the outer gate until contact verification, recovery, seller identity and media controls, and an independent security review are ready; then deliberately switch Production to public while protecting Preview. See [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication) and [NIST password guidance](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/).

## Provisioned resources

- Turso Cloud `melaa-db`, Starter (free) plan, connected to Production, Preview and Development. Environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
- Private Vercel Blob store `melaa-media`, connected to the same project. Vercel supplies Blob credentials; do not commit them.
- `MELAA_ADMIN_PASSWORD` must be a non-empty, unique 12+ character Production secret before the next production build. The catalog-only migration intentionally did not create an admin account; the Vercel CLI redacts Secret values in pulled environment files, so a blank local placeholder does not establish that the saved Production value is blank. Never enter it into source control or chat. The production admin email is `admin@melaa.local`; replace it with a real controlled email and implement verified-email/MFA onboarding before a public release.

## Production migration

The production Vercel build runs `scripts/migrate.js` after bundling the browser uploader. This applies the schema and catalog and creates the first admin inside Vercel's environment, where the Production Secret is available. The migration is idempotent for the seed records, so subsequent production builds are safe, although a dedicated release migration job would be preferable as the project grows. A build fails if the Turso credentials or a 12+ character admin password are absent.

The October 2026 release adds versioned seller acceptance, post recommendations and private suggestions. Its migration changes only untouched original commission defaults (10%/6%) to 5%/3%; an admin-edited rate is preserved. These are internal projections, not seller-agreed fees. The revised seller terms require a separate mutual written fee agreement before paid selling. A seller with an older terms version must accept the current terms before publishing. This deployment still records no wholesale or retail payment.

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
5. Retain **All Deployments** protection until identity verification, automated media/malware scanning, independent security review, privacy/legal review and licensed payment/fulfillment integrations are complete. Recheck the production alias anonymously after every protection change: Standard Protection leaves production domains public. A working preview is **not** authorization to operate a public marketplace.

## Payments and moderation

Checkout intentionally records only `awaiting_payment` orders. No funds, donations or payouts are moved. Commission is a projected accounting field, not revenue collected. Private uploads and text rules plus admin review are baseline controls; they cannot guarantee that all counterfeit goods, fake identities or illegal content are detected.

References: [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js), [Turso on Vercel](https://vercel.com/marketplace/tursocloud/database), [private Blob storage](https://vercel.com/docs/vercel-blob/private-storage), [client uploads](https://vercel.com/docs/vercel-blob/client-upload), [Function body limits](https://vercel.com/docs/functions/limitations), [Vercel production protection announcement](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan).
