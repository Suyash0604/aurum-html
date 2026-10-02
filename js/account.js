// Customer account: bookings, wishlist and profile.
document.addEventListener('DOMContentLoaded', () => {
  if (!Aurum.requireLogin('customer')) return;

  const root = document.getElementById('accountRoot');
  const e = Aurum.escape;
  const TABS = [['bookings', 'My Bookings'], ['wishlist', 'Wishlist'], ['profile', 'Profile']];
  let tab = TABS.some(([key]) => key === location.hash.slice(1)) ? location.hash.slice(1) : 'bookings';

  document.getElementById('accountTitle').textContent = `Hello, ${Aurum.user().name.split(' ')[0]}`;

  function render() {
    const user = Aurum.user();
    const mine = Aurum.reservations().filter((r) => r.userId === user.id);
    const saved = Aurum.wishlist().map(Aurum.watch).filter(Boolean);
    const open = mine.filter((r) => ['Pending', 'Confirmed'].includes(r.status)).length;

    root.innerHTML = `
      <div class="stats">
        <div class="stat"><strong>${mine.length}</strong><span>Total bookings</span></div>
        <div class="stat"><strong>${open}</strong><span>Upcoming viewings</span></div>
        <div class="stat"><strong>${saved.length}</strong><span>Watches in wishlist</span></div>
      </div>
      <div class="tabs" role="tablist">
        ${TABS.map(([key, label]) => `<button type="button" role="tab" class="tab ${key === tab ? 'active' : ''}" data-tab="${key}" aria-selected="${key === tab}">${label}</button>`).join('')}
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
    if (tab === 'bookings') renderBookings(body, mine);
    if (tab === 'wishlist') renderWishlist(body, saved);
    if (tab === 'profile') renderProfile(body, user);
  }

  function renderBookings(body, mine) {
    if (!mine.length) {
      body.innerHTML = `<div class="empty"><h3>No bookings yet</h3><p>You have not booked a private viewing.</p>
        <a class="btn btn-gold" href="reserve.html">Book a Private Viewing</a></div>`;
      return;
    }
    body.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Booking</th><th>Watch</th><th>Date and time</th><th>Price</th><th>Status</th><th></th></tr></thead>
        <tbody>${mine.map((r) => `
          <tr>
            <td data-label="Booking">${e(r.id)}</td>
            <td data-label="Watch">${Aurum.watch(r.watchId) ? `<a href="watch.html?id=${encodeURIComponent(r.watchId)}">${e(r.watchName)}</a>` : e(r.watchName)}</td>
            <td data-label="Date and time">${Aurum.formatDate(r.date)}, ${e(r.time)}</td>
            <td data-label="Price">${Aurum.money(r.price)}</td>
            <td data-label="Status">${Aurum.statusBadge(r.status)}</td>
            <td data-label="Action">${['Pending', 'Confirmed'].includes(r.status)
              ? `<button type="button" class="btn btn-outline btn-sm" data-cancel="${e(r.id)}">Cancel</button>` : '<span class="muted small">—</span>'}</td>
          </tr>`).join('')}
        </tbody></table></div>
      <div class="btn-row"><a class="btn btn-gold" href="reserve.html">Book Another Viewing</a></div>`;

    body.querySelectorAll('[data-cancel]').forEach((button) => {
      button.addEventListener('click', async () => {
        const yes = await Aurum.confirmDialog({
          title: 'Cancel booking',
          message: `Do you want to cancel booking ${button.dataset.cancel}?`,
          confirmLabel: 'Cancel Booking',
          danger: true,
        });
        if (!yes) return;
        Aurum.setReservationStatus(button.dataset.cancel, 'Cancelled');
        Aurum.toast('Your booking has been cancelled.');
        render();
      });
    });
  }

  function renderWishlist(body, saved) {
    if (!saved.length) {
      body.innerHTML = `<div class="empty"><h3>Your wishlist is empty</h3><p>Use the heart button on a watch to save it here.</p>
        <a class="btn btn-gold" href="collection.html">View the Collection</a></div>`;
      return;
    }
    body.innerHTML = `<div class="watch-grid">${saved.map(Aurum.watchCard).join('')}</div>`;
    Aurum.wireWishButtons(body, render);
  }

  function renderProfile(body, user) {
    body.innerHTML = `
      <div class="two-col">
        <form class="card form" id="profileForm" novalidate>
          <h2>Personal details</h2>
          <div class="form-grid">
            <div class="field"><label for="pName">Full name</label><input id="pName" name="name" value="${e(user.name)}"></div>
            <div class="field"><label for="pEmail">Email</label><input id="pEmail" value="${e(user.email)}" readonly></div>
            <div class="field"><label for="pPhone">Mobile number</label><input id="pPhone" name="phone" maxlength="10" value="${e(user.phone)}"></div>
            <div class="field"><label for="pCity">City</label><input id="pCity" name="city" value="${e(user.city || '')}"></div>
          </div>
          <button class="btn btn-gold" type="submit">Save Changes</button>
        </form>
        <form class="card form" id="passwordForm" novalidate>
          <h2>Change password</h2>
          <div class="field"><label for="pwOld">Current password</label><input id="pwOld" name="old" type="password" autocomplete="current-password"></div>
          <div class="field"><label for="pwNew">New password</label><input id="pwNew" name="new" type="password" autocomplete="new-password"></div>
          <button class="btn btn-outline" type="submit">Update Password</button>
        </form>
      </div>`;

    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = profileForm.name.value.trim();
      const phone = profileForm.phone.value.trim();
      const city = profileForm.city.value.trim();
      if (name.length < 2) return Aurum.showMessage(profileForm, 'Please enter your full name.');
      if (!Aurum.isPhone(phone)) return Aurum.showMessage(profileForm, 'Please enter a valid 10-digit mobile number.');
      Aurum.updateProfile({ name, phone, city });
      Aurum.showMessage(profileForm, 'Your details have been saved.', 'success');
      document.getElementById('accountTitle').textContent = `Hello, ${name.split(' ')[0]}`;
    });

    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const stored = Aurum.users().find((u) => u.id === user.id);
      const next = passwordForm.new.value;
      if (passwordForm.old.value !== stored.password) return Aurum.showMessage(passwordForm, 'The current password is incorrect.');
      if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
        return Aurum.showMessage(passwordForm, 'The new password must have at least 8 characters, including a letter and a number.');
      }
      Aurum.updateProfile({ password: next });
      passwordForm.reset();
      Aurum.showMessage(passwordForm, 'Your password has been updated.', 'success');
    });
  }

  // Keep the open tab in step with the address bar (links such as admin.html#watches).
  window.addEventListener('hashchange', () => {
    const key = location.hash.slice(1);
    if (TABS.some(([name]) => name === key) && key !== tab) {
      tab = key;
      render();
    }
  });

  render();
});
