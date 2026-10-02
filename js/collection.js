document.addEventListener('DOMContentLoaded', () => {
  const watches = Aurum.watches();
  const search = document.getElementById('fSearch');
  const collection = document.getElementById('fCollection');
  const stock = document.getElementById('fStock');
  const sort = document.getElementById('fSort');
  const list = document.getElementById('watchList');
  const count = document.getElementById('resultCount');

  [...new Set(watches.map((w) => w.collection))].sort().forEach((name) => {
    collection.insertAdjacentHTML('beforeend', `<option>${Aurum.escape(name)}</option>`);
  });
  if (Aurum.param('collection')) collection.value = Aurum.param('collection');

  function render() {
    const query = search.value.trim().toLowerCase();
    let results = watches.filter((w) => {
      const text = [w.name, w.collection, w.tagline, w.movement, w.caseMaterial].join(' ').toLowerCase();
      if (query && !query.split(/\s+/).every((word) => text.includes(word))) return false;
      if (collection.value && w.collection !== collection.value) return false;
      if (stock.value === 'in' && w.stock <= 0) return false;
      if (stock.value === 'order' && w.stock > 0) return false;
      return true;
    });
    const sorters = {
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name),
      featured: (a, b) => Number(b.featured) - Number(a.featured),
    };
    results = [...results].sort(sorters[sort.value]);

    count.textContent = `${results.length} ${results.length === 1 ? 'watch' : 'watches'} found`;
    list.innerHTML = results.length
      ? results.map(Aurum.watchCard).join('')
      : `<div class="empty"><h3>No watches match your search</h3><p>Try a different word or clear the filters.</p></div>`;
    Aurum.wireWishButtons(list);
  }

  [search, collection, stock, sort].forEach((el) => el.addEventListener('input', render));
  document.getElementById('filters').addEventListener('submit', (e) => e.preventDefault());
  document.getElementById('fClear').addEventListener('click', () => {
    search.value = '';
    collection.value = '';
    stock.value = '';
    sort.value = 'featured';
    render();
  });
  render();
});
