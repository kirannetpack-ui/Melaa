export class ShippingError extends Error {}
// Carrier methodology: see SHIPPING_LOGIC.md. Packaging allowances are Melaa estimates.
export const packagingProfiles = {
  soft: { name: 'Protective pouch', padding_cm: 1, tare_g: 50 },
  standard: { name: 'Protective carton', padding_cm: 2, tare_g: 150 },
  fragile: { name: 'Cushioned fragile carton', padding_cm: 5, tare_g: 300 }
};
export function packedParcel(product) {
  const mode = product.packaging_mode || 'packed';
  const dimensions = ['length_cm','width_cm','height_cm'].map(key => Number(product[key]));
  if (dimensions.some(v => !Number.isFinite(v) || v <= 0) || !Number.isFinite(Number(product.weight_g)) || Number(product.weight_g) <= 0) throw new ShippingError('Product needs valid weight and dimensions before delivery can be quoted.');
  if (mode === 'packed') return { actual_kg: Number(product.weight_g)/1000, dimensions_cm: dimensions, packaging: 'Seller-provided packed parcel', estimated: false };
  let profileKey = mode;
  if (mode === 'auto') {
    const text = [product.title, product.category].join(' ').toLowerCase();
    profileKey = /clay|ceramic|glass|pottery|diya|fragile/.test(text) ? 'fragile' : /shawl|textile|clothing|fabric|scarf|garment/.test(text) ? 'soft' : 'standard';
  }
  const profile = packagingProfiles[profileKey];
  if (!profile) throw new ShippingError('Unsupported packaging method.');
  return { actual_kg: (Number(product.weight_g)+profile.tare_g)/1000, dimensions_cm: dimensions.map(v=>v+2*profile.padding_cm), packaging: profile.name, packaging_weight_g: profile.tare_g, padding_cm: profile.padding_cm, estimated: true };
}
export function parcelWeights(lines, rule) {
  const divisor=Number(rule.divisor), increment=Number(rule.billing_increment_kg || .5), minimum=Number(rule.minimum_kg);
  if (![divisor,increment,minimum].every(v=>Number.isFinite(v)&&v>0)) throw new ShippingError('Invalid carrier weight settings.');
  let actual=0,volume=0,chargeable=0;
  const parcels=lines.map(({product,qty})=>{
    const parcel=packedParcel(product), volumetric=parcel.dimensions_cm.reduce((a,b)=>a*b,1)/divisor;
    // Compare per parcel, so a dense item cannot cancel a bulky item's billable volume.
    const billed=Math.max(minimum,Math.ceil((Math.max(parcel.actual_kg,volumetric)-1e-9)/increment)*increment);
    actual+=parcel.actual_kg*qty; volume+=volumetric*qty; chargeable+=billed*qty;
    return { product_id:product.id, title:product.title, qty, ...parcel, volumetric_kg:+volumetric.toFixed(3), chargeable_kg_per_unit:+billed.toFixed(3) };
  });
  return { actual_kg:+actual.toFixed(3), volumetric_kg:+volume.toFixed(3), chargeable_kg:+chargeable.toFixed(3), parcels, packaging_estimated:parcels.some(p=>p.estimated), packing_basis:'Each unit is quoted as a separate parcel; consolidation requires measured final parcels.' };
}
export const valleyDistricts=['Kathmandu','Bhaktapur','Lalitpur'];
export function deliveryCategory(rule){return rule.delivery_category||(rule.scope==='international'?'international':rule.name==='Kathmandu Valley'?'kathmandu_valley':'nepal_outside_valley');}
export function resolveDestination(rules, destination) {
  const country=String(destination.country || '').trim();
  if (!country) throw new ShippingError('Choose a destination country.');
  let matches;
  if (country === 'Nepal') {
    const {province,district}=destination;
    if (!province || !district) throw new ShippingError('Choose a delivery province and district.');
    const category=valleyDistricts.includes(district)?'kathmandu_valley':'nepal_outside_valley';
    if(destination.delivery_category&&destination.delivery_category!==category)throw new ShippingError('The selected delivery category does not match the district.');
    matches=rules.filter(r=>deliveryCategory(r)===category && (!r.province||r.province===province) && (!r.district||r.district===district));
    matches.sort((a,b)=>(Number(Boolean(b.district))*2+Number(Boolean(b.province)))-(Number(Boolean(a.district))*2+Number(Boolean(a.province))));
  } else {
    if(destination.delivery_category&&destination.delivery_category!=='international')throw new ShippingError('Choose International Destinations for this country.');
    matches=rules.filter(r=>deliveryCategory(r)==='international' && JSON.parse(r.countries_json || '[]').includes(country));
    matches.sort((a,b)=>Number(b.international_mode==='country')-Number(a.international_mode==='country'));
  }
  if (!matches.length) throw new ShippingError('No courier rate is configured for this destination. Request a delivery quote.');
  const rank=r=>country==='Nepal'?Number(Boolean(r.district))*2+Number(Boolean(r.province)):Number(r.international_mode==='country');
  if (matches.length>1 && rank(matches[0])===rank(matches[1])) throw new ShippingError('Multiple courier cards cover this destination. An administrator must resolve the overlap.');
  if(destination.shipping_rule_id && Number(destination.shipping_rule_id)!==Number(matches[0].id))throw new ShippingError('The selected courier card does not match the destination.');
  return matches[0];
}
