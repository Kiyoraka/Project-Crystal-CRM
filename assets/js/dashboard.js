/* Crystal CRM — Dashboard (Owner/Admin "Dashboard", Sales "Hari saya"). */
(function (C) {
  'use strict';
  const D = C.data, U = C.ui, html = U.html, icon = U.icon;
  let ctx = null;
  let range = '30 hari';

  const head = title => html`
    <div class="page-head">
      <h1>${title}</h1>
      <label class="actions small muted">Tarikh
        <select class="select select-sm" data-change="range" aria-label="Julat tarikh">
          ${['7 hari', '30 hari', '90 hari'].map(r => html`<option${r === range ? U.raw(' selected') : ''}>${r}</option>`)}
        </select>
      </label>
    </div>`;

  function hotRow(l) {
    return html`
      <div class="row-item dash-hot" data-act="open" data-id="${l.id}" role="link" tabindex="0">
        <div class="row-main">
          <div class="row-title">${U.tempChip('HOT')}<span>${l.name}</span><span class="muted small">· ${l.state} · ${l.budgetShort}</span><span class="dash-score num">${l.score}</span></div>
          <div class="row-sub">${l.typeShort} · ${l.timeShort} · ${l.createdAgo}</div>
          <div class="row-sub">Sales: ${l.assignedName}</div>
        </div>
        <div class="row-actions">
          <a class="btn btn-primary btn-sm" href="${l.tel}" data-act="call" data-id="${l.id}">${icon('phone', 14)}Call</a>
          <a class="btn btn-secondary btn-icon btn-sm" href="${l.wa}" target="_blank" rel="noopener" data-act="stop" aria-label="WhatsApp ${l.name}">${icon('wa', 16)}</a>
        </div>
      </div>`;
  }
  function dueRow(l, withCall) {
    const tone = l.fuTone === 'overdue' ? 't-overdue' : 't-today';
    return html`
      <div class="row-item" data-act="open" data-id="${l.id}" role="link" tabindex="0">
        ${l.fuTone === 'overdue' ? html`<span class="t-overdue">${icon('alert', 16)}</span>` : html`<span class="t-today">${icon('clock', 16)}</span>`}
        <div class="row-main">
          <div class="row-title"><span class="${tone} num">${l.fuText.replace('Hari ini ', '')}</span><span class="muted small">${l.followUpPurpose || 'Call'}</span></div>
          <div class="row-sub">${l.name}</div>
        </div>
        ${withCall ? html`<a class="btn btn-secondary btn-icon btn-sm" href="${l.tel}" data-act="call" data-id="${l.id}" aria-label="Call ${l.name}">${icon('phone', 16)}</a>` : U.avatar(l.assignedInitial)}
      </div>`;
  }

  function ownerView(L) {
    const v = L.visible, D2 = D;
    const won = v.filter(l => l.isWon);
    const wonValue = won.reduce((a, l) => a + (l.quotation || 0), 0);
    const conv = v.length ? Math.round(won.length / v.length * 1000) / 10 : 0;
    const kpis = [
      { label: 'Total', value: v.length, sub: v.filter(l => l.daysInStage === 0 && l.status === 'new').length + ' baharu hari ini' },
      { label: 'New', value: v.filter(l => l.status === 'new').length, sub: 'belum diproses' },
      { label: 'HOT', value: v.filter(l => l.isHot).length, sub: L.hotUncontacted.length + ' belum dihubungi', cls: 't-hot', hot: true },
      { label: 'WARM', value: v.filter(l => l.cls === 'WARM').length, sub: 'skor 40–69', cls: 't-warm' },
      { label: 'COLD', value: v.filter(l => l.cls === 'COLD').length, sub: 'skor ≤ 39', cls: 't-cold' },
      { label: 'Won', value: D2.fmtRM(wonValue), sub: won.length + ' projek', cls: 't-won' },
      { label: 'Conversion', value: conv + ' %', sub: 'Lead → Won' }
    ];
    const idx = st => D.STAGE_ORDER.indexOf(st);
    const steps = [['Lead', v.length], ['Contacted', v.filter(l => idx(l.status) >= 1 || l.status === 'nurture').length], ['Consult', v.filter(l => idx(l.status) >= 2).length], ['Site', v.filter(l => idx(l.status) >= 3).length], ['Quotation', v.filter(l => idx(l.status) >= 4).length], ['Won', won.length]];
    const hot = L.hotUncontacted.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const dueToday = L.due.filter(l => l.fuTone === 'today').length, overdue = L.due.filter(l => l.fuTone === 'overdue').length;
    return html`
      <div class="kpis">${kpis.map(k => html`
        <div class="glass kpi${k.hot ? ' kpi-hot' : ''}">
          <div class="kpi-label ${k.cls || ''}">${k.hot ? icon('flame', 13) : ''}${k.label}</div>
          <div class="kpi-value ${k.cls || ''}">${k.value}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`)}</div>
      <div class="cols-2">
        <section class="glass panel">
          <div class="panel-head"><span>${icon('flame', 16)} HOT menunggu <span class="muted small" style="font-weight:400">· belum dihubungi, paling lama dahulu</span></span></div>
          ${hot.length ? html`<div class="rows">${hot.map(hotRow)}</div>` : U.empty('Tiada lead HOT hari ini', html`<a class="btn btn-secondary btn-sm" href="leads.html">Lihat semua lead</a>`, 'flame')}
          <a class="panel-link" href="leads.html?chip=hot">Lihat semua HOT ›</a>
        </section>
        <div class="stack">
          <section class="glass panel">
            <div class="panel-head"><span>${icon('clock', 16)} Due hari ini (${dueToday}) <span class="t-overdue small">· Tertunggak (${overdue})</span></span></div>
            ${L.due.length ? html`<div class="rows">${L.due.map(l => dueRow(l, false))}</div>` : html`<p class="muted">Tiada follow-up hari ini.</p>`}
            <a class="panel-link" href="leads.html?chip=due">Lihat semua ›</a>
          </section>
          <section class="glass panel">
            <div class="panel-head"><span>Funnel</span></div>
            <div class="funnel">${steps.map(([label, n], i) => html`
              <div class="funnel-row">
                <span class="funnel-label">${label}</span>
                <div class="funnel-track"><div class="funnel-bar${i === 5 ? ' is-won' : ''}" style="width:${v.length ? Math.max(2, n / v.length * 100) : 0}%;opacity:${i === 0 || i === 5 ? 1 : (0.85 - i * 0.13).toFixed(2)}"></div></div>
                <span class="funnel-num num">${i === 5 ? n + ' (' + conv + ' %)' : n}</span>
              </div>`)}</div>
          </section>
        </div>
      </div>`;
  }

  function salesView(L) {
    const mine = L.visible;
    const counts = [['New', mine.filter(l => l.status === 'new').length], ['Contacted', mine.filter(l => l.status === 'contacted').length], ['Consult / Site', mine.filter(l => l.status === 'consult' || l.status === 'site').length], ['Quot / Nego', mine.filter(l => l.status === 'quot' || l.status === 'nego').length, 't-warm'], ['Won', mine.filter(l => l.isWon).length, 't-won']];
    const fresh = mine.filter(l => l.daysInStage <= 1 && l.isOpen);
    const dueToday = L.due.filter(l => l.fuTone === 'today').length, overdue = L.due.filter(l => l.fuTone === 'overdue').length;
    return html`
      <div class="kpis">${counts.map(([label, value, cls]) => html`<div class="glass kpi"><div class="kpi-label">${label}</div><div class="kpi-value ${cls || ''}">${value}</div></div>`)}</div>
      <div class="cols-2">
        <section class="glass panel">
          <div class="panel-head"><span>${icon('clock', 16)} Due hari ini saya (${dueToday}) <span class="t-overdue small">· Tertunggak (${overdue})</span></span></div>
          ${L.due.length ? html`<div class="rows">${L.due.map(l => dueRow(l, true))}</div>` : html`<p class="muted">Tiada follow-up hari ini.</p>`}
        </section>
        <section class="glass panel">
          <div class="panel-head"><span>${icon('assign', 16)} Assignment baharu</span></div>
          ${fresh.length ? html`<div class="rows">${fresh.map(l => html`
            <div class="row-item" data-act="open" data-id="${l.id}" role="link" tabindex="0">
              <div class="row-main"><div class="row-title">${U.tempChip(l.cls)}<span>${l.name}</span><span class="muted small">· ${l.state} · ${l.budgetShort}</span></div><div class="row-sub">${l.createdAgo}</div></div>
              <span class="faint">${icon('right', 16)}</span>
            </div>`)}</div>` : html`<p class="muted">Tiada assignment baharu.</p>`}
        </section>
      </div>`;
  }

  function render(view, c) {
    const L = c.data();
    U.render(view, html`${head(c.isSales ? 'Hari saya' : 'Dashboard')}${c.isSales ? salesView(L) : ownerView(L)}`);
  }

  const me = C.crm.me();
  ctx = C.shell.mount({
    screen: 'dashboard', title: me && me.role === 'Sales' ? 'Hari saya' : 'Dashboard', render,
    bind: {
      range: el => { range = el.value; U.toast('Julat: ' + range); },
      open: (el, e) => { if (e.target.closest('a')) return; location.href = 'lead.html?id=' + el.dataset.id; },
      call: el => ctx.actions.logCall(Number(el.dataset.id)),
      stop: () => {}
    }
  });
  // Keyboard activation for row links
  document.addEventListener('keydown', e => {
    const row = e.target.closest && e.target.closest('[data-act="open"][role="link"]');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.href = 'lead.html?id=' + row.dataset.id; }
  });
})(window.Crystal);
