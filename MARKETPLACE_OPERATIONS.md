# Marketplace economics and anti-circumvention

Melaa should earn transparently for services customers value. It should not make users feel that the platform owns their business, identity, content, or customer relationships.

## Recommended commercial model

The current build stores a configurable retail commission (default 10%), wholesale commission (default 6%), buyer-protection percentage (default 0%), and payout hold (default seven days). The recorded commission is calculated per order line so it can be reconciled per seller.

A balanced launch model is:

- Publish the seller commission before listing and again before accepting an order.
- Charge commission only on successfully paid merchandise; disclose treatment of shipping, tax, refunds, discounts, and chargebacks.
- Let sellers retain ownership of their brand, product media, and customer-independent business. Grant Melaa only the license needed to operate and promote marketplace listings.
- Use optional paid visibility or seller subscriptions only when clearly labeled. Never make organic reach secretly pay-to-play.
- Hold payout only for a stated protection/fraud window; show the expected release date and reason for any exception.
- Offer seller data export, notice of material fee changes, accessible disputes, and proportionate suspension/appeal processes.

## Making bypass less attractive

The strongest defense is useful infrastructure, not dark patterns.

1. Use a marketplace payment product that creates a destination/seller charge and retains an application fee. Release seller proceeds after delivery or the configured risk window.
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

- Stripe Connect application fees/destination charges: https://stripe.com/connect/marketplaces
- Airbnb off-platform communication/payment protections: https://www.airbnb.com/help/article/209
- Upwork circumvention rationale: https://support.upwork.com/hc/en-us/articles/360048105134-Why-you-shouldn-t-get-paid-outside-Upwork
- EU Digital Services Act trader traceability: https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- US FTC INFORM Consumers Act guidance: https://www.ftc.gov/business-guidance/resources/what-third-party-sellers-need-know-about-inform-consumers-act

These examples are operational references, not Nepal-specific legal advice. Nepal tax, payment, consumer, privacy, e-commerce, export, fundraising, and foreign-exchange requirements need local counsel and licensed providers.
