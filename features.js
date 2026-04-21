// ============================================================
//  DRAPE — New Features Extension
//  Adds: Dark Mode, Product Zoom, Size Guide, Recently Viewed,
//        Compare, Loyalty Points, Style Quiz, Promo Codes,
//        Reviews & Ratings, Order Tracking, Returns, Reorder,
//        AI Styling Assistant
// ============================================================

// ============================================================
//  1. DARK MODE
// ============================================================
let darkMode = localStorage.getItem('drape_dark') === 'true';

// Local SVG placeholder generator to avoid external placeholder requests
function getPlaceholderSrc(width = 120, height = 160, label = 'DRAPE') {
  try {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%23EDE8DC'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-family='Arial, Helvetica, sans-serif' font-size='${Math.floor(width/8)}'>${label}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  } catch (e) { return ''; }
}

function initDarkMode() {
  if (darkMode) document.documentElement.setAttribute('data-theme', 'dark');
  const btn = document.getElementById('dark-mode-toggle');
  if (btn) btn.innerHTML = darkMode ? getSunIcon() : getMoonIcon();
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('drape_dark', darkMode);
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  const btn = document.getElementById('dark-mode-toggle');
  if (btn) btn.innerHTML = darkMode ? getSunIcon() : getMoonIcon();
}

function getMoonIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}
function getSunIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}

// ============================================================
//  2. PRODUCT IMAGE ZOOM
// ============================================================
function initImageZoom() {
  // Disable zoom on touch devices to avoid interfering with touch gestures
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  if (isTouch) return;
  // Attach zoom to the main image only to avoid global side-effects
  const img = document.getElementById('main-img');
  if (!img) return;
  img.addEventListener('mousemove', handleZoom);
  img.addEventListener('mouseleave', resetZoom);
}

function handleZoom(e) {
  const img = document.getElementById('main-img');
  if (!img) return;
  // If pointer event exists, make sure it's from a mouse (not touch/pointer pen)
  if (e.pointerType && e.pointerType !== 'mouse') return;
  const rect = img.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center';
    return;
  }
  const xPct = (x / rect.width) * 100;
  const yPct = (y / rect.height) * 100;
  img.style.transform = 'scale(2)';
  img.style.transformOrigin = `${xPct}% ${yPct}%`;
  img.style.cursor = 'zoom-in';
}

function resetZoom() {
  const img = document.getElementById('main-img');
  if (img) { img.style.transform = 'scale(1)'; img.style.cursor = 'default'; }
}

// ============================================================
//  3. RECENTLY VIEWED
// ============================================================
let recentlyViewed = JSON.parse(localStorage.getItem('drape_recent') || '[]');

function trackRecentlyViewed(productId) {
  recentlyViewed = recentlyViewed.filter(id => id !== productId);
  recentlyViewed.unshift(productId);
  recentlyViewed = recentlyViewed.slice(0, 8);
  localStorage.setItem('drape_recent', JSON.stringify(recentlyViewed));
}

function renderRecentlyViewed() {
  const container = document.getElementById('recently-viewed-grid');
  if (!container) return;
  const items = recentlyViewed.map(id => allProducts.find(p => p.id == id)).filter(Boolean);
  if (!items.length) {
    document.getElementById('recently-viewed-section').style.display = 'none';
    return;
  }
  document.getElementById('recently-viewed-section').style.display = 'block';
  container.innerHTML = items.map(createProductCard).join('');
}

// ============================================================
//  4. COMPARE PRODUCTS (up to 3)
// ============================================================
let compareList = JSON.parse(localStorage.getItem('drape_compare') || '[]');

function toggleCompare(id) {
  const idx = compareList.indexOf(id);
  if (idx > -1) {
    compareList.splice(idx, 1);
    showToast('Removed from compare.');
  } else {
    if (compareList.length >= 3) { showToast('You can compare up to 3 products.', 'error'); return; }
    compareList.push(id);
    showToast('Added to compare!', 'success');
  }
  localStorage.setItem('drape_compare', JSON.stringify(compareList));
  updateCompareBar();
}

function updateCompareBar() {
  const bar = document.getElementById('compare-bar');
  if (!bar) return;
  if (!compareList.length) { bar.classList.remove('visible'); return; }
  bar.classList.add('visible');
  const products = compareList.map(id => allProducts.find(p => p.id == id)).filter(Boolean);
  document.getElementById('compare-bar-items').innerHTML = products.map(p => `
    <div class="compare-bar-item">
      <img src="${p.images?.[0] || getPlaceholderSrc(80,100,'DRAPE')}" alt="${p.name}" data-images='${JSON.stringify(p.images || [])}' data-img-idx="0" onerror="handleImageError(this)" />
      <span>${p.name.slice(0, 18)}…</span>
      <button onclick="toggleCompare('${p.id}')" title="Remove">×</button>
    </div>
  `).join('');
  document.getElementById('compare-count').textContent = compareList.length;
}

function openComparePage() {
  if (compareList.length < 2) { showToast('Add at least 2 products to compare.', 'error'); return; }
  renderComparePage();
  showPage('compare');
}

function renderComparePage() {
  const container = document.getElementById('compare-table-wrap');
  if (!container) return;
  const products = compareList.map(id => allProducts.find(p => p.id == id)).filter(Boolean);
  const attrs = [
    { label: 'Image', key: 'image' },
    { label: 'Price', key: 'price' },
    { label: 'Category', key: 'category' },
    { label: 'Rating', key: 'rating' },
    { label: 'Reviews', key: 'review_count' },
    { label: 'Sizes', key: 'sizes' },
    { label: 'In Stock', key: 'stock' },
  ];

  let html = `<table class="compare-table">
    <thead><tr><th>Attribute</th>${products.map(p => `<th>${p.name}</th>`).join('')}</tr></thead>
    <tbody>`;

  attrs.forEach(attr => {
    html += `<tr><td class="compare-attr">${attr.label}</td>`;
    products.forEach(p => {
          if (attr.key === 'image') {
            html += `<td><img src="${p.images?.[0] || getPlaceholderSrc(80,100,'DRAPE')}" style="width:80px;height:100px;object-fit:cover;border-radius:4px" data-images='${JSON.stringify(p.images || [])}' data-img-idx="0" onerror="handleImageError(this)" /></td>`;
          } else if (attr.key === 'price') {
        html += `<td><strong style="color:var(--accent)">₹${p.price.toLocaleString('en-IN')}</strong>${p.original_price ? `<br><del style="color:var(--muted);font-size:12px">₹${p.original_price.toLocaleString('en-IN')}</del>` : ''}</td>`;
      } else if (attr.key === 'rating') {
        html += `<td>${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5-Math.round(p.rating))} ${p.rating}</td>`;
      } else if (attr.key === 'sizes') {
        html += `<td>${(p.sizes || []).join(', ')}</td>`;
      } else {
        html += `<td>${p[attr.key] ?? '—'}</td>`;
      }
    });
    html += '</tr>';
  });

  html += `</tbody></table>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:2rem;flex-wrap:wrap;">
      ${products.map(p => `<button class="btn-primary" onclick="quickAddToCart('${p.id}')">Add ${p.name.split(' ')[0]} to Cart</button>`).join('')}
    </div>`;
  container.innerHTML = html;
}

// ============================================================
//  5. SIZE GUIDE MODAL
// ============================================================
function openSizeGuide(category) {
  const cat = category || (currentProduct?.category) || 'Men';
  const guide = {
    Men: [
      ['Size', 'Chest (in)', 'Waist (in)', 'Hip (in)'],
      ['XS', '34-36', '28-30', '34-36'],
      ['S', '36-38', '30-32', '36-38'],
      ['M', '38-40', '32-34', '38-40'],
      ['L', '40-42', '34-36', '40-42'],
      ['XL', '42-44', '36-38', '42-44'],
      ['XXL', '44-46', '38-40', '44-46'],
    ],
    Women: [
      ['Size', 'Bust (in)', 'Waist (in)', 'Hip (in)'],
      ['XS', '32-34', '24-26', '34-36'],
      ['S', '34-36', '26-28', '36-38'],
      ['M', '36-38', '28-30', '38-40'],
      ['L', '38-40', '30-32', '40-42'],
      ['XL', '40-42', '32-34', '42-44'],
    ],
    Kids: [
      ['Age', 'Height (cm)', 'Chest (cm)', 'Waist (cm)'],
      ['2-3Y', '92-98', '53-55', '50-52'],
      ['4-5Y', '104-110', '56-58', '53-55'],
      ['6-7Y', '116-122', '59-62', '56-58'],
      ['8-9Y', '128-134', '63-66', '59-62'],
      ['10-11Y', '140-146', '67-70', '63-66'],
    ],
    Accessories: [
      ['Size', 'Measurement', 'Notes'],
      ['One Size', 'Adjustable', 'Fits most adults'],
      ['S/M', 'Up to 56cm head', 'For hats'],
      ['M/L', '56-60cm head', 'For hats'],
      ['L/XL', '60-64cm head', 'For hats'],
    ]
  };
  const rows = guide[cat] || guide['Men'];
  const header = rows[0];
  const body = rows.slice(1);
  document.getElementById('size-guide-category').textContent = cat + ' Size Guide';
  document.getElementById('size-guide-table').innerHTML = `
    <table class="size-guide-table">
      <thead><tr>${header.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${body.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="size-guide-tip">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Tip: When between sizes, we recommend sizing up for a more comfortable fit.
    </div>`;
  document.getElementById('size-guide-modal').classList.add('open');
}

function closeSizeGuide() {
  document.getElementById('size-guide-modal').classList.remove('open');
}

// ============================================================
//  6. LOYALTY POINTS
// ============================================================
function getLoyaltyPoints() {
  return parseInt(localStorage.getItem('drape_points') || '0');
}

function addLoyaltyPoints(orderTotal) {
  const pts = Math.floor(orderTotal / 10); // 1 point per ₹10
  const current = getLoyaltyPoints();
  const newTotal = current + pts;
  localStorage.setItem('drape_points', newTotal);
  return pts;
}

function redeemLoyaltyPoints(pointsToRedeem) {
  const current = getLoyaltyPoints();
  if (pointsToRedeem > current) return false;
  localStorage.setItem('drape_points', current - pointsToRedeem);
  return true;
}

function getLoyaltyTier(points) {
  if (points >= 5000) return { name: 'Platinum', color: '#A8A9AD', next: null, icon: '💎' };
  if (points >= 2000) return { name: 'Gold', color: '#C8956C', next: 5000, icon: '🥇' };
  if (points >= 500) return { name: 'Silver', color: '#9B9B9B', next: 2000, icon: '🥈' };
  return { name: 'Bronze', color: '#CD7F32', next: 500, icon: '🥉' };
}

function renderLoyaltyWidget() {
  const container = document.getElementById('loyalty-widget');
  if (!container) return;
  const points = getLoyaltyPoints();
  const tier = getLoyaltyTier(points);
  const progress = tier.next ? Math.min(100, (points / tier.next) * 100) : 100;
  container.innerHTML = `
    <div class="loyalty-header">
      <span class="loyalty-tier-badge" style="background:${tier.color}20;color:${tier.color}">${tier.icon} ${tier.name}</span>
      <span class="loyalty-pts-total">${points.toLocaleString('en-IN')} pts</span>
    </div>
    <div class="loyalty-bar-wrap">
      <div class="loyalty-bar-track">
        <div class="loyalty-bar-fill" style="width:${progress}%;background:${tier.color}"></div>
      </div>
      ${tier.next ? `<div class="loyalty-bar-label">${points} / ${tier.next} pts to ${tier.name === 'Bronze' ? 'Silver' : tier.name === 'Silver' ? 'Gold' : 'Platinum'}</div>` : '<div class="loyalty-bar-label">Maximum tier reached! 🎉</div>'}
    </div>
    <div class="loyalty-info">
      <div class="loyalty-info-item">
        <span class="li-val">₹${Math.floor(points / 10).toLocaleString('en-IN')}</span>
        <span class="li-label">Redeemable value</span>
      </div>
      <div class="loyalty-info-item">
        <span class="li-val">1 pt</span>
        <span class="li-label">per ₹10 spent</span>
      </div>
    </div>
    <button class="btn-primary full-width" style="margin-top:1rem" onclick="openRedeemModal()">Redeem Points</button>
  `;
}

function openRedeemModal() {
  const points = getLoyaltyPoints();
  const maxRedeem = Math.floor(points / 10) * 10; // must redeem in multiples of 10
  document.getElementById('redeem-modal').classList.add('open');
  document.getElementById('redeem-available').textContent = points.toLocaleString('en-IN');
  document.getElementById('redeem-value').textContent = Math.floor(points / 10).toLocaleString('en-IN');
  const inp = document.getElementById('redeem-input');
  if (inp) { inp.max = maxRedeem; inp.value = Math.min(100, maxRedeem); updateRedeemPreview(); }
}

function closeRedeemModal() {
  document.getElementById('redeem-modal').classList.remove('open');
}

function updateRedeemPreview() {
  const inp = document.getElementById('redeem-input');
  const preview = document.getElementById('redeem-discount-preview');
  if (!inp || !preview) return;
  const pts = parseInt(inp.value) || 0;
  preview.textContent = '₹' + Math.floor(pts / 10).toLocaleString('en-IN');
}

function applyRedeemPoints() {
  const inp = document.getElementById('redeem-input');
  const pts = parseInt(inp?.value) || 0;
  const maxPts = getLoyaltyPoints();
  if (pts > maxPts) { showToast('Not enough points.', 'error'); return; }
  if (pts < 10) { showToast('Minimum redemption is 10 points.', 'error'); return; }
  activePromoDiscount = Math.floor(pts / 10);
  activePromoCode = `POINTS${pts}`;
  redeemLoyaltyPoints(pts);
  closeRedeemModal();
  renderCheckoutSummary();
  showToast(`${pts} points redeemed! ₹${activePromoDiscount} off applied. 🎉`, 'success');
  renderLoyaltyWidget();
}

// ============================================================
//  7. PROMO CODES
// ============================================================
let activePromoDiscount = 0;
let activePromoCode = '';

const PROMO_CODES = {
  'WELCOME10': { type: 'percent', value: 10, label: '10% off' },
  'DRAPE20': { type: 'percent', value: 20, label: '20% off' },
  'FLAT500': { type: 'fixed', value: 500, label: '₹500 off' },
  'SUMMER15': { type: 'percent', value: 15, label: '15% off summer' },
  'NEWUSER': { type: 'fixed', value: 200, label: '₹200 off for new users' },
};

function applyPromoCode() {
  const code = document.getElementById('promo-input')?.value.trim().toUpperCase();
  const msgEl = document.getElementById('promo-msg');
  if (!code) { showToast('Enter a promo code.', 'error'); return; }
  const promo = PROMO_CODES[code];
  if (!promo) {
    if (msgEl) { msgEl.textContent = 'Invalid code. Try WELCOME10 or FLAT500.'; msgEl.style.color = 'var(--error)'; }
    return;
  }
  const subtotal = getCartTotal();
  if (promo.type === 'percent') {
    activePromoDiscount = Math.round(subtotal * promo.value / 100);
  } else {
    activePromoDiscount = Math.min(promo.value, subtotal);
  }
  activePromoCode = code;
  if (msgEl) { msgEl.textContent = `✓ ${promo.label} applied!`; msgEl.style.color = 'var(--success)'; }
  renderCheckoutSummary();
  showToast(`Promo code ${code} applied! 🎉`, 'success');
}

function removePromoCode() {
  activePromoDiscount = 0;
  activePromoCode = '';
  const msgEl = document.getElementById('promo-msg');
  if (msgEl) msgEl.textContent = '';
  const inp = document.getElementById('promo-input');
  if (inp) inp.value = '';
  renderCheckoutSummary();
  showToast('Promo code removed.');
}

// ============================================================
//  8. REVIEWS & RATINGS
// ============================================================
function getReviews(productId) {
  return JSON.parse(localStorage.getItem(`drape_reviews_${productId}`) || '[]');
}

function saveReview(productId, review) {
  const reviews = getReviews(productId);
  reviews.unshift({ ...review, id: Date.now(), date: new Date().toISOString() });
  localStorage.setItem(`drape_reviews_${productId}`, JSON.stringify(reviews));
}

function renderReviews(productId) {
  const reviews = getReviews(productId);
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const dist = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100) : 0
  }));

  return `
    <div class="reviews-section" id="reviews-section-${productId}">
      <h3 class="reviews-title">Customer Reviews</h3>
      ${reviews.length ? `
        <div class="reviews-summary">
          <div class="reviews-avg">
            <span class="avg-score">${avg}</span>
            <div class="avg-stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div>
            <span class="avg-count">${reviews.length} review${reviews.length > 1 ? 's' : ''}</span>
          </div>
          <div class="reviews-dist">
            ${dist.map(d => `
              <div class="dist-row">
                <span>${d.star}★</span>
                <div class="dist-bar-track"><div class="dist-bar-fill" style="width:${d.pct}%"></div></div>
                <span>${d.count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '<p style="color:var(--muted);font-size:0.9rem">No reviews yet. Be the first!</p>'}

      <div class="add-review-form" id="add-review-${productId}">
        <h4>Write a Review</h4>
        <div class="star-picker" id="star-picker-${productId}">
          ${[1,2,3,4,5].map(s => `<span class="star-pick" data-val="${s}" onclick="pickStar(${s}, '${productId}')">☆</span>`).join('')}
        </div>
        <input type="text" class="review-name-input" id="rev-name-${productId}" placeholder="Your name" />
        <textarea class="review-textarea" id="rev-text-${productId}" placeholder="Share your experience with this product…" rows="3"></textarea>
        <button class="btn-primary" onclick="submitReview('${productId}')">Submit Review</button>
      </div>

      <div class="reviews-list">
        ${reviews.map(r => `
          <div class="review-card">
            <div class="review-header">
              <div class="reviewer-avatar">${(r.name || 'A')[0].toUpperCase()}</div>
              <div>
                <div class="reviewer-name">${r.name || 'Anonymous'}</div>
                <div class="review-date">${new Date(r.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
              <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            <p class="review-body">${r.text}</p>
          </div>
        `).join('')}
      </div>
    </div>`;
}

let pickedStars = {};

function pickStar(val, productId) {
  pickedStars[productId] = val;
  const picker = document.getElementById(`star-picker-${productId}`);
  if (!picker) return;
  picker.querySelectorAll('.star-pick').forEach((s, i) => {
    s.textContent = i < val ? '★' : '☆';
    s.classList.toggle('active', i < val);
  });
}

function submitReview(productId) {
  const name = document.getElementById(`rev-name-${productId}`)?.value.trim();
  const text = document.getElementById(`rev-text-${productId}`)?.value.trim();
  const rating = pickedStars[productId];
  if (!rating) { showToast('Please select a star rating.', 'error'); return; }
  if (!text) { showToast('Please write a review.', 'error'); return; }
  saveReview(productId, { name: name || 'Anonymous', text, rating });
  showToast('Review submitted! Thank you 🌟', 'success');
  pickedStars[productId] = 0;
  // Re-render reviews section
  const section = document.getElementById(`reviews-section-${productId}`);
  if (section) section.outerHTML = renderReviews(productId);
}

// ============================================================
//  9. ORDER TRACKING
// ============================================================
const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const ORDER_STATUS_LABELS = {
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered'
};
const ORDER_STATUS_DATES = {
  confirmed: 0,
  processing: 1,
  shipped: 2,
  out_for_delivery: 4,
  delivered: 5
};

function getSimulatedStatus(orderCreatedAt) {
  const daysSince = (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 0.1) return 'confirmed';
  if (daysSince < 1) return 'processing';
  if (daysSince < 3) return 'shipped';
  if (daysSince < 4.5) return 'out_for_delivery';
  return 'delivered';
}

function openTrackingModal(orderId) {
  const orders = JSON.parse(localStorage.getItem('drape_orders') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (!order) { showToast('Order not found.', 'error'); return; }

  const status = getSimulatedStatus(order.created_at);
  const currentIdx = ORDER_STATUSES.indexOf(status);
  const orderDate = new Date(order.created_at);

  const stepsHTML = ORDER_STATUSES.map((s, i) => {
    const isCompleted = i <= currentIdx;
    const isCurrent = i === currentIdx;
    const estDate = new Date(orderDate);
    estDate.setDate(estDate.getDate() + ORDER_STATUS_DATES[s]);
    return `
      <div class="track-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
        <div class="track-dot">
          ${isCompleted ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </div>
        <div class="track-step-info">
          <div class="track-step-label">${ORDER_STATUS_LABELS[s]}</div>
          <div class="track-step-date">${isCompleted || isCurrent ? estDate.toLocaleDateString('en-IN', {day:'numeric',month:'short'}) : 'Estimated: ' + estDate.toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</div>
        </div>
      </div>`;
  }).join('<div class="track-connector"></div>');

  document.getElementById('tracking-modal-content').innerHTML = `
    <div class="tracking-header">
      <h3>Track Your Order</h3>
      <div class="tracking-order-id">Order: ${orderId}</div>
    </div>
    <div class="tracking-status-badge" style="text-align:center;margin:1rem 0">
      <span class="order-status-badge" style="background:var(--accent-light);color:var(--accent);font-size:1rem;padding:8px 20px">
        ${ORDER_STATUS_LABELS[status]}
      </span>
    </div>
    <div class="track-steps">${stepsHTML}</div>
    ${status !== 'delivered' ? `<p style="text-align:center;color:var(--muted);font-size:13px;margin-top:1rem">Estimated delivery by ${new Date(new Date(order.created_at).getTime() + 5*24*60*60*1000).toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long'})}</p>` : '<p style="text-align:center;color:var(--success);font-weight:600;margin-top:1rem">✓ Delivered Successfully!</p>'}
  `;
  document.getElementById('tracking-modal').classList.add('open');
}

function closeTrackingModal() {
  document.getElementById('tracking-modal').classList.remove('open');
}

// ============================================================
//  10. RETURNS & EXCHANGE
// ============================================================
function openReturnModal(orderId) {
  document.getElementById('return-order-id').value = orderId;
  document.getElementById('return-modal').classList.add('open');
  // Populate items
  const orders = JSON.parse(localStorage.getItem('drape_orders') || '[]');
  const order = orders.find(o => o.id === orderId);
  const sel = document.getElementById('return-item-select');
  if (sel && order) {
    sel.innerHTML = (order.items || []).map(item =>
      `<option value="${item.key || item.name}">${item.name} (Size: ${item.size || 'N/A'})</option>`
    ).join('');
  }
}

function closeReturnModal() {
  document.getElementById('return-modal').classList.remove('open');
}

function submitReturn() {
  const orderId = document.getElementById('return-order-id').value;
  const reason = document.getElementById('return-reason').value;
  const type = document.querySelector('input[name="return-type"]:checked')?.value;
  const msg = document.getElementById('return-msg');
  if (!reason || !type) {
    if (msg) { msg.textContent = 'Please fill all fields.'; msg.style.color = 'var(--error)'; }
    return;
  }
  const returnReqs = JSON.parse(localStorage.getItem('drape_returns') || '[]');
  returnReqs.unshift({
    id: 'RET-' + Date.now(),
    orderId, reason, type,
    status: 'pending',
    created_at: new Date().toISOString()
  });
  localStorage.setItem('drape_returns', JSON.stringify(returnReqs));
  closeReturnModal();
  showToast(`${type === 'return' ? 'Return' : 'Exchange'} request submitted! We'll contact you within 24 hours.`, 'success');
}

// ============================================================
//  11. REORDER
// ============================================================
function reorder(orderId) {
  const orders = JSON.parse(localStorage.getItem('drape_orders') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (!order) { showToast('Order not found.', 'error'); return; }
  let added = 0;
  (order.items || []).forEach(item => {
    const product = allProducts.find(p => p.id == item.id);
    if (product) {
      addToCart(product, item.qty || 1, item.size, item.color);
      added++;
    }
  });
  if (added) {
    openCart();
    showToast(`${added} item${added > 1 ? 's' : ''} added to cart! 🛍️`, 'success');
  } else {
    showToast('Could not reorder — some products may be unavailable.', 'error');
  }
}

// ============================================================
//  12. STYLE QUIZ
// ============================================================
const QUIZ_QUESTIONS = [
  {
    q: 'What best describes your style personality?',
    options: ['Classic & Timeless', 'Bold & Trendy', 'Casual & Relaxed', 'Minimalist & Clean']
  },
  {
    q: 'What occasions do you mostly shop for?',
    options: ['Work & Formal', 'Casual Everyday', 'Parties & Events', 'Outdoor & Active']
  },
  {
    q: 'What colours are you drawn to?',
    options: ['Neutrals (white, black, grey)', 'Earth tones (beige, rust, olive)', 'Pastels', 'Bold & vibrant']
  },
  {
    q: 'What is your preferred fit?',
    options: ['Slim & tailored', 'Relaxed & oversized', 'Classic & fitted', 'Flowy & draped']
  },
  {
    q: 'What is your budget range per item?',
    options: ['Under ₹1,000', '₹1,000 – ₹2,500', '₹2,500 – ₹5,000', 'Above ₹5,000']
  }
];

let quizAnswers = [];
let quizStep = 0;

function openStyleQuiz() {
  quizAnswers = [];
  quizStep = 0;
  document.getElementById('style-quiz-modal').classList.add('open');
  renderQuizStep();
}

function closeStyleQuiz() {
  document.getElementById('style-quiz-modal').classList.remove('open');
}

function renderQuizStep() {
  const wrap = document.getElementById('quiz-content');
  if (!wrap) return;
  if (quizStep >= QUIZ_QUESTIONS.length) {
    renderQuizResult();
    return;
  }
  const q = QUIZ_QUESTIONS[quizStep];
  wrap.innerHTML = `
    <div class="quiz-progress">
      <div class="quiz-progress-bar" style="width:${(quizStep / QUIZ_QUESTIONS.length) * 100}%"></div>
    </div>
    <div class="quiz-step-label">Question ${quizStep + 1} of ${QUIZ_QUESTIONS.length}</div>
    <h3 class="quiz-question">${q.q}</h3>
    <div class="quiz-options">
      ${q.options.map((opt, i) => `
        <button class="quiz-option" onclick="selectQuizAnswer(${i}, '${opt.replace(/'/g, "\\'")}')">
          ${opt}
        </button>
      `).join('')}
    </div>
  `;
}

function selectQuizAnswer(idx, val) {
  quizAnswers.push({ q: quizStep, answer: val });
  quizStep++;
  renderQuizStep();
}

function renderQuizResult() {
  // Simple recommendation logic based on answers
  const styleType = quizAnswers[0]?.answer || '';
  const occasion = quizAnswers[1]?.answer || '';
  const budget = quizAnswers[4]?.answer || '';

  let category = 'All', tags = [], maxPrice = 10000, minPrice = 0;

  if (occasion.includes('Work')) tags.push('formal');
  if (occasion.includes('Casual')) tags.push('casual');
  if (occasion.includes('Parties')) tags.push('formal');
  if (budget.includes('1,000 –')) { minPrice = 1000; maxPrice = 2500; }
  else if (budget.includes('2,500')) { minPrice = 2500; maxPrice = 5000; }
  else if (budget.includes('Above')) { minPrice = 5000; maxPrice = 99999; }
  else { minPrice = 0; maxPrice = 1000; }

  let recommended = allProducts.filter(p => {
    const tagMatch = !tags.length || tags.some(t => (p.tags || []).includes(t));
    const priceMatch = p.price >= minPrice && p.price <= maxPrice;
    return tagMatch && priceMatch;
  }).slice(0, 4);

  if (recommended.length < 2) recommended = allProducts.filter(p => p.is_featured).slice(0, 4);

  const wrap = document.getElementById('quiz-content');
  wrap.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-icon">✨</div>
      <h3>Your Style Profile</h3>
      <p class="quiz-result-type">${styleType || 'Versatile Style'}</p>
      <p style="color:var(--muted);font-size:0.9rem;margin-bottom:1.5rem">Based on your answers, here are our top picks for you:</p>
      <div class="quiz-products-grid">
        ${recommended.map(p => `
          <div class="quiz-product-card" onclick="closeStyleQuiz(); openProduct('${p.id}')">
            <img src="${p.images?.[0] || getPlaceholderSrc(200,260,'DRAPE')}" alt="${p.name}" data-images='${JSON.stringify(p.images || [])}' data-img-idx="0" onerror="handleImageError(this)" />
            <div class="quiz-product-name">${p.name}</div>
            <div class="quiz-product-price">₹${p.price.toLocaleString('en-IN')}</div>
          </div>
        `).join('')}
      </div>
      <button class="btn-primary full-width" onclick="closeStyleQuiz(); showPage('shop')" style="margin-top:1.5rem">Shop All Recommendations</button>
      <button class="btn-outline full-width" onclick="openStyleQuiz()" style="margin-top:0.75rem">Retake Quiz</button>
    </div>
  `;
}

// ============================================================
//  13. AI STYLING ASSISTANT
// ============================================================
let aiChatHistory = [];
let aiTyping = false;

function openAIAssistant() {
  document.getElementById('ai-assistant-modal').classList.add('open');
  if (!aiChatHistory.length) {
    addAIMessage('assistant', "Hi! I'm DRAPE's AI stylist 👗 I can help you find the perfect outfit, suggest size guidance, build looks for any occasion, or answer questions about our products. What are you looking for today?");
  }
}

function closeAIAssistant() {
  document.getElementById('ai-assistant-modal').classList.remove('open');
}

function addAIMessage(role, text) {
  aiChatHistory.push({ role, content: text });
  renderAIChat();
}

function renderAIChat() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;
  container.innerHTML = aiChatHistory.map(msg => `
    <div class="ai-msg ai-msg-${msg.role}">
      ${msg.role === 'assistant' ? '<div class="ai-avatar">✦</div>' : ''}
      <div class="ai-bubble">${msg.content}</div>
    </div>
  `).join('');
  if (aiTyping) {
    container.innerHTML += `<div class="ai-msg ai-msg-assistant"><div class="ai-avatar">✦</div><div class="ai-bubble ai-typing"><span></span><span></span><span></span></div></div>`;
  }
  container.scrollTop = container.scrollHeight;
}

async function sendAIMessage() {
  const input = document.getElementById('ai-chat-input');
  const text = input?.value.trim();
  if (!text || aiTyping) return;
  input.value = '';
  addAIMessage('user', text);
  aiTyping = true;
  renderAIChat();

  try {
    // First try the real Anthropic API (works if a backend proxy is configured via APP_CONFIG)
    const apiBase = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.aiProxyUrl) ? APP_CONFIG.aiProxyUrl : null;

    if (apiBase) {
      const productContext = allProducts.slice(0, 10).map(p =>
        `${p.name} (${p.category}, ₹${p.price}, sizes: ${(p.sizes||[]).join('/')}, tags: ${(p.tags||[]).join(',')})`
      ).join('\n');
      const systemPrompt = `You are DRAPE's AI fashion stylist. DRAPE is a premium Indian clothing brand. Be warm, stylish, and concise. Help users find products, suggest outfits, give size advice, and style tips. Keep replies under 120 words. Use emojis sparingly. Current products:\n${productContext}`;
      const response = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          system: systemPrompt,
          messages: aiChatHistory.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text;
      if (reply) {
        aiTyping = false;
        addAIMessage('assistant', reply);
        return;
      }
    }
  } catch (e) { /* fall through to smart offline mode */ }

  // Smart offline assistant — keyword matching against real products
  await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
  const reply = getSmartAIReply(text);
  aiTyping = false;
  addAIMessage('assistant', reply);
}

function getSmartAIReply(text) {
  const q = text.toLowerCase();
  const products = allProducts || [];

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|namaste)/.test(q)) {
    return "Hello! Welcome to DRAPE 👗 I'm your personal stylist. Ask me about outfit ideas, sizing, our bestsellers, or anything fashion-related!";
  }

  // Bestsellers / popular
  if (/best.?sell|popular|top pick|trending/.test(q)) {
    const best = products.filter(p => p.badge === 'Bestseller' || p.review_count > 200).slice(0, 3);
    if (best.length) return `Our top bestsellers right now: ${best.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. Want details on any of these?`;
    return "Check out our Shop page — filter by ratings to find our most-loved pieces! ⭐";
  }

  // New arrivals
  if (/new arriv|latest|just in|fresh/.test(q)) {
    const newItems = products.filter(p => p.badge === 'New').slice(0, 3);
    if (newItems.length) return `Fresh arrivals you'll love: ${newItems.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')} 🌟`;
    return "New collections drop every Friday! Subscribe to our newsletter for early access. 📬";
  }

  // Sale / discount
  if (/sale|discount|offer|deal|cheap|budget/.test(q)) {
    const onSale = products.filter(p => p.original_price && p.original_price > p.price).slice(0, 3);
    if (onSale.length) return `On sale now: ${onSale.map(p => `**${p.name}** — ₹${p.price.toLocaleString('en-IN')} (was ₹${p.original_price.toLocaleString('en-IN')})`).join(', ')} 🏷️`;
    return "Use code **WELCOME10** at checkout for 10% off your first order! 🎉";
  }

  // Sizing help
  if (/size|fit|measurement|xl|xxl|small|medium|large|plus size/.test(q)) {
    return "For the perfect fit: if you're between sizes, go up for comfort. Our clothes run true-to-size. Check the Size Guide icon on any product page for exact measurements in cm/inches. Need more help? Share your height and usual size and I'll guide you! 📏";
  }

  // Formal / office
  if (/formal|office|work|meeting|interview|professional/.test(q)) {
    const formal = products.filter(p => (p.tags||[]).includes('formal')).slice(0, 3);
    if (formal.length) return `For a polished work look, try: ${formal.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. Pair with minimal accessories for a sharp finish. 💼`;
    return "For office wear, I'd suggest our tailored blazers, slim-fit trousers, or classic shirts. Check the Men's or Women's formal section in Shop! 💼";
  }

  // Casual / weekend
  if (/casual|weekend|chill|relax|lounge|comfy|everyday/.test(q)) {
    const casual = products.filter(p => (p.tags||[]).includes('casual')).slice(0, 3);
    if (casual.length) return `Casual and effortless: ${casual.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. Perfect for weekend vibes! ☀️`;
    return "Our casual range is all about comfort meeting style — hoodies, wrap dresses, and co-ord sets are fan favourites!";
  }

  // Summer / season
  if (/summer|hot|heat|light.?weight|breathe|cotton|linen/.test(q)) {
    const summer = products.filter(p => (p.tags||[]).includes('summer')).slice(0, 3);
    if (summer.length) return `Summer essentials you'll love: ${summer.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. All in breathable fabrics! 🌞`;
    return "Look for our linen and cotton pieces — ideal for India's climate. The Linen Blazer and Floral Wrap Dress are perennial summer hits!";
  }

  // Women
  if (/women|ladies|female|she|girl|her/.test(q)) {
    const women = products.filter(p => p.category === 'Women').slice(0, 3);
    if (women.length) return `Top picks for women: ${women.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. View the full women's collection in Shop! 👗`;
  }

  // Men
  if (/men|male|he|him|guy|boy/.test(q)) {
    const men = products.filter(p => p.category === 'Men').slice(0, 3);
    if (men.length) return `Top picks for men: ${men.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. Sharp and effortlessly styled! 👔`;
  }

  // Kids
  if (/kid|child|baby|toddler|girl|boy/.test(q)) {
    const kids = products.filter(p => p.category === 'Kids').slice(0, 3);
    if (kids.length) return `Adorable kids' picks: ${kids.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. Soft, safe fabrics for little ones! 🧸`;
  }

  // Accessories
  if (/accessory|accessories|bag|belt|scarf|hat|watch|jewel/.test(q)) {
    const acc = products.filter(p => p.category === 'Accessories').slice(0, 3);
    if (acc.length) return `Our accessories collection: ${acc.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. The perfect finishing touch! ✨`;
  }

  // Price range
  if (/under (\d+)|below (\d+)|budget|affordable/.test(q)) {
    const match = q.match(/(\d+)/);
    if (match) {
      const limit = parseInt(match[1]);
      const cheap = products.filter(p => p.price <= limit).slice(0, 3);
      if (cheap.length) return `Under ₹${limit.toLocaleString('en-IN')}: ${cheap.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')} 🎯`;
    }
    return "Use the Price Filter in our Shop to set your exact budget. We have great pieces from ₹399 to ₹4,999!";
  }

  // Gift
  if (/gift|present|birthday|anniversary|wedding|occasion/.test(q)) {
    const gifts = products.filter(p => p.rating >= 4.7).slice(0, 3);
    if (gifts.length) return `For gifting, our highest-rated picks: ${gifts.map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(', ')}. We also offer gift wrapping at checkout! 🎁`;
  }

  // Return / exchange / refund
  if (/return|exchange|refund|cancel|policy/.test(q)) {
    return "We offer hassle-free returns within 14 days of delivery. Go to My Orders and tap 'Return / Exchange' on any item. Refunds are processed in 5–7 business days. 🔄";
  }

  // Shipping / delivery
  if (/ship|deliver|courier|dispatch|track|how long/.test(q)) {
    return "Standard delivery takes 3–5 business days. We offer same-day delivery in Chennai, Bengaluru, Mumbai, Delhi, Hyderabad, and Pune. Free shipping on orders above ₹999! 🚚";
  }

  // Outfit building
  if (/what (should|to|can) (i|we) wear|outfit|look|style (for|me)|dress (for|me)/.test(q)) {
    return "I'd love to help you build an outfit! Tell me a bit more — is it for a casual day out, a work meeting, or a special occasion? And do you prefer a specific colour palette? 🎨";
  }

  // Payment
  if (/pay|upi|gpay|razorpay|cod|cash|card|emi/.test(q)) {
    return "We accept all major payment methods via Razorpay — UPI (GPay, PhonePe, Paytm), credit/debit cards, net banking, and wallets. We also offer Cash on Delivery. EMI available on orders above ₹3,000 💳";
  }

  // Sustainability
  if (/sustainable|eco|organic|artisan|handmade|ethical/.test(q)) {
    return "Sustainability is core to DRAPE 🌱 We use GOTS-certified organic cotton, natural dyes, and work with 200+ artisans paid 40% above industry rates. 1% of revenue goes to Indian reforestation.";
  }

  // Default fallback
  const featured = products.filter(p => p.is_featured).slice(0, 2);
  if (featured.length) {
    return `Great question! I'd suggest browsing our Shop for the full range. Some customer favourites right now: **${featured[0].name}** (₹${featured[0].price.toLocaleString('en-IN')}) and **${featured[1]?.name || 'Floral Wrap Dress'}**. Anything specific I can help you find? 👗`;
  }
  return "I'm here to help you find your perfect style! Ask me about sizing, outfit ideas, our collections, shipping, or anything else. What are you looking for? ✨";
}

function aiChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
}

// ============================================================
//  INIT ALL FEATURES
// ============================================================
function initFeatures() {
  initDarkMode();
  initImageZoom();
  updateCompareBar();
  renderRecentlyViewed();
}

// Override openProduct to track recently viewed
const _origOpenProduct = typeof openProduct !== 'undefined' ? openProduct : null;
