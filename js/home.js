document.addEventListener('DOMContentLoaded', () => {
  const watches = Aurum.watches();
  document.getElementById('statWatches').textContent = watches.length;

  const hero = watches.find((w) => w.featured) || watches[0];
  if (hero) {
    document.getElementById('heroWatch').innerHTML = `
      <a class="hero-card" href="watch.html?id=${encodeURIComponent(hero.id)}">
        <img src="${Aurum.escape(hero.image)}" alt="${Aurum.escape(hero.name)}">
        <div class="hero-card-foot">
          <div><p class="hero-card-name">${Aurum.escape(hero.name)}</p><p class="muted small">${Aurum.escape(hero.tagline)}</p></div>
          <div class="right"><p class="price">${Aurum.money(hero.price)}</p><p class="muted small">${Aurum.availability(hero)}</p></div>
        </div>
      </a>`;
  }

  const featured = watches.filter((w) => w.featured).slice(0, 3);
  const root = document.getElementById('featured');
  root.innerHTML = (featured.length ? featured : watches.slice(0, 3)).map(Aurum.watchCard).join('');
  Aurum.wireWishButtons(root);
});
