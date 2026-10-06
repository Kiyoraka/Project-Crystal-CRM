/* Crystal CRM — tiny UI kit: escaped templates, icons, chips, score ring, toast, overlays, event delegation. */
(function (C) {
  'use strict';

  /* ---------- Escaped HTML templates ---------- */
  function Raw(s) { this.s = s; }
  const raw = s => new Raw(String(s));
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function fmt(v) {
    if (v == null || v === false) return '';
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(fmt).join('');
    return esc(v);
  }
  /** Tagged template: interpolated values are escaped unless wrapped in raw() or produced by html``. */
  function html(strings) {
    let out = '';
    for (let i = 0; i < strings.length; i++) {
      out += strings[i];
      if (i + 1 < arguments.length) out += fmt(arguments[i + 1]);
    }
    return new Raw(out);
  }
  function render(el, content) { el.innerHTML = fmt(content); }

  /* ---------- Icons (inline SVG paths, stroke style from the design) ---------- */
  const PATHS = {
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.7a2 2 0 0 1 1.7 2z',
    wa: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 1 1 21 11.5z',
    flame: 'M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 1-3s.5 2 2 2c0-3 2-5 2-9z',
    check: 'M20 6L9 17l-5-5',
    left: 'M15 18l-6-6 6-6',
    right: 'M9 18l6-6-6-6',
    down: 'M6 9l6 6 6-6',
    menu: 'M3 6h18M3 12h18M3 18h18',
    close: 'M18 6L6 18M6 6l12 12',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    play: 'M8 5v14l11-7z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    assign: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    dot: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    alert: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    plus: 'M12 5v14M5 12h14',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    arrow: 'M5 12h14M12 5l7 7-7 7',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    move: 'M5 12h14M13 6l6 6-6 6',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    wifiOff: 'M1 1l22 22M16.7 11.1A11 11 0 0 1 19 12.6M5 12.6a11 11 0 0 1 5.2-2.5M10.7 5A16 16 0 0 1 22.6 9M1.4 9a16 16 0 0 1 4.4-2.8M8.5 16.1a6 6 0 0 1 7 0M12 20h.01',
    dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
    leads: 'M4 6h16M4 12h16M4 18h10',
    pipeline: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z',
    analytics: 'M4 20V10M10 20V4M16 20v-6M22 20H2',
    settings: 'M4 7h8M16 7h4M4 17h4M12 17h8M12 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0M8 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    collapse: 'M15 18l-6-6 6-6M20 4v16',
    home: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
    task: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    compare: 'M8 7l-4 5 4 5M16 7l4 5-4 5'
  };
  const FILLED = { play: true };
  function icon(name, size, extra) {
    const d = PATHS[name] || PATHS.dot;
    const s = size || 18;
    const paint = FILLED[name] ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor" stroke-width="' + ((extra && extra.sw) || 2) + '" stroke-linecap="round" stroke-linejoin="round"';
    const fill = extra && extra.fill ? ' fill="' + extra.fill + '"' : '';
    return raw('<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' + paint + ' aria-hidden="true"><path d="' + d + '"' + fill + '></path></svg>');
  }

  /* ---------- Chips & small components ---------- */
  function tempChip(cls, big) {
    const c = cls === 'HOT' ? 'chip-hot' : cls === 'WARM' ? 'chip-warm' : 'chip-cold';
    return html`<span class="chip ${c}${big ? ' chip-lg' : ''}">${cls === 'HOT' ? icon('flame', 11, { fill: '#111', sw: 2.4 }) : ''}${cls}</span>`;
  }
  function statusChip(status, qualified) {
    const meta = C.data.STATUS_META[status] || { label: status };
    const mod = status === 'won' ? ' status-won' : status === 'lost' ? ' status-lost' : status === 'nurture' ? ' status-nurture' : '';
    return html`<span class="status${mod}">${meta.label}${qualified ? html`<span class="tick" title="Qualified">✓</span>` : ''}</span>`;
  }
  function avatar(initial, big) {
    if (!initial || initial === '—') return html`<span class="avatar avatar-none${big ? ' avatar-lg' : ''}">—</span>`;
    return html`<span class="avatar${big ? ' avatar-lg' : ''}">${initial}</span>`;
  }
  /** SVG ring: r=36 → circumference 226.2, as in the design. */
  function scoreRing(score, cls, size) {
    const sz = size || 88;
    const color = cls === 'HOT' ? '#FF7A1A' : cls === 'WARM' ? '#B45309' : '#6B7280';
    const dash = (Math.max(0, Math.min(100, score)) / 100 * 226.2).toFixed(1) + ' 226.2';
    return html`<svg width="${sz}" height="${sz}" viewBox="0 0 88 88"><circle cx="44" cy="44" r="36" fill="none" stroke="rgba(17,17,19,0.08)" stroke-width="8"></circle><circle cx="44" cy="44" r="36" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${dash}"></circle></svg>`;
  }
  function photoSlot(label, src) {
    const style = src ? raw(' style="background-image:url(\'' + esc(src) + '\')"') : '';
    return html`<div class="photo-slot${src ? ' has-img' : ''}"${style}><span>${icon('home', 12)}${label}</span></div>`;
  }
  function empty(title, actionHtml, iconName) {
    return html`<div class="empty"><div class="empty-icon">${icon(iconName || 'check', 24)}</div><strong>${title}</strong>${actionHtml || ''}</div>`;
  }

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(text) {
    let host = document.querySelector('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    render(host, html`<div class="toast">${icon('check', 16)}${text}</div>`);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { host.innerHTML = ''; }, 2600);
  }

  /* ---------- Overlays (dialog | sheet | slide) ---------- */
  /**
   * open({ kind, content, label, onMount(panel, close), onClose })
   * Returns close(). ESC and scrim click close. Focus moves into the panel.
   */
  function open(opts) {
    const kind = opts.kind || 'dialog';
    const wrap = document.createElement('div');
    wrap.className = 'overlay overlay-' + kind;
    const cls = kind === 'dialog' ? 'dialog' : kind === 'sheet' ? 'sheet' : 'slideover';
    render(wrap, html`<div class="scrim" data-close></div><div class="${cls}" role="dialog" aria-modal="true" aria-label="${opts.label || ''}">${opts.content}</div>`);
    const prevFocus = document.activeElement;
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';
    const panel = wrap.lastElementChild;
    let closed = false;
    function close() {
      if (closed) return; closed = true;
      wrap.remove();
      if (!document.querySelector('.overlay')) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    if (opts.onMount) opts.onMount(panel, close);
    const focusable = panel.querySelector('input, select, textarea, button:not([data-close])');
    if (focusable) setTimeout(() => focusable.focus(), 30);
    return close;
  }

  /* ---------- Event delegation ---------- */
  /**
   * bind(root, handlers): one listener per event type.
   * Elements declare data-act="name" (click), data-change="name", data-input="name", data-submit="name",
   * data-dragstart / data-dragover / data-drop / data-dragleave / data-dragend.
   * Handler signature: (el, event).
   */
  function bind(root, handlers) {
    const map = { click: 'act', change: 'change', input: 'input', submit: 'submit', keydown: 'key', dragstart: 'dragstart', dragend: 'dragend', dragover: 'dragover', dragleave: 'dragleave', drop: 'drop' };
    Object.keys(map).forEach(type => {
      root.addEventListener(type, e => {
        const attr = 'data-' + map[type];
        const el = e.target.closest('[' + attr + ']');
        if (!el || !root.contains(el)) return;
        const fn = handlers[el.getAttribute(attr)];
        if (fn) fn(el, e);
      });
    });
  }

  /* ---------- Misc ---------- */
  const param = name => new URLSearchParams(location.search).get(name);
  const MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
  function fmtDate(iso) {
    const d = new Date(iso + (iso.length <= 16 ? ':00+08:00' : ''));
    const p = n => String(n).padStart(2, '0');
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const g = t => Number((parts.find(x => x.type === t) || {}).value);
    return g('day') + ' ' + MONTHS[g('month') - 1] + ' ' + g('year') + ' ' + p(g('hour')) + ':' + p(g('minute'));
  }
  const digits = s => String(s || '').replace(/\D/g, '');

  C.ui = { html, raw, esc, render, icon, tempChip, statusChip, avatar, scoreRing, photoSlot, empty, toast, open, bind, param, fmtDate, digits };
})(window.Crystal = window.Crystal || {});
