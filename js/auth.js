// Login and registration pages.
document.addEventListener('DOMContentLoaded', () => {
  const home = (user) => (user.role === 'admin' ? 'admin.html' : 'account.html');

  // Only allow "next" to point at a page of this site.
  const nextPage = (user) => {
    const next = Aurum.param('next');
    const safe = next && /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(next);
    const adminOnly = next && next.startsWith('admin.html');
    return safe && (!adminOnly || user.role === 'admin') ? next : home(user);
  };

  const current = Aurum.user();
  if (current) {
    location.replace(home(current));
    return;
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    if (Aurum.param('next')) Aurum.showMessage(loginForm, 'Please log in to continue.', 'info');
    const registerLink = loginForm.querySelector('.form-foot a');
    if (Aurum.param('next')) registerLink.href = 'register.html?next=' + encodeURIComponent(Aurum.param('next'));

    loginForm.querySelectorAll('[data-demo]').forEach((button) => {
      button.addEventListener('click', () => {
        const [email, password] = button.dataset.demo.split('|');
        loginForm.email.value = email;
        loginForm.password.value = password;
      });
    });

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      if (!Aurum.isEmail(email)) return Aurum.showMessage(loginForm, 'Please enter a valid email address.');
      if (!password) return Aurum.showMessage(loginForm, 'Please enter your password.');
      const result = Aurum.login(email, password);
      if (!result.ok) return Aurum.showMessage(loginForm, result.error);
      Aurum.flash(`Welcome back, ${result.user.name.split(' ')[0]}.`);
      location.href = nextPage(result.user);
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const f = registerForm;
      const data = {
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim(),
        city: f.city.value.trim(),
        password: f.password.value,
      };
      if (data.name.length < 2) return Aurum.showMessage(f, 'Please enter your full name.');
      if (!Aurum.isEmail(data.email)) return Aurum.showMessage(f, 'Please enter a valid email address.');
      if (!Aurum.isPhone(data.phone)) return Aurum.showMessage(f, 'Please enter a valid 10-digit mobile number.');
      if (!data.city) return Aurum.showMessage(f, 'Please enter your city.');
      if (data.password.length < 8 || !/[A-Za-z]/.test(data.password) || !/\d/.test(data.password)) {
        return Aurum.showMessage(f, 'The password must have at least 8 characters, including a letter and a number.');
      }
      if (data.password !== f.confirm.value) return Aurum.showMessage(f, 'The two passwords do not match.');

      const result = Aurum.register(data);
      if (!result.ok) return Aurum.showMessage(f, result.error);
      Aurum.flash('Your account has been created.');
      location.href = nextPage(result.user);
    });
  }
});
