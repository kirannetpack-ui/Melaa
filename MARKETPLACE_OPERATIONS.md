# Marketplace economics and anti-circumvention

Melaa should earn transparently for services customers value. It should not make users feel that the platform owns their business, identity, content, or customer relationships.

## Recommended commercial model

The current build stores internal planning defaults of **5% retail** and **3% wholesale**, plus a buyer-protection percentage (default 0%) and payout hold (default seven days). These defaults are **not agreed seller fees**. The recorded retail commission is a projection on an unpaid order, not revenue. Wholesale is still a quote request, so **no wholesale fee is booked or collected**. An untouched 10%/6% deployment default is migrated to 5%/3%; admin-modified rates are preserved.

Three percent is the safer wholesale starting proposal. Two percent should be a negotiated volume rate only after a Nepal-licensed settlement partner quotes actual processing, refund and chargeback costs and Melaa measures support/moderation cost. For example, a NPR 10,000 merchandise sale produces a projected NPR 500 retail fee or NPR 300 standard wholesale fee **before** provider costs, tax and operating expense; this is not profit. Sellers set their own displayed prices. Shipping and tax are excluded from the percentage; discounts, refunds, provider fees and reversals require a reconciled ledger and counsel-reviewed rules before money moves.

Seller registration shows six short clauses and requires explicit, unchecked acceptance. The accepted version and timestamp are saved. The fee clause now requires a **separate mutual written agreement** stating the rate, calculation basis, payment timing and refund treatment before paid selling begins. Changes to internal planning defaults do not create or amend such an agreement. Material term changes require a new terms version and fresh acceptance. Existing sellers without current acceptance are prompted in their account. These clauses are a launch draft requiring Nepalese counsel review, not an assertion of legal sufficiency.

A balanced launch model is:

- Agree and disclose each seller's actual commission in writing before enabling paid selling, and show it again before an order is accepted.
- Charge commission only on successfully paid merchandise; disclose treatment of shipping, tax, refunds, discounts, and chargebacks.
- Let sellers retain ownership of their brand, product media, and customer-independent business. Grant Melaa only the license needed to operate and promote marketplace listings.
- Use optional paid visibility or seller subscriptions only when clearly labeled. Never make organic reach secretly pay-to-play.
- Hold payout only for a stated protection/fraud window; show the expected release date and reason for any exception.
- Offer seller data export, notice of material fee changes, accessible disputes, and proportionate suspension/appeal processes.
- Keep community “recommend” signals separate from verified-purchase reviews. Do not buy or secretly boost recommendations; disclose any material seller relationship if testimonial features are later added.

## Making bypass less attractive

The strongest defense is useful infrastructure, not dark patterns.

1. Contract a Nepal-eligible, licensed payment provider with a documented marketplace/settlement arrangement that retains the agreed Melaa fee and pays sellers under a stated schedule. Do not assume a global provider can serve a Nepal-based platform.
2. Keep product inquiry, offer, order, receipt, shipment, refund, dispute, and support history in one timeline.
3. Block contact details, external links, and off-platform payment requests in pre-order chat; provide an appeal when a legitimate address is needed after purchase.
4. Make buyer protection, verified reviews, fraud monitoring, shipment tracking, refunds, and seller payout eligibility conditional on an on-platform order.
5. Detect repeated contact-sharing variants and suspicious migration behavior, but use risk-based review rather than silently reading meaning into every message.
6. Write a reasonable non-circumvention term with counsel, an explicit time/scope, transparent enforcement, and a lawful opt-out or conversion mechanism where appropriate.
7. Do not fabricate ownership: communicate that Melaa facilitates and safeguards a transaction; the seller remains an independent business and the buyer remains the buyer.

The current text blocker is only a first layer. Production needs multilingual normalization, OCR, image/QR detection, obfuscation detection, appeal tooling, and privacy/retention limits.

## Payment architecture required

Use a licensed provider's marketplace/connected-account flow so customer funds are not informally received in Melaa's bank account. On payment confirmation, write a double-entry ledger for gross merchandise value, tax, delivery, discount, Melaa fee, seller payable, reserves, refunds, disputes, and provider fees. Trust only signed idempotent webhooks. Reconcile provider balances daily. Require controlled approval for payout-account changes.

Useful models and requirements:

- Stripe Connect application fees/destination charges (architectural example only, not an available Nepal integration): https://docs.stripe.com/connect/destination-charges
- Stripe country availability (Nepal is not listed as of October 2026): https://stripe.com/global
- Nepal Rastra Bank's current list of licensed PSOs and PSPs: https://www.nrb.org.np/departments/psd/
- eSewa merchant integration documentation (ordinary merchant payments; marketplace split settlement is not established by this documentation): https://developer.esewa.com.np/pages/Introduction
- Airbnb off-platform communication/payment protections: https://www.airbnb.com/help/article/209
- Upwork circumvention rationale: https://support.upwork.com/hc/en-us/articles/360048105134-Why-you-shouldn-t-get-paid-outside-Upwork
- EU Digital Services Act trader traceability: https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- US FTC INFORM Consumers Act guidance: https://www.ftc.gov/business-guidance/resources/what-third-party-sellers-need-know-about-inform-consumers-act
- US FTC guidance on truthful recommendations and material-connection disclosures (comparative design reference, not Nepal law): https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews
- Vercel limits: Functions cannot host WebSocket servers, so true live commerce needs a separate real-time streaming service and moderation workflow: https://vercel.com/docs/limits

These examples are operational references, not Nepal-specific legal advice. Nepal tax, payment, consumer, privacy, e-commerce, export, fundraising, and foreign-exchange requirements need local counsel and licensed providers.
