/* Crystal CRM — Lead detail: header + score ring, earlier-leads banner, actions, answers, audit timeline, value. */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html, icon = U.icon;
  let ctx = null;
  const id = Number(U.param('id')) || 1;
  const ui = { tab: 'answers', showParts: false, note: '', quot: null };

  const STATUS_OPTS = ['new', 'contacted', 'consult', 'site', 'quot', 'nego', 'nurture', 'won', 'lost'];
  const statusSelect = l => html`
    <select class="select select-sm" data-change="status" aria-label="Tukar status">
      ${STATUS_OPTS.map(s => html`<option value="${s}"${s === l.status ? U.raw(' selected') : ''}>● ${D.STATUS_META[s].label}</option>`)}
    </select>`;
  const fuInput = (l, label) => html`<label class="fu-field">${label ? html`<span>${label}</span>` : icon('clock', 16)}<input class="input" type="datetime-local" data-change="followUp" value="${l.nextFollowUp || ''}" aria-label="Next follow-up"></label>`;

  function valuePanel(l) {
    if (l.isWon) return html`<div class="value-state t-won"><strong>Won</strong> · ${l.quotText}</div>`;
    if (l.isLost) return html`<div class="value-state t-lost"><strong>Lost</strong> · ${l.lostReason || '—'}</div>`;
    return html`
      <label class="field">Nilai sebut harga (RM)<input class="input" type="number" min="0" step="100" inputmode="numeric" data-input="quot" data-focus-key="quot" value="${ui.quot != null ? ui.quot : (l.quotation || '')}" placeholder="0"></label>
      <div class="value-actions"><button class="btn btn-won btn-sm" data-act="won">${icon('check', 16)}Won</button><button class="btn btn-lost btn-sm" data-act="lost">Lost · sebab ▾</button></div>`;
  }

  function render(view, c) {
    ctx = c;
    const L = c.data();
    const l = L.visible.find(x => x.id === id);
    if (!l) {
      U.render(view, html`<a class="back-link" href="leads.html">${icon('left', 18)}Leads</a>${U.empty('Lead tidak dijumpai atau bukan milik anda.', html`<a class="btn btn-secondary btn-sm" href="leads.html">Lihat semua lead</a>`, 'search')}`);
      return;
    }
    const earlier = S.leads().filter(x => x.id !== l.id && U.digits(x.phone) === U.digits(l.phone));
    const answers = [['Hartanah', l.propertyType + ' · ' + l.state], ['Renovation', l.renoTypes.map(r => D.labelOf(D.RENO_TYPES, r)).join(', ')], ['Bajet', D.labelOf(D.BUDGETS, l.budget)], ['Rekaan', D.labelOf(D.DESIGNS, l.design)], ['Tempoh', D.labelOf(D.TIMELINES, l.timeline)], ['Pemilikan', D.labelOf(D.OWNERSHIPS, l.ownership)], ['Tambahan', l.info ? '"' + l.info + '"' : '—'], ['Sumber', l.source + (l.utm && l.utm.utm_campaign ? ' · utm_campaign=' + l.utm.utm_campaign : (l.id === 1 ? ' · utm_campaign=raya2026' : ''))]];
    const parts = [['Bajet', l.parts.budget], ['Jenis', l.parts.type], ['Masa', l.parts.timeline], ['Rekaan', l.parts.design], ['Milik', l.parts.ownership]];
    const sales = S.users().filter(u => u.role === 'Sales' && u.active);
    const tab = ui.tab;
    const focus = U.keepFocus(view);

    U.render(view, html`
      <div class="detail${'' }">
        <div class="detail-crumb"><a class="back-link" href="leads.html">${icon('left', 18)}Leads</a><span class="muted num">${l.leadId}</span></div>

        <section class="glass panel detail-head${l.hotGlow ? ' kpi-hot' : ''}">
          <div class="detail-id">
            <div class="detail-title"><h1>${l.name}</h1>${U.tempChip(l.cls, true)}${U.statusChip(l.status, l.qualified)}<span class="muted small">${l.source}</span></div>
            <div class="muted">${l.phone}${l.email ? ' · ' + l.email : ''} · ${l.state}</div>
            <div class="muted small">Dicipta ${l.createdText} · Sales: ${l.assignedFull}</div>
            ${earlier.length ? html`<button class="earlier" data-act="earlier">${icon('info', 16)}${earlier.length} lead terdahulu dengan nombor ini ›</button>` : ''}
          </div>
          <button class="ring detail-ring" data-act="parts" title="Tap untuk lihat pecahan skor" aria-expanded="${ui.showParts ? 'true' : 'false'}">
            ${U.scoreRing(l.score, l.cls, 92)}<span class="ring-val"><span class="ring-num">${l.score}</span><span class="ring-lbl">skor</span></span>
          </button>
          <div class="detail-actions hide-phone">
            <a class="btn btn-primary btn-sm" href="${l.tel}" data-act="call">${icon('phone', 16)}Call</a>
            <a class="btn btn-secondary btn-sm" href="${l.wa}" target="_blank" rel="noopener">${icon('wa', 16)}WhatsApp</a>
            ${c.canAssign ? html`<select class="select select-sm" data-change="assign" aria-label="Assign"><option value="">Assign…</option>${sales.map(u => html`<option value="${u.id}"${u.id === l.assigned ? U.raw(' selected') : ''}>${u.name}</option>`)}</select>` : ''}
            ${statusSelect(l)}
            ${fuInput(l, 'Next f/u')}
            <button class="btn btn-secondary btn-sm" data-act="focusNote">${icon('pen', 16)}Nota</button>
          </div>
        </section>

        <div class="tabs detail-tabs only-phone" role="tablist">
          ${[['answers', 'Jawapan'], ['activity', 'Aktiviti'], ['value', 'Nilai']].map(([k, t]) => html`<button class="tab${tab === k ? ' is-on' : ''}" role="tab" aria-selected="${tab === k ? 'true' : 'false'}" data-act="tab" data-tab="${k}">${t}</button>`)}
        </div>

        <div class="cols-2 detail-cols">
          <div class="stack${tab !== 'answers' ? ' phone-hidden' : ''}">
            <section class="glass panel">
              <div class="panel-head">Jawapan borang</div>
              <dl class="answers">${answers.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
              ${ui.showParts ? html`
                <div class="parts">
                  <div class="small muted">Pecahan skor · scoring v${l.scoringVersion}</div>
                  <div class="parts-row">${parts.map(([k, v]) => html`<span class="part"><span>${k}</span><strong class="num">${v}</strong></span>`)}<span class="part part-total"><span>=</span><strong class="num">${l.score}</strong></span></div>
                </div>` : ''}
            </section>
            <section class="glass panel hide-phone">
              <div class="panel-head">Nilai</div>
              ${valuePanel(l)}
            </section>
          </div>

          <div class="stack${tab !== 'activity' ? ' phone-hidden' : ''}">
            <section class="glass panel">
              <div class="panel-head">Next follow-up</div>
              <div class="fu-now"><span class="${l.fuTone === 'overdue' ? 't-overdue' : l.fuTone === 'today' ? 't-today' : ''}">${icon('clock', 16)} ${l.fuText}${l.followUpPurpose ? ' · ' + l.followUpPurpose : ''}</span>${fuInput(l, 'Ubah')}</div>
            </section>
            <section class="glass panel">
              <div class="panel-head">Aktiviti <span class="muted small" style="font-weight:400">· jejak audit</span></div>
              <ol class="timeline">${l.activity.slice().reverse().map(ev => html`
                <li class="${ev.actor === 'system' ? 'is-system' : ''}"><span class="tl-dot"></span><div><div class="small"><span class="muted num">${ev.at}</span> · <strong class="${ev.actor === 'system' ? 'muted' : 'ink-accent'}">${ev.actor}</strong></div><div>${ev.text}</div></div></li>`)}</ol>
              <div class="note-box">
                <textarea class="textarea" rows="2" id="note" data-input="note" data-focus-key="note" placeholder="Tambah nota…">${ui.note}</textarea>
                <button class="btn btn-dark btn-sm" data-act="addNote"${ui.note.trim() ? '' : U.raw(' disabled')}>${icon('plus', 16)}Nota</button>
              </div>
            </section>
          </div>

          <section class="glass panel only-phone${tab !== 'value' ? ' phone-hidden' : ''}">
            <div class="panel-head">Nilai</div>
            ${valuePanel(l)}
          </section>
        </div>
      </div>

      <div class="detail-bar only-phone">
        <a class="btn btn-primary btn-icon" href="${l.tel}" data-act="call" aria-label="Call">${icon('phone', 18)}</a>
        <a class="btn btn-secondary btn-icon" href="${l.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('wa', 18)}</a>
        ${statusSelect(l)}
        ${fuInput(l, '')}
      </div>`);
    focus();
  }

  ctx = C.shell.mount({
    screen: 'lead', title: 'Lead', bottomNav: false, render,
    bind: {
      call: () => ctx.actions.logCall(id),
      parts: () => { ui.showParts = !ui.showParts; ui.tab = 'answers'; ctx.refresh(); },
      tab: el => { ui.tab = el.dataset.tab; ctx.refresh(); },
      earlier: () => { const l = S.lead(id); location.href = 'leads.html?q=' + encodeURIComponent(l.phone); },
      assign: el => ctx.actions.assign(id, el.value || null),
      status: el => { if (!ctx.actions.changeStatus(id, el.value)) ctx.refresh(); },
      followUp: el => {
        if (!el.value) return;
        const l = S.lead(id);
        if (ctx.actions.update(id, { nextFollowUp: el.value, followUpPurpose: l.followUpPurpose || 'Call' }, 'Next follow-up ' + D.followUpLabel(el.value).text)) U.toast('Follow-up disimpan · peringatan push dijadualkan');
        else ctx.refresh();
      },
      focusNote: () => { ui.tab = 'activity'; ctx.refresh(); setTimeout(() => { const n = document.getElementById('note'); if (n) n.focus(); }, 30); },
      note: el => { ui.note = el.value; const b = document.querySelector('[data-act="addNote"]'); if (b) b.disabled = !ui.note.trim(); },
      addNote: () => { const t = ui.note.trim(); if (!t) return; if (ctx.actions.update(id, {}, 'Nota: "' + t + '"')) { ui.note = ''; U.toast('Nota ditambah'); } },
      quot: el => { ui.quot = el.value; },
      won: () => ctx.actions.wonLostDialog(id, 'won', ui.quot),
      lost: () => ctx.actions.wonLostDialog(id, 'lost')
    }
  });
  if (ctx) {
    const l = S.lead(id);
    if (l && !l.read) S.updateLead(id, { read: true });
    document.title = (l ? l.name : 'Lead') + ' — Crystal CRM';
  }
})(window.Crystal);
