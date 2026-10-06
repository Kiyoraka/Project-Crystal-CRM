/* Crystal CRM — app shell: auth guard, role model, sidebar (expanded / rail / drawer), top bar,
   notifications slide-over, user menu, offline banner. Pages call Crystal.shell.mount({...}). */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html, icon = U.icon;

  /* ---------- Role model ---------- */
  const ROLE_USER = { Owner: 'aiman', Sales: 'farid', Admin: 'hana' };
  function me() {
    const s = S.session();
    if (!s) return null;
    const u = S.user(ROLE_USER[s.role]) || { name: 'Aiman Hakim', initial: 'A', email: 'aiman@crystal.my' };
    return Object.assign({}, u, { id: ROLE_USER[s.role], role: s.role, first: u.name.split(' ')[0] });
  }

  /* ---------- Offline (PWA demo): ?offline=1 sticks for the tab, ?offline=0 clears ---------- */
  function offline() {
    const q = U.param('offline');
    try {
      if (q === '1') sessionStorage.setItem('crystal.offline', '1');
      if (q === '0') sessionStorage.removeItem('crystal.offline');
      if (sessionStorage.getItem('crystal.offline') === '1') return true;
    } catch (_) { if (q === '1') return true; }
    return navigator.onLine === false;
  }

  /* ---------- Derived lead fields (port of the design's deco()) ---------- */
  function deco(l, users) {
    const u = users.find(x => x.id === l.assigned);
    const fu = D.followUpLabel(l.nextFollowUp);
    const main = (l.renoTypes || []).slice().sort((a, b) => ((D.RENO_TYPES.find(r => r.id === b) || {}).pts || 0) - ((D.RENO_TYPES.find(r => r.id === a) || {}).pts || 0))[0];
    const dg = U.digits(l.phone);
    return Object.assign({}, l, {
      isHot: l.cls === 'HOT',
      isWon: l.status === 'won', isLost: l.status === 'lost', isOpen: l.status !== 'won' && l.status !== 'lost',
      statusLabel: (D.STATUS_META[l.status] || {}).label || l.status,
      assignedName: u ? u.name.split(' ')[0] : '—', assignedFull: u ? u.name : '—', assignedInitial: u ? u.initial : '—',
      fuText: fu.text, fuTone: fu.tone,
      budgetShort: D.shortOf(D.BUDGETS, l.budget), typeShort: D.TYPE_SHORT[main] || '—', timeShort: D.shortOf(D.TIMELINES, l.timeline),
      createdAgo: D.ago(l.createdAt), createdText: U.fmtDate(l.createdAt),
      tel: 'tel:+' + dg, wa: 'https://wa.me/' + dg,
      daysText: l.daysInStage === 0 ? 'hari ini' : l.daysInStage + ' hari',
      quotText: D.fmtRM(l.quotation),
      hotGlow: l.cls === 'HOT' && !l.contacted && l.status !== 'won' && l.status !== 'lost'
    });
  }
  /** All leads decorated + the slice this role may see (Sales: own leads only). */
  function leadsFor(m) {
    const users = S.users();
    const all = S.leads().map(l => deco(l, users));
    const visible = m.role === 'Sales' ? all.filter(l => l.assigned === m.id) : all;
    const open = visible.filter(l => l.isOpen);
    const hotUncontacted = open.filter(l => l.isHot && !l.contacted);
    const due = open.filter(l => l.fuTone === 'overdue' || l.fuTone === 'today').sort((a, b) => (a.nextFollowUp || '').localeCompare(b.nextFollowUp || ''));
    const unassigned = open.filter(l => !l.assigned);
    return { all, visible, open, hotUncontacted, due, unassigned, users };
  }
  function notifsFor(m) {
    return S.notifs().filter(n => m.role === 'Sales' ? (n.kind === 'assign' || n.kind === 'due') : n.kind !== 'assign');
  }

  /* ---------- Shared lead actions (every write goes through guard + activity row) ---------- */
  function makeActions(ctx) {
    const a = {
      guard() {
        if (ctx.offline) { U.toast('Anda di luar talian — tindakan tulis dimatikan'); return true; }
        return false;
      },
      update(id, patch, text) {
        if (a.guard()) return null;
        return S.updateLead(id, patch, text, ctx.me.first);
      },
      assign(id, uid) {
        const l = S.lead(id); if (!l) return;
        const from = l.assigned ? (S.user(l.assigned) || {}).name || '—' : '—';
        const to = uid ? S.user(uid) : null;
        if (a.update(id, { assigned: uid || null }, 'Assign ' + from + ' → ' + (to ? to.name : '—'))) {
          if (to && to.role === 'Sales') a.notify({ kind: 'assign', title: 'Lead diassign kepada anda', body: l.name + ' → ' + to.name.split(' ')[0], leadId: id });
          U.toast(to ? 'Diassign kepada ' + to.name.split(' ')[0] : 'Nyahassign');
        }
      },
      /** Won/Lost need a value/reason: pass extra, or the Won/Lost dialog opens. */
      changeStatus(id, to, extra, quiet) {
        const l = S.lead(id); if (!l || l.status === to) return false;
        if ((to === 'won' || to === 'lost') && !extra) { a.wonLostDialog(id, to); return false; }
        const patch = { status: to, daysInStage: 0, contacted: to === 'new' ? l.contacted : true };
        let text = 'Status ' + D.STATUS_META[l.status].label + ' → ' + D.STATUS_META[to].label;
        if (to === 'won') { patch.quotation = extra.value; text += ' · ' + D.fmtRM(extra.value); }
        if (to === 'lost') { patch.lostReason = extra.reason; text += ' · ' + extra.reason; }
        if (!a.update(id, patch, text)) return false;
        if (!quiet) U.toast('Status: ' + D.STATUS_META[to].label);
        return true;
      },
      notify(n) {
        const list = S.notifs();
        list.unshift(Object.assign({ id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1, time: 'baru', unread: true }, n));
        S.saveNotifs(list);
      },
      wonLostDialog(id, to, prefill) {
        if (a.guard()) return;
        const l = deco(S.lead(id), S.users());
        const won = to === 'won';
        const content = html`
          <div class="overlay-head"><h2>${won ? 'Tandakan Won' : 'Tandakan Lost'}</h2><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Tutup">${icon('close', 18)}</button></div>
          <div><strong>${l.name}</strong> <span class="muted">· ${l.budgetShort} · ${l.typeShort}</span></div>
          ${won
            ? html`<label class="field">Nilai sebut harga dimenangi (RM)<input class="input" type="number" min="0" step="100" inputmode="numeric" name="value" value="${prefill || l.quotation || ''}" placeholder="cth. 88000"></label>`
            : html`<label class="field">Sebab lost<select class="select" name="reason"><option value="">Pilih sebab…</option>${(S.lists().lost || D.LOST_REASONS).map(r => html`<option>${r}</option>`)}</select></label>`}
          <div class="field-error" data-err hidden>${icon('alert', 14)}${won ? 'Masukkan nilai sebut harga.' : 'Pilih sebab lost.'}</div>
          <div class="overlay-actions"><button class="btn btn-secondary" data-close>Batal</button><button class="btn ${won ? 'btn-won' : 'btn-lost-solid'}" data-confirm>${won ? 'Sahkan Won' : 'Sahkan Lost'}</button></div>`;
        U.open({
          kind: 'dialog', label: won ? 'Tandakan Won' : 'Tandakan Lost', content,
          onMount(panel, close) {
            const err = panel.querySelector('[data-err]');
            const submit = () => {
              if (won) {
                const v = Number(panel.querySelector('[name=value]').value);
                if (!v) { err.hidden = false; return; }
                if (a.changeStatus(id, 'won', { value: v })) close();
              } else {
                const r = panel.querySelector('[name=reason]').value;
                if (!r) { err.hidden = false; return; }
                if (a.changeStatus(id, 'lost', { reason: r })) close();
              }
            };
            panel.querySelector('[data-confirm]').addEventListener('click', submit);
            panel.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') submit(); });
            panel.addEventListener('input', () => { err.hidden = true; });
          }
        });
      },
      logCall(id) {
        if (ctx.offline) return;
        a.update(id, { contacted: true, lastContactedAt: 'now' }, 'Panggilan dibuat (tel:)');
      }
    };
    return a;
  }

  /* ---------- Shell rendering ---------- */
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html' },
    { id: 'leads', label: 'Leads', icon: 'leads', href: 'leads.html', badge: 'hot' },
    { id: 'pipeline', label: 'Pipeline', icon: 'pipeline', href: 'pipeline.html' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', href: 'analytics.html' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: 'settings.html', admin: 'notSales' },
    { id: 'users', label: 'Users', icon: 'users', href: 'users.html', admin: 'admin' }
  ];

  function sidebarHtml(ctx, active) {
    const items = NAV.filter(n => !n.admin || (n.admin === 'notSales' ? !ctx.isSales : ctx.isAdmin));
    const main = items.filter(n => !n.admin), admin = items.filter(n => n.admin);
    const item = n => html`<a class="sb-item${n.id === active ? ' is-on' : ''}" href="${n.href}" title="${n.label}" ${n.id === active ? U.raw('aria-current="page"') : ''}>${icon(n.icon, 20, { sw: 1.8 })}<span class="sb-label">${n.label}</span>${n.badge ? html`<span class="badge" data-badge="hot"${ctx.counts.hot ? '' : U.raw(' hidden')}>${ctx.counts.hot}</span>` : ''}</a>`;
    return html`
      <div class="sb-brand"><a href="dashboard.html" class="sb-brand-link"><span class="sb-mark"></span><span class="sb-brand-text">CRYSTAL CRM</span></a>
        <button type="button" class="sb-close" data-act="closeDrawer" aria-label="Tutup menu">${icon('close', 18)}</button></div>
      <nav class="stack" style="gap:4px" aria-label="Navigasi CRM">
        ${main.map(item)}
        ${admin.length ? html`<div class="sb-divider"></div><div class="sb-group">Admin</div>${admin.map(item)}` : ''}
      </nav>
      <div class="sb-spacer"></div>
      <div class="sb-user">${U.avatar(ctx.me.initial)}<div class="sb-user-text"><div class="sb-user-name">${ctx.me.first} · ${ctx.me.role}</div><div class="sb-user-role">${ctx.me.email}</div></div></div>
      <button type="button" class="sb-item sb-collapse" data-act="toggleRail" title="Kecilkan / besarkan">${icon('collapse', 20, { sw: 1.8 })}<span class="sb-label">Kecilkan</span></button>`;
  }

  function topbarHtml(ctx, title) {
    return html`
      <button type="button" class="tb-btn only-phone" data-act="openDrawer" aria-label="Buka menu">${icon('menu', 22)}</button>
      <div class="tb-title">${title}</div>
      <form class="tb-search hide-phone" data-submit="search" role="search">${icon('search', 16)}<input class="input" name="q" type="search" placeholder="Cari nama / telefon / Lead ID" aria-label="Cari lead"></form>
      <div class="tb-spacer"></div>
      <a class="tb-btn only-phone" href="leads.html?focus=search" aria-label="Cari">${icon('search', 20)}</a>
      <button type="button" class="tb-btn" data-act="openNotifs" aria-label="Notifikasi">${icon('bell', 20)}<span class="badge" data-badge="unread"${ctx.counts.unread ? '' : U.raw(' hidden')}>${ctx.counts.unread}</span></button>
      <div class="tb-menu-wrap">
        <button type="button" class="tb-user" data-act="toggleUserMenu" aria-haspopup="menu" aria-expanded="false">${U.avatar(ctx.me.initial)}<span class="tb-user-name">${ctx.me.first}</span>${icon('down', 14)}</button>
        <div class="tb-menu" role="menu" hidden>
          <div class="tb-menu-head"><strong>${ctx.me.name}</strong><span>${ctx.me.email} · ${ctx.me.role}</span></div>
          <button type="button" role="menuitem" data-act="resetDemo">${icon('refresh', 16)}Reset demo</button>
          <a role="menuitem" href="../index.html" target="_blank" rel="noopener">${icon('home', 16)}Laman utama (awam)</a>
          <button type="button" role="menuitem" class="danger" data-act="logout">${icon('logout', 16)}Log keluar</button>
        </div>
      </div>`;
  }

  function quickRowHtml(ctx) {
    return html`
      <a class="fchip" href="leads.html?chip=hot">${icon('flame', 14)}HOT <span class="count" data-badge="hotq">${ctx.counts.hot}</span></a>
      <a class="fchip" href="leads.html?chip=due">${icon('clock', 14)}Due <span class="count" data-badge="due">${ctx.counts.due}</span></a>
      ${ctx.isSales ? '' : html`<a class="fchip" href="../semak.html?source=manual" target="_blank" rel="noopener">${icon('plus', 14)}Lead</a>`}`;
  }

  const NOTIF_ICON = { hot: 'flame', assign: 'assign', due: 'clock', warm: 'dot', cold: 'dot' };
  function openNotifications(ctx) {
    const list = () => notifsFor(ctx.me);
    const body = () => {
      const rows = list();
      return html`
        <div class="notif-head"><h2>Notifikasi</h2><button class="link-btn" data-mark>Tanda semua</button><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Tutup">${icon('close', 18)}</button></div>
        <div class="notif-list">${rows.length ? rows.map(n => html`
          <button type="button" class="notif-row notif-${n.kind}${n.unread ? ' is-unread' : ''}" data-open="${n.id}">
            <span class="notif-icon">${icon(NOTIF_ICON[n.kind] || 'dot', 18)}</span>
            <span class="notif-text"><span class="notif-title">${n.title}</span><span class="notif-body">${n.body}</span><span class="notif-time">${n.time}${n.kind === 'hot' ? ' · Buka ›' : ''}</span></span>
            ${n.unread ? html`<span class="notif-dot" aria-label="Belum dibaca"></span>` : ''}
          </button>`) : U.empty('Tiada notifikasi', '', 'bell')}</div>`;
    };
    U.open({
      kind: 'slide', label: 'Notifikasi', content: body(),
      onMount(panel) {
        panel.addEventListener('click', e => {
          const mark = e.target.closest('[data-mark]');
          if (mark) {
            const ids = list().map(n => n.id);
            S.saveNotifs(S.notifs().map(n => ids.includes(n.id) ? Object.assign({}, n, { unread: false }) : n));
            U.render(panel, body());
            return;
          }
          const row = e.target.closest('[data-open]');
          if (row) {
            const id = Number(row.dataset.open);
            const n = S.notifs().find(x => x.id === id);
            S.saveNotifs(S.notifs().map(x => x.id === id ? Object.assign({}, x, { unread: false }) : x));
            if (n) location.href = 'lead.html?id=' + n.leadId;
          }
        });
      }
    });
  }

  function counts(ctx) {
    const L = leadsFor(ctx.me);
    return { hot: L.hotUncontacted.length, due: L.due.length, unread: notifsFor(ctx.me).filter(n => n.unread).length };
  }
  function patchCounts(ctx) {
    ctx.counts = counts(ctx);
    const set = (sel, v) => document.querySelectorAll('[data-badge="' + sel + '"]').forEach(el => { el.textContent = v; if (sel === 'hot' || sel === 'unread') el.hidden = !v; });
    set('hot', ctx.counts.hot); set('hotq', ctx.counts.hot); set('due', ctx.counts.due); set('unread', ctx.counts.unread);
  }

  /**
   * mount({ screen, title, access: 'all'|'notSales'|'admin', render(view, ctx), bind: handlers })
   * Builds the shell, guards the session, re-renders the page on every store change.
   */
  function mount(opts) {
    const m = me();
    if (!m) { location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return null; }
    if ((opts.access === 'notSales' && m.role === 'Sales') || (opts.access === 'admin' && m.role !== 'Admin')) { location.replace('dashboard.html'); return null; }

    const ctx = {
      me: m, role: m.role, isSales: m.role === 'Sales', isAdmin: m.role === 'Admin', isOwner: m.role === 'Owner',
      canAssign: m.role !== 'Sales', canExport: m.role !== 'Sales', offline: offline(),
      data: () => leadsFor(m), notifs: () => notifsFor(m)
    };
    ctx.actions = makeActions(ctx);
    ctx.counts = counts(ctx);

    let rail = false;
    try { rail = localStorage.getItem('crystal.sidebar') === 'rail'; } catch (_) { /* ignore */ }
    document.body.classList.add('crm-body');
    document.body.classList.toggle('sb-rail', rail);
    document.body.classList.toggle('offline', ctx.offline);

    const shell = document.createElement('div');
    shell.className = 'crm';
    U.render(shell, html`
      <aside class="sidebar" id="sidebar" aria-label="Menu utama">${sidebarHtml(ctx, opts.screen === 'lead' ? 'leads' : opts.screen)}</aside>
      <div class="sb-scrim" data-act="closeDrawer"></div>
      <div class="crm-main">
        ${ctx.offline ? html`<div class="offline-bar" role="status">${icon('wifiOff', 16)}<span><strong>Anda di luar talian</strong> — paparan terakhir 10:41 · tindakan tulis dimatikan</span></div>` : ''}
        <header class="topbar">${topbarHtml(ctx, opts.title)}</header>
        <div class="quick-row only-phone">${quickRowHtml(ctx)}</div>
        <main class="crm-view" id="view" tabindex="-1"></main>
      </div>`);
    document.body.prepend(shell);
    const view = shell.querySelector('#view');

    const menuBtn = shell.querySelector('[data-act="toggleUserMenu"]');
    const menu = shell.querySelector('.tb-menu');
    function setMenu(open) { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('.tb-menu-wrap')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); document.body.classList.remove('drawer-open'); } });

    U.bind(shell.querySelector('.sidebar').parentNode, {
      openDrawer: () => document.body.classList.add('drawer-open'),
      closeDrawer: (el, e) => { if (e) e.preventDefault(); document.body.classList.remove('drawer-open'); },
      toggleRail: () => {
        rail = !document.body.classList.contains('sb-rail');
        document.body.classList.toggle('sb-rail', rail);
        try { localStorage.setItem('crystal.sidebar', rail ? 'rail' : 'expanded'); } catch (_) { /* ignore */ }
      },
      openNotifs: () => openNotifications(ctx),
      toggleUserMenu: () => setMenu(menu.hidden),
      search: (el, e) => { e.preventDefault(); const q = el.q.value.trim(); location.href = 'leads.html' + (q ? '?q=' + encodeURIComponent(q) : ''); },
      resetDemo: () => { setMenu(false); S.resetDemo(); U.toast('Demo dipulihkan ke data asal'); },
      logout: () => { S.clearSession(); location.href = 'login.html'; }
    });
    if (opts.bind) U.bind(view, opts.bind);

    let queued = false;
    ctx.refresh = function () {
      if (queued) return; queued = true;
      // microtask (not rAF) so background tabs still refresh after a cross-tab storage event
      Promise.resolve().then(() => { queued = false; patchCounts(ctx); opts.render(view, ctx); });
    };
    S.onChange(ctx.refresh);
    opts.render(view, ctx);
    return ctx;
  }

  C.crm = { deco, leadsFor, notifsFor, me, ROLE_USER };
  C.shell = { mount };
})(window.Crystal);
