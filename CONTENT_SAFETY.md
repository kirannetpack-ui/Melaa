# Marketplace trust and content-safety program

Automation alone cannot reliably identify every fake person, counterfeit product, exploitative account, or illegal image. Melaa therefore uses layered prevention, detection, human review, appeals, and enforcement.

## Current product controls

- Seller accounts start in `pending`; only an admin can mark them `verified`.
- Seller products and stories start in `review`; only approved records reach the public catalog/feed.
- Category and commodity proposals start in `review` and require admin approval.
- A baseline text classifier blocks explicit sexual terms, counterfeit/deceptive claims, impersonation/fraud language, and off-platform contact/payment instructions in chat.
- Buyers and sellers can report a conversation. Admins can read marketplace conversations, inspect moderation events, hide a message, and close a conversation through the API.
- Rejected items retain a moderation note; admin decisions are auditable.
- Cloud seller uploads are held in private Blob storage. Basic signatures are checked after upload, and only the owner/admin can fetch media before a linked item is approved.

## Production moderation layers

1. **Identity:** verify seller identity, business registration where applicable, beneficial owner, address, payout-account ownership, sanctions/PEP exposure, device risk, and duplicate-account signals. Reverify after sensitive changes.
2. **Product authenticity:** require seller invoices/provenance, maker attribution, material/ingredient labels, certifications, brand authorization, serial numbers when relevant, and country/export eligibility. Use high-risk-category holds and sample purchases.
3. **Media:** quarantine first; hash-match known illegal imagery through an authorized provider, run nudity/sexual-content and violence classifiers, OCR text, scan malware, and send uncertain/high-risk results to trained reviewers. Never expose suspected child sexual abuse material to ordinary staff; follow competent-authority reporting and evidence-preservation rules.
4. **Behavior:** score account age, linked devices, payment failures, rapid listing/message volume, copied media, price anomalies, review rings, refunds, chargebacks, buyer reports, contact sharing, and seller-to-buyer migration attempts.
5. **Human review:** documented severity levels, restricted queues, reviewer wellness controls, response targets, second review for severe decisions, and an appeal channel.
6. **Enforcement:** warn, limit reach, hold listing, hold payout, remove content, suspend account, preserve evidence, or report as legally required. Avoid automatic permanent bans based on one weak signal.

## Prohibited or restricted examples

Illegal sexual content; sexual exploitation; non-consensual intimate imagery; nudity involving minors; counterfeit, stolen, recalled, unsafe, or misrepresented goods; fake identities; impersonation; manipulated reviews; hate or targeted harassment; weapons and controlled goods; medical products or claims without authorization; wildlife/heritage items that cannot lawfully be traded; financial scams; malware; and instructions to evade Melaa payments or safety controls.

This list is not complete. Create jurisdiction-specific rules with counsel and destination-specific product controls.

## External safety references

- eSafety Safety by Design: https://www.esafety.gov.au/industry/safety-by-design/industry-guides
- eSafety illegal/restricted content workflow: https://www.esafety.gov.au/industry/safety-by-design/foundations/dealing-with-illegal-and-restricted-online-content
- Internet Watch Foundation hash services: https://www.iwf.org.uk/our-technology/our-services/
- INTERPOL counterfeit shopping guidance: https://www.interpol.int/Crimes/Illicit-goods/Shop-safely
- FTC review-platform guidance: https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms
- Ofcom illegal-content risk and records guidance: https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/check-how-to-comply-with-the-illegal-content-rules
