document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const user = Aurum.user();
  if (user) {
    form.name.value = user.name;
    form.email.value = user.email;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };
    if (data.name.length < 2) return Aurum.showMessage(form, 'Please enter your name.');
    if (!Aurum.isEmail(data.email)) return Aurum.showMessage(form, 'Please enter a valid email address.');
    if (!data.subject) return Aurum.showMessage(form, 'Please enter a subject.');
    if (data.message.length < 10) return Aurum.showMessage(form, 'Please write a message of at least 10 characters.');

    Aurum.addMessage(data);
    form.subject.value = '';
    form.message.value = '';
    Aurum.showMessage(form, 'Thank you. Your message has been sent and we will reply within one working day.', 'success');
  });
});
