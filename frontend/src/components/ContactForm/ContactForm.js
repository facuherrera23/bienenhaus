/**
 * Contact Form Component
 */

import { config } from '@/utils/config.js';
import { API } from '@/utils/api.js';

export class ContactForm {
  constructor() {
    this.form = null;
    this.submitBtn = null;
    this.msgEl = null;
  }

  render(container) {
    if (!container) return;
    container.innerHTML = this.getHTML();
    this.bindElements();
    this.bindEvents();
  }

  getHTML() {
    return `
<div class="contact-form-card">
  <p class="contact-form-card-title">Envianos un mensaje</p>
  <p class="contact-form-card-sub">Respondemos en menos de 24 horas</p>

  <form id="contactForm" class="contact-form" novalidate>
    <div style="position:absolute;left:-9999px;top:-9999px;height:0;overflow:hidden" aria-hidden="true">
      <input type="text" id="cf_website" tabindex="-1" autocomplete="off" value=""/>
    </div>
    <input type="hidden" id="cf_ts" value=""/>

    <div class="form-group">
      <label class="form-label" for="cf_motivo">¿En qué podemos ayudarte?</label>
      <select id="cf_motivo" class="form-select">
        <option value="">Consulta general</option>
        <option value="tasacion">Quiero tasar mi propiedad</option>
      </select>
    </div>

    <div class="contact-form-row">
      <div class="form-group">
        <label class="form-label" for="cf_name">Nombre *</label>
        <input type="text" id="cf_name" class="form-input" required placeholder="Tu nombre"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="cf_email">Email</label>
        <input type="email" id="cf_email" class="form-input" placeholder="tu@email.com"/>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="cf_phone">Teléfono</label>
      <input type="tel" id="cf_phone" class="form-input" placeholder="+54 351 ..."/>
    </div>

    <div id="cfTasacionFields" class="cf-tasacion-fields" style="display:none">
      <div class="contact-form-row">
        <div class="form-group">
          <label class="form-label" for="cf_property_type">Tipo de propiedad</label>
          <select id="cf_property_type" class="form-input">
            <option value="">Seleccioná...</option>
            <option value="casa">Casa</option>
            <option value="departamento">Departamento</option>
            <option value="terreno">Terreno</option>
            <option value="finca">Finca</option>
            <option value="local">Local comercial</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="cf_city">Ciudad / Zona</label>
          <input type="text" id="cf_city" class="form-input" placeholder="Ej: Nueva Córdoba"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="cf_address">Dirección</label>
        <input type="text" id="cf_address" class="form-input" placeholder="Calle y número"/>
      </div>
    </div>

    <div class="form-group" id="cfMessageField">
      <label class="form-label" for="cf_message">Mensaje</label>
      <textarea id="cf_message" class="form-textarea" rows="4" placeholder="Contanos cómo podemos ayudarte..."></textarea>
    </div>

    <div class="contact-form-footer">
      <button type="submit" class="btn btn-primary" id="cf_submit">Enviar mensaje</button>
      <span class="cf-msg" id="cfMsg"></span>
    </div>
  </form>
</div>`;
  }

  bindElements() {
    this.form = document.getElementById('contactForm');
    this.submitBtn = document.getElementById('cf_submit');
    this.msgEl = document.getElementById('cfMsg');
  }

  bindEvents() {
    if (!this.form) return;

    // Honeypot timestamp
    document.getElementById('cf_ts').value = Date.now();

    // Toggle tasación fields
    const motivoSel = document.getElementById('cf_motivo');
    const tasacionFields = document.getElementById('cfTasacionFields');
    const msgField = document.getElementById('cf_message');

    if (motivoSel && tasacionFields) {
      const toggle = () => {
        const show = motivoSel.value === 'tasacion';
        tasacionFields.style.display = show ? 'block' : 'none';
        if (msgField) msgField.required = !show;
      };
      motivoSel.addEventListener('change', toggle);
      if (window.location.hash === '#tasacion') {
        motivoSel.value = 'tasacion';
        toggle();
      }
    }

    // Form submit
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot
      if (document.getElementById('cf_website').value) return;

      const name = document.getElementById('cf_name').value.trim();
      const message = document.getElementById('cf_message').value.trim();

      if (!name || !message) {
        this.msgEl.textContent = 'Completá nombre y mensaje.';
        this.msgEl.className = 'cf-msg cf-msg--err';
        return;
      }

      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Enviando...';

      try {
        const res = await API.sendContact({
          name,
          email: document.getElementById('cf_email').value.trim(),
          phone: document.getElementById('cf_phone').value.trim(),
          message,
          _ts: document.getElementById('cf_ts').value,
          _website: document.getElementById('cf_website').value
        });

        if (res.ok) {
          this.msgEl.textContent = '✓ Mensaje enviado. Te contactaremos pronto.';
          this.msgEl.className = 'cf-msg cf-msg--ok';
          this.form.reset();
          document.getElementById('cf_ts').value = Date.now();
          if (tasacionFields) tasacionFields.style.display = 'none';
        } else {
          this.msgEl.textContent = res.error || 'Error al enviar.';
          this.msgEl.className = 'cf-msg cf-msg--err';
        }
      } catch {
        this.msgEl.textContent = 'Error de conexión.';
        this.msgEl.className = 'cf-msg cf-msg--err';
      }

      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Enviar mensaje';
    });
  }
}

export default ContactForm;