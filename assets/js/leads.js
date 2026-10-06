/* Crystal CRM — Leads work queue: saved chips, filters, search, table (desktop) / cards (phone), bulk bar, CSV. */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html, icon = U.icon;
  let ctx = null;
  const f = { q: U.param('q') || '', chip: U.param('chip') || null, cls: '', status: '', source: '', state: '' };
  let selected = new Set();

  function filtered(L) {
    const qd = f.q.trim().toLowerCase(), qDigits = U.digits(f.q);
    let rows = L.visible.filter(l => !qd || l.name.toLowerCase().includes(qd) || l.leadId.toLowerCase().includes(qd) || (qDigits.length >= 3 && U.digits(l.phone).includes(qDigits)));
    if (f.cls) rows = rows.filter(l => l.cls === f.cls);
    if (f.status) rows = rows.filter(l => l.status === f.status);
    if (f.source) rows = rows.filter(l => l.source === f.source);
    if (f.state) rows = rows.filter(l => l.state === f.state);
    if (f.chip === 'hot') rows = rows.filter(l => l.isHot && !l.contacted && l.isOpen);
    if (f.chip === 'due') rows = rows.filter(l => l.fuTone === 'overdue' || l.fuTone === 'today');
    if (f.chip === 'unassigned') rows = rows.filter(l => !l.assigned && l.isOpen);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  }
  const hasFilters = () => !!(f.cls || f.status || f.source || f.state || f.chip || f.q);

  const sel = (name, label, opts, value) => html`
    <select class="select select-sm" data-change="filter" data-key="${name}" aria-label="${label}">
      <option value="">${label}</option>
      ${opts.map(o => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return html`<option value="${v}"${v === value ? U.raw(' selected') : ''}>${t}</option>`; })}
    </select>`;
  const fuCell = l => html`<span class="${l.fuTone === 'overdue' ? 't-overdue' : l.fuTone === 'today' ? 't-today' : l.fuTone === 'none' ? 't-none' : ''}">${l.fuText}</span>`;

  function tableView(rows) {
    const all = rows.length > 0 && rows.every(r => selected.has(r.id));
    return html`
      <div class="glass tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th class="tbl-check">${ctx.canAssign ? html`<input type="checkbox" data-change="toggleAll" aria-label="Pilih semua"${all ? U.raw(' checked') : ''}>` : ''}</th>
            <th>Kelas</th><th>Nama</th><th>Telefon</th><th>Negeri</th><th>Jenis</th><th>Bajet</th><th class="num">Skor</th><th>Status</th><th>Sumber</th><th>Sales</th><th>Next f/u</th>
          </tr></thead>
          <tbody>
            ${rows.length ? rows.map(l => html`
              <tr data-act="open" data-id="${l.id}" class="${l.hotGlow ? 'is-hot' : ''}${selected.has(l.id) ? ' is-selected' : ''}">
                <td class="tbl-check" data-act="noop">${ctx.canAssign ? html`<input type="checkbox" data-change="toggleRow" data-id="${l.id}" aria-label="Pilih ${l.name}"${selected.has(l.id) ? U.raw(' checked') : ''}>` : ''}</td>
                <td>${U.tempChip(l.cls)}</td>
                <td class="tbl-name"><a href="lead.html?id=${l.id}">${l.name}</a>${l.qualified ? html`<span class="t-won" title="Qualified"> ✓</span>` : ''}</td>
                <td class="tbl-phone"><span class="num">${l.phone}</span>
                  <a class="tbl-ico" href="${l.tel}" data-act="call" data-id="${l.id}" aria-label="Call ${l.name}">${icon('phone', 14)}</a>
                  <a class="tbl-ico" href="${l.wa}" target="_blank" rel="noopener" data-act="noop" aria-label="WhatsApp ${l.name}">${icon('wa', 14)}</a></td>
                <td>${l.state}</td><td>${l.typeShort}</td><td>${l.budgetShort}</td><td class="num tbl-score">${l.score}</td>
                <td>${U.statusChip(l.status)}</td><td>${l.source}</td><td>${U.avatar(l.assignedInitial)}</td><td class="num">${fuCell(l)}</td>
              </tr>`) : html`<tr><td colspan="12">${U.empty('Tiada lead sepadan.', html`<button class="btn btn-secondary btn-sm" data-act="clearFilters">Padam penapis</button>`, 'search')}</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  function cardsView(rows) {
    return html`
      <div class="lead-cards">
        ${rows.length ? rows.map(l => html`
          <article class="glass lead-card${l.hotGlow ? ' is-hot' : ''}" data-act="open" data-id="${l.id}">
            <div class="lead-card-top">${U.tempChip(l.cls)}<a class="lead-card-name" href="lead.html?id=${l.id}">${l.name}</a><span class="lead-card-score num">${l.score}</span></div>
            <div class="row-sub">${l.state} · ${l.typeShort} · ${l.budgetShort}</div>
            <div class="row-sub">${U.statusChip(l.status, l.qualified)} · ${l.source} · ${l.createdAgo}</div>
            <div class="lead-card-foot">
              <span class="row-sub">Sales: ${l.assignedName}${l.nextFollowUp ? html` · Next: ${fuCell(l)}` : ''}</span>
              <span class="row-actions">
                <a class="btn btn-secondary btn-icon btn-sm" href="${l.tel}" data-act="call" data-id="${l.id}" aria-label="Call ${l.name}">${icon('phone', 16)}</a>
                <a class="btn btn-secondary btn-icon btn-sm" href="${l.wa}" target="_blank" rel="noopener" data-act="noop" aria-label="WhatsApp ${l.name}">${icon('wa', 16)}</a>
              </span>
            </div>
          </article>`) : U.empty('Tiada lead sepadan.', html`<button class="btn btn-secondary btn-sm" data-act="clearFilters">Padam penapis</button>`, 'search')}
      </div>`;
  }

  function bulkBar(rows) {
    const picked = rows.filter(r => selected.has(r.id));
    if (!ctx.canAssign || !picked.length) return '';
    const sales = S.users().filter(u => u.role === 'Sales' && u.active);
    return html`
      <div class="glass bulk-bar" role="region" aria-label="Tindakan pukal">
        <strong>${picked.length} dipilih</strong><span class="muted">→</span>
        <select class="select select-sm" data-change="bulkAssign" aria-label="Assign kepada"><option value="">Assign kepada…</option>${sales.map(u => html`<option value="${u.id}">${u.name}</option>`)}<option value="__none">Nyahassign</option></select>
        <select class="select select-sm" data-change="bulkStatus" aria-label="Tukar status"><option value="">Tukar status…</option><option value="contacted">Contacted</option><option value="nurture">Nurturing</option><option value="lost">Lost</option></select>
        <button class="btn btn-ghost btn-sm" data-act="clearSel">Batal</button>
      </div>`;
  }

  function render(view, c) {
    ctx = c; // first render runs inside mount(), before it returns
    const L = c.data();
    const rows = filtered(L);
    selected = new Set([...selected].filter(id => rows.some(r => r.id === id)));
    const chips = [['hot', 'HOT belum dihubungi', L.hotUncontacted.length], ['due', 'Due hari ini', L.due.length], ['unassigned', 'Belum assign', L.unassigned.length]];
    const focus = U.keepFocus(view);
    U.render(view, html`
      <div class="page-head">
        <h1 class="hide-phone">Leads</h1>
        <form class="leads-search only-phone" data-submit="noop" role="search">${icon('search', 16)}<input class="input" type="search" data-input="q" data-focus-key="q" value="${f.q}" placeholder="Cari nama / telefon / Lead ID" aria-label="Cari lead"></form>
        ${c.canExport ? html`<div class="actions">
          <a class="btn btn-secondary btn-sm" href="../semak.html?source=manual" target="_blank" rel="noopener">${icon('plus', 16)}<span class="hide-phone">Lead manual</span></a>
          <button class="btn btn-dark btn-sm" data-act="csv">${icon('download', 16)}CSV</button>
        </div>` : ''}
      </div>
      <div class="chip-row">
        ${chips.map(([id, label, n]) => html`<button type="button" class="fchip${f.chip === id ? ' is-on' : ''}" data-act="chip" data-chip="${id}" aria-pressed="${f.chip === id ? 'true' : 'false'}">${label}<span class="count">${n}</span></button>`)}
      </div>
      <div class="filter-row hide-phone">
        <span class="leads-q">${icon('search', 14)}<input class="input" type="search" data-input="q" data-focus-key="qd" value="${f.q}" placeholder="Cari nama / telefon / Lead ID" aria-label="Cari lead"></span>
        ${sel('cls', 'Kelas', ['HOT', 'WARM', 'COLD'], f.cls)}
        ${sel('status', 'Status', [...D.STAGES, D.NURTURE].map(s => [s.id, s.label]), f.status)}
        ${sel('source', 'Sumber', S.lists().sources || D.SOURCES, f.source)}
        ${sel('state', 'Negeri', S.lists().locations || D.STATES.slice(0, 7), f.state)}
        ${hasFilters() ? html`<button class="link-btn" data-act="clearFilters">Padam penapis</button>` : ''}
        <span class="muted small leads-count num">${rows.length ? '1–' + rows.length + ' / ' + rows.length : '0 / 0'}</span>
      </div>
      <div class="hide-phone">${tableView(rows)}</div>
      <div class="only-phone">${cardsView(rows)}<p class="muted small center-note">${rows.length} lead</p></div>
      ${bulkBar(rows)}`);
    focus();
  }

  function csv(rows) {
    const head = ['Lead ID', 'Nama', 'Telefon', 'Emel', 'Negeri', 'Jenis hartanah', 'Jenis renovation', 'Bajet', 'Skor', 'Kelas', 'Status', 'Sumber', 'Sales', 'Next follow-up', 'Sebut harga', 'Dicipta'];
    const body = rows.map(l => [l.leadId, l.name, l.phone, l.email, l.state, l.propertyType, l.renoTypes.map(id => D.labelOf(D.RENO_TYPES, id)).join('; '), D.labelOf(D.BUDGETS, l.budget), l.score, l.cls, l.statusLabel, l.source, l.assignedName, l.nextFollowUp || '', l.quotation || '', l.createdAt]
      .map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    const blob = new Blob(['﻿' + [head.join(','), ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'crystal-leads-2026-10-04.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    U.toast('CSV dimuat turun · ' + rows.length + ' lead');
  }

  const rerender = () => ctx.refresh();
  ctx = C.shell.mount({
    screen: 'leads', title: 'Leads', render,
    bind: {
      open: (el, e) => { if (e.target.closest('a, input, button, select')) return; location.href = 'lead.html?id=' + el.dataset.id; },
      noop: (el, e) => { if (e && e.type === 'submit') e.preventDefault(); },
      call: el => ctx.actions.logCall(Number(el.dataset.id)),
      chip: el => { f.chip = f.chip === el.dataset.chip ? null : el.dataset.chip; rerender(); },
      filter: el => { f[el.dataset.key] = el.value; rerender(); },
      q: el => { f.q = el.value; rerender(); },
      clearFilters: () => { Object.assign(f, { q: '', chip: null, cls: '', status: '', source: '', state: '' }); rerender(); },
      toggleRow: el => { const id = Number(el.dataset.id); if (el.checked) selected.add(id); else selected.delete(id); rerender(); },
      toggleAll: el => { const rows = filtered(ctx.data()); selected = el.checked ? new Set(rows.map(r => r.id)) : new Set(); rerender(); },
      clearSel: () => { selected.clear(); rerender(); },
      bulkAssign: el => {
        if (!el.value || ctx.actions.guard()) return;
        const uid = el.value === '__none' ? null : el.value;
        [...selected].forEach(id => ctx.actions.assign(id, uid));
        selected.clear(); rerender();
      },
      bulkStatus: el => {
        const to = el.value; if (!to || ctx.actions.guard()) return;
        const n = selected.size;
        [...selected].forEach(id => ctx.actions.changeStatus(id, to, to === 'lost' ? { reason: 'Lain-lain' } : null, true));
        selected.clear(); U.toast(n + ' lead dikemas kini'); rerender();
      },
      csv: () => csv(filtered(ctx.data()))
    }
  });
  if (ctx && U.param('focus') === 'search') {
    const input = document.querySelector('.leads-search input');
    if (input) input.focus();
  }
})(window.Crystal);
