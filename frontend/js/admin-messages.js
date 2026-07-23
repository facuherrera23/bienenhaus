/**
 * admin-messages.js — Sistema de mensajería tipo WhatsApp CRM
 * Conversaciones, chat en vivo, panel lateral de contacto
 */

let _conversations = [];
let _activeConvId = null;
let _msgPollTimer = null;
let _lastUnreadTotal = 0;
let _msgEmojiOpen = false;

const CONV_AVATAR_BG = ['#0b131e','#0b1a0d','#1a0b0b','#181808','#0b1818','#100b1a','#1a0b14','#0b1a1a'];
const CHANNEL_LABELS = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', email: 'Email', web: 'Web' };
const CHANNEL_ICONS = { whatsapp: '💬', instagram: '📷', facebook: '👍', email: '✉', web: '🌐' };
const EMOJIS = ['😀','😊','😂','😍','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','🙏','💪','✅','❌','📅','📍','💰','🏠','🔑','📞','✉️'];

function _convInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0,2).toUpperCase();
}

function _convAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CONV_AVATAR_BG[Math.abs(hash) % CONV_AVATAR_BG.length];
}

function _convTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const thisYear = d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  if (thisYear) return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' });
}

function _convDateGroup(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (sameDay) return 'Hoy';
  if (isYesterday) return 'Ayer';
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── LOAD CONVERSATIONS ──────────────────────────────────────────────
async function loadMessages() {
  const list = $('msgConvList');
  if (!list) return;
  list.innerHTML = '<div class="loading-state">Cargando conversaciones...</div>';
  try {
    const data = await API.getConversations();
    _conversations = data.conversations || [];

    $('sidebarMsgCount').textContent = data.total_unread > 0 ? data.total_unread : _conversations.length;
    $('msgSubtitle').textContent = `${_conversations.length} conversación${_conversations.length !== 1 ? 'es' : ''} · ${data.total_unread} sin leer`;

    if (!_conversations.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-text">No hay conversaciones todavía.</div></div>';
      $('msgChatArea').innerHTML = '';
      $('msgSidePanel').innerHTML = '';
      return;
    }

    _renderConvList();

    if (_activeConvId) {
      const stillExists = _conversations.find(c => c.id === _activeConvId);
      if (!stillExists) _activeConvId = null;
    }
    if (!_activeConvId) {
      _activeConvId = _conversations[0].id;
    }
    _openConversation(_activeConvId);

  } catch (e) {
    list.innerHTML = `<div class="loading-state">Error al cargar conversaciones.</div>`;
  }
}

function _renderConvList() {
  const list = $('msgConvList');
  if (!list) return;
  list.innerHTML = _conversations.map(c => `
    <button type="button" class="msg-conv-item${c.id === _activeConvId ? ' active' : ''}" data-conv-id="${c.id}" onclick="selectConversation(${c.id})">
      <div class="msg-conv-avatar" style="background:${_convAvatarColor(c.lead_name)}">${_convInitials(c.lead_name)}</div>
      <div class="msg-conv-info">
        <div class="msg-conv-name">${esc(c.lead_name || 'Sin nombre')}</div>
        ${c.subject ? `<div class="msg-conv-subject">${esc(c.subject)}</div>` : ''}
        <div class="msg-conv-preview">${c.last_sender === 'agent' ? 'Tú: ' : ''}${esc(c.last_message_preview || '—')}</div>
      </div>
      <div class="msg-conv-meta">
        <span class="msg-conv-time">${_convTime(c.last_message_at)}</span>
        ${c.unread > 0 ? `<span class="msg-conv-badge">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
      </div>
      </button>
    `).join('');
}

// ── SELECT CONVERSATION ─────────────────────────────────────────────
window.selectConversation = async function selectConversation(id) {
  _activeConvId = id;
  document.querySelectorAll('.msg-conv-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.msg-conv-item[data-conv-id="${id}"]`)?.classList.add('active');

  try {
    const messagesData = await API.getConversationMessages(id);
    const conv = _conversations.find(c => c.id === id);
    if (conv && conv.unread > 0) {
      await API.markConversationRead(id);
      conv.unread = 0;
      _renderConvList();
      _updateUnreadBadge();
    }
    _renderChat(conv || { id }, messagesData.messages || []);
    _renderSidePanel(conv || { id });
  } catch (e) {
    toast('Error al cargar mensajes', 'error');
  }
};

async function _openConversation(id) {
  _activeConvId = id;
  document.querySelectorAll('.msg-conv-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.msg-conv-item[data-conv-id="${id}"]`)?.classList.add('active');

  try {
    const messagesData = await API.getConversationMessages(id);
    const conv = _conversations.find(c => c.id === id);
    if (conv && conv.unread > 0) {
      await API.markConversationRead(id);
      conv.unread = 0;
      _renderConvList();
      _updateUnreadBadge();
    }
    _renderChat(conv || { id }, messagesData.messages || []);
    _renderSidePanel(conv || { id });
  } catch {
    $('msgChatArea').innerHTML = '<div class="loading-state">Error al cargar mensajes.</div>';
  }
}

// ── RENDER CHAT ──────────────────────────────────────────────────────
function _renderChat(conv, messages) {
  const area = $('msgChatArea');
  if (!area) return;
  if (!conv || !conv.lead_name) {
    area.innerHTML = `
      <div class="msg-chat-empty">
        <div class="msg-chat-empty-icon">💬</div>
        <div class="msg-chat-empty-text">Seleccioná una conversación para ver los mensajes</div>
      </div>`;
    return;
  }

  const channelIcon = CHANNEL_ICONS[conv.channel] || '💬';
  const channelLabel = CHANNEL_LABELS[conv.channel] || conv.channel;
  const statusLabel = conv.status === 'resuelta' ? 'Resuelta' : conv.status === 'archivada' ? 'Archivada' : 'Activa';

  area.innerHTML = `
    <div class="msg-chat-header" id="msgChatHeader">
      <div class="msg-chat-header-left">
        <div class="msg-conv-avatar msg-conv-avatar--sm" style="background:${_convAvatarColor(conv.lead_name)}">${_convInitials(conv.lead_name)}</div>
        <div>
          <div class="msg-chat-header-name">${esc(conv.lead_name)} ${channelIcon}</div>
          <div class="msg-chat-header-status">${channelLabel} · ${statusLabel}</div>
        </div>
      </div>
      <div class="msg-chat-header-actions">
        <button class="btn btn-ghost btn-sm" onclick="loadMessages()" title="Actualizar">↻</button>
      </div>
    </div>
    <div class="msg-messages" id="msgMessages">
      ${messages.length === 0
        ? '<div class="msg-chat-empty-text msg-chat-empty-text--centered">No hay mensajes en esta conversación. Enviá el primero.</div>'
        : _renderMessages(messages)
      }
    </div>
    <div class="msg-input-bar" id="msgInputBar">
      <div class="msg-input-actions">
        <button class="msg-input-btn" onclick="toggleEmojiPicker()" title="Emoji">😊</button>
        <button class="msg-input-btn" onclick="document.getElementById('msgFileInput').click()" title="Adjuntar">📎</button>
        <input type="file" id="msgFileInput" class="msg-hidden-input" accept="image/*,.pdf,.doc,.docx" onchange="attachFile(this)">
      </div>
      <textarea class="msg-input-field" id="msgInputField" rows="1" placeholder="Escribí un mensaje..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}"></textarea>
      <button class="msg-input-send" id="msgSendBtn" onclick="sendMessage()" title="Enviar">➤</button>
    </div>`;

  const msgsEl = $('msgMessages');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
}

function _renderMessages(messages) {
  let html = '';
  let lastDate = '';
  messages.forEach(m => {
    const d = _convDateGroup(m.created_at);
    if (d && d !== lastDate) {
      html += `<div class="msg-date-separator">${d}</div>`;
      lastDate = d;
    }
    const isAgent = m.sender === 'agent';
    html += `
      <div class="msg-bubble msg-bubble--${isAgent ? 'agent' : 'client'}">
        ${m.content ? esc(m.content) : ''}
        ${m.attachment_url ? `<div class="msg-bubble-attachment"><a href="${esc(m.attachment_url)}" target="_blank">📎 ${esc(m.attachment_name || 'Archivo')}</a></div>` : ''}
        <div class="msg-bubble-time">${_convTime(m.created_at)}${isAgent ? ' ✓' : ''}</div>
      </div>`;
  });
  return html;
}

// ── SEND MESSAGE ─────────────────────────────────────────────────────
window.sendMessage = async function sendMessage() {
  const input = $('msgInputField');
  const btn = $('msgSendBtn');
  const content = (input?.value || '').trim();
  if (!content || !_activeConvId) return;
  if (btn) btn.disabled = true;

  try {
    const msg = await API.sendMessage(_activeConvId, content);
    input.value = '';
    input.style.height = 'auto';
    if (btn) btn.disabled = false;

    const msgsEl = $('msgMessages');
    if (msgsEl) {
      const d = _convDateGroup(msg.created_at);
      const lastSep = msgsEl.querySelector('.msg-date-separator:last-child');
      const needsSep = !lastSep || lastSep.textContent !== d;
      msgsEl.insertAdjacentHTML('beforeend', `
        ${needsSep ? `<div class="msg-date-separator">${d}</div>` : ''}
        <div class="msg-bubble msg-bubble--agent">
          ${esc(msg.content)}
          <div class="msg-bubble-time">${_convTime(msg.created_at)} ✓</div>
        </div>`);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    const conv = _conversations.find(c => c.id === _activeConvId);
    if (conv) {
      conv.last_message_preview = content;
      conv.last_message_at = msg.created_at;
      conv.last_sender = 'agent';
      _renderConvList();
    }
  } catch (e) {
    toast('Error al enviar mensaje', 'error');
    if (btn) btn.disabled = false;
  }
};

// ── AUTO-RESIZE TEXTAREA ────────────────────────────────────────────
document.addEventListener('input', function(e) {
  const el = e.target.closest('#msgInputField');
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }
});

// ── ATTACH FILE ─────────────────────────────────────────────────────
window.attachFile = async function attachFile(input) {
  if (!input.files.length || !_activeConvId) return;
  const file = input.files[0];
  const btn = $('msgSendBtn');
  if (btn) btn.disabled = true;
  try {
    const uploadResult = await API.uploadImages([file]);
    if (uploadResult.urls && uploadResult.urls[0]) {
      const msg = await API.sendMessage(_activeConvId, '', 'attachment', uploadResult.urls[0], file.name);
      const msgsEl = $('msgMessages');
      if (msgsEl) {
        msgsEl.insertAdjacentHTML('beforeend', `
          <div class="msg-date-separator">${_convDateGroup(msg.created_at)}</div>
          <div class="msg-bubble msg-bubble--agent">
            <div class="msg-bubble-attachment"><a href="${esc(msg.attachment_url)}" target="_blank">📎 ${esc(msg.attachment_name || 'Archivo')}</a></div>
            <div class="msg-bubble-time">${_convTime(msg.created_at)} ✓</div>
          </div>`);
        msgsEl.scrollTop = msgsEl.scrollHeight;
      }
    }
  } catch (e) {
    toast('Error al adjuntar archivo', 'error');
  }
  input.value = '';
  if (btn) btn.disabled = false;
};

// ── EMOJI PICKER ────────────────────────────────────────────────────
window.toggleEmojiPicker = function toggleEmojiPicker() {
  _msgEmojiOpen = !_msgEmojiOpen;
  const existing = document.querySelector('.msg-emoji-picker');
  if (existing) { existing.remove(); _msgEmojiOpen = false; return; }
  if (!_msgEmojiOpen) return;

  const picker = document.createElement('div');
  picker.className = 'msg-emoji-picker';
  picker.innerHTML = EMOJIS.map(e => `<button class="msg-emoji-btn" onclick="insertEmoji('${e}')">${e}</button>`).join('');
  const actions = document.querySelector('.msg-input-actions');
  if (actions) actions.appendChild(picker);

  document.addEventListener('click', _closeEmojiOnOutside, true);
};

function _closeEmojiOnOutside(e) {
  if (!e.target.closest('.msg-input-actions')) {
    const picker = document.querySelector('.msg-emoji-picker');
    if (picker) picker.remove();
    _msgEmojiOpen = false;
    document.removeEventListener('click', _closeEmojiOnOutside, true);
  }
}

window.insertEmoji = function insertEmoji(emoji) {
  const input = $('msgInputField');
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
  input.selectionStart = input.selectionEnd = start + emoji.length;
  input.focus();
  input.dispatchEvent(new Event('input'));
};

// ── SIDE PANEL ───────────────────────────────────────────────────────
function _renderSidePanel(conv) {
  const panel = $('msgSidePanel');
  if (!panel) return;
  if (!conv || !conv.lead_name) {
    panel.innerHTML = '<div class="msg-panel-section"><div class="msg-panel-section-title">Contacto</div><div class="msg-panel-empty">Sin información</div></div>';
    return;
  }

  const channelLabel = CHANNEL_LABELS[conv.channel] || conv.channel;
  const statusBadge = conv.status === 'resuelta'
    ? '<span class="admin-status-badge status-disponible">Resuelta</span>'
    : conv.status === 'archivada'
    ? '<span class="admin-status-badge status-oculta">Archivada</span>'
    : '<span class="admin-status-badge status-pendiente">Activa</span>';

  const linkedSection = `
    <div class="msg-panel-section msg-linked-section">
      <div class="msg-panel-section-title">Vinculado a</div>
      <div class="msg-linked-chips" id="msgLinkedChips_${conv.id}">
        <span class="msg-panel-placeholder">Cargando...</span>
      </div>
      <button class="msg-panel-action-btn" onclick="_showLinkModal(${conv.id})" style="margin-top:8px">🔗 Vincular propiedad / tasación</button>
    </div>`;

  panel.innerHTML = `
    <div class="msg-panel-section">
      <div class="msg-panel-contact">
        <div class="msg-panel-avatar" style="background:${_convAvatarColor(conv.lead_name)}">${_convInitials(conv.lead_name)}</div>
        <div class="msg-panel-name">${esc(conv.lead_name || 'Sin nombre')}</div>
        ${statusBadge}
      </div>
    </div>
    <div class="msg-panel-section">
      <div class="msg-panel-section-title">Contacto</div>
      ${conv.lead_email ? `<div class="msg-panel-row"><span class="msg-panel-label">Email</span><span class="msg-panel-value"><a href="mailto:${esc(conv.lead_email)}">${esc(conv.lead_email)}</a></span></div>` : ''}
      ${conv.lead_phone ? `<div class="msg-panel-row"><span class="msg-panel-label">Teléfono</span><span class="msg-panel-value"><a href="tel:${esc(conv.lead_phone)}">${esc(conv.lead_phone)}</a></span></div>` : ''}
      <div class="msg-panel-row"><span class="msg-panel-label">Canal</span><span class="msg-panel-value">${channelLabel}</span></div>
      ${conv.lead_status ? `<div class="msg-panel-row"><span class="msg-panel-label">Estado lead</span><span class="msg-panel-value">${esc(conv.lead_status)}</span></div>` : ''}
      ${conv.agent_name ? `<div class="msg-panel-row"><span class="msg-panel-label">Asignado a</span><span class="msg-panel-value">${esc(conv.agent_name)}</span></div>` : ''}
      <div class="msg-panel-row"><span class="msg-panel-label">Mensajes</span><span class="msg-panel-value">${conv.message_count || 0}</span></div>
    </div>
    ${linkedSection}
    <div class="msg-panel-section">
      <div class="msg-panel-section-title">Acciones rápidas</div>
      <div class="msg-panel-actions">
        ${conv.lead_phone ? `<button class="msg-panel-action-btn" onclick="window.open('https://wa.me/${conv.lead_phone.replace(/\\D/g,'')}','_blank')">💬 Abrir WhatsApp</button>` : ''}
        ${conv.lead_email ? `<button class="msg-panel-action-btn" onclick="window.open('mailto:${esc(conv.lead_email)}','_blank')">✉ Enviar email</button>` : ''}
        <button class="msg-panel-action-btn" onclick="changeConvStatus(${conv.id}, 'archivada')">📁 Archivar conversación</button>
      </div>
    </div>`;

  _refreshLinkedItems(conv.id);
}

async function _refreshLinkedItems(convId) {
  const chipsEl = $('msgLinkedChips_' + convId);
  if (!chipsEl) return;
  try {
    const links = await API.getConversationLinks(convId);
    const props = links.properties || [];
    const apprs = links.appraisals || [];
    const all = [...props, ...apprs];
    if (!all.length) {
      chipsEl.innerHTML = '<span class="msg-panel-placeholder">Sin vínculos</span>';
      return;
    }
    chipsEl.innerHTML = all.map(item =>
      `<span class="msg-linked-chip">
        <span class="acm-chip-text">${esc(item.title || 'Sin título')}</span>
        <button class="msg-linked-chip-remove" onclick="_removeLink(${convId},'${item.type}',${item.id})" title="Desvincular">×</button>
      </span>`
    ).join('');
  } catch {
    const el = $('msgLinkedChips_' + convId);
    if (el) el.innerHTML = '<span class="msg-panel-placeholder">Error al cargar</span>';
  }
}

async function _removeLink(convId, linkType, linkId) {
  try {
    await API.removeConversationLink(convId, linkType, linkId);
    _refreshLinkedItems(convId);
    toast('Vínculo eliminado', 'success');
  } catch {
    toast('Error al desvincular', 'error');
  }
}

// ── LINKING MODAL ─────────────────────────────────────────────────────
async function _showLinkModal(convId) {
  const conv = _conversations.find(c => c.id === convId);
  if (!conv) return;

  let linkTab = 'property';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;align-items:center;justify-content:center;z-index:10000';
  modal.innerHTML = `
    <div class="modal" style="max-width:520px;width:90%;max-height:80vh;display:flex;flex-direction:column">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:var(--admin-space-4);border-bottom:1px solid var(--admin-border)">
        <h3 style="margin:0;font-family:var(--admin-font-display);font-weight:400;font-size:var(--admin-text-md)">Vincular ${esc(conv.lead_name || 'conversación')}</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--admin-text-muted)">×</button>
      </div>
      <div style="display:flex;gap:0;padding:var(--admin-space-2) var(--admin-space-4) 0;border-bottom:1px solid var(--admin-border)">
        <button class="msg-link-tab ${linkTab === 'property' ? 'active' : ''}" data-link-tab="property" style="flex:1;padding:var(--admin-space-2) var(--admin-space-3);border:none;background:none;cursor:pointer;font-size:var(--admin-text-xs);font-weight:600;color:var(--admin-text-secondary);border-bottom:2px solid ${linkTab === 'property' ? 'var(--admin-primary)' : 'transparent'};transition:var(--admin-transition)">Propiedades</button>
        <button class="msg-link-tab ${linkTab === 'appraisal' ? 'active' : ''}" data-link-tab="appraisal" style="flex:1;padding:var(--admin-space-2) var(--admin-space-3);border:none;background:none;cursor:pointer;font-size:var(--admin-text-xs);font-weight:600;color:var(--admin-text-secondary);border-bottom:2px solid ${linkTab === 'appraisal' ? 'var(--admin-primary)' : 'transparent'};transition:var(--admin-transition)">Tasaciones</button>
      </div>
      <div style="padding:var(--admin-space-3) var(--admin-space-4)">
        <input type="text" class="msg-link-search" data-link-type="${linkTab}" placeholder="Buscar..." style="width:100%;padding:var(--admin-space-2) var(--admin-space-3);border:1px solid var(--admin-border);border-radius:var(--admin-radius-md);font-size:var(--admin-text-sm);outline:none;font-family:var(--admin-font-body);background:var(--admin-bg);color:var(--admin-text)">
      </div>
      <div class="msg-link-results" style="flex:1;overflow-y:auto;padding:0 var(--admin-space-4) var(--admin-space-3);min-height:120px">
        <div class="msg-panel-placeholder">Escribí para buscar...</div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const searchInput = modal.querySelector('.msg-link-search');
  const resultsEl = modal.querySelector('.msg-link-results');
  const tabs = modal.querySelectorAll('.msg-link-tab');

  let searchTimer = null;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.style.borderBottomColor = 'transparent';
        t.classList.remove('active');
      });
      tab.style.borderBottomColor = 'var(--admin-primary)';
      tab.classList.add('active');
      linkTab = tab.dataset.linkTab;
      searchInput.dataset.linkType = linkTab;
      searchInput.value = '';
      resultsEl.innerHTML = '<div class="msg-panel-placeholder">Escribí para buscar...</div>';
    });
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      resultsEl.innerHTML = '<div class="msg-panel-placeholder">Escribí al menos 2 caracteres</div>';
      return;
    }
    searchTimer = setTimeout(() => _searchLinkItems(linkTab, q, resultsEl, convId), 300);
  });
}

async function _searchLinkItems(type, query, resultsEl, convId) {
  resultsEl.innerHTML = '<div class="msg-panel-placeholder">Buscando...</div>';
  try {
    let items;
    if (type === 'property') {
      const data = await API.getProperties({ search: query, per_page: 20 });
      items = (data.properties || []).map(p => ({
        id: p.id, title: p.title || 'Sin título',
        subtitle: p.location ? esc(p.location) : '',
      }));
    } else {
      const data = await API.getAppraisals({ search: query, per_page: 20 });
      items = (data.appraisals || []).map(a => ({
        id: a.id, title: a.titulo || 'Sin título',
        subtitle: a.direccion ? esc(a.direccion) : '',
      }));
    }

    if (!items.length) {
      resultsEl.innerHTML = '<div class="msg-panel-placeholder">Sin resultados</div>';
      return;
    }

    resultsEl.innerHTML = items.map(item =>
      `<button class="msg-link-result" data-id="${item.id}" style="display:flex;align-items:center;width:100%;padding:var(--admin-space-2) var(--admin-space-3);border:1px solid var(--admin-border);border-radius:var(--admin-radius-md);background:var(--admin-surface);cursor:pointer;text-align:left;margin-bottom:6px;transition:var(--admin-transition);font:inherit;color:inherit"
          onmouseover="this.style.borderColor='var(--admin-primary-border)'" onmouseout="this.style.borderColor=''"
          onclick="_confirmLink(${convId},'${type}',${item.id},this)">
        <div>
          <div style="font-size:var(--admin-text-sm);font-weight:600;color:var(--admin-text)">${esc(item.title)}</div>
          ${item.subtitle ? `<div style="font-size:var(--admin-text-xs);color:var(--admin-text-muted);margin-top:2px">${item.subtitle}</div>` : ''}
        </div>
      </button>`
    ).join('');
  } catch {
    resultsEl.innerHTML = '<div class="msg-panel-placeholder">Error al buscar</div>';
  }
}

async function _confirmLink(convId, linkType, linkId, btnEl) {
  btnEl.disabled = true;
  btnEl.style.opacity = '0.5';
  try {
    await API.addConversationLink(convId, linkType, linkId);
    toast('Vinculado correctamente', 'success');
    const modal = btnEl.closest('.modal-overlay');
    if (modal) modal.remove();
    _refreshLinkedItems(convId);
  } catch (e) {
    toast(e.message || 'Error al vincular', 'error');
    btnEl.disabled = false;
    btnEl.style.opacity = '1';
  }
}

window._showLinkModal = _showLinkModal;
window._removeLink = _removeLink;

window.changeConvStatus = async function changeConvStatus(id, status) {
  if (!await confirmModal(`¿${status === 'archivada' ? 'Archivar' : 'Cambiar estado a'} esta conversación?`)) return;
  try {
    await API.updateConversationStatus(id, status);
    const conv = _conversations.find(c => c.id === id);
    if (conv) conv.status = status;
    if (_activeConvId === id) _renderSidePanel(conv);
    toast('Estado actualizado', 'success');
  } catch (e) {
    toast('Error al actualizar estado', 'error');
  }
};

// ── SEARCH CONVERSATIONS ────────────────────────────────────────────
window.filterConversations = function filterConversations(q) {
  const query = (q || '').toLowerCase().trim();
  document.querySelectorAll('.msg-conv-item').forEach(el => {
    const name = el.querySelector('.msg-conv-name')?.textContent?.toLowerCase() || '';
    const preview = el.querySelector('.msg-conv-preview')?.textContent?.toLowerCase() || '';
    const match = !query || name.includes(query) || preview.includes(query);
    el.style.display = match ? '' : 'none';
  });
};

// ── POLLING ─────────────────────────────────────────────────────────
function startMsgPolling() {
  stopMsgPolling();
  _lastUnreadTotal = 0;
  _msgPollTimer = setInterval(pollConversations, 15000);
}

function stopMsgPolling() {
  if (_msgPollTimer) {
    clearInterval(_msgPollTimer);
    _msgPollTimer = null;
  }
}

async function pollConversations() {
  try {
    const data = await API.getConversations();
    const totalUnread = data.total_unread || 0;
    const newConvs = data.conversations || [];

    $('sidebarMsgCount').textContent = totalUnread > 0 ? totalUnread : newConvs.length;
    $('msgSubtitle').textContent = `${newConvs.length} conversación${newConvs.length !== 1 ? 'es' : ''} · ${totalUnread} sin leer`;

    if (totalUnread > _lastUnreadTotal && _lastUnreadTotal >= 0) {
      const newCount = totalUnread - _lastUnreadTotal;
      toast(`${newCount} mensaje${newCount !== 1 ? 's' : ''} nuevo${newCount !== 1 ? 's' : ''}`, 'info');
    }
    _lastUnreadTotal = totalUnread;

    const changed = JSON.stringify(_conversations.map(c => c.id).sort()) !== JSON.stringify(newConvs.map(c => c.id).sort());
    const unreadChanged = _conversations.some(c => {
      const nc = newConvs.find(n => n.id === c.id);
      return nc && nc.unread !== c.unread;
    });

    if (changed || unreadChanged) {
      _conversations = newConvs;
      if (_tab === 'messages') {
        _renderConvList();
        if (_activeConvId) {
          const stillExists = _conversations.find(c => c.id === _activeConvId);
          if (!stillExists) {
            if (_conversations.length) {
              _activeConvId = _conversations[0].id;
              _openConversation(_activeConvId);
            }
          } else {
            const conv = _conversations.find(c => c.id === _activeConvId);
            if (conv && conv.unread > 0) {
              const msgsData = await API.getConversationMessages(_activeConvId);
              _renderChat(conv, msgsData.messages || []);
              _renderSidePanel(conv);
              await API.markConversationRead(_activeConvId);
              conv.unread = 0;
              _renderConvList();
            }
          }
        }
      }
    }
  } catch {
    // polling silencioso
  }
}

function _updateUnreadBadge() {
  const total = _conversations.reduce((s, c) => s + (c.unread || 0), 0);
  $('sidebarMsgCount').textContent = total > 0 ? total : _conversations.length;
}

// ── EXPORTS (para esbuild IIFE) ────────────────────────────────────
window.loadMessages = loadMessages;
window.startMsgPolling = startMsgPolling;
window.stopMsgPolling = stopMsgPolling;
