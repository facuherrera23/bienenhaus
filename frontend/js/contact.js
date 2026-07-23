function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  document.getElementById('cf_ts').value = Date.now();

  const motivoSel = document.getElementById('cf_motivo');
  const tasacionFields = document.getElementById('cfTasacionFields');
  if (motivoSel && tasacionFields) {
    motivoSel.addEventListener('change', function () {
      const show = motivoSel.value === 'tasacion';
      tasacionFields.style.display = show ? 'block' : 'none';
      const msg = document.getElementById('cf_message');
      if (msg) msg.required = !show;
      const btn = document.getElementById('cf_submit');
      if (btn) btn.textContent = show ? 'Solicitar tasación' : 'Enviar mensaje';
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = document.getElementById('cf_submit');
    const msgEl = document.getElementById('cfMsg');

    if (document.getElementById('cf_website').value) return;

    const name = document.getElementById('cf_name').value.trim();
    const motivo = motivoSel ? motivoSel.value : '';
    const phone = document.getElementById('cf_phone').value.trim();
    const city = document.getElementById('cf_city')?.value.trim() || '';

    if (motivo === 'tasacion') {
      if (!name || !phone || !city) {
        msgEl.textContent = 'Completá nombre, teléfono y zona.';
        msgEl.className = 'cf-msg cf-msg--err';
        return;
      }
    } else {
      const message = document.getElementById('cf_message').value.trim();
      if (!name || !message) {
        msgEl.textContent = 'Completá nombre y mensaje.';
        msgEl.className = 'cf-msg cf-msg--err';
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const payload = {
      name,
      email: document.getElementById('cf_email').value.trim(),
      phone,
      _ts: document.getElementById('cf_ts').value,
      _website: document.getElementById('cf_website').value,
    };

    try {
      let res;
      if (motivo === 'tasacion') {
        payload.property_type = document.getElementById('cf_property_type').value;
        payload.motivo = 'tasacion';
        payload.city = city;
        payload.address = document.getElementById('cf_address').value.trim();
        payload.comments = document.getElementById('cf_message').value.trim();
        res = await API.sendTasacion(payload);
      } else {
        payload.message = document.getElementById('cf_message').value.trim();
        if (motivo) payload.motivo = motivo;
        res = await API.sendContact(payload);
      }

      if (res && res.ok !== false) {
        msgEl.textContent = motivo === 'tasacion'
          ? '✓ Solicitud de tasación recibida. Te contactaremos pronto.'
          : '✓ Mensaje enviado. Te contactaremos pronto.';
        msgEl.className = 'cf-msg cf-msg--ok';
        form.reset();
        document.getElementById('cf_ts').value = Date.now();
        if (tasacionFields) tasacionFields.style.display = 'none';
        if (motivoSel) motivoSel.value = '';
        if (document.getElementById('cf_submit')) document.getElementById('cf_submit').textContent = 'Enviar mensaje';
      } else {
        msgEl.textContent = (res && res.error) || 'Error al enviar.';
        msgEl.className = 'cf-msg cf-msg--err';
      }
    } catch {
      msgEl.textContent = 'Error de conexión.';
      msgEl.className = 'cf-msg cf-msg--err';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = motivoSel && motivoSel.value === 'tasacion' ? 'Solicitar tasación' : 'Enviar mensaje';
  });
}
