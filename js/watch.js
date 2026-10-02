document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('watchRoot');
  const w = Aurum.watch(Aurum.param('id'));
  const e = Aurum.escape;

  if (!w) {
    root.innerHTML = `<div class="empty"><h3>Watch not found</h3><p>This watch may have been removed, or the link is incorrect.</p>
      <a class="btn btn-gold" href="collection.html">View the Collection</a></div>`;
    return;
  }

  document.title = `${w.name} – Aurum`;
  const specs = [
    ['Movement', w.movement], ['Case', w.caseMaterial], ['Diameter', w.diameter],
    ['Power reserve', w.powerReserve], ['Water resistance', w.waterResistance], ['Strap', w.strap],
  ].filter(([, value]) => value);
  const saved = Aurum.wishlist().includes(w.id);
  const isAdmin = Aurum.user()?.role === 'admin';

  root.innerHTML = `
    <nav class="breadcrumb"><a href="index.html">Home</a> / <a href="collection.html">Collection</a> / ${e(w.name)}</nav>
    <div class="detail-grid">
      <div class="detail-image"><img src="${e(w.image)}" alt="${e(w.name)}"></div>
      <div class="detail-info">
        <p class="eyebrow">${e(w.collection)} Collection</p>
        <h1>${e(w.name)}</h1>
        <p class="muted">${e(w.tagline)}</p>
        <div class="detail-price">
          <span class="price price-lg">${Aurum.money(w.price)}</span>
          <span class="badge ${w.stock > 0 ? 'badge-green' : 'badge-gold'}">${w.stock > 0 ? `In stock · ${w.stock} available` : 'Made to order'}</span>
        </div>
        <p class="muted small">Price includes all taxes. ${w.stock > 0 ? 'Available to view at the boutique.' : 'Made to order in 12 to 16 weeks.'}</p>
        <p class="detail-text">${e(w.description)}</p>
        <div class="btn-row">
          ${isAdmin
            ? `<a class="btn btn-gold" href="admin.html#watches">Manage in Dashboard</a>`
            : `<a class="btn btn-gold" href="reserve.html?watch=${encodeURIComponent(w.id)}">Book a Private Viewing</a>
               <button type="button" class="btn btn-outline" id="wishBtn">${saved ? '♥ Saved to Wishlist' : '♡ Add to Wishlist'}</button>`}
        </div>
        <h2 class="detail-sub">Specifications</h2>
        <dl class="info-list">${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>
        <ul class="check-list">
          <li>5-year international warranty</li>
          <li>Free servicing for the first 2 years</li>
          <li>Certificate of authenticity with every watch</li>
        </ul>
      </div>
    </div>
    <div class="section-head related-head"><div><p class="eyebrow">More watches</p><h2>You may also like</h2></div></div>
    <div class="watch-grid" id="related"></div>`;

  document.getElementById('wishBtn')?.addEventListener('click', (event) => {
    const nowSaved = Aurum.toggleWish(w.id);
    event.currentTarget.textContent = nowSaved ? '♥ Saved to Wishlist' : '♡ Add to Wishlist';
  });

  const others = Aurum.watches().filter((x) => x.id !== w.id);
  const related = [...others.filter((x) => x.collection === w.collection), ...others.filter((x) => x.collection !== w.collection)].slice(0, 3);
  const relatedRoot = document.getElementById('related');
  relatedRoot.innerHTML = related.map(Aurum.watchCard).join('');
  Aurum.wireWishButtons(relatedRoot);
});
