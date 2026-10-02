document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('reserveRoot');
  if (!Aurum.requireLogin()) return;

  const user = Aurum.user();
  const e = Aurum.escape;
  if (user.role === 'admin') {
    root.innerHTML = `<div class="empty wide"><h3>Bookings are made by customers</h3>
      <p>You are logged in as an admin. You can manage all bookings from the dashboard.</p>
      <a class="btn btn-gold" href="admin.html#reservations">Open Dashboard</a></div>`;
    return;
  }

  const watches = Aurum.watches();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const lastDay = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const selected = Aurum.param('watch') || '';

  root.innerHTML = `
    <form class="card form" id="reserveForm" novalidate>
      <h2>Booking details</h2>
      <div class="field"><label for="vWatch">Watch</label>
        <select id="vWatch" name="watch"><option value="">Select a watch</option>
          ${watches.map((w) => `<option value="${e(w.id)}" ${w.id === selected ? 'selected' : ''}>${e(w.name)} – ${Aurum.money(w.price)}</option>`).join('')}
        </select></div>
      <div class="form-grid">
        <div class="field"><label for="vDate">Preferred date</label><input id="vDate" name="date" type="date" min="${tomorrow}" max="${lastDay}"></div>
        <div class="field"><label for="vTime">Preferred time</label>
          <select id="vTime" name="time"><option value="">Select a time</option>${TIME_SLOTS.map((t) => `<option>${t}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="vNote">Note (optional)</label><textarea id="vNote" name="note" rows="3" maxlength="300" placeholder="Anything we should know before your visit"></textarea></div>
      <button class="btn btn-gold" type="submit">Confirm Booking</button>
    </form>
    <aside class="card" id="reserveSide"></aside>`;

  const form = document.getElementById('reserveForm');
  const side = document.getElementById('reserveSide');

  function renderSide() {
    const w = Aurum.watch(form.watch.value);
    side.innerHTML = `
      <h2>Your booking</h2>
      ${w ? `<div class="mini-watch"><img src="${e(w.image)}" alt=""><div><strong>${e(w.name)}</strong><span class="muted small">${e(w.collection)} Collection</span><span class="price">${Aurum.money(w.price)}</span></div></div>` : '<p class="muted">Select a watch to see its details here.</p>'}
      <dl class="info-list">
        <div><dt>Name</dt><dd>${e(user.name)}</dd></div>
        <div><dt>Email</dt><dd>${e(user.email)}</dd></div>
        <div><dt>Mobile</dt><dd>${e(user.phone)}</dd></div>
        <div><dt>Location</dt><dd>Aurum Boutique, Koregaon Park, Pune</dd></div>
      </dl>
      <p class="muted small">No payment is needed to book a viewing. The boutique is closed on Sundays.</p>`;
  }
  form.watch.addEventListener('change', renderSide);
  renderSide();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { watch, date, time, note } = form;
    if (!watch.value) return Aurum.showMessage(form, 'Please select a watch.');
    if (!date.value) return Aurum.showMessage(form, 'Please choose a date.');
    if (date.value < tomorrow || date.value > lastDay) {
      return Aurum.showMessage(form, 'Please choose a date between tomorrow and the next 90 days.');
    }
    if (new Date(date.value + 'T12:00:00').getDay() === 0) {
      return Aurum.showMessage(form, 'The boutique is closed on Sundays. Please choose another day.');
    }
    if (!time.value) return Aurum.showMessage(form, 'Please select a time.');

    const result = Aurum.addReservation({ watchId: watch.value, date: date.value, time: time.value, note: note.value });
    if (!result.ok) return Aurum.showMessage(form, result.error);

    const r = result.reservation;
    root.innerHTML = `<div class="empty wide success">
      <span class="tick">✓</span>
      <h3>Your viewing is booked</h3>
      <p>Booking <strong>${e(r.id)}</strong> for the <strong>${e(r.watchName)}</strong> on ${Aurum.formatDate(r.date)} at ${e(r.time)}.<br>
      The status is <strong>Pending</strong> until our team confirms it.</p>
      <div class="btn-row center"><a class="btn btn-gold" href="account.html">View My Bookings</a><a class="btn btn-outline" href="collection.html">Back to Collection</a></div>
    </div>`;
    window.scrollTo({ top: 0 });
  });
});
