# Delivery matching and packing methodology

Updated 8 October 2026.

Customers choose their destination country. Nepal additionally requires a valid province/district pair. International country cards cover exactly one country; zone cards list their constituent countries. A country card takes precedence over a zone. Domestic district cards take precedence over province cards, then nationwide cards. Equal-priority overlaps fail with an explicit configuration message. A requested rate-card ID cannot override the country match. The legacy indicative “All countries” card is never treated as real international coverage.

Quotes and order recording use the same server-side resolver, product records and calculation. Orders store the destination and full quote snapshot, including parcel assumptions and matched rate card. Client-submitted product weights and prices are not used. Unsupported destinations require a manual quote; the UI does not display free delivery or allow an order with a missing quote.

## Weight and packing

Carrier guidance uses actual weight including packaging and volumetric weight based on exterior parcel dimensions. Melaa compares the two for each parcel, rounds up using the rate card's billing increment and applies its minimum billable weight. Each unit is conservatively modeled as a separate parcel. Rounded chargeable weights are summed within each seller dispatch and priced using that card's weight bands and applicable surcharges. Different sellers incur separate dispatch base rates. This does not optimize consolidated cartons; a carrier or seller needs to measure those final parcels before an accurate consolidated quote can be offered.

`volumetric kg = exterior length cm × exterior width cm × exterior height cm / carrier divisor`

Existing products retain their recorded **packed** weights and dimensions. No packaging allowance is added twice. New products can supply measured packed data or select unpacked-product estimation. Automatic classification suggests fragile packaging for clay, ceramic, glass, pottery or diya titles/categories, a pouch for textiles/garments, otherwise a carton. Sellers can override this suggestion.

Initial Melaa planning allowances (these are estimates, not specifications or rates supplied by a carrier):

| Profile | Packaging mass per unit | Protective space on each side |
| --- | --- | --- |
| Protective pouch | 50 g | 1 cm |
| Protective carton | 150 g | 2 cm |
| Fragile cushioned carton | 300 g | 5 cm |

Both the mass and exterior dimensions increase for estimated packing. The customer sees the profile, dimensions, actual/volumetric/billed weights and estimation label. These allowances require validation against the maker's real materials, fragility and shipping tests. Accurate product mass cannot be inferred from a photo or product name alone.

The divisor and billing increment are configured per courier card; 5,000 and 0.5 kg are defaults, not a universal rule. The carrier's contracted tariff controls rounding, limits, fuel/remote-area fees and eligibility. Customs duties, taxes, pickup serviceability, prohibited goods and final carrier measurements require confirmation.

## Sources researched for this implementation

- [DHL weight and dimensions](https://www.dhl.com/discover/en-gb/ship-with-dhl/products-and-services/weight-and-dimensions): volumetric comparison and centimetre divisor of 5,000.
- [DHL exterior box measurement](https://www.dhl.com/discover/en-in/ship-with-dhl/services/how-to-measure-box-size-for-shipping): use exterior parcel dimensions, including protective packaging.
- [FedEx dimensional-weight guidance](https://www.fedex.com/en-ph/customer-support/faq/invoices-and-payments/fees-and-charges/calculate-dimensional-weight.html): comparison and metric dimensional divisor.
- [DHL 2026 service guide, Vietnam](https://mydhlplus.dhl.com/content/dam/downloads/vn/en/rate-guide/service_and_rate_guide_vn_en_2026.pdf.coredownload.pdf): calculate each piece and allow carrier remeasurement. This informs methodology only; Vietnam tariffs are not imported as Nepal export rates.

The sources inform the calculation, not the price of every destination. Production rates and zone membership must come from the selected courier's Nepal-origin tariff or contracted rating API. No live carrier API is connected, and the system does not scrape or invent a worldwide price list.

## Verification

Integration coverage includes individual-country precedence, zone matching, missing coverage, mismatched IDs, domestic district matching, estimated fragile packaging, separate seller dispatches, checkout refusal without coverage and stored quote snapshots. Unit checks verify no double packing, mixed dense/bulky parcels, custom increments, invalid dimensions and equal-priority overlaps.

## Three categories and the dedicated admin page — 8 October 2026

Open **Admin account → Manage courier rates** to use the separate `#courier` page. It is available only to administrators and replaces the embedded account-page form.

Both admin entry and customer destination selection use these categories:

1. **Kathmandu Valley** — the operational district grouping of Kathmandu, Bhaktapur and Lalitpur. Carrier area/postcode coverage still needs confirmation.
2. **Nepal Outside Valley** — other Nepal districts. A category-wide rate is the simplest setup; optional province/district overrides support regional prices.
3. **International Destinations** — named zones with selected destination countries, plus individual-country override cards.

### Enter a card

1. Select a category. For an existing domestic card, choose **Edit** in Saved rate cards.
2. Enter a card name. For international delivery this is the zone name, such as the zone label on the courier's tariff.
3. Type into **Find countries**, then select the matches. Selected countries remain visible as removable chips across searches. Enter adds an exact country match, or a sole match, without submitting the form. Individual-country mode keeps one selected country.
4. Enter the first 0.5 kg rate and the additional amount per 0.5 kg; select **Fill weight-band rates**. This fills all twenty bands through 10 kg, which can be individually adjusted. If a courier uses irregular prices, enter those directly in the grid.
5. Enter the additional per-kg price above 10 kg. Weight settings and optional surcharges are under the expandable advanced section.
6. Save. Use **Edit** to update destinations, prices or the zone name while retaining the saved card ID.

The server rejects duplicate names and equal-priority destination overlaps. A country-specific card can coexist with a containing zone and takes precedence. Kathmandu Valley and Outside Valley cards cannot serve each other's district groups. Existing cards are migrated to a category without changing their prices.

### Researched rate-entry structure

[FedEx's export-rate documentation](https://www.fedex.com/en-th/quick-help/ecrv.html) separates export rate sheets from the country-to-zone chart. [FedEx's rate-sheet tool](https://www.fedex.com/ratetools/html/RateSheets.html) supports retrieving rates by zone. Melaa follows that structure: named zone → country membership → weight rates. The quick-fill calculator is an entry convenience, not a carrier price source. Use the courier's current **Nepal-origin** rate sheet and zone chart; foreign-origin tariffs are not imported. The indexed 2025 DHL Nepal guide was unavailable from its published URL during this research, so it was not used to populate prices or country assignments.

Verification includes browser save/reload/rename, typed country search, multi-country selection and removal, rate-table generation, surcharge persistence, deep links and phone-width layout. Integration tests cover category isolation, renaming without creating a new rule, zone overlap rejection and admin-only mutations.
