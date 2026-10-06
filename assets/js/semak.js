/* Crystal Inc — /semak 10-step qualification wizard (port of Semak.dc.html). */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html, icon = U.icon;
  const DRAFT_KEY = 'crystal-semak-draft';
  const root = document.getElementById('semak');

  const blank = () => ({ name: '', phone: '', email: '', state: '', propertyType: '', propertyOther: '', renoTypes: [], budget: '', design: '', timeline: '', ownership: '', info: '', consent: false });
  const state = { step: 1, a: blank(), err: {}, submitted: false, lead: null, hidden: {} };

  /* ---------- Hidden fields (UTM / referrer / device) ---------- */
  const p = new URLSearchParams(location.search);
  state.hidden = {
    utm_source: p.get('utm_source') || (p.get('source') === 'manual' ? 'manual' : 'direct'),
    utm_medium: p.get('utm_medium') || '',
    utm_campaign: p.get('utm_campaign') || '',
    referrer: document.referrer || '—',
    landing: location.pathname.split('/').pop() || 'semak.html',
    device: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop'
  };
  const showDebug = p.get('debug') === '1';

  /* ---------- Draft (resume an interrupted form; consent never restored) ---------- */
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.a) { state.a = Object.assign(blank(), d.a, { consent: false }); state.step = Math.min(10, d.step || 1); }
  } catch (_) { /* ignore */ }
  function saveDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ a: state.a, step: state.step })); } catch (_) { /* ignore */ } }

  /* ---------- Validation (messages verbatim from the design) ---------- */
  function normPhone(raw) {
    let d = String(raw).replace(/\D/g, '');
    if (d.startsWith('60')) d = d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);
    if (!/^1\d{8,9}$/.test(d)) return null;
    return '+60 ' + d.slice(0, 2) + '-' + d.slice(2, 5) + ' ' + d.slice(5);
  }
  function validate(step) {
    const a = state.a, e = {};
    if (step === 1 && a.name.trim().length < 3) e.name = 'Sila masukkan nama penuh anda.';
    if (step === 2 && !normPhone(a.phone)) e.phone = 'Nombor tidak sah. Contoh: +60 12-345 6789';
    if (step === 3 && a.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) e.email = 'Emel tidak sah. Contoh: nama@contoh.com';
    if (step === 4 && !a.state) e.state = 'Sila pilih lokasi hartanah.';
    if (step === 5 && (!a.propertyType || (a.propertyType === 'Lain-lain' && !a.propertyOther.trim()))) e.propertyType = a.propertyType === 'Lain-lain' ? 'Sila nyatakan jenis hartanah.' : 'Sila pilih jenis hartanah.';
    if (step === 6 && a.renoTypes.length === 0) e.renoTypes = 'Pilih sekurang-kurangnya satu jenis renovation.';
    if (step === 7 && !a.budget) e.budget = 'Sila pilih anggaran bajet.';
    if (step === 8 && !a.design) e.design = 'Sila pilih keperluan rekaan.';
    if (step === 9) { if (!a.timeline) e.timeline = 'Sila pilih tempoh masa.'; if (!a.ownership) e.ownership = 'Sila pilih status pemilikan.'; }
    if (step === 10 && !a.consent) e.consent = 'Persetujuan PDPA diperlukan untuk kami menghubungi anda.';
    return e;
  }

  /* ---------- Actions ---------- */
  function setA(key, value, rerender) {
    state.a[key] = value;
    delete state.err[key];
    saveDraft();
    if (rerender) draw();
  }
  function next() {
    const e = validate(state.step);
    if (Object.keys(e).length) { state.err = e; draw(); focusFirstError(); return; }
    if (state.step < 10) { state.step++; state.err = {}; saveDraft(); draw(true); window.scrollTo({ top: 0 }); return; }
    const a = Object.assign({}, state.a, { phone: normPhone(state.a.phone) });
    state.lead = S.addLead(a, state.hidden);
    state.submitted = true;
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* ignore */ }
    draw(true);
  }
  function back() { if (state.step > 1) { state.step--; state.err = {}; saveDraft(); draw(true); } }
  function reset() { state.a = blank(); state.step = 1; state.err = {}; state.submitted = false; state.lead = null; draw(true); }
  function focusFirstError() { const el = root.querySelector('.is-error input, input.is-error, .is-error'); if (el && el.focus) el.focus(); }

  /* ---------- View helpers ---------- */
  const errLine = key => state.err[key] ? html`<div class="field-error sk-err" role="alert">${icon('alert', 14)}${state.err[key]}</div>` : '';
  function options(list, key, opts) {
    opts = opts || {};
    const a = state.a;
    return list.map(it => {
      const id = it.id || it, label = it.label || it;
      const on = opts.multi ? a[key].includes(id) : a[key] === id;
      const mark = opts.multi ? html`<span class="sk-box">${icon('check', 12, { sw: 3.5 })}</span>` : html`<span class="sk-radio"></span>`;
      return html`<button type="button" class="sk-opt${opts.cls ? ' ' + opts.cls : ''}${on ? ' is-on' : ''}" data-act="pick" data-key="${key}" data-id="${id}" data-multi="${opts.multi ? '1' : ''}" aria-pressed="${on ? 'true' : 'false'}">${mark}${label}</button>`;
    });
  }
  function textInput(key, attrs) {
    return html`<input class="input input-lg${state.err[key] ? ' is-error' : ''}" data-input="text" data-key="${key}" value="${state.a[key]}" ${U.raw(attrs)}>`;
  }

  function stepBody() {
    const a = state.a;
    switch (state.step) {
      case 1: return html`
        <h1>Siapa nama penuh anda?</h1>
        <label class="field">Nama penuh${textInput('name', 'placeholder="cth. Ahmad bin Abdullah" autocomplete="name"')}</label>
        ${errLine('name')}`;
      case 2: return html`
        <h1>No. telefon anda?</h1>
        <p class="sk-help">Kami hubungi anda dalam 24 jam. Nombor Malaysia sahaja.</p>
        <label class="field">No. telefon bimbit
          <div class="input-group${state.err.phone ? ' is-error' : ''}"><span class="prefix">+60</span><input type="tel" inputmode="tel" class="num" data-input="text" data-key="phone" value="${a.phone}" placeholder="12-345 6789" autocomplete="tel-national"></div>
        </label>
        ${errLine('phone')}`;
      case 3: return html`
        <h1>Emel anda? <span class="sk-opt-note">(pilihan)</span></h1>
        <p class="sk-help">Untuk kami hantar salinan sebut harga.</p>
        <label class="field">Emel${textInput('email', 'type="email" inputmode="email" placeholder="nama@contoh.com" autocomplete="email"')}</label>
        ${errLine('email')}
        <button type="button" class="sk-skip" data-act="skipEmail">Langkau langkah ini</button>`;
      case 4: return html`
        <h1>Di mana lokasi hartanah anda?</h1>
        <div class="sk-grid">${options(D.STATES, 'state')}</div>
        ${errLine('state')}`;
      case 5: return html`
        <h1>Jenis hartanah?</h1>
        <div class="sk-grid">${options(D.PROPERTY_TYPES, 'propertyType')}</div>
        ${a.propertyType === 'Lain-lain' ? textInput('propertyOther', 'placeholder="Nyatakan jenis hartanah"') : ''}
        ${errLine('propertyType')}`;
      case 6: return html`
        <h1>Jenis renovation yang anda perlukan?</h1>
        <p class="sk-help">Pilih satu atau lebih. <strong id="reno-count">${a.renoTypes.length ? a.renoTypes.length + ' dipilih' : ''}</strong></p>
        <div class="sk-grid">${options(D.RENO_TYPES, 'renoTypes', { multi: true, cls: 'sk-opt-sm' })}</div>
        ${errLine('renoTypes')}`;
      case 7: return html`
        <h1>Anggaran bajet renovation anda?</h1>
        <div class="sk-list">${options(D.BUDGETS, 'budget', { cls: 'sk-opt-lg' })}</div>
        ${errLine('budget')}`;
      case 8: return html`
        <h1>Keperluan rekaan anda?</h1>
        <div class="sk-list">${options(D.DESIGNS, 'design')}</div>
        ${errLine('design')}`;
      case 9: return html`
        <h1>Bila anda mahu mula?</h1>
        <div class="sk-fit">${options(D.TIMELINES, 'timeline')}</div>
        ${errLine('timeline')}
        <h2>Status pemilikan hartanah?</h2>
        <div class="sk-fit">${options(D.OWNERSHIPS, 'ownership')}</div>
        ${errLine('ownership')}`;
      default: return html`
        <h1>Maklumat tambahan <span class="sk-opt-note">(pilihan)</span></h1>
        <textarea class="textarea" rows="4" data-input="text" data-key="info" placeholder="cth. Nak siap sebelum raya. Rumah 2 tingkat, 4 bilik.">${a.info}</textarea>
        <label class="sk-consent${state.err.consent ? ' is-error' : ''}">
          <input type="checkbox" data-change="consent" ${a.consent ? 'checked' : ''}>
          <span>Saya bersetuju Crystal Inc menghubungi saya melalui telefon / WhatsApp dan memproses data peribadi saya mengikut <a href="#" style="font-weight:600">Notis Privasi (PDPA)</a>.</span>
        </label>
        ${errLine('consent')}`;
    }
  }

  function formView() {
    const step = state.step, last = step === 10;
    const backBtn = step > 1
      ? html`<button type="button" class="sk-back" data-act="back">${icon('left', 18)}Kembali</button>`
      : html`<a class="sk-back" href="index.html">${icon('left', 18)}Laman utama</a>`;
    return html`
      <div class="sk-top">
        <div class="sk-top-row">${backBtn}<div class="sk-step"><span class="sk-mark"></span><span class="num">Langkah ${step} / 10</span></div></div>
        <div class="sk-progress" role="progressbar" aria-valuemin="1" aria-valuemax="10" aria-valuenow="${step}"><div style="width:${step * 10}%"></div></div>
      </div>
      <form class="sk-body" data-submit="next" novalidate>${stepBody()}<button type="submit" hidden></button></form>
      <div class="sk-foot">
        <button type="button" class="btn btn-primary btn-block sk-next${Object.keys(state.err).length ? ' is-dim' : ''}" data-act="next">${last ? 'Hantar' : 'Seterusnya'}${icon(last ? 'check' : 'right', 18, { sw: 2.6 })}</button>
        <div class="sk-fine">Borang 2 minit · tiada komitmen · data dilindungi PDPA</div>
      </div>`;
  }

  function successView() {
    const l = state.lead, a = state.a;
    const first = a.name.trim().split(/\s+/)[0] || 'anda';
    const wa = 'https://wa.me/60123456789?text=' + encodeURIComponent('Hai Crystal, saya ' + a.name.trim() + ' (' + l.leadId + ').');
    const h = state.hidden;
    const debug = showDebug ? html`
      <div class="sk-debug">
        <div style="font-weight:600;color:var(--ink);margin-bottom:6px">Dev: payload ke CRM (tidak dipapar kepada pelanggan)</div>
        <div>Skor <b>${l.score}</b> → <b class="${l.cls === 'HOT' ? 't-hot' : l.cls === 'WARM' ? 't-warm' : 't-cold'}">${l.cls}</b> · Bajet ${l.parts.budget} · Jenis ${l.parts.type} · Tempoh ${l.parts.timeline} · Rekaan ${l.parts.design} · Milik ${l.parts.ownership}</div>
        <div style="margin-top:4px">utm_source=${h.utm_source} · utm_campaign=${h.utm_campaign || '—'} · referrer=${h.referrer} · device=${h.device} · phone_e164=${l.phone.replace(/[\s-]/g, '')}</div>
      </div>` : '';
    return html`
      <div class="sk-done">
        <div class="sk-tick"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></div>
        <h1>Terima kasih, ${first}!</h1>
        <p>Pasukan Crystal akan hubungi anda dalam <strong>24 jam</strong> di ${l.phone}.</p>
        <div class="sk-ref">Rujukan: ${l.leadId}</div>
        <a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener" style="margin-top:8px">${icon('wa', 18)}WhatsApp kami</a>
        <a class="sk-home" href="index.html">Kembali ke laman utama ›</a>
        ${debug}
        <button type="button" class="sk-reset" data-act="reset">Isi borang baharu (demo)</button>
      </div>`;
  }

  /* ---------- Render ---------- */
  function draw(moveFocus) {
    U.render(root, state.submitted ? successView() : formView());
    if (moveFocus) {
      const target = root.querySelector('.sk-body input:not([type=checkbox]), .sk-body textarea') || root.querySelector('h1');
      if (target) { if (target.tagName === 'H1') target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    }
  }

  U.bind(root, {
    next: (el, e) => { if (e) e.preventDefault(); next(); },
    back,
    reset,
    skipEmail: () => { setA('email', ''); state.step = 4; state.err = {}; saveDraft(); draw(true); },
    pick: el => {
      const key = el.dataset.key, id = el.dataset.id;
      if (el.dataset.multi) {
        const list = state.a[key];
        setA(key, list.includes(id) ? list.filter(x => x !== id) : list.concat(id), true);
      } else {
        setA(key, id, true);
      }
    },
    text: el => {
      const hadErr = !!state.err[el.dataset.key];
      setA(el.dataset.key, el.value, false);
      if (hadErr) { // clear the inline error without losing the caret
        const box = el.closest('.input-group') || el;
        box.classList.remove('is-error');
        const msg = root.querySelector('.sk-err'); if (msg) msg.remove();
        const btn = root.querySelector('.sk-next'); if (btn && !Object.keys(state.err).length) btn.classList.remove('is-dim');
      }
    },
    consent: el => setA('consent', el.checked, !!state.err.consent)
  });

  draw(false);
})(window.Crystal);
