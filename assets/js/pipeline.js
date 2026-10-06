/* Crystal CRM — Pipeline: desktop kanban (HTML5 drag-and-drop), phone stage tabs + "Move to" bottom sheet. */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html, icon = U.icon;
  let ctx = null;
  const ui = { sales: '', cls: '', nurture: false, stage: 'new', dragId: null };

  function cards(L) {
    let list = L.visible;
    if (ui.sales) list = list.filter(l => l.assigned === ui.sales);
    if (ui.cls) list = list.filter(l => l.cls === ui.cls);
    return list;
  }
  function column(st, list) {
    const items = list.filter(l => l.status === st.id).sort((a, b) => b.score - a.score);
    const total = items.reduce((a, l) => a + (l.quotation || 0), 0);
    return { st, items, count: items.length, total: total ? D.fmtRM(total) : 'RM —' };
  }
  const card = (l, phone) => html`
    <article class="glass kb-card${l.hotGlow ? ' is-hot' : ''}" ${phone ? '' : U.raw('draggable="true"')} data-dragstart="drag" data-dragend="dragEnd" data-id="${l.id}" data-act="openCard" aria-label="${l.name}, ${l.cls}, skor ${l.score}">
      <div class="kb-card-top">${U.tempChip(l.cls)}<span class="kb-score num">${l.score}</span></div>
      <a class="kb-name" href="lead.html?id=${l.id}">${l.name}${l.qualified ? html`<span class="t-won" title="Qualified"> ✓</span>` : ''}</a>
      <div class="row-sub">${l.budgetShort}${l.quotation ? ' · ' + l.quotText : ''} · ${l.typeShort}</div>
      <div class="kb-card-foot"><span class="row-sub">${icon('clock', 12)} ${l.daysText}</span>${U.avatar(l.assignedInitial)}</div>
      ${phone ? html`<div class="kb-card-actions"><button class="btn btn-secondary btn-sm" data-act="moveTo" data-id="${l.id}">${icon('move', 14)}Move to ▾</button><a class="btn btn-secondary btn-icon btn-sm" href="${l.tel}" data-act="call" data-id="${l.id}" aria-label="Call ${l.name}">${icon('phone', 16)}</a></div>` : ''}
    </article>`;

  function render(view, c) {
    ctx = c;
    const L = c.data();
    const list = cards(L);
    const stages = D.STAGES.concat(ui.nurture ? [D.NURTURE] : []);
    const cols = stages.map(st => column(st, list));
    const nurtureCount = list.filter(l => l.status === 'nurture').length;
    const allStages = D.STAGES.concat([D.NURTURE]);
    const active = column(allStages.find(s => s.id === ui.stage) || D.STAGES[0], list);
    const sales = S.users().filter(u => u.role === 'Sales');
    U.render(view, html`
      <div class="page-head">
        <h1 class="hide-phone">Pipeline</h1>
        <div class="actions">
          ${c.isSales ? '' : html`<select class="select select-sm" data-change="filter" data-key="sales" aria-label="Sales"><option value="">Sales</option>${sales.map(u => html`<option value="${u.id}"${u.id === ui.sales ? U.raw(' selected') : ''}>${u.name}</option>`)}</select>`}
          <select class="select select-sm" data-change="filter" data-key="cls" aria-label="Kelas"><option value="">Kelas</option>${['HOT', 'WARM', 'COLD'].map(k => html`<option${k === ui.cls ? U.raw(' selected') : ''}>${k}</option>`)}</select>
          <button class="fchip hide-phone${ui.nurture ? ' is-on' : ''}" data-act="nurture" aria-pressed="${ui.nurture ? 'true' : 'false'}">Nurturing ${ui.nurture ? '▾' : '▸'} <span class="count">${nurtureCount}</span></button>
        </div>
      </div>

      <div class="kanban hide-phone" role="list">
        ${cols.map(col => html`
          <section class="kb-col${col.st.id === 'won' ? ' is-won' : col.st.id === 'lost' ? ' is-lost' : col.st.id === 'nurture' ? ' is-nurture' : ''}" role="listitem" aria-label="${col.st.label}"
            data-dragover="over" data-dragleave="leave" data-drop="drop" data-stage="${col.st.id}">
            <header class="kb-head"><span class="kb-title">${col.st.label}</span><span class="kb-count">${col.count}</span><div class="kb-total num">${col.total}</div></header>
            <div class="kb-list">${col.items.length ? col.items.map(l => card(l, false)) : html`<div class="kb-empty">Seret kad ke sini</div>`}</div>
          </section>`)}
      </div>
      <p class="muted small hide-phone kb-hint">${icon('move', 14)} Seret kad ke lajur lain untuk tukar status · Won / Lost akan minta nilai atau sebab.</p>

      <div class="only-phone">
        <div class="stage-tabs" role="tablist">
          ${allStages.map(s => html`<button class="fchip${ui.stage === s.id ? ' is-on' : ''}" role="tab" aria-selected="${ui.stage === s.id ? 'true' : 'false'}" data-act="stage" data-stage="${s.id}">${s.label} <span class="count">${list.filter(l => l.status === s.id).length}</span></button>`)}
        </div>
        <div class="stage-sum"><strong>${active.st.label}</strong> · ${active.count} lead · ${active.total}</div>
        <div class="lead-cards">${active.items.length ? active.items.map(l => card(l, true)) : U.empty('Tiada lead di peringkat ini', '', 'pipeline')}</div>
      </div>`);
  }

  function moveSheet(id) {
    const l = C.crm.deco(S.lead(id), S.users());
    const opts = D.STAGES.concat([D.NURTURE]);
    U.open({
      kind: 'sheet', label: 'Move to',
      content: html`
        <div class="overlay-head"><h2>Move to</h2><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Tutup">${icon('close', 18)}</button></div>
        <div class="muted">${l.name} · ${l.budgetShort} · ${l.typeShort}</div>
        <div class="move-list">${opts.map(s => html`
          <button class="move-opt${s.id === l.status ? ' is-current' : ''}" data-stage="${s.id}"${s.id === l.status ? U.raw(' disabled') : ''}>
            <span class="move-dot move-${s.id}"></span><span class="move-label">${s.label}</span>
            ${s.id === l.status ? html`<span class="muted small">semasa</span>` : s.id === 'won' ? html`<span class="muted small">nilai</span>` : s.id === 'lost' ? html`<span class="muted small">sebab</span>` : icon('right', 16)}
          </button>`)}</div>`,
      onMount(panel, close) {
        panel.addEventListener('click', e => {
          const b = e.target.closest('[data-stage]');
          if (!b || b.disabled) return;
          close();
          ctx.actions.changeStatus(id, b.dataset.stage);
        });
      }
    });
  }

  function clearOver() { document.querySelectorAll('.kb-col.is-over').forEach(c => c.classList.remove('is-over')); }
  ctx = C.shell.mount({
    screen: 'pipeline', title: 'Pipeline', render,
    bind: {
      filter: el => { ui[el.dataset.key] = el.value; ctx.refresh(); },
      nurture: () => { ui.nurture = !ui.nurture; ctx.refresh(); },
      stage: el => { ui.stage = el.dataset.stage; ctx.refresh(); },
      openCard: (el, e) => { if (e.target.closest('a, button')) return; location.href = 'lead.html?id=' + el.dataset.id; },
      moveTo: el => moveSheet(Number(el.dataset.id)),
      call: el => ctx.actions.logCall(Number(el.dataset.id)),
      drag: (el, e) => {
        ui.dragId = Number(el.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(ui.dragId)); } catch (_) { /* IE-style */ }
        requestAnimationFrame(() => el.classList.add('is-dragging'));
      },
      dragEnd: el => { el.classList.remove('is-dragging'); clearOver(); ui.dragId = null; },
      over: (el, e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (!el.classList.contains('is-over')) { clearOver(); el.classList.add('is-over'); } },
      leave: (el, e) => { if (!el.contains(e.relatedTarget)) el.classList.remove('is-over'); },
      drop: (el, e) => {
        e.preventDefault(); clearOver();
        const id = ui.dragId || Number(e.dataTransfer.getData('text/plain'));
        ui.dragId = null;
        if (id) ctx.actions.changeStatus(id, el.dataset.stage);
      }
    }
  });
})(window.Crystal);
