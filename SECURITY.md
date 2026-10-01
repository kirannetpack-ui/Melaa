# Melaa security baseline

This repository implements a defensive development baseline, not a guarantee of absolute security. A public marketplace needs independent penetration testing, infrastructure hardening, incident response, and continuing patch management.

## Implemented in this build

- Passwords are salted and derived with Node.js `scrypt`; passwords must be 12+ characters and contain upper-case, lower-case, and numeric characters.
- Session tokens contain 256 bits of randomness, are stored as SHA-256 hashes, expire after seven days, and use `HttpOnly`, `SameSite=Strict`, and production-only `Secure` cookies.
- Inactive accounts cannot authenticate. Repeated login failures are throttled and recorded.
- Role checks protect buyer, verified-seller, and admin actions. New sellers remain pending until an admin verifies them.
- All database values are passed through prepared statements. Dynamic SQL is restricted to server-owned allowlists.
- Non-GET cross-origin requests are rejected. API write rates and authentication attempts are bounded.
- CSP, frame denial, MIME sniffing prevention, referrer, permissions, and cross-origin resource headers are set. Production responses add HSTS.
- Product, post, category, commodity, chat, and admin-review states are enforced on the server; hiding a button is never the access control.
- Upload type and size are constrained. Uploaded paths are randomized and traversal is rejected. Vercel uploads go to private Blob storage, are checked for basic file signatures, and are served only through the app's approval/ownership gate.
- Admin decisions and selected moderation actions are written to audit or moderation records.

## Required before Internet launch

1. Keep Vercel deployment protection enabled until independent security and abuse reviews pass. Configure WAF/bot controls and alerting before opening registration publicly.
2. The private Blob store is only a quarantine foundation. Decode/re-encode media, scan malware, strip metadata, create safe derivatives, and add specialist image/video checks before public launch.
3. Add verified email/phone, MFA for admins, account recovery, session/device management, credential breach screening, and a modern identity provider if practical.
4. Move rate limits and sessions to a shared durable store. Add bot controls, device/risk signals, IP reputation, and alerting.
5. Turso provides managed persistent storage for Vercel. Add versioned migrations, least-privilege credentials, backup/restore drills, and a recovery runbook.
6. Add structured logs without secrets, security monitoring, dependency/SAST/DAST/secret scanning, incident playbooks, data-retention rules, and breach-notification procedures.
7. Contract a PCI-compliant marketplace payment provider. Never store card data here. Use signed webhooks, idempotency keys, double-entry ledgers, reconciliation, disputes, refunds, reserves, and controlled payouts.
8. Obtain independent threat modeling, accessibility testing, privacy/legal review, and penetration testing before launch and after material changes.

## Administrator safety

Use a unique production admin email and password supplied through a secret manager. Do not retain the demo credentials. Separate support, catalog reviewer, moderator, finance, and super-admin privileges as the team grows; the current `admin` role is intentionally simple for development. Require two-person approval for payout account changes, seller reinstatement after fraud, and high-value refunds.

## Reporting

Create a monitored `security@` address and a disclosure policy before public release. Preserve evidence, revoke affected sessions, restrict compromised accounts, and document every incident decision. Do not include passwords, full identity documents, card data, or illegal content in ordinary tickets or logs.
