// Shared code for every page: storage, login, header, footer and helpers.
// All data is kept in the browser's localStorage under keys starting "aurum_".

const Aurum = (() => {
  const PREFIX = 'aurum_';

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(PREFIX + key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false; // storage is full
    }
  };

  // Seed data is written only when a key does not exist yet.
  function seed() {
    const defaults = {
      watches: SEED_WATCHES,
      users: SEED_USERS,
      reservations: SEED_RESERVATIONS,
      wishlist: {},
      messages: [],
    };
    Object.entries(defaults).forEach(([key, value]) => {
      if (localStorage.getItem(PREFIX + key) === null) write(key, value);
    });
  }

  // ---------- Helpers ----------
  const money = (amount) => '₹' + Number(amount).toLocaleString('en-IN');

  const escape = (text) =>
    String(text ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '—';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const param = (name) => new URLSearchParams(location.search).get(name);
  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = (value) => /^[6-9]\d{9}$/.test(value);
  const availability = (watch) => (watch.stock > 0 ? 'In stock' : 'Made to order');

  function toast(message) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el.timer);
    el.timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // A toast that should appear after the next page loads.
  const flash = (message) => sessionStorage.setItem('aurum_flash', message);

  function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `
        <div class="modal modal-sm" role="dialog" aria-modal="true" aria-label="${escape(title)}">
          <div class="modal-head"><h2>${escape(title)}</h2></div>
          <div class="modal-body"><p>${escape(message)}</p></div>
          <div class="modal-foot">
            <button type="button" class="btn btn-outline" data-no>Cancel</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-gold'}" data-yes>${escape(confirmLabel)}</button>
          </div>
        </div>`;
      const close = (answer) => {
        wrap.remove();
        resolve(answer);
      };
      wrap.querySelector('[data-no]').onclick = () => close(false);
      wrap.querySelector('[data-yes]').onclick = () => close(true);
      wrap.addEventListener('mousedown', (e) => e.target === wrap && close(false));
      document.body.appendChild(wrap);
      wrap.querySelector('[data-yes]').focus();
    });
  }

  function showMessage(form, text, type = 'error') {
    let box = form.querySelector('.alert');
    if (!box) {
      box = document.createElement('div');
      form.prepend(box);
    }
    box.className = `alert alert-${type}`;
    box.textContent = text;
  }

  // ---------- Users ----------
  const users = () => read('users', []);
  const user = () => read('currentUser', null);
  const withoutPassword = ({ password, ...rest }) => rest;

  function login(email, password) {
    const found = users().find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!found) return { ok: false, error: 'The email or password is incorrect.' };
    write('currentUser', withoutPassword(found));
    return { ok: true, user: found };
  }

  function register({ name, email, phone, city, password }) {
    const list = users();
    email = email.trim().toLowerCase();
    if (list.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const created = {
      id: 'cust-' + Date.now().toString(36),
      role: 'customer',
      name: name.trim(),
      email,
      phone,
      city: city.trim(),
      password,
      createdAt: daysFromToday(0),
    };
    write('users', [...list, created]);
    write('currentUser', withoutPassword(created));
    return { ok: true, user: created };
  }

  function logout() {
    localStorage.removeItem(PREFIX + 'currentUser');
    flash('You have been logged out.');
    location.href = 'index.html';
  }

  function updateProfile(patch) {
    const current = user();
    write('users', users().map((u) => (u.id === current.id ? { ...u, ...patch } : u)));
    const { password, ...safe } = patch;
    write('currentUser', { ...current, ...safe });
  }

  // Sends visitors to the login page and returns false when access is not allowed.
  function requireLogin(role) {
    const current = user();
    if (!current) {
      location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
      return false;
    }
    if (role && current.role !== role) {
      flash('That page is not available for your account.');
      location.replace(current.role === 'admin' ? 'admin.html' : 'account.html');
      return false;
    }
    return true;
  }

  // ---------- Watches ----------
  const watches = () => read('watches', []);
  const watch = (id) => watches().find((w) => w.id === id);

  function saveWatch(data) {
    const list = watches();
    const exists = list.some((w) => w.id === data.id);
    return write('watches', exists ? list.map((w) => (w.id === data.id ? data : w)) : [...list, data]);
  }

  const deleteWatch = (id) => write('watches', watches().filter((w) => w.id !== id));

  // ---------- Wishlist (one list per user) ----------
  const wishlist = () => {
    const current = user();
    return current ? read('wishlist', {})[current.id] || [] : [];
  };

  function toggleWish(id) {
    const current = user();
    if (!current) {
      location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
      return false;
    }
    const all = read('wishlist', {});
    const mine = all[current.id] || [];
    const saved = mine.includes(id);
    all[current.id] = saved ? mine.filter((x) => x !== id) : [...mine, id];
    write('wishlist', all);
    toast(saved ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
    return !saved;
  }

  // ---------- Reservations ----------
  const reservations = () => read('reservations', []);

  function addReservation({ watchId, date, time, note }) {
    const current = user();
    const item = watch(watchId);
    const list = reservations();
    const active = list.some(
      (r) => r.userId === current.id && r.watchId === watchId && ['Pending', 'Confirmed'].includes(r.status),
    );
    if (active) return { ok: false, error: 'You already have an open reservation for this watch.' };
    const reservation = {
      id: 'AUR-' + String(Date.now()).slice(-5),
      userId: current.id,
      customerName: current.name,
      customerEmail: current.email,
      customerPhone: current.phone,
      watchId,
      watchName: item.name,
      price: item.price,
      date,
      time,
      note: note.trim(),
      status: 'Pending',
      createdAt: daysFromToday(0),
    };
    write('reservations', [reservation, ...list]);
    return { ok: true, reservation };
  }

  const setReservationStatus = (id, status) =>
    write('reservations', reservations().map((r) => (r.id === id ? { ...r, status } : r)));

  // ---------- Messages ----------
  const messages = () => read('messages', []);
  const addMessage = (message) =>
    write('messages', [{ ...message, id: 'MSG-' + Date.now().toString(36), createdAt: new Date().toISOString() }, ...messages()]);
  const deleteMessage = (id) => write('messages', messages().filter((m) => m.id !== id));

  // ---------- Shared page parts ----------
  function watchCard(w) {
    const saved = wishlist().includes(w.id);
    return `
      <article class="watch-card">
        <a class="watch-image" href="watch.html?id=${encodeURIComponent(w.id)}">
          <img src="${escape(w.image)}" alt="${escape(w.name)}" loading="lazy">
        </a>
        <button type="button" class="wish-btn ${saved ? 'active' : ''}" data-wish="${escape(w.id)}"
          aria-label="${saved ? 'Remove from' : 'Save to'} wishlist" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button>
        <div class="watch-info">
          <p class="eyebrow">${escape(w.collection)} Collection</p>
          <h3><a href="watch.html?id=${encodeURIComponent(w.id)}">${escape(w.name)}</a></h3>
          <p class="muted small">${escape(w.tagline)}</p>
          <div class="watch-foot">
            <span class="price">${money(w.price)}</span>
            <span class="badge ${w.stock > 0 ? 'badge-green' : 'badge-gold'}">${availability(w)}</span>
          </div>
        </div>
      </article>`;
  }

  function wireWishButtons(root = document, onChange) {
    root.querySelectorAll('[data-wish]').forEach((button) => {
      button.addEventListener('click', () => {
        const saved = toggleWish(button.dataset.wish);
        button.classList.toggle('active', saved);
        button.textContent = saved ? '♥' : '♡';
        button.setAttribute('aria-pressed', saved);
        if (onChange) onChange();
      });
    });
  }

  const statusBadge = (status) => {
    const tone = { Pending: 'amber', Confirmed: 'blue', Completed: 'green', Cancelled: 'red' }[status] || 'gray';
    return `<span class="badge badge-${tone}">${escape(status)}</span>`;
  };

  function renderHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const current = user();
    const page = document.body.dataset.page;
    const link = (href, label, key) => `<a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>`;
    const account = current
      ? `${link(current.role === 'admin' ? 'admin.html' : 'account.html', current.role === 'admin' ? 'Dashboard' : 'My Account', current.role === 'admin' ? 'admin' : 'account')}
         <button type="button" class="btn btn-outline btn-sm" data-logout>Log out</button>`
      : `${link('login.html', 'Log in', 'login')}<a href="register.html" class="btn btn-gold btn-sm">Create account</a>`;
    header.innerHTML = `
      <div class="container nav">
        <a class="brand" href="index.html" aria-label="Aurum home">
          <span class="brand-mark">A</span><span class="brand-name">Aurum</span>
        </a>
        <button type="button" class="nav-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
        <nav class="nav-links" aria-label="Main">
          ${link('collection.html', 'Collection', 'collection')}
          ${link('about.html', 'About', 'about')}
          ${link('contact.html', 'Contact', 'contact')}
          ${current?.role === 'admin' ? '' : link('reserve.html', 'Book a Viewing', 'reserve')}
        </nav>
        <div class="nav-user">${current ? `<span class="nav-hello">Hello, ${escape(current.name.split(' ')[0])}</span>` : ''}${account}</div>
      </div>`;
    const toggle = header.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
    });
    header.querySelector('[data-logout]')?.addEventListener('click', logout);
  }

  function renderFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <p class="footer-brand">Aurum</p>
          <p class="muted small">Fine mechanical watches, finished by hand and sold through our boutique in Pune.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="collection.html">Collection</a><a href="about.html">About Aurum</a><a href="reserve.html">Book a Viewing</a>
        </div>
        <div>
          <h4>Account</h4>
          <a href="login.html">Log in</a><a href="register.html">Create account</a><a href="account.html">My Account</a>
        </div>
        <div>
          <h4>Boutique</h4>
          <p class="muted small">Lane 7, Koregaon Park, Pune 411001<br>Monday to Saturday, 11 am – 7 pm<br>+91 20 5550 0188<br>care@aurum.example</p>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Aurum Watches. All prices include taxes.</span>
        <span>Demonstration project – data is stored in your browser.</span>
      </div>`;
  }

  seed();
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    const pending = sessionStorage.getItem('aurum_flash');
    if (pending) {
      sessionStorage.removeItem('aurum_flash');
      toast(pending);
    }
  });

  return {
    money, escape, formatDate, param, isEmail, isPhone, availability, toast, flash, confirmDialog, showMessage,
    users, user, login, register, logout, updateProfile, requireLogin, write,
    watches, watch, saveWatch, deleteWatch, wishlist, toggleWish,
    reservations, addReservation, setReservationStatus, messages, addMessage, deleteMessage,
    watchCard, wireWishButtons, statusBadge,
  };
})();
