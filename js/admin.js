// Admin dashboard: overview, watches, bookings, customers and messages.
document.addEventListener('DOMContentLoaded', () => {
  if (!Aurum.requireLogin('admin')) return;

  const root = document.getElementById('adminRoot');
  const e = Aurum.escape;
  const TABS = [
    ['overview', 'Overview'], ['watches', 'Watches'], ['reservations', 'Bookings'],
    ['customers', 'Customers'], ['messages', 'Messages'],
  ];
  const MAX_IMAGE_BYTES = 400 * 1024;
  let tab = TABS.some(([key]) => key === location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  let statusFilter = '';

  function render() {
    const counts = {
      watches: Aurum.watches().length,
      reservations: Aurum.reservations().length,
      customers: Aurum.users().filter((u) => u.role === 'customer').length,
      messages: Aurum.messages().length,
    };
    root.innerHTML = `
      <div class="tabs" role="tablist">
        ${TABS.map(([key, label]) => `<button type="button" role="tab" class="tab ${key === tab ? 'active' : ''}" data-tab="${key}" aria-selected="${key === tab}">${label}${counts[key] !== undefined ? ` <span class="tab-count">${counts[key]}</span>` : ''}</button>`).join('')}
      </div>
      <div id="tabBody"></div>`;
    root.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        tab = button.dataset.tab;
        history.replaceState(null, '', '#' + tab);
        render();
      });
    });
    const body = document.getElementById('tabBody');
    ({ overview, watches, reservations, customers, messages })[tab](body);
  }

  const table = (head, rows) => `
    <div class="table-wrap"><table class="table">
      <thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>`;

  const cell = (label, html) => `<td data-label="${label}">${html}</td>`;

  const statusSelect = (r) => `
    <select class="input-sm" data-status="${e(r.id)}" aria-label="Status of booking ${e(r.id)}">
      ${RESERVATION_STATUSES.map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
    </select>`;

  function wireStatus(body) {
    body.querySelectorAll('[data-status]').forEach((select) => {
      select.addEventListener('change', () => {
        Aurum.setReservationStatus(select.dataset.status, select.value);
        Aurum.toast(`Booking ${select.dataset.status} is now ${select.value}.`);
        render();
      });
    });
  }

  // ---------- Overview ----------
  function overview(body) {
    const watchList = Aurum.watches();
    const bookings = Aurum.reservations();
    const units = watchList.reduce((sum, w) => sum + w.stock, 0);
    const value = watchList.reduce((sum, w) => sum + w.stock * w.price, 0);
    const stats = [
      [watchList.length, 'Watches listed'],
      [units, 'Units in stock'],
      [Aurum.money(value), 'Value of stock'],
      [bookings.filter((r) => r.status === 'Pending').length, 'Pending bookings'],
      [Aurum.users().filter((u) => u.role === 'customer').length, 'Customers'],
    ];
    const low = watchList.filter((w) => w.stock > 0 && w.stock <= 1);

    body.innerHTML = `
      <div class="stats">${stats.map(([n, label]) => `<div class="stat"><strong>${n}</strong><span>${label}</span></div>`).join('')}</div>
      ${low.length ? `<div class="alert alert-info">Low stock: ${low.map((w) => `${e(w.name)} (${w.stock} left)`).join(', ')}.</div>` : ''}
      <div class="section-head"><div><h2>Recent bookings</h2></div><button type="button" class="text-link" id="allBookings">View all bookings →</button></div>
      ${bookings.length
        ? table(['Booking', 'Customer', 'Watch', 'Date and time', 'Status'], bookings.slice(0, 5).map((r) => `<tr>
            ${cell('Booking', e(r.id))}${cell('Customer', e(r.customerName))}${cell('Watch', e(r.watchName))}
            ${cell('Date and time', `${Aurum.formatDate(r.date)}, ${e(r.time)}`)}${cell('Status', statusSelect(r))}</tr>`))
        : '<div class="empty"><h3>No bookings yet</h3><p>Customer bookings will appear here.</p></div>'}`;
    document.getElementById('allBookings').addEventListener('click', () => {
      tab = 'reservations';
      render();
    });
    wireStatus(body);
  }

  // ---------- Watches ----------
  function watches(body) {
    const list = Aurum.watches();
    body.innerHTML = `
      <div class="section-head"><div><h2>Watches</h2><p class="muted small">Add, edit or remove watches and update their stock.</p></div>
        <button type="button" class="btn btn-gold" id="addWatch">+ Add Watch</button></div>
      ${list.length
        ? table(['Watch', 'Collection', 'Price', 'Stock', 'Featured', 'Actions'], list.map((w) => `<tr>
            ${cell('Watch', `<span class="thumb-cell"><img src="${e(w.image)}" alt=""><a href="watch.html?id=${encodeURIComponent(w.id)}">${e(w.name)}</a></span>`)}
            ${cell('Collection', e(w.collection))}
            ${cell('Price', Aurum.money(w.price))}
            ${cell('Stock', w.stock > 0 ? `${w.stock} in stock` : '<span class="muted">Made to order</span>')}
            ${cell('Featured', w.featured ? 'Yes' : 'No')}
            ${cell('Actions', `<span class="btn-row"><button type="button" class="btn btn-outline btn-sm" data-edit="${e(w.id)}">Edit</button>
              <button type="button" class="btn btn-outline btn-sm danger" data-delete="${e(w.id)}">Delete</button></span>`)}</tr>`))
        : '<div class="empty"><h3>No watches</h3><p>Add the first watch to the collection.</p></div>'}`;

    document.getElementById('addWatch').addEventListener('click', () => openWatchForm());
    body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openWatchForm(Aurum.watch(b.dataset.edit))));
    body.querySelectorAll('[data-delete]').forEach((b) => {
      b.addEventListener('click', async () => {
        const w = Aurum.watch(b.dataset.delete);
        const yes = await Aurum.confirmDialog({
          title: 'Delete watch',
          message: `Delete ${w.name}? It will be removed from the collection. Existing bookings are kept.`,
          confirmLabel: 'Delete',
          danger: true,
        });
        if (!yes) return;
        Aurum.deleteWatch(w.id);
        Aurum.toast(`${w.name} has been deleted.`);
        render();
      });
    });
  }

  function openWatchForm(w) {
    const editing = Boolean(w);
    w = w || { collection: COLLECTIONS[0], stock: 0, featured: false, image: 'images/placeholder.svg' };
    let image = w.image;
    const text = (name, label, value, attrs = '') =>
      `<div class="field"><label for="w-${name}">${label}</label><input id="w-${name}" name="${name}" value="${e(value ?? '')}" ${attrs}></div>`;

    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <form class="modal form" id="watchForm" novalidate role="dialog" aria-modal="true" aria-label="${editing ? 'Edit' : 'Add'} watch">
        <div class="modal-head"><h2>${editing ? 'Edit watch' : 'Add watch'}</h2><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
        <div class="modal-body">
          <div class="form-grid">
            ${text('name', 'Name', w.name)}
            <div class="field"><label for="w-collection">Collection</label><select id="w-collection" name="collection">
              ${COLLECTIONS.map((c) => `<option ${c === w.collection ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            ${text('price', 'Price (₹)', w.price, 'type="number" min="1" step="1"')}
            ${text('stock', 'Units in stock', w.stock, 'type="number" min="0" step="1"')}
          </div>
          ${text('tagline', 'Short description', w.tagline, 'maxlength="60"')}
          <div class="field"><label for="w-description">Full description</label><textarea id="w-description" name="description" rows="4">${e(w.description || '')}</textarea></div>
          <div class="form-grid">
            ${text('movement', 'Movement', w.movement)}
            ${text('caseMaterial', 'Case', w.caseMaterial)}
            ${text('diameter', 'Diameter', w.diameter, 'placeholder="e.g. 40 mm"')}
            ${text('powerReserve', 'Power reserve', w.powerReserve, 'placeholder="e.g. 60 hours"')}
            ${text('waterResistance', 'Water resistance', w.waterResistance, 'placeholder="e.g. 50 metres"')}
            ${text('strap', 'Strap', w.strap)}
          </div>
          <div class="field"><label for="w-image">Photograph</label>
            <div class="image-pick"><img id="w-preview" src="${e(image)}" alt=""><div>
              <input id="w-image" type="file" accept="image/jpeg,image/png,image/webp">
              <p class="hint">Optional. JPG, PNG or WebP up to 400 KB.</p></div></div></div>
          <label class="check"><input type="checkbox" name="featured" ${w.featured ? 'checked' : ''}> Show on the home page as a featured watch</label>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-outline" data-close>Cancel</button>
          <button type="submit" class="btn btn-gold">${editing ? 'Save Changes' : 'Add Watch'}</button>
        </div>
      </form>`;
    document.body.appendChild(wrap);
    const form = wrap.querySelector('form');
    const close = () => wrap.remove();
    wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    wrap.addEventListener('mousedown', (event) => event.target === wrap && close());
    form.name.focus();

    form.querySelector('#w-image').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        event.target.value = '';
        return Aurum.showMessage(form.querySelector('.modal-body'), 'Please choose a JPG, PNG or WebP image.');
      }
      if (file.size > MAX_IMAGE_BYTES) {
        event.target.value = '';
        return Aurum.showMessage(form.querySelector('.modal-body'), 'The image is larger than 400 KB. Please choose a smaller file.');
      }
      const reader = new FileReader();
      reader.onload = () => {
        image = reader.result;
        form.querySelector('#w-preview').src = image;
      };
      reader.readAsDataURL(file);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const box = form.querySelector('.modal-body');
      const name = form.name.value.trim();
      const price = Number(form.price.value);
      const stock = Number(form.stock.value);
      if (name.length < 2) return Aurum.showMessage(box, 'Please enter the name of the watch.');
      if (!Number.isInteger(price) || price <= 0) return Aurum.showMessage(box, 'Please enter a valid price in rupees.');
      if (!Number.isInteger(stock) || stock < 0) return Aurum.showMessage(box, 'Stock must be 0 or more.');
      if (!form.tagline.value.trim()) return Aurum.showMessage(box, 'Please enter a short description.');
      if (form.description.value.trim().length < 20) return Aurum.showMessage(box, 'Please write a full description of at least 20 characters.');

      const others = Aurum.watches().filter((x) => x.id !== w.id);
      if (others.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
        return Aurum.showMessage(box, 'Another watch already has this name.');
      }
      let id = w.id;
      if (!id) {
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'watch';
        id = base;
        for (let n = 2; others.some((x) => x.id === id); n++) id = `${base}-${n}`;
      }
      const saved = Aurum.saveWatch({
        id, name, price, stock, image,
        collection: form.collection.value,
        featured: form.featured.checked,
        tagline: form.tagline.value.trim(),
        description: form.description.value.trim(),
        movement: form.movement.value.trim(),
        caseMaterial: form.caseMaterial.value.trim(),
        diameter: form.diameter.value.trim(),
        powerReserve: form.powerReserve.value.trim(),
        waterResistance: form.waterResistance.value.trim(),
        strap: form.strap.value.trim(),
      });
      if (!saved) return Aurum.showMessage(box, 'The watch could not be saved because browser storage is full. Try a smaller image.');
      close();
      Aurum.toast(editing ? `${name} has been updated.` : `${name} has been added.`);
      render();
    });
  }

  // ---------- Bookings ----------
  function reservations(body) {
    const all = Aurum.reservations();
    const list = statusFilter ? all.filter((r) => r.status === statusFilter) : all;
    body.innerHTML = `
      <div class="section-head"><div><h2>Bookings</h2><p class="muted small">Confirm, complete or cancel private viewings.</p></div>
        <select class="input-sm" id="statusFilter" aria-label="Filter by status">
          <option value="">All statuses</option>${RESERVATION_STATUSES.map((s) => `<option ${s === statusFilter ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
      ${list.length
        ? table(['Booking', 'Customer', 'Contact', 'Watch', 'Date and time', 'Note', 'Status'], list.map((r) => `<tr>
            ${cell('Booking', `${e(r.id)}<br><span class="muted small">Made ${Aurum.formatDate(r.createdAt)}</span>`)}
            ${cell('Customer', e(r.customerName))}
            ${cell('Contact', `${e(r.customerEmail)}<br><span class="muted small">${e(r.customerPhone)}</span>`)}
            ${cell('Watch', `${e(r.watchName)}<br><span class="muted small">${Aurum.money(r.price)}</span>`)}
            ${cell('Date and time', `${Aurum.formatDate(r.date)}, ${e(r.time)}`)}
            ${cell('Note', r.note ? e(r.note) : '<span class="muted">—</span>')}
            ${cell('Status', statusSelect(r))}</tr>`))
        : `<div class="empty"><h3>No bookings found</h3><p>${statusFilter ? 'There are no bookings with this status.' : 'Customer bookings will appear here.'}</p></div>`}`;
    document.getElementById('statusFilter').addEventListener('change', (event) => {
      statusFilter = event.target.value;
      render();
    });
    wireStatus(body);
  }

  // ---------- Customers ----------
  function customers(body) {
    const list = Aurum.users().filter((u) => u.role === 'customer');
    const bookings = Aurum.reservations();
    body.innerHTML = `
      <div class="section-head"><div><h2>Customers</h2><p class="muted small">People who have created an account.</p></div></div>
      ${list.length
        ? table(['Name', 'Email', 'Mobile', 'City', 'Joined', 'Bookings'], list.map((u) => `<tr>
            ${cell('Name', e(u.name))}${cell('Email', e(u.email))}${cell('Mobile', e(u.phone))}${cell('City', e(u.city || '—'))}
            ${cell('Joined', Aurum.formatDate(u.createdAt))}${cell('Bookings', bookings.filter((r) => r.userId === u.id).length)}</tr>`))
        : '<div class="empty"><h3>No customers yet</h3><p>Registered customers will appear here.</p></div>'}`;
  }

  // ---------- Messages ----------
  function messages(body) {
    const list = Aurum.messages();
    body.innerHTML = `
      <div class="section-head"><div><h2>Messages</h2><p class="muted small">Enquiries sent from the Contact page.</p></div></div>
      ${list.length
        ? `<div class="message-list">${list.map((m) => `
            <article class="card message">
              <div class="message-head"><div><h3>${e(m.subject)}</h3><p class="muted small">${e(m.name)} · ${e(m.email)} · ${Aurum.formatDate(m.createdAt)}</p></div>
                <button type="button" class="btn btn-outline btn-sm danger" data-remove="${e(m.id)}">Delete</button></div>
              <p>${e(m.message)}</p>
            </article>`).join('')}</div>`
        : '<div class="empty"><h3>No messages</h3><p>Messages from the Contact page will appear here.</p></div>'}`;
    body.querySelectorAll('[data-remove]').forEach((b) => {
      b.addEventListener('click', async () => {
        const yes = await Aurum.confirmDialog({ title: 'Delete message', message: 'Delete this message?', confirmLabel: 'Delete', danger: true });
        if (!yes) return;
        Aurum.deleteMessage(b.dataset.remove);
        render();
      });
    });
  }

  render();
});
