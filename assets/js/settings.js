/* Crystal CRM — Settings: Scoring (Owner/Admin) and Senarai / dropdown lists (Admin only). */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html, icon = U.icon;
  let ctx = null;
  const clone = v => JSON.parse(JSON.stringify(v));
  const ui = { tab: U.param('tab') === 'lists' ? 'lists' : 'scoring', draft: clone(S.weights()), dirty: false, pv: { budget: 'b3', type: 'full', timeline: 't1', design: 'd2', ownership: 'o1' }, listDraft: {} };

  const TABLES = [['budget', 'Bajet', D.BUDGETS], ['type', 'Jenis renovation', D.RENO_TYPES], ['timeline', 'Tempoh masa', D.TIMELINES], ['design', 'Keperluan rekaan', D.DESIGNS], ['ownership', 'Status pemilikan', D.OWNERSHIPS]];
  const LISTS = [['locations', 'Lokasi'], ['property', 'Jenis hartanah'], ['reno', 'Jenis renovation'], ['sources', 'Sumber lead'], ['lost', 'Sebab lost']];

  const numInput = (key, id, val, label) => html`<input class="input w-num num" type="number" min="0" max="100" inputmode="numeric" data-input="weight" data-key="${key}" data-id="${id}" data-focus-key="${key}-${id}" value="${val}" aria-label="${label}">`;

  function scoringView() {
    const W = ui.draft;
    const pv = D.score({ budget: ui.pv.budget, renoTypes: [ui.pv.type], timeline: ui.pv.timeline, design: ui.pv.design, ownership: ui.pv.ownership }, W);
    const pvSel = (key, list, label) => html`<label class="field">${label}<select class="select select-sm" data-change="pv" data-key="${key}">${list.map(it => html`<option value="${it.id}"${ui.pv[key] === it.id ? U.raw(' selected') : ''}>${it.label}</option>`)}</select></label>`;
    return html`
      <div class="weights-grid">
        ${TABLES.map(([key, title, list]) => html`
          <section class="glass panel">
            <div class="panel-head">${title}</div>
            <div class="w-rows">${list.map(it => html`<label class="w-row"><span>${it.label}</span>${numInput(key, it.id, W[key][it.id], title + ': ' + it.label)}</label>`)}</div>
          </section>`)}
        <section class="glass panel">
          <div class="panel-head">Ambang</div>
          <div class="w-rows">
            <label class="w-row"><span>${U.tempChip('HOT')} ≥</span><input class="input w-num num" type="number" min="0" max="100" data-input="threshold" data-key="hot" data-focus-key="t-hot" value="${W.hot}" aria-label="Ambang HOT"></label>
            <label class="w-row"><span>${U.tempChip('WARM')} ≥</span><input class="input w-num num" type="number" min="0" max="100" data-input="threshold" data-key="warm" data-focus-key="t-warm" value="${W.warm}" aria-label="Ambang WARM"></label>
            <div class="w-row muted small"><span>${U.tempChip('COLD')}</span><span>&lt; ${W.warm}</span></div>
          </div>
        </section>
      </div>
      <section class="glass panel preview">
        <div class="panel-head">Pratonton skor <span class="muted small" style="font-weight:400">· guna pemberat di atas (belum disimpan)</span></div>
        <div class="pv-grid">
          ${pvSel('budget', D.BUDGETS, 'Bajet')}${pvSel('type', D.RENO_TYPES, 'Jenis')}${pvSel('timeline', D.TIMELINES, 'Tempoh')}${pvSel('design', D.DESIGNS, 'Rekaan')}${pvSel('ownership', D.OWNERSHIPS, 'Milik')}
          <div class="pv-result"><span class="pv-score num">${pv.total}</span>${U.tempChip(pv.cls, true)}</div>
        </div>
        <div class="muted small">Bajet ${pv.parts.budget} · Jenis ${pv.parts.type} · Tempoh ${pv.parts.timeline} · Rekaan ${pv.parts.design} · Milik ${pv.parts.ownership} = ${pv.total}</div>
      </section>
      <div class="save-row">
        <span class="muted small">${icon('info', 14)} Simpan = Versi ${S.weights().version + 1}; hanya lead baharu diskor semula. (Sejarah versi: Fasa 2)</span>
        <span class="actions">
          ${ui.dirty ? html`<button class="btn btn-ghost btn-sm" data-act="revert">Batal perubahan</button>` : ''}
          <button class="btn btn-primary" data-act="save"${ui.dirty ? '' : U.raw(' disabled')}>Simpan</button>
        </span>
      </div>`;
  }

  function listsView() {
    const lists = S.lists();
    return html`
      <div class="lists-grid">
        ${LISTS.map(([key, title]) => html`
          <section class="glass panel">
            <div class="panel-head"><span>${title}</span><span class="muted small">${(lists[key] || []).length}</span></div>
            <ul class="list-items">${(lists[key] || []).map((label, i) => html`<li><span>${label}</span><button class="btn btn-ghost btn-icon btn-sm" data-act="removeItem" data-key="${key}" data-i="${i}" aria-label="Buang ${label}">${icon('close', 14)}</button></li>`)}</ul>
            <form class="list-add" data-submit="addItem" data-key="${key}">
              <input class="input" name="v" data-input="listDraft" data-key="${key}" data-focus-key="add-${key}" value="${ui.listDraft[key] || ''}" placeholder="Tambah…" aria-label="Tambah ke ${title}">
              <button class="btn btn-secondary btn-sm" type="submit">${icon('plus', 14)}Tambah</button>
            </form>
          </section>`)}
      </div>`;
  }

  function render(view, c) {
    ctx = c;
    const tab = ui.tab === 'lists' && c.isAdmin ? 'lists' : 'scoring';
    const focus = U.keepFocus(view);
    U.render(view, html`
      <div class="page-head">
        <div class="settings-title"><h1>Settings</h1>
          <div class="tabs" role="tablist">
            <button class="tab${tab === 'scoring' ? ' is-on' : ''}" role="tab" aria-selected="${tab === 'scoring' ? 'true' : 'false'}" data-act="tab" data-tab="scoring">Scoring</button>
            ${c.isAdmin ? html`<button class="tab${tab === 'lists' ? ' is-on' : ''}" role="tab" aria-selected="${tab === 'lists' ? 'true' : 'false'}" data-act="tab" data-tab="lists">Senarai</button>` : ''}
          </div>
        </div>
        ${tab === 'scoring' ? html`<span class="muted small">Versi semasa: <strong class="num">${S.weights().version}</strong> (${S.weightsDate()})</span>` : ''}
      </div>
      ${tab === 'scoring' ? scoringView() : listsView()}`);
    focus();
  }

  ctx = C.shell.mount({
    screen: 'settings', title: 'Settings', access: 'notSales', render,
    bind: {
      tab: el => { ui.tab = el.dataset.tab; ctx.refresh(); },
      weight: el => { ui.draft[el.dataset.key][el.dataset.id] = Math.max(0, Math.min(100, Number(el.value) || 0)); ui.dirty = true; ctx.refresh(); },
      threshold: el => { ui.draft[el.dataset.key] = Math.max(0, Math.min(100, Number(el.value) || 0)); ui.dirty = true; ctx.refresh(); },
      pv: el => { ui.pv[el.dataset.key] = el.value; ctx.refresh(); },
      revert: () => { ui.draft = clone(S.weights()); ui.dirty = false; ctx.refresh(); },
      save: () => {
        if (ctx.actions.guard()) return;
        if (ui.draft.warm >= ui.draft.hot) { U.toast('Ambang WARM mesti lebih rendah daripada HOT'); return; }
        const version = S.weights().version + 1;
        const next = Object.assign(clone(ui.draft), { version });
        S.saveWeights(next); S.saveWeightsDate('hari ini');
        ui.draft = clone(next); ui.dirty = false;
        U.toast('Scoring v' + version + ' disimpan — lead baharu sahaja');
      },
      listDraft: el => { ui.listDraft[el.dataset.key] = el.value; },
      addItem: (el, e) => {
        e.preventDefault();
        const key = el.dataset.key, v = (ui.listDraft[key] || '').trim();
        if (!v || ctx.actions.guard()) return;
        const lists = S.lists();
        if ((lists[key] || []).some(x => x.toLowerCase() === v.toLowerCase())) { U.toast('"' + v + '" sudah ada'); return; }
        lists[key] = (lists[key] || []).concat(v);
        ui.listDraft[key] = '';
        S.saveLists(lists);
        U.toast('"' + v + '" ditambah');
      },
      removeItem: el => {
        if (ctx.actions.guard()) return;
        const lists = S.lists(), key = el.dataset.key, i = Number(el.dataset.i);
        const gone = lists[key][i];
        lists[key] = lists[key].filter((_, j) => j !== i);
        S.saveLists(lists);
        U.toast('"' + gone + '" dibuang');
      }
    }
  });
})(window.Crystal);
