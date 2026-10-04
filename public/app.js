const $ = selector => document.querySelector(selector);
const money = value => `NPR ${Number(value || 0).toLocaleString('en-US')}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const symbols = ['🧣', '🥟', '🎨', '🪔', '📓', '🌶️', '🎁', '🧵', '🍚', '🧺'];

const state = {
  data: null,
  view: ['home','occasions','shop','wholesale','impact','messages','account'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home',
  filter: 'All',
  query: '',
  feedMode: 'for-you',
  feedQuery: '',
  feedPosts: [],
  feedOffset: 0,
  feedHasMore: true,
  feedLoading: false,
  feedGeneration: 0,
  cart: JSON.parse(localStorage.getItem('melaa-cart') || '[]'),
  zone: 'Kathmandu Valley',
  ship: null,
  me: null,
  conversations: [],
  activeConversation: null
};

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
const product = id => state.data.products.find(item => item.id === Number(id));
const occasion = id => state.data.occasions.find(item => item.id === Number(id));
const art = item => symbols[(Number(item?.id || 1) - 1) % symbols.length];
const initials = name => String(name || 'M').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.add('hidden'), 3600);
}

function updateMessengerBadge() {
  const unread = state.data?.user?.role === 'admin' ? 0 : state.conversations.reduce((sum, item) => sum + Number(item.unread || 0), 0);
  document.querySelectorAll('.messenger-count').forEach(badge => {
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.classList.toggle('hidden', unread === 0);
  });
  document.querySelectorAll('[data-view="messages"]').forEach(button => button.setAttribute('aria-label', unread ? `Open Messenger, ${unread} unread messages` : 'Open Messenger'));
}

async function syncMessengerBadge() {
  if (!state.data?.user) { state.conversations = []; updateMessengerBadge(); return; }
  try { state.conversations = (await api('/conversations')).conversations; updateMessengerBadge(); }
  catch { /* Background status must not interrupt shopping. */ }
}

function saveCart() {
  localStorage.setItem('melaa-cart', JSON.stringify(state.cart));
  $('#cart-count').textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function imageOrArt(item, className = '') {
  return item?.image
    ? `<img class="${className}" src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">`
    : `<span aria-hidden="true">${art(item)}</span>`;
}

function footer() {
  return `<footer class="footer-main"><div class="container">
    <div class="brand" style="color:white">✺ Melaa.</div>
    <p>Discover Nepal. Celebrate everywhere.</p>
    <p>This is a development preview. Seller verification, product evidence, export eligibility, payments and contribution recipients require production review before launch.</p>
  </div></footer>`;
}

function section(eyebrow, title, subtitle, content, link = '') {
  return `<section class="section"><div class="container">
    <div class="section-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${subtitle}</p></div>${link}</div>
    ${content}
  </div></section>`;
}

function productCard(item) {
  return `<article class="card">
    <button class="card-image" data-view-product="${item.id}" aria-label="View ${esc(item.title)}">
      ${imageOrArt(item)}<b class="tag">${esc(item.category)}</b>
    </button>
    <div class="card-body">
      <span class="subtle">${esc(item.origin)} · ${esc(item.seller)}</span>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.description)}</p>
      <div class="card-bottom"><span class="price">${money(item.price)}</span><button class="small-btn" data-add="${item.id}">Add +</button></div>
    </div>
  </article>`;
}

function occasionCard(item) {
  return `<article class="card occasion-card">
    <span class="symbol" aria-hidden="true">✺</span>
    <span class="subtle">${esc(item.month)} · ${esc(item.community)}</span>
    <h3>${esc(item.name)}</h3>
    <p>${esc(item.nepali)} · ${esc(item.type)}</p>
    <span class="footer">Explore the story</span>
    <button class="text-link" data-occasion="${item.id}" aria-label="Explore ${esc(item.name)}">View occasion →</button>
  </article>`;
}

function postMedia(item) {
  if (item.media_url && item.media_type === 'video') {
    return `<video src="${esc(item.media_url)}" controls playsinline preload="metadata" aria-label="Video by ${esc(item.author)}"></video><span class="media-badge">▶ Video</span>`;
  }
  if (item.media_url) return `<img src="${esc(item.media_url)}" alt="${esc(item.product ? `${item.product} by ${item.author}` : `Story by ${item.author}`)}" loading="lazy">`;
  return `<div class="post-placeholder" aria-label="Media preview">${symbols[(Number(item.product_id || 1) - 1) % symbols.length] || '✺'}</div>`;
}

function shoppableTag(item) {
  if (!item.product_id) return '';
  const linked = product(item.product_id);
  return `<div class="shoppable-tag">
    <div class="product-thumb">${linked ? imageOrArt(linked) : art(item)}</div>
    <div><strong>${esc(item.product)}</strong><span>${money(item.price)}${item.stock === 0 ? ' · Sold out' : ''}</span></div>
    <div class="shop-actions">
      <button class="view-btn" data-view-product="${item.product_id}">View</button>
      <button class="add-btn" data-add="${item.product_id}" ${item.stock === 0 ? 'disabled' : ''}>Add +</button>
    </div>
  </div>`;
}

function postCard(item) {
  const own = state.data.user?.id === item.author_id;
  return `<article class="post" data-post="${item.id}">
    <header class="post-head">
      <button class="avatar" data-maker="${item.author_id}" aria-label="View ${esc(item.author)}">${initials(item.author)}</button>
      <button class="post-author" data-maker="${item.author_id}" style="border:0;background:none;text-align:left;padding:0">
        <b>${esc(item.author)}</b><span>${esc(item.occasion || 'Maker story')} · Nepal</span>
      </button>
      ${own ? '<span class="pill">Your post</span>' : `<button class="follow-btn ${item.following ? 'following' : ''}" data-follow="${item.author_id}">${item.following ? 'Following' : 'Follow'}</button>`}
    </header>
    <div class="post-media">${postMedia(item)}</div>
    <div class="post-body">
      <div class="action-row">
        <button class="icon-action ${item.liked ? 'liked' : ''}" data-like="${item.id}" aria-label="${item.liked ? 'Unlike' : 'Like'} post" aria-pressed="${Boolean(item.liked)}">${item.liked ? '♥' : '♡'}</button>
        <button class="icon-action" data-comments="${item.id}" aria-label="Comment on post">◯</button>
        <button class="icon-action" data-share="${item.id}" aria-label="Share post">⌁</button>
        ${!own ? `<button class="icon-action ${item.recommended ? 'recommended' : ''}" data-recommend="${item.id}" aria-label="${item.recommended ? 'Remove recommendation' : 'Recommend this story'}" aria-pressed="${Boolean(item.recommended)}" title="Recommend to the Melaa community">${item.recommended ? '✦' : '✧'}</button><button class="icon-action" data-suggest-seller="${item.id}" aria-label="Suggest an idea to the seller" title="Suggest to seller">♧</button>` : ''}
        ${item.product_id && !own ? `<button class="icon-action" data-message-product="${item.product_id}" aria-label="Message seller">✉</button>` : ''}
        ${!own ? `<button class="icon-action" data-report="post" data-id="${item.id}" aria-label="Report post">⚑</button>` : ''}
        <button class="icon-action save-action" data-save="${item.id}" aria-label="${item.saved ? 'Remove from saved' : 'Save post'}" aria-pressed="${Boolean(item.saved)}">${item.saved ? '▣' : '▢'}</button>
      </div>
      <div class="like-count">${Number(item.likes).toLocaleString()} ${Number(item.likes) === 1 ? 'like' : 'likes'} · ${Number(item.recommendations||0)} ${Number(item.recommendations||0) === 1 ? 'recommendation' : 'recommendations'} <span class="subtle">· Member signals, not verified purchases</span></div>
      <p class="caption"><b>${esc(item.author)}</b>${esc(item.caption)}</p>
      ${shoppableTag(item)}
      <button class="comment-link" data-comments="${item.id}">View ${item.comments || 0} ${Number(item.comments) === 1 ? 'comment' : 'comments'}</button>
      <form class="quick-comment" data-id="${item.id}"><input name="body" maxlength="500" placeholder="Add a comment…" aria-label="Add a comment"><button>Post</button></form>
    </div>
  </article>`;
}

function storyTray() {
  const seen = new Set();
  const stories = state.data.posts.filter(item => {
    if (seen.has(item.author_id)) return false;
    seen.add(item.author_id);
    return true;
  });
  const occasionStories = state.data.occasions.slice(0, 5).map(item => ({
    id: `occasion-${item.id}`,
    name: item.name,
    image: null,
    occasionId: item.id
  }));
  const makerStories = stories.map(item => ({ id: item.id, name: item.author, image: item.media_url, authorId: item.author_id }));
  return `<div class="story-tray" aria-label="Stories">
    ${[...makerStories, ...occasionStories].map(item => `<button class="story" ${item.authorId ? `data-maker="${item.authorId}"` : `data-occasion="${item.occasionId}"`}>
      <span class="story-ring"><span class="story-inner">${item.image && !String(item.image).endsWith('.mp4') ? `<img src="${esc(item.image)}" alt="">` : initials(item.name)}</span></span>
      <small>${esc(item.name)}</small>
    </button>`).join('')}
  </div>`;
}

function home() {
  const posts = state.feedPosts;
  const isSeller = ['seller', 'admin'].includes(state.data.user?.role);
  return `<div class="social-shell">
    <aside class="social-sidebar">
      <nav class="side-menu" aria-label="Discover Melaa">
        <button class="active" data-view="home"><span>⌂</span>For you</button>
        <button data-view="shop"><span>◇</span>Shop all</button>
        <button data-view="messages"><span>✉</span>Messages</button>
        <button data-view="occasions"><span>◷</span>Occasions</button>
        <button data-view="wholesale"><span>▤</span>Wholesale</button>
        <button data-view="impact"><span>♡</span>Melaa Gives</button>
        ${isSeller ? '<button data-open-compose><span>＋</span>Create a post</button>' : ''}
      </nav>
      <p class="side-note">Every post can carry a product. Every product keeps its maker and cultural context visible.</p>
    </aside>
    <section class="feed-column" aria-label="Discovery feed">
      ${storyTray()}
      <div class="feed-tabs"><button class="${state.feedMode === 'for-you' ? 'active' : ''}" data-feed-mode="for-you">For you</button><button class="${state.feedMode === 'following' ? 'active' : ''}" data-feed-mode="following">Following</button></div>
      <label class="feed-search-label">Find stories <input id="feed-search" class="search" type="search" maxlength="80" placeholder="Try Dhaka, Tihar, pottery…" value="${esc(state.feedQuery)}"></label>
      ${isSeller ? `<div class="composer-prompt"><span class="avatar">${initials(state.data.user.name)}</span><button data-open-compose>Share what you're making…</button><button class="media-shortcut" data-open-compose aria-label="Add photo or video">▧</button></div>` : ''}
      <div id="feed-list">${posts.map(postCard).join('')}</div><div id="feed-status" class="feed-status" aria-live="polite">${state.feedLoading ? 'Loading stories…' : ''}</div><div id="feed-sentinel"></div>
      <button id="feed-more" class="btn ghost ${state.feedHasMore ? '' : 'hidden'}" type="button">Load more stories</button>
    </section>
    <aside class="right-rail">
      <div class="rail-card"><span class="eyebrow">Happening now</span><h3>Explore by occasion</h3>
        ${state.data.occasions.slice(0, 4).map(item => `<button class="trend-row" data-occasion="${item.id}" style="width:100%;border-left:0;border-right:0;border-top:0;background:none;text-align:left"><span class="avatar" style="width:44px;height:44px">✺</span><span><b>${esc(item.name)}</b><span>${esc(item.month)} · ${esc(item.community)}</span></span></button>`).join('')}
      </div>
      <div class="rail-card"><span class="eyebrow">Made in Nepal</span><h3>Shop the feed</h3><p class="muted" style="font-size:12px;line-height:1.55">Browse every tagged product, compare details, then add it without losing your place.</p><button class="btn" data-view="shop">Browse marketplace</button></div>
    </aside>
  </div>`;
}

function occasions() {
  return `<div class="page-hero"><div class="container"><span class="eyebrow">A living calendar</span><h1>Every story has a season.</h1><p>Browse festivals, community traditions and life events. Dates awaiting annual review stay clearly labeled.</p><input id="occasion-search" class="search" placeholder="Search occasion, community or month" value="${esc(state.query)}"></div></div>
  <section class="section"><div class="container">
    <div class="chips">${['All', 'Festival', 'New Year', 'Food & culture', 'Seasonal', 'Life event'].map(item => `<button class="chip ${state.filter === item ? 'active' : ''}" data-filter="${esc(item)}">${esc(item)}</button>`).join('')}</div>
    <div class="grid" id="occasion-results"></div>
    <div class="panel" style="margin-top:30px"><h3>Know a tradition we missed?</h3><p>Share its local name, community, place and a source or contact. A researcher reviews it before publication.</p>
      <form id="suggest-form" class="split"><div><label class="field">Occasion name<input name="name" required maxlength="120"></label><label class="field">Community<input name="community"></label><label class="field">Place or region<input name="region"></label></div><div><label class="field">Describe the tradition<textarea name="description" minlength="20" required></textarea></label><label class="field">Source URL, if available<input name="source_url" type="url"></label><button class="btn">Submit for research</button></div></form>
    </div>
  </div></section>${footer()}`;
}

function shop() {
  const categories = ['All', ...new Set(state.data.products.map(item => item.category))];
  return `<div class="page-hero"><div class="container"><span class="eyebrow">The Melaa marketplace</span><h1>Shop what inspires you.</h1><p>Every item stays connected to its maker, story and occasion.</p><input id="product-search" class="search" placeholder="Search products, makers, places and occasions" value="${esc(state.query)}"></div></div>
  <section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Category directory</span><h2>Culture, community, food and craft</h2><p>${state.data.categories.length} reviewed categories with ${state.data.commodities.length} starter commodity guides.</p></div><button class="btn ghost" data-propose-category>Propose a category or commodity</button></div>${categoryDirectory()}<div class="chips" style="margin-top:28px">${categories.map(item => `<button class="chip ${state.filter === item ? 'active' : ''}" data-filter="${esc(item)}">${esc(item)}</button>`).join('')}</div><div class="grid" id="product-results"></div></div></section>${footer()}`;
}

function categoryDirectory() {
  const groups = Object.groupBy ? Object.groupBy(state.data.categories, item => item.group_name) : state.data.categories.reduce((all, item) => ((all[item.group_name] ||= []).push(item), all), {});
  return `<div class="category-directory">${Object.entries(groups).map(([group, items]) => `<section class="category-group"><h3>${esc(group)}</h3><div class="category-links">${items.map(item => `<button data-category="${item.id}">${esc(item.name)} <small>${state.data.commodities.filter(x => x.category_id === item.id).length}</small></button>`).join('')}</div></section>`).join('')}</div>`;
}

function messages() {
  if (!state.data.user) return `<div class="page-hero"><div class="container"><span class="eyebrow">Melaa Messenger</span><h1>Trade with confidence.</h1><p>Sign in to message verified sellers while keeping conversations and transactions protected on Melaa.</p><button class="btn" data-view="account">Sign in</button></div></div>${footer()}`;
  return `<div class="message-page"><div class="message-title"><div><span class="eyebrow">Protected conversations</span><h1>Messages</h1></div><div class="notice compact">Contact details and off-platform payment requests are blocked. Admins can review reported and flagged conversations.</div></div><div class="messenger"><aside id="conversation-list" class="conversation-list"><div class="empty">Loading conversations…</div></aside><section id="chat-panel" class="chat-panel"><div class="empty">Choose a conversation or message a seller from a product.</div></section></div></div>`;
}

function wholesale() {
  return `<div class="page-hero"><div class="container"><span class="eyebrow">For shops, communities and events</span><h1>Bring Nepal closer, in bulk.</h1><p>Request quantity and destination from the same maker catalog. Freight and final offers require seller confirmation.</p></div></div>${section('Direct from makers', 'Bulk-ready products', 'Indicative prices become confirmed offers after a seller reviews the request.', `<div class="grid">${state.data.products.filter(item=>item.wholesale_price).map(item => `<article class="card"><div class="card-image">${imageOrArt(item)}</div><div class="card-body"><span class="subtle">MOQ ${item.moq} · ${esc(item.origin)}</span><h3>${esc(item.title)}</h3><p>From ${money(item.wholesale_price)} / unit</p><button class="small-btn" data-rfq="${item.id}">Request quote →</button></div></article>`).join('')||'<div class="empty">No bulk-ready listings yet. Ask a maker about custom quantity from their product page.</div>'}</div>`)}${footer()}`;
}

function impact() {
  return `<div class="page-hero"><div class="container"><span class="eyebrow">Melaa Gives</span><h1>Giving should stay a choice.</h1><p>Shopping never requires a contribution, and choosing not to contribute is private.</p></div></div>
  <section class="section"><div class="container"><div class="split"><div class="panel"><span class="pill">OPTIONAL · ALWAYS</span><h3>Your purchase stands on its own.</h3><p>A future checkout may let customers choose a verified recipient, amount and privacy setting. The default remains no contribution.</p><div class="notice">Contributions are disabled in this preview. No money can be collected for a beneficiary.</div></div><div class="panel"><span class="pill">TRANSPARENCY</span><h3>Every rupee needs a destination.</h3><p>Recipient identity, account ownership, lawful collection and reporting must be approved before fundraising.</p></div></div></div></section>${section('Applications', 'Recipients under review', 'A directory entry is not fundraising approval.', `<div class="grid">${state.data.causes.length ? state.data.causes.map(item => `<article class="card occasion-card"><span class="pill">Verified</span><h3>${esc(item.name)}</h3><p>${esc(item.project)}</p></article>`).join('') : '<div class="empty">No approved contribution recipients yet.</div>'}</div>`)}${footer()}`;
}

function sellerPanel() {
  const terms=state.data.seller_terms;
  if(state.data.user.role==='seller'&&state.data.user.accepted_terms_version!==terms.version)return `<div class="panel" style="margin-top:22px"><span class="eyebrow">Seller terms update</span><h3>Review before publishing</h3>${sellerTermsHtml()}<form id="seller-terms-accept-form"><input type="hidden" name="version" value="${esc(terms.version)}"><label class="consent-row"><input type="checkbox" name="accept" required> I have read and accept these seller terms.</label><button class="btn">Accept current terms</button></form></div>`;
  if (state.data.user.role === 'seller' && state.data.user.seller_status !== 'verified') return `<div class="panel" style="margin-top:22px"><span class="eyebrow">Seller application</span><h3>Verification ${esc(state.data.user.seller_status)}</h3><p>Admin approval is required before products, photos or videos can be published. This protects buyers and keeps seller identity accountable.</p></div>`;
  return `<div class="panel" style="margin-top:22px"><span class="eyebrow">Seller tools</span><h3>Maker studio</h3><p>Create a product once, then tag it in as many stories as you need.</p><div class="notice">You own your brand and product content. Any platform service fee will be mutually agreed in writing before paid selling begins. No payment or fee is collected in this preview; internal fee projections are not your agreed commercial terms.</div>
    <p><button class="text-link" data-show-seller-terms>Review your seller terms</button> · <span class="subtle">Live broadcasting is not enabled; uploaded videos can be tagged to approved products and occasions.</span></p>
    <div class="split">
      <form id="product-form">
        <label class="field">Product photo<input name="media" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label>
        <div class="media-preview hidden"></div>
        <label class="field">Title<input name="title" required maxlength="150"></label>
        <label class="field">Description<textarea name="description"></textarea></label>
        <div class="split"><label class="field">Approved category<select name="category_id" required><option value="">Choose one</option>${state.data.categories.map(item => `<option value="${item.id}">${esc(item.group_name)} · ${esc(item.name)}</option>`).join('')}</select></label><label class="field">Origin<input name="origin" value="Nepal"></label></div>
        <label class="field">Occasion<select name="occasion_id"><option value="">None</option>${state.data.occasions.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('')}</select></label>
        <div class="split"><label class="field">Price NPR<input name="price" type="number" min="1" required></label><label class="field">Stock<input name="stock" type="number" min="0" required></label></div>
        <div class="split"><label class="field">Optional wholesale NPR / unit<input name="wholesale_price" type="number" min="1" placeholder="Leave blank if not offered"></label><label class="field">Minimum wholesale quantity<input name="moq" type="number" min="2" value="2"></label></div>
        <label class="field">Packed weight grams<input name="weight_g" type="number" min="1" required></label>
        <div class="split"><label class="field">Length cm<input name="length_cm" type="number" min="1" required></label><label class="field">Width cm<input name="width_cm" type="number" min="1" required></label></div>
        <label class="field">Height cm<input name="height_cm" type="number" min="1" required></label>
        <button class="btn">Create product</button>
      </form>
      ${composerForm()}
    </div>
  </div>`;
}

function sellerTermsHtml() {
  const terms=state.data.seller_terms;
  return `<div class="seller-terms"><span class="eyebrow">Seller terms · ${esc(terms.version)}</span><ol>${terms.clauses.map(clause=>`<li>${esc(clause)}</li>`).join('')}</ol><p class="subtle">Draft for Nepalese legal review before public launch. Payment and payout services are not active.</p></div>`;
}

function composerForm() {
  return `<form id="post-form">
    <div class="upload-drop"><div><b>Tap to add a photo or video</b><p class="subtle">JPG, PNG or WebP up to 10 MB · MP4 up to 25 MB</p><input name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4" capture="environment"></div></div>
    <div class="media-preview hidden"></div>
    <label class="field">Caption<textarea name="caption" maxlength="2000" placeholder="Tell people what they are seeing and why it matters…" required></textarea></label>
    <label class="field">Tag one of your approved products<select name="product_id"><option value="">No product</option>${state.data.products.filter(item=>item.seller_id===state.data.user?.id).map(item => `<option value="${item.id}">${esc(item.title)} · ${money(item.price)}</option>`).join('')}</select></label>
    <label class="field">Tag an occasion<select name="occasion_id"><option value="">No occasion</option>${state.data.occasions.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('')}</select></label>
    <button class="btn">Publish story</button>
    <p class="subtle">Stories enter the admin review queue before they become public.</p>
  </form>`;
}

function adminPanel() {
  return `<div class="panel" style="margin-top:22px"><h3>Admin control center</h3><p>One queue for seller identity, products, posts, catalog proposals, conversations and recorded moderation events.</p><div id="admin-data">Loading…</div><div id="admin-review-queues"></div><div class="split">
    <form id="settings-form"><h3>Marketplace economics</h3><label class="field">Retail commission %<input name="retail_commission_percent" type="number" min="0" max="30" step="0.1" required></label><label class="field">Wholesale commission %<input name="wholesale_commission_percent" type="number" min="0" max="30" step="0.1" required></label><label class="field">Payout hold days<input name="payout_hold_days" type="number" min="0" max="30" required></label><button class="btn">Save commercial rules</button><p class="subtle">A payment provider must enforce split settlement and delayed payouts in production.</p></form>
    <form id="rate-form"><h3>Set delivery rate</h3><label class="field">Zone<select name="zone">${state.data.rates.map(item => `<option>${esc(item.zone)}</option>`).join('')}</select></label><label class="field">Base NPR<input name="base_npr" type="number" min="1" required></label><label class="field">Per chargeable kg<input name="per_kg_npr" type="number" min="1" required></label><label class="field">Volumetric divisor<input name="divisor" type="number" min="1" value="5000" required></label><label class="field">Minimum kg<input name="minimum_kg" type="number" min="1" value="1" required></label><button class="btn">Save rate</button></form>
  </div></div>
  <div class="panel" style="margin-top:22px"><h3>Cultural research desk</h3><p>Annual dates need a cited source and human review.</p><form id="occasion-date-form" class="split"><div><label class="field">Occasion<select name="occasion_id">${state.data.occasions.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('')}</select></label><label class="field">Bikram Sambat year<input name="bs_year" type="number" min="2000" max="2200" required></label></div><div><label class="field">Gregorian date<input name="gregorian_date" type="date" required></label><label class="field">Evidence URL<input name="source_url" type="url" required></label><button class="btn">Save reviewed date</button></div></form><div id="research-submissions"></div></div>`;
}

function account() {
  const user = state.data.user;
  if (!user) return `<div class="page-hero"><div class="container"><span class="eyebrow">Your Melaa</span><h1>Come on in.</h1><p>Sign in to follow makers, save stories, message sellers and order.</p></div></div><section class="section"><div class="container split"><div class="panel"><h3>Sign in</h3><form id="login-form"><label class="field">Email<input name="email" type="email" autocomplete="email" required></label><label class="field">Password<input name="password" type="password" autocomplete="current-password" required></label><button class="text-link" type="button" data-password-toggle>Show password</button><button class="btn">Sign in</button><p class="subtle">Password recovery is not available in this protected preview. Do not create an account you cannot access again.</p></form></div><div class="panel"><h3>Join Melaa</h3><form id="register-form"><label class="field">Name<input name="name" autocomplete="name" required maxlength="100"></label><label class="field">Email<input name="email" type="email" autocomplete="email" required></label><label class="field">Password (12+ characters)<input name="password" type="password" autocomplete="new-password" minlength="12" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,}" required></label><button class="text-link" type="button" data-password-toggle>Show password</button><label class="field">Join as<select name="role" id="join-role"><option value="buyer">Buyer</option><option value="seller">Maker / seller — requires admin approval</option></select></label><div id="seller-terms-box" class="hidden">${sellerTermsHtml()}<input type="hidden" name="seller_terms_version" value="${esc(state.data.seller_terms.version)}"><label class="consent-row"><input type="checkbox" name="accept_seller_terms"> I have read and accept the seller terms.</label></div><button class="btn">Create account</button></form></div></div></section>${footer()}`;
  return `<div class="page-hero"><div class="container"><span class="eyebrow">Your Melaa</span><h1>Hello, ${esc(user.name)}.</h1><p>Follow makers, save inspiration and keep orders in view.</p><button class="btn ghost" id="logout">Sign out</button></div></div><section class="section"><div class="container"><div class="split"><div class="panel"><h3>Plan an occasion</h3><p>Save a date and delivery area. Order-by dates remain planning estimates until live carriers are connected.</p><form id="event-form"><label class="field">Occasion<select name="occasion_id">${state.data.occasions.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('')}</select></label><label class="field">Date<input type="date" name="event_date" required></label><label class="field">Delivery area<select name="zone">${state.data.rates.map(item => `<option>${esc(item.zone)}</option>`).join('')}</select></label><button class="btn">Save event</button></form></div><div class="panel"><h3>Occasion reminders</h3><p>See planning notices here. Email and push delivery are not enabled.</p><div id="reminder-data">Loading…</div><button class="small-btn" data-reminder-demo>Show reminder demo</button></div></div><div class="panel" style="margin-top:18px"><h3>Your activity</h3><div id="account-data">Loading…</div></div>${['seller', 'admin'].includes(user.role) ? `<div class="panel" style="margin-top:18px"><h3>Suggestions to sellers</h3><p class="subtle">Private feedback is visible to the receiving seller and Melaa admins.</p><div id="suggestions-data">Loading…</div></div>${sellerPanel()}` : ''}${user.role === 'admin' ? adminPanel() : ''}</div></section>${footer()}`;
}

function render(scroll = true) {
  const views = { home, occasions, shop, wholesale, impact, messages, account };
  $('#content').innerHTML = (views[state.view] || home)();
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('nav-active', button.dataset.view === state.view));
  document.querySelectorAll('.mobile-nav [data-view]').forEach(button => button.classList.toggle('nav-active', button.dataset.view === state.view));
  const seller = ['seller', 'admin'].includes(state.data.user?.role);
  $('#create-toggle')?.classList.toggle('hidden', !seller);
  $('#mobile-create')?.classList.toggle('hidden', !seller);
  if (state.view === 'shop') filterProducts();
  if (state.view === 'occasions') filterOccasions();
  if (state.view === 'account' && state.data.user) loadAccount();
  if (state.view === 'messages' && state.data.user) loadConversations();
  if (state.view === 'home') setupFeed();
  else state.feedObserver?.disconnect();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

function resetFeed() {
  state.feedGeneration += 1;
  state.feedPosts = [];
  state.feedOffset = 0;
  state.feedHasMore = true;
  state.feedLoading = false;
}

function setupFeed() {
  state.feedObserver?.disconnect();
  const status = $('#feed-status');
  if (status && !state.feedHasMore && !state.feedLoading) status.innerHTML = feedEnd();
  state.feedObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) loadFeed();
  }, { rootMargin: '550px 0px' });
  if (state.feedHasMore) state.feedObserver.observe($('#feed-sentinel'));
  if (state.feedHasMore && !state.feedPosts.length) loadFeed();
}

function feedEnd() {
  if (!state.feedPosts.length) return state.feedMode === 'following'
    ? '<div class="empty">Follow a maker to build your feed. <button class="text-link" data-feed-mode="for-you">Explore all stories</button></div>'
    : '<div class="empty">No more reviewed stories yet. Explore products and occasions while makers create more.</div>';
  return '<div class="feed-finish"><b>You’re caught up for now.</b><p>More reviewed stories will appear as makers post.</p><button class="small-btn" data-view="shop">Explore products</button> <button class="small-btn" data-view="occasions">Explore occasions</button></div>';
}

async function loadFeed() {
  if (state.feedLoading || !state.feedHasMore || state.view !== 'home') return;
  const generation = state.feedGeneration;
  state.feedLoading = true;
  const status = $('#feed-status');
  if (status) status.textContent = 'Loading stories…';
  try {
    const params = new URLSearchParams({ limit: '8', offset: String(state.feedOffset), mode: state.feedMode, q: state.feedQuery });
    const result = await api(`/feed?${params}`);
    if (generation !== state.feedGeneration) return;
    state.feedPosts.push(...result.posts);
    state.feedOffset = result.next_offset;
    state.feedHasMore = result.has_more;
    result.posts.forEach(item => { if (!state.data.posts.some(x => x.id === item.id)) state.data.posts.push(item); });
    $('#feed-list')?.insertAdjacentHTML('beforeend', result.posts.map(postCard).join(''));
    if (status) status.innerHTML = result.has_more ? '<span class="subtle">Results reflect your search, followed makers and recent community activity.</span>' : feedEnd();
    $('#feed-more')?.classList.toggle('hidden', !result.has_more);
    if (!result.has_more) state.feedObserver?.disconnect();
  } catch (error) { if (status) status.textContent = error.message; }
  finally { if (generation === state.feedGeneration) state.feedLoading = false; }
}

function rerenderStay() {
  const y = window.scrollY;
  render(false);
  window.scrollTo({ top: y, behavior: 'instant' });
}

function filterProducts() {
  const query = state.query.toLowerCase();
  const items = state.data.products.filter(item => (state.filter === 'All' || item.category === state.filter) && [item.title, item.category, item.origin, item.occasion, item.seller].join(' ').toLowerCase().includes(query));
  $('#product-results').innerHTML = items.length ? items.map(productCard).join('') : '<div class="empty">No products match this search.</div>';
}

function filterOccasions() {
  const query = state.query.toLowerCase();
  const items = state.data.occasions.filter(item => (state.filter === 'All' || item.type === state.filter) && [item.name, item.nepali, item.community, item.month].join(' ').toLowerCase().includes(query));
  $('#occasion-results').innerHTML = items.length ? items.map(occasionCard).join('') : '<div class="empty">No occasions match this search.</div>';
}

async function loadAccount() {
  try {
    const [data,reminders] = await Promise.all([api('/me'),api('/reminders')]);
    state.me = data;
    $('#reminder-data').innerHTML = [...reminders.saved.map(item=>`<div class="reminder-card"><b>${esc(item.title)}</b><span>${esc(item.event_date)} · ${item.active?'Plan or order now':'Planning notice starts '+esc(item.notice_date)}</span><small>Your saved date · ${esc(item.zone)}</small></div>`),...reminders.reviewed.map(item=>`<div class="reminder-card"><b>${esc(item.title)}</b><span>${esc(item.event_date)} · ${item.active?'Prepare now':'Planning notice starts '+esc(item.notice_date)}</span><small>Admin-reviewed annual date${item.source_url?` · <a href="${esc(item.source_url)}" target="_blank" rel="noopener noreferrer">Source</a>`:''}</small></div>`)].join('')||'<p class="muted">No saved or annually reviewed dates in the next 120 days. Try the demo below, or save a personal occasion.</p>';
    $('#account-data').innerHTML = `<b>Saved occasions</b>${data.saved.length ? data.saved.map(item => {
      const date = new Date(`${item.event_date}T00:00:00`);
      date.setDate(date.getDate() - (item.zone.includes('International') ? 45 : 21));
      return `<p>${esc(item.title)} · ${esc(item.event_date)}<br><span class="subtle">Planning order-by: ${date.toISOString().slice(0, 10)}</span></p>`;
    }).join('') : '<p class="muted">Nothing saved yet.</p>'}<b>Orders</b>${data.orders.length ? data.orders.map(item => `<p>#${item.id} · ${money(item.total)} · ${esc(item.status)}<br><span class="subtle">No payment collected</span></p>`).join('') : '<p class="muted">No orders yet.</p>'}<b>Wholesale requests you sent</b>${data.quotes.length ? data.quotes.map(item => `<p>${esc(item.title)} × ${item.qty} · ${esc(item.status)}</p>`).join('') : '<p class="muted">No requests yet.</p>'}${data.quotes_received?.length?`<b>Bulk enquiries received</b>${data.quotes_received.map(item=>`<p>${esc(item.buyer)} requested ${esc(item.title)} × ${item.qty} · ${esc(item.destination)}<br><span class="subtle">${esc(item.note||'No special requirements')} · ${esc(item.status)}</span></p>`).join('')}`:''}`;
    if($('#suggestions-data'))$('#suggestions-data').innerHTML=data.suggestions.length?data.suggestions.map(item=>`<div class="review-card"><div><b>${esc(item.kind.replaceAll('_',' '))}</b> · ${esc(item.buyer)}<p>${esc(item.body)}</p><small>${esc(item.caption.slice(0,80))} · ${esc(item.status)}</small></div>${item.status==='new'?`<button class="small-btn" data-suggestion-reviewed="${item.id}">Mark reviewed</button>`:''}</div>`).join(''):'<p class="muted">No suggestions yet.</p>';
    if (data.user.role === 'admin') {
      const admin = await api('/admin');
      const openReports=admin.moderation.filter(item=>item.action==='queued');
      $('#admin-data').innerHTML = `<div class="admin-metrics"><div><span class="metric">${admin.orders.length}</span><p>Orders</p></div><div><span class="metric">${money(admin.revenue.projected_commission)}</span><p>Projected commission, not collected</p></div><div><span class="metric">${admin.sellers.length + admin.products.length + admin.posts.length}</span><p>Identity/content reviews</p></div><div><span class="metric">${openReports.length}</span><p>Open safety reports</p></div></div>`;
      const queue = (title, entity, items, label) => `<section class="review-section"><h3>${esc(title)} <span class="pill">${items.length}</span></h3>${items.length ? items.map(item => `<article class="review-card"><div><b>${esc(label(item))}</b>${item.image ? `<img class="review-media" src="${esc(item.image)}" alt="Submitted product">` : ''}${item.media_url ? item.media_type==='video' ? `<video class="review-media" src="${esc(item.media_url)}" controls playsinline></video>` : `<img class="review-media" src="${esc(item.media_url)}" alt="Submitted story">` : ''}${item.description ? `<p>${esc(item.description)}</p>` : ''}${item.caption ? `<p>${esc(item.caption)}</p>` : ''}<span class="subtle">${esc(item.email || item.proposer || item.seller || item.author || item.category || '')}</span></div><div class="review-actions"><button class="small-btn" data-review="approve" data-entity="${entity}" data-id="${item.user_id || item.id}">Approve</button><button class="small-btn danger" data-review="reject" data-entity="${entity}" data-id="${item.user_id || item.id}">Reject</button></div></article>`).join('') : '<p class="muted">Queue clear.</p>'}</section>`;
      $('#admin-review-queues').innerHTML = queue('Seller verification','seller',admin.sellers,x=>x.business_name||x.name)+queue('Product review','product',admin.products,x=>x.title)+queue('Story review','post',admin.posts,x=>x.caption.slice(0,70))+queue('Category proposals','category',admin.categoryProposals,x=>x.name)+queue('Commodity proposals','commodity',admin.commodityProposals,x=>x.name)+`<section class="review-section"><h3>Open safety reports <span class="pill">${openReports.length}</span></h3>${openReports.length?openReports.map(item=>`<div class="review-card"><div><b>${esc(item.surface)} · ${esc(item.reason.replaceAll('_',' '))}</b><p>${esc(item.excerpt||'')}</p><span class="subtle">${esc(item.actor||'Member')} · ${esc(item.created_at)}</span></div><div class="review-actions">${item.surface==='conversation'?`<button class="small-btn" data-open-admin-conversation="${item.entity_id}">Open chat</button>`:''}<button class="small-btn" data-resolve-report="${item.id}">Resolve</button></div></div>`).join(''):'<p class="muted">No open reports.</p>'}</section><section class="review-section"><h3>Recent moderation events</h3>${admin.moderation.slice(0,12).map(item=>`<div class="moderation-row"><b>${esc(item.reason.replaceAll('_',' '))}</b><span>${esc(item.surface)} · ${esc(item.actor||'automated')} · ${esc(item.action)}</span><p>${esc(item.excerpt||'')}</p></div>`).join('')||'<p class="muted">No events.</p>'}</section><section class="review-section"><h3>Accounts</h3>${admin.users.map(item=>`<div class="review-card"><div><b>${esc(item.name)}</b><p>${esc(item.email)} · ${esc(item.role)} · ${esc(item.account_status)}</p></div>${item.id===data.user.id?'':`<button class="small-btn ${item.account_status==='active'?'danger':''}" data-user-status="${item.account_status==='active'?'suspended':'active'}" data-id="${item.id}">${item.account_status==='active'?'Suspend':'Reactivate'}</button>`}</div>`).join('')}</section>`;
      const settingsForm=$('#settings-form');if(settingsForm)Object.entries(admin.settings).forEach(([key,value])=>{if(settingsForm.elements[key])settingsForm.elements[key].value=value});
      $('#research-submissions').innerHTML = `<h3>Community suggestions</h3>${admin.submissions.length ? admin.submissions.map(item => `<div class="drawer-item"><div><b>${esc(item.name)}</b> · ${esc(item.community || 'Community unspecified')}<p>${esc(item.description)}</p><span class="subtle">${esc(item.region || 'Location unspecified')} · submitted by ${esc(item.contributor)}</span></div></div>`).join('') : '<p class="muted">No suggestions yet.</p>'}`;
    }
  } catch (error) { toast(error.message); }
}

function openDrawer(title, html) {
  $('#drawer').innerHTML = `<div class="drawer-head"><h2>${esc(title)}</h2><button class="icon-btn" id="close-drawer" aria-label="Close">×</button></div>${html}`;
  $('#drawer').classList.remove('hidden');
  $('#overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  $('#drawer').classList.add('hidden');
  $('#overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

async function cartDrawer() {
  const lines = state.cart.map(item => ({ ...item, product: product(item.product_id) })).filter(item => item.product);
  const subtotal = lines.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  let shipping = 0;
  try {
    if (lines.length) {
      state.ship = await post('/quote-shipping', { items: state.cart, zone: state.zone });
      shipping = state.ship.shipping;
    }
  } catch (error) { toast(error.message); }
  openDrawer('Your basket', `${lines.length ? lines.map(item => `<div class="drawer-item"><div class="mini-art">${imageOrArt(item.product)}</div><div style="flex:1"><b>${esc(item.product.title)}</b><p>${money(item.product.price)} · ${item.product.weight_g} g packed/unit</p><div class="qty"><button data-qty="${item.product.id}" data-change="-1">−</button>${item.qty}<button data-qty="${item.product.id}" data-change="1">+</button><button class="text-link" data-remove="${item.product.id}">Remove</button></div></div></div>`).join('') : '<div class="empty">Your basket is waiting for something meaningful.</div>'}<div class="summary"><label class="field">Delivery zone<select id="delivery-zone">${state.data.rates.map(item => `<option ${item.zone === state.zone ? 'selected' : ''}>${esc(item.zone)}</option>`).join('')}</select></label><div class="summary-row"><span>Products</span><b>${money(subtotal)}</b></div><div class="summary-row"><span>Delivery estimate</span><b>${money(shipping)}</b></div><div class="summary-row"><strong>Estimated total</strong><strong>${money(subtotal + shipping)}</strong></div><p class="subtle">${state.ship ? `Chargeable weight ${state.ship.chargeable_kg} kg. Quote is provisional.` : ''}</p><div class="notice">No payment is taken in this preview. Contributions remain optional and disabled.</div><button class="btn" id="checkout" style="width:100%;margin-top:16px" ${lines.length ? '' : 'disabled'}>Record order · payment pending</button></div>`);
}

function productDrawer(id) {
  const item = product(id);
  if (!item) return;
  const canMessage=state.data.user?.id!==item.seller_id;
  openDrawer(item.title, `<div class="card-image" style="height:330px;border-radius:16px">${imageOrArt(item)}</div><p class="pill" style="margin-top:16px">${esc(item.category)} · ${esc(item.origin)}</p><h2 style="font:700 34px 'Playfair Display';color:var(--wine);margin:10px 0">${esc(item.title)}</h2><p>${esc(item.description)}</p><p><b>By ${esc(item.seller)}</b><br><span class="subtle">${item.stock} in stock · ${item.weight_g} g packed</span></p><div class="summary-row"><strong>${money(item.price)}</strong><span>${esc(item.occasion || 'Everyday craft')}</span></div><div class="form-actions"><button class="btn" data-buy-now="${item.id}">Buy now</button><button class="btn ghost" data-add="${item.id}">Add to basket</button>${canMessage?`<button class="btn ghost" data-message-product="${item.id}">Message seller</button><button class="btn ghost" data-report="product" data-id="${item.id}">Report listing</button>`:''}</div><p class="subtle">Keep messages and orders on Melaa so buyer protection and admin review can work.</p>`);
}

function categoryDrawer(id) {
  const item=state.data.categories.find(x=>x.id===Number(id));if(!item)return;
  const commodities=state.data.commodities.filter(x=>x.category_id===item.id);
  openDrawer(item.name,`<span class="eyebrow">${esc(item.group_name)}</span><p>${esc(item.description)}</p>${item.source_url?`<p><a class="text-link" href="${esc(item.source_url)}" target="_blank" rel="noopener noreferrer">Editorial source ↗</a></p>`:''}<h3>Starter commodities</h3>${commodities.length?commodities.map(x=>`<div class="catalog-item"><b>${esc(x.name)}</b><p>${esc(x.description)}</p></div>`).join(''):'<p class="muted">No starter guide yet.</p>'}<button class="btn ghost" data-propose-category>Propose an addition</button>`);
}

function proposalDrawer() {
  if(!state.data.user){state.view='account';closeDrawer();render();toast('Sign in to propose an addition');return}
  openDrawer('Propose a catalog addition',`<div class="proposal-tabs"><h3>New category</h3><form id="category-proposal-form"><label class="field">Category name<input name="name" maxlength="120" required></label><label class="field">Group<input name="group_name" placeholder="Food & agriculture" required></label><label class="field">Description<textarea name="description" minlength="20" required></textarea></label><label class="field">Evidence URL<input name="source_url" type="url"></label><button class="btn">Submit for admin approval</button></form><hr><h3>New commodity</h3><form id="commodity-proposal-form"><label class="field">Approved category<select name="category_id" required>${state.data.categories.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label><label class="field">Commodity name<input name="name" maxlength="120" required></label><label class="field">Description<textarea name="description" minlength="20" required></textarea></label><label class="field">Evidence URL<input name="source_url" type="url"></label><button class="btn">Submit for admin approval</button></form></div>`);
}

function reportDrawer(surface,id) {
  if(!state.data.user){closeDrawer();state.view='account';render();toast('Sign in to report content');return}
  openDrawer('Report a concern',`<p>Reports go to the Melaa safety team for review.</p><form id="report-form" data-surface="${esc(surface)}" data-id="${Number(id)}"><label class="field">Concern<select name="reason"><option>Suspected counterfeit or fake product</option><option>Impersonation or fake account</option><option>Sexual or prohibited content</option><option>Fraud or payment request</option><option>Other safety concern</option></select></label><label class="field">Details<textarea name="details" maxlength="250" placeholder="What should our team check?"></textarea></label><button class="btn">Send report</button></form>`);
}

function chatReportDrawer(conversationId,messageId=null) {
  openDrawer(messageId?'Report message':'Report conversation',`<p>A Melaa administrator can review this conversation. Report only a genuine concern; the other participant will not see your report.</p><form id="chat-report-form" data-conversation-id="${Number(conversationId)}" data-message-id="${messageId?Number(messageId):''}"><label class="field">Concern<select name="reason"><option>Off-platform contact or payment request</option><option>Suspected fake product or seller</option><option>Sexual or prohibited content</option><option>Harassment or abuse</option><option>Other safety concern</option></select></label><label class="field">Details<textarea name="details" maxlength="250" placeholder="What should the safety team check?"></textarea></label><button class="btn">Send to admin</button></form>`);
}

async function occasionDrawer(id) {
  const item = occasion(id);
  if (!item) return;
  const products = state.data.products.filter(productItem => productItem.occasion_id === item.id);
  const dates = (await api(`/occasions/dates?occasion_id=${item.id}`)).dates;
  openDrawer(item.name, `<span class="eyebrow">${esc(item.type)} · ${esc(item.community)}</span><h2 style="font:700 36px 'Playfair Display';color:var(--wine)">${esc(item.name)} <small>${esc(item.nepali)}</small></h2><p>${esc(item.description)}</p><p><b>Typical season:</b> ${esc(item.month)}<br><b>Date rule:</b> ${esc(item.date_rule)}<br><b>Preparation guide:</b> ${item.lead_days}+ days ahead.</p>${dates.length ? `<h3>Reviewed annual dates</h3>${dates.map(date => `<p>BS ${date.bs_year} · ${esc(date.gregorian_date)} · <a class="text-link" href="${esc(date.source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a></p>`).join('')}` : `<div class="notice">No annually verified date is available yet. Research status: ${esc(item.status)}.</div>`}<h3>Shop this occasion</h3>${products.length ? products.map(productItem => `<div class="drawer-item"><div class="mini-art">${imageOrArt(productItem)}</div><div style="flex:1"><b>${esc(productItem.title)}</b><p>${money(productItem.price)}</p><button class="small-btn" data-add="${productItem.id}">Add +</button></div></div>`).join('') : '<p class="muted">Product curation is in progress.</p>'}`);
}

async function commentsDrawer(id) {
  const item = state.data.posts.find(postItem => postItem.id === Number(id));
  if (!item) return;
  const data = await api(`/posts/comments?post_id=${item.id}`);
  openDrawer('Comments', `<p><b>${esc(item.author)}</b> ${esc(item.caption)}</p><form id="comment-form" data-id="${item.id}"><label class="field">Join the conversation<textarea name="body" maxlength="500" required></textarea></label><button class="btn">Post comment</button></form><h3>${data.comments.length} comments</h3>${data.comments.length ? data.comments.map(comment => `<div class="drawer-item"><div class="avatar">${initials(comment.author)}</div><div><b>${esc(comment.author)}</b><p>${esc(comment.body)}</p><span class="subtle">${esc(comment.created_at)}</span></div></div>`).join('') : '<p class="muted">Start the conversation.</p>'}`);
}

function makerDrawer(id) {
  const posts = state.data.posts.filter(item => item.author_id === Number(id));
  const products = state.data.products.filter(item => item.seller_id === Number(id));
  const name = posts[0]?.author || 'Maker';
  openDrawer(name, `<div style="text-align:center"><span class="avatar" style="width:78px;height:78px;margin:auto;font-size:24px">${initials(name)}</span><h2 style="font:700 31px 'Playfair Display';color:var(--wine);margin-bottom:4px">${esc(name)}</h2><p class="muted">Nepalese maker · ${posts.length} recently loaded stories · ${products.length} products</p>${state.data.user?.id !== Number(id) ? `<button class="btn ghost" data-follow="${id}">${posts[0]?.following ? 'Following' : 'Follow maker'}</button>` : '<span class="pill">Your maker profile</span>'}</div><h3>Shop the maker</h3>${products.length ? products.map(item => `<div class="drawer-item"><div class="mini-art">${imageOrArt(item)}</div><div style="flex:1"><b>${esc(item.title)}</b><p>${money(item.price)}</p><button class="small-btn" data-view-product="${item.id}">View product</button></div></div>`).join('') : '<p class="muted">No products yet.</p>'}`);
}

function rfqDrawer(id) {
  const item = product(id);
  openDrawer('Bulk enquiry', `<h2>${esc(item.title)}</h2><p>${item.wholesale_price?`Indicative unit price from ${money(item.wholesale_price)} · `:'Price requires a custom seller quote · '}MOQ ${item.moq||1}</p><form id="rfq-form" data-id="${item.id}"><label class="field">Quantity<input name="qty" type="number" min="${item.moq||1}" value="${item.moq||1}" required></label><label class="field">Delivery destination<input name="destination" placeholder="City and country" required></label><label class="field">Packaging, timing or requirements<textarea name="note"></textarea></label><button class="btn">Submit enquiry</button></form><p class="subtle">Seller confirmation, trade documents, freight and payment follow after quotation. No payment is taken here.</p>`);
}

function suggestionDrawer(id) {
  const item = state.feedPosts.find(postItem => postItem.id === Number(id));
  if (!item) return;
  if (!state.data.user) { state.view='account'; render(); toast('Sign in to send a suggestion'); return; }
  openDrawer('Suggest to the maker', `<p>Send a private, constructive idea about <b>${esc(item.product || item.caption.slice(0,60))}</b>. The seller and Melaa admin can review it.</p><form id="seller-suggestion-form" data-id="${item.id}"><label class="field">Idea type<select name="kind"><option value="customization">Customization</option><option value="restock">Restock or size</option><option value="packaging">Packaging or gifting</option><option value="product_idea">New product idea</option><option value="other">Other feedback</option></select></label><label class="field">Your suggestion<textarea name="body" minlength="10" maxlength="600" required placeholder="What would make this product more useful for you?"></textarea></label><button class="btn">Send to seller</button></form><p class="subtle">No contact details or off-platform payment requests.</p>`);
}

function composerDrawer() {
  if (!state.data.user) { state.view = 'account'; render(); toast('Sign in as a maker to publish'); return; }
  if (!['seller', 'admin'].includes(state.data.user.role)) { toast('A maker account is required to publish'); return; }
  if(state.data.user.role==='seller'&&state.data.user.seller_status!=='verified'){toast('Admin verification is required before publishing');return}
  if(state.data.user.role==='seller'&&state.data.user.accepted_terms_version!==state.data.seller_terms.version){state.view='account';render();toast('Accept the current seller terms before publishing');return}
  openDrawer('Create a shoppable story', composerForm());
}

function searchDrawer() {
  openDrawer('Search Melaa', `<input id="global-search-input" class="search" placeholder="Search products, makers and occasions" autofocus><div id="global-search-results"><p class="muted">Start typing to explore all of Melaa.</p></div>`);
  setTimeout(() => $('#global-search-input')?.focus(), 0);
}

function renderSearchResults(query) {
  const target = $('#global-search-results');
  if (!target) return;
  const value = query.trim().toLowerCase();
  if (!value) { target.innerHTML = '<p class="muted">Start typing to explore all of Melaa.</p>'; return; }
  const products = state.data.products.filter(item => [item.title, item.seller, item.origin, item.category].join(' ').toLowerCase().includes(value)).slice(0, 5);
  const occasions = state.data.occasions.filter(item => [item.name, item.nepali, item.community].join(' ').toLowerCase().includes(value)).slice(0, 4);
  target.innerHTML = `<h3>Products</h3>${products.length ? products.map(item => `<button class="trend-row" data-view-product="${item.id}" style="width:100%;border-left:0;border-right:0;border-top:0;background:none;text-align:left"><span class="product-thumb" style="width:44px;height:44px">${imageOrArt(item)}</span><span><b>${esc(item.title)}</b><span>${money(item.price)} · ${esc(item.seller)}</span></span></button>`).join('') : '<p class="muted">No matching products.</p>'}<h3>Occasions</h3>${occasions.map(item => `<button class="trend-row" data-occasion="${item.id}" style="width:100%;border-left:0;border-right:0;border-top:0;background:none;text-align:left"><span class="avatar" style="width:44px;height:44px">✺</span><span><b>${esc(item.name)}</b><span>${esc(item.community)}</span></span></button>`).join('')}`;
}

async function loadConversations(selectId = state.activeConversation) {
  try {
    const data=await api('/conversations');state.conversations=data.conversations;
    updateMessengerBadge();
    const list=$('#conversation-list');if(!list)return;
    list.innerHTML=data.conversations.length?data.conversations.map(item=>{const other=state.data.user.role==='seller'?item.buyer:item.seller;return `<button class="conversation ${Number(selectId)===item.id?'active':''}" data-conversation="${item.id}"><span class="avatar">${initials(other)}</span><span><b>${esc(other)}</b><small>${esc(item.product||'General conversation')}</small><em>${esc(item.last_message||'Start the conversation')}</em></span>${item.unread?`<i aria-label="${item.unread} unread messages">${item.unread}</i>`:item.flags?`<i aria-label="${item.flags} flagged messages">!</i>`:''}</button>`}).join(''):'<div class="empty">No conversations yet. Open a product to message its seller.</div>';
    if(selectId)await openConversation(selectId);
  }catch(error){toast(error.message)}
}

async function openConversation(id) {
  const data=await api(`/conversations/messages?conversation_id=${id}`);state.activeConversation=Number(id);
  const current=state.conversations.find(item=>item.id===Number(id));if(current)current.unread=0;updateMessengerBadge();
  document.querySelectorAll('[data-conversation]').forEach(x=>x.classList.toggle('active',Number(x.dataset.conversation)===Number(id)));
  document.querySelector(`[data-conversation="${Number(id)}"] i[aria-label$="unread messages"]`)?.remove();
  const meta=state.conversations.find(x=>x.id===Number(id)),panel=$('#chat-panel');if(!panel)return;
  panel.innerHTML=`<header class="chat-head"><div><b>${esc(meta?.product||'Marketplace conversation')}</b><span>${esc(meta?.buyer||'')} ↔ ${esc(meta?.seller||'')}</span></div><div>${state.data.user.role==='admin'?`<button class="text-link" data-conversation-status="${data.conversation.status==='open'?'closed':'open'}" data-id="${id}">${data.conversation.status==='open'?'Close':'Reopen'} chat</button>`:`<button class="text-link" data-report-conversation="${id}">Report</button>`}</div></header><div class="chat-safety">Protected Melaa chat · avoid contact details. Checkout is currently a no-payment order request.</div><div class="message-stream">${data.messages.length?data.messages.map(m=>`<div class="bubble ${m.sender_id===state.data.user.id?'mine':''} ${m.hidden?'removed':''}"><b>${esc(m.sender)}</b><p>${esc(m.body)}</p><small>${esc(m.created_at)}</small>${m.flagged?'<span class="message-flag">Flagged for review</span>':''}${state.data.user.role==='admin'?`<button class="text-link" data-hide-message="${m.id}" data-hidden="${m.hidden?0:1}">${m.hidden?'Restore':'Hide'}</button>`:m.sender_id!==state.data.user.id?`<button class="text-link" data-report-message="${m.id}" data-conversation-id="${id}">Report</button>`:''}</div>`).join(''):'<div class="empty">Ask about materials, availability, customization or delivery.</div>'}</div>${data.conversation.status==='open'&&state.data.user.role!=='admin'?`<form id="message-form" data-id="${id}" class="message-composer"><textarea name="body" maxlength="1000" placeholder="Write a message…" required></textarea><button class="btn">Send</button></form>`:`<div class="notice">This conversation is ${esc(data.conversation.status)}.</div>`}`;
  panel.querySelector('.message-stream')?.scrollTo({top:100000,behavior:'instant'});
}

async function startConversation(productId) {
  if(!state.data.user){closeDrawer();state.view='account';render();toast('Sign in to message a seller');return}
  const result=await post('/conversations/start',{product_id:Number(productId)});closeDrawer();state.view='messages';render();state.activeConversation=result.id;await loadConversations(result.id);
}

async function refresh({ keepPosition = false } = {}) {
  const y = window.scrollY;
  state.data = await api('/bootstrap');
  resetFeed();
  render(!keepPosition);
  saveCart();
  await syncMessengerBadge();
  if (keepPosition) window.scrollTo({ top: y, behavior: 'instant' });
}

async function uploadFile(file) {
  if (!file) return null;
  if (state.data?.cloud_uploads) {
    const { uploadPrivateMedia } = await import('./blob-upload.js');
    return uploadPrivateMedia(file);
  }
  const response = await fetch('/api/media', { method: 'POST', headers: { 'content-type': file.type }, body: file });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

function addToCart(id, open = false) {
  const item = product(id);
  if (!item) return;
  const row = state.cart.find(cartItem => cartItem.product_id === item.id);
  if (row) row.qty += 1;
  else state.cart.push({ product_id: item.id, qty: 1 });
  saveCart();
  toast(`${item.title} added to basket`);
  if (open) cartDrawer();
}

document.addEventListener('click', async event => {
  const togglePassword=event.target.closest('[data-password-toggle]');
  if(togglePassword){const input=togglePassword.closest('form')?.elements.password;if(input){input.type=input.type==='password'?'text':'password';togglePassword.textContent=input.type==='password'?'Show password':'Hide password'}return}
  if(event.target.closest('[data-show-seller-terms]')){openDrawer('Seller terms',sellerTermsHtml());return}
  if(event.target.closest('[data-reminder-demo]')){const target=$('#reminder-data');if(target){const date=new Date();date.setDate(date.getDate()+21);target.insertAdjacentHTML('afterbegin',`<div class="reminder-card demo"><b>Demo: prepare for your occasion</b><span>Illustrative event: ${date.toISOString().slice(0,10)} · plan or order now</span><small>This is only an in-app preview. No message was sent and no date was saved.</small></div>`)}return}
  const reviewedSuggestion=event.target.closest('[data-suggestion-reviewed]');
  if(reviewedSuggestion){try{await post('/suggestions/status',{id:Number(reviewedSuggestion.dataset.suggestionReviewed),status:'reviewed'});await loadAccount();toast('Suggestion marked reviewed')}catch(error){toast(error.message)}return}
  const view = event.target.closest('[data-view]');
  if (view) {
    event.preventDefault();
    state.view = view.dataset.view;
    history.replaceState(null,'',`#${state.view}`);
    state.filter = 'All';
    state.query = '';
    closeDrawer();
    render();
    return;
  }
  if (event.target.closest('#mobile-profile') || event.target.closest('#account-toggle')) { state.view = 'account'; history.replaceState(null,'','#account'); render(); return; }
  if (event.target.closest('#search-toggle')) { searchDrawer(); return; }
  if (event.target.closest('#create-toggle') || event.target.closest('#mobile-create') || event.target.closest('[data-open-compose]')) { composerDrawer(); return; }
  if (event.target.closest('#cart-toggle')) { await cartDrawer(); return; }
  if (event.target.closest('#close-drawer') || event.target.closest('#overlay')) { closeDrawer(); return; }

  const feedMode = event.target.closest('[data-feed-mode]');
  if (feedMode) { state.feedMode = feedMode.dataset.feedMode; resetFeed(); render(); return; }
  if (event.target.closest('#feed-more')) { await loadFeed(); return; }
  const add = event.target.closest('[data-add]');
  if (add) { addToCart(add.dataset.add); return; }
  const buy = event.target.closest('[data-buy-now]');
  if (buy) { addToCart(buy.dataset.buyNow, true); return; }
  const viewProduct = event.target.closest('[data-view-product]');
  if (viewProduct) { productDrawer(viewProduct.dataset.viewProduct); return; }
  const maker = event.target.closest('[data-maker]');
  if (maker) { makerDrawer(maker.dataset.maker); return; }
  const occ = event.target.closest('[data-occasion]');
  if (occ) { await occasionDrawer(occ.dataset.occasion); return; }
  const rfq = event.target.closest('[data-rfq]');
  if (rfq) { rfqDrawer(rfq.dataset.rfq); return; }
  const comments = event.target.closest('[data-comments]');
  if (comments) { await commentsDrawer(comments.dataset.comments); return; }
  const messageProduct=event.target.closest('[data-message-product]');
  if(messageProduct){await startConversation(messageProduct.dataset.messageProduct);return}
  const suggestion=event.target.closest('[data-suggest-seller]');
  if(suggestion){suggestionDrawer(suggestion.dataset.suggestSeller);return}
  const category=event.target.closest('[data-category]');
  if(category){categoryDrawer(category.dataset.category);return}
  if(event.target.closest('[data-propose-category]')){proposalDrawer();return}
  const conversation=event.target.closest('[data-conversation]');
  if(conversation){await openConversation(conversation.dataset.conversation);return}
  const reportConversation=event.target.closest('[data-report-conversation]');
  if(reportConversation){chatReportDrawer(reportConversation.dataset.reportConversation);return}
  const reportMessage=event.target.closest('[data-report-message]');
  if(reportMessage){chatReportDrawer(reportMessage.dataset.conversationId,reportMessage.dataset.reportMessage);return}
  const adminConversation=event.target.closest('[data-open-admin-conversation]');
  if(adminConversation){state.view='messages';render();await loadConversations(Number(adminConversation.dataset.openAdminConversation));return}
  const resolveReport=event.target.closest('[data-resolve-report]');
  if(resolveReport){try{await post('/admin/moderation',{id:Number(resolveReport.dataset.resolveReport),action:'resolved'});await loadAccount();toast('Report marked resolved')}catch(error){toast(error.message)}return}
  const hideMessage=event.target.closest('[data-hide-message]');
  if(hideMessage){try{await post('/admin/message',{message_id:Number(hideMessage.dataset.hideMessage),hidden:Number(hideMessage.dataset.hidden),reason:'Admin moderation decision'});await openConversation(state.activeConversation);toast('Message moderation updated')}catch(error){toast(error.message)}return}
  const conversationStatus=event.target.closest('[data-conversation-status]');
  if(conversationStatus){try{await post('/admin/conversation',{conversation_id:Number(conversationStatus.dataset.id),status:conversationStatus.dataset.conversationStatus});await loadConversations(conversationStatus.dataset.id);toast('Conversation status updated')}catch(error){toast(error.message)}return}
  const review=event.target.closest('[data-review]');
  if(review){try{await post('/admin/review',{entity:review.dataset.entity,id:Number(review.dataset.id),decision:review.dataset.review});await loadAccount();toast(`Review ${review.dataset.review}d`)}catch(error){toast(error.message)}return}
  const accountStatus=event.target.closest('[data-user-status]');
  if(accountStatus){try{await post('/admin/user',{id:Number(accountStatus.dataset.id),status:accountStatus.dataset.userStatus,reason:'Admin control center action'});await refresh({keepPosition:true});toast('Account status updated')}catch(error){toast(error.message)}return}
  const report=event.target.closest('[data-report]');
  if(report){reportDrawer(report.dataset.report,report.dataset.id);return}

  const authAction = event.target.closest('[data-like], [data-save], [data-follow], [data-recommend]');
  if (authAction) {
    if (!state.data.user) { state.view = 'account'; render(); toast('Sign in to join the community'); return; }
    try {
      if (authAction.dataset.like) {
        const id = Number(authAction.dataset.like);
        const result = await post('/posts/like', { post_id: id });
        const item = state.data.posts.find(postItem => postItem.id === id);
        item.liked = result.liked ? 1 : 0;
        item.likes += result.liked ? 1 : -1;
        const feedItem=state.feedPosts.find(postItem=>postItem.id===id);if(feedItem&&feedItem!==item){feedItem.liked=item.liked;feedItem.likes=item.likes}
      }
      if (authAction.dataset.recommend) {
        const id=Number(authAction.dataset.recommend),result=await post('/posts/recommend',{post_id:id});
        const item=state.feedPosts.find(postItem=>postItem.id===id);
        item.recommended=result.recommended?1:0;item.recommendations+=result.recommended?1:-1;
        toast(result.recommended?'Recommended to the community':'Recommendation removed');
      }
      if (authAction.dataset.save) {
        const id = Number(authAction.dataset.save);
        const result = await post('/posts/save', { post_id: id });
        state.data.posts.find(postItem => postItem.id === id).saved = result.saved ? 1 : 0;
        const feedItem=state.feedPosts.find(postItem=>postItem.id===id);if(feedItem)feedItem.saved=result.saved?1:0;
        toast(result.saved ? 'Saved for later' : 'Removed from saved');
      }
      if (authAction.dataset.follow) {
        const id = Number(authAction.dataset.follow);
        const result = await post('/follows', { seller_id: id });
        state.data.posts.filter(postItem => postItem.author_id === id).forEach(postItem => { postItem.following = result.following ? 1 : 0; });
        state.feedPosts.filter(postItem=>postItem.author_id===id).forEach(postItem=>{postItem.following=result.following?1:0});
        toast(result.following ? 'Maker followed' : 'Maker unfollowed');
      }
      if (!$('#drawer').classList.contains('hidden')) closeDrawer();
      rerenderStay();
    } catch (error) { toast(error.message); }
    return;
  }

  const share = event.target.closest('[data-share]');
  if (share) {
    const item = state.data.posts.find(postItem => postItem.id === Number(share.dataset.share));
    const shareData = { title: `${item.author} on Melaa`, text: item.caption, url: `${location.origin}/#post-${item.id}` };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(shareData.url); toast('Post link copied'); }
    } catch (error) { if (error.name !== 'AbortError') toast('Could not share this post'); }
    return;
  }

  const quantity = event.target.closest('[data-qty]');
  if (quantity) {
    const row = state.cart.find(item => item.product_id === Number(quantity.dataset.qty));
    row.qty += Number(quantity.dataset.change);
    if (row.qty <= 0) state.cart = state.cart.filter(item => item !== row);
    saveCart(); await cartDrawer(); return;
  }
  const remove = event.target.closest('[data-remove]');
  if (remove) { state.cart = state.cart.filter(item => item.product_id !== Number(remove.dataset.remove)); saveCart(); await cartDrawer(); return; }
  if (event.target.closest('#logout')) { await post('/logout', {}); await refresh(); toast('Signed out'); return; }
  if (event.target.closest('#checkout')) {
    if (!state.data.user) { closeDrawer(); state.view = 'account'; render(); toast('Sign in to record the order'); return; }
    try {
      const result = await post('/checkout', { items: state.cart, zone: state.zone, contribution: 0 });
      state.cart = []; saveCart(); closeDrawer(); state.view = 'account'; await refresh(); toast(`Order #${result.id} recorded. No payment taken.`);
    } catch (error) { toast(error.message); }
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'feed-search') { clearTimeout(state.feedSearchTimer); const value=event.target.value; state.feedSearchTimer=setTimeout(()=>{state.feedQuery=value.trim();resetFeed();const list=$('#feed-list');if(list){list.innerHTML='';$('#feed-status').textContent='Searching reviewed stories…';$('#feed-more').classList.remove('hidden');setupFeed()}},350); }
  if (event.target.id === 'product-search') { state.query = event.target.value; filterProducts(); }
  if (event.target.id === 'occasion-search') { state.query = event.target.value; filterOccasions(); }
  if (event.target.id === 'global-search-input') renderSearchResults(event.target.value);
});

document.addEventListener('change', event => {
  if(event.target.id==='join-role'){const seller=event.target.value==='seller';$('#seller-terms-box')?.classList.toggle('hidden',!seller);const check=$('#seller-terms-box input[name="accept_seller_terms"]');if(check)check.required=seller;return}
  if (event.target.id === 'delivery-zone') { state.zone = event.target.value; cartDrawer(); return; }
  if (event.target.matches('input[type="file"][name="media"]')) {
    const file = event.target.files?.[0];
    const preview = event.target.closest('form')?.querySelector('.media-preview');
    if (!file || !preview) return;
    const url = URL.createObjectURL(file);
    preview.innerHTML = file.type.startsWith('video/') ? `<video src="${url}" controls playsinline></video>` : `<img src="${url}" alt="Selected media preview">`;
    preview.classList.remove('hidden');
  }
});

document.addEventListener('click', event => {
  const filter = event.target.closest('[data-filter]');
  if (filter) { state.filter = filter.dataset.filter; render(); }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  const accepted = ['login-form', 'register-form', 'seller-terms-accept-form', 'seller-suggestion-form', 'event-form', 'rfq-form', 'product-form', 'post-form', 'rate-form', 'cause-form', 'comment-form', 'suggest-form', 'occasion-date-form', 'settings-form', 'category-proposal-form', 'commodity-proposal-form', 'message-form', 'chat-report-form', 'report-form'];
  if (!accepted.includes(form.id) && !form.classList.contains('quick-comment')) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const submit = form.querySelector('button[type="submit"], button:not([type])');
  const originalText = submit?.textContent;
  if (submit) { submit.disabled = true; submit.textContent = 'Working…'; }
  try {
    if (form.classList.contains('quick-comment') || form.id === 'comment-form') {
      if (!state.data.user) { state.view = 'account'; closeDrawer(); render(); toast('Sign in to comment'); return; }
      const id = Number(form.dataset.id);
      if (!String(data.body || '').trim()) return;
      await post('/posts/comment', { post_id: id, body: data.body });
      const item = state.data.posts.find(postItem => postItem.id === id);
      item.comments += 1;
      const feedItem=state.feedPosts.find(postItem=>postItem.id===id);if(feedItem&&feedItem!==item)feedItem.comments+=1;
      if (form.id === 'comment-form') { await commentsDrawer(id); }
      else { form.reset(); rerenderStay(); }
      toast('Comment posted');
    } else if (form.id === 'login-form' || form.id === 'register-form') {
      if(form.id==='register-form'&&data.role==='seller')data.accept_seller_terms=Boolean(data.accept_seller_terms);
      await post(form.id === 'login-form' ? '/login' : '/register', data);
      state.view = 'home'; await refresh(); toast('Welcome to Melaa');
    } else if(form.id==='seller-terms-accept-form'){
      await post('/seller-terms/accept',{version:data.version,accept:Boolean(data.accept)});await refresh({keepPosition:true});toast('Current seller terms accepted');
    } else if(form.id==='seller-suggestion-form'){
      await post('/posts/suggest',{post_id:Number(form.dataset.id),kind:data.kind,body:data.body});closeDrawer();toast('Suggestion sent privately to the seller');
    } else if (form.id === 'event-form') {
      data.title = occasion(data.occasion_id)?.name || 'My event';
      await post('/events', data); await loadAccount(); form.reset(); toast('Event saved');
    } else if (form.id === 'rfq-form') {
      data.product_id = Number(form.dataset.id); data.qty = Number(data.qty);
      await post('/quotes', data); closeDrawer(); toast('Wholesale request submitted');
    } else if (form.id === 'product-form') {
      const file = form.elements.media.files?.[0];
      if (file) { const uploaded = await uploadFile(file); data.image = uploaded.url; }
      delete data.media;
      ['price', 'stock', 'weight_g', 'length_cm', 'width_cm', 'height_cm'].forEach(key => { data[key] = Number(data[key]); });
      const result=await post('/products', data); await refresh({ keepPosition: true }); toast(result.status==='review'?'Product submitted for admin review':'Product published');
    } else if (form.id === 'post-form') {
      const file = form.elements.media.files?.[0];
      if (file) { const uploaded = await uploadFile(file); data.media_url = uploaded.url; data.media_type = uploaded.media_type; }
      delete data.media;
      const result=await post('/posts', data); closeDrawer(); state.view = 'home'; await refresh(); toast(result.status==='review'?'Story submitted for admin review':'Your story is live');
    } else if (form.id === 'rate-form') {
      await post('/admin/rates', data); await refresh({ keepPosition: true }); toast('Rate updated');
    } else if (form.id === 'cause-form') {
      await post('/admin/causes', data); await loadAccount(); form.reset(); toast('Recipient added to review');
    } else if (form.id === 'suggest-form') {
      if (!state.data.user) { state.view = 'account'; render(); toast('Sign in to submit'); return; }
      await post('/occasions/suggest', data); form.reset(); toast('Submitted for cultural research');
    } else if (form.id === 'occasion-date-form') {
      await post('/admin/occasion-date', data); await refresh({ keepPosition: true }); toast('Cited annual date saved');
    } else if(form.id==='settings-form'){
      Object.keys(data).forEach(key=>data[key]=Number(data[key]));await post('/admin/settings',data);await loadAccount();toast('Commercial rules updated');
    } else if(form.id==='category-proposal-form'){
      await post('/categories/propose',data);closeDrawer();toast('Category sent for admin approval');
    } else if(form.id==='commodity-proposal-form'){
      data.category_id=Number(data.category_id);await post('/commodities/propose',data);closeDrawer();toast('Commodity sent for admin approval');
    } else if(form.id==='message-form'){
      await post('/conversations/message',{conversation_id:Number(form.dataset.id),body:data.body});await loadConversations(form.dataset.id);
    } else if(form.id==='chat-report-form'){
      await post('/conversations/report',{conversation_id:Number(form.dataset.conversationId),message_id:form.dataset.messageId?Number(form.dataset.messageId):null,reason:`${data.reason}: ${data.details||''}`});closeDrawer();toast('Report sent to the admin safety queue');
    } else if(form.id==='report-form'){
      await post('/reports',{surface:form.dataset.surface,id:Number(form.dataset.id),reason:`${data.reason}: ${data.details||''}`});closeDrawer();toast('Report sent to the safety team');
    }
  } catch (error) { toast(error.message); }
  finally { if (submit?.isConnected) { submit.disabled = false; submit.textContent = originalText; } }
});

try {
  await refresh();
  setInterval(()=>{if(state.view==='messages'&&document.visibilityState==='visible'&&!$('#message-form textarea')?.value)loadConversations(state.activeConversation)},12000);
  setInterval(()=>{if(state.view!=='messages'&&document.visibilityState==='visible')syncMessengerBadge()},30000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
} catch (error) {
  $('#content').innerHTML = `<div class="app-error">The application could not load: ${esc(error.message)}</div>`;
}
