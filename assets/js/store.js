/* Crystal CRM — localStorage store.
   Seeds from Crystal.data once, then every page reads and writes the same keys.
   Falls back to an in-memory copy when storage is blocked (private mode, previews). */
(function (C) {
  'use strict';
  const D = C.data;
  const PREFIX = 'crystal.';
  const SEED_VERSION = 1;
  const memory = {};
  const listeners = [];

  const clone = v => JSON.parse(JSON.stringify(v));
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw != null) return JSON.parse(raw);
    } catch (_) { /* storage blocked */ }
    return key in memory ? clone(memory[key]) : fallback;
  }
  function write(key, value) {
    memory[key] = clone(value);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) { /* memory only */ }
    listeners.forEach(fn => fn(key));
  }

  function seed() {
    write('leads', clone(D.LEADS));
    write('notifs', clone(D.NOTIFICATIONS));
    write('users', clone(D.USERS));
    write('weights', clone(D.DEFAULT_WEIGHTS));
    write('weightsDate', '1 Okt 2026');
    write('lists', {
      locations: D.STATES.slice(0, 7),
      property: D.PROPERTY_TYPES.slice(),
      reno: D.RENO_TYPES.map(r => r.label),
      sources: D.SOURCES.slice(),
      lost: D.LOST_REASONS.slice()
    });
    write('seedVersion', SEED_VERSION);
  }
  if (read('seedVersion', 0) !== SEED_VERSION) seed();

  // Another tab changed the store (e.g. the form submitted a lead) → notify this page.
  window.addEventListener('storage', e => {
    if (e.key && e.key.indexOf(PREFIX) === 0) listeners.forEach(fn => fn(e.key.slice(PREFIX.length)));
  });

  const SOURCE_FROM_UTM = { facebook: 'Facebook', fb: 'Facebook', instagram: 'Instagram', ig: 'Instagram', tiktok: 'TikTok', google: 'Google', whatsapp: 'WhatsApp', wa: 'WhatsApp', manual: 'WhatsApp', referral: 'Rujukan', rujukan: 'Rujukan' };
  function sourceFromUtm(utm) { return SOURCE_FROM_UTM[String(utm || '').toLowerCase()] || 'Website'; }
  function demoClock() { return '15:00'; } // frozen with Crystal.data.TODAY

  const store = {
    onChange(fn) { listeners.push(fn); },

    leads() { return read('leads', []); },
    saveLeads(list) { write('leads', list); },
    lead(id) { return store.leads().find(l => l.id === Number(id)) || null; },
    /** Patch one lead; when `text` is given, append an activity row (the audit trail). */
    updateLead(id, patch, text, actor) {
      const list = store.leads();
      const i = list.findIndex(l => l.id === Number(id));
      if (i < 0) return null;
      const next = Object.assign({}, list[i], patch);
      if (text) next.activity = (list[i].activity || []).concat({ at: 'Sekarang', actor: actor || 'system', text });
      list[i] = next;
      store.saveLeads(list);
      return next;
    },

    users() { return read('users', []); },
    saveUsers(list) { write('users', list); },
    user(id) { return store.users().find(u => u.id === id) || null; },

    notifs() { return read('notifs', []); },
    saveNotifs(list) { write('notifs', list); },

    weights() { return read('weights', clone(D.DEFAULT_WEIGHTS)); },
    saveWeights(w) { write('weights', w); },
    weightsDate() { return read('weightsDate', '1 Okt 2026'); },
    saveWeightsDate(v) { write('weightsDate', v); },

    lists() { return read('lists', {}); },
    saveLists(v) { write('lists', v); },

    session() { return read('session', null); },
    setSession(s) { write('session', s); },
    clearSession() {
      delete memory.session;
      try { localStorage.removeItem(PREFIX + 'session'); } catch (_) { /* ignore */ }
    },

    sourceFromUtm,

    /** Turn a submitted /semak form into a scored CRM lead (+ notification). */
    addLead(a, hidden) {
      hidden = hidden || {};
      const list = store.leads();
      const id = list.reduce((m, l) => Math.max(m, l.id), 0) + 1;
      const w = store.weights();
      const s = D.score({ budget: a.budget, renoTypes: a.renoTypes, timeline: a.timeline, design: a.design, ownership: a.ownership }, w);
      const manual = hidden.utm_source === 'manual';
      const source = sourceFromUtm(hidden.utm_source);
      const at = demoClock();
      const campaign = hidden.utm_campaign ? ' · utm_campaign=' + hidden.utm_campaign : '';
      const activity = [
        { at, actor: 'system', text: manual ? 'Lead dimasukkan manual (' + source + ')' : 'Borang dihantar (' + source + campaign + ')' },
        { at, actor: 'system', text: 'Skor ' + s.total + ' → ' + s.cls + ' · v' + w.version }
      ];
      if (s.cls === 'HOT') activity.push({ at, actor: 'system', text: 'Push dihantar → Owner' });
      const lead = {
        id, leadId: 'CI-LEAD-2026-' + String(id).padStart(6, '0'),
        name: a.name.trim(), phone: a.phone, email: (a.email || '').trim(),
        state: a.state, propertyType: a.propertyType === 'Lain-lain' && a.propertyOther ? a.propertyOther.trim() : a.propertyType,
        budget: a.budget, renoTypes: a.renoTypes.slice(), timeline: a.timeline, design: a.design, ownership: a.ownership,
        info: (a.info || '').trim(), source, utm: hidden,
        status: 'new', qualified: false, assigned: null, nextFollowUp: null, followUpPurpose: null,
        quotation: null, lostReason: null, contacted: false, daysInStage: 0, read: false,
        createdAt: '2026-10-04T' + at, score: s.total, parts: s.parts, cls: s.cls, scoringVersion: w.version, activity
      };
      list.push(lead);
      store.saveLeads(list);

      const notifs = store.notifs();
      const nid = notifs.reduce((m, n) => Math.max(m, n.id), 0) + 1;
      const budget = 'RM' + D.shortOf(D.BUDGETS, a.budget);
      const topType = a.renoTypes.slice().sort((x, y) => (w.type[y] || 0) - (w.type[x] || 0))[0];
      if (s.cls === 'HOT') {
        notifs.unshift({ id: nid, kind: 'hot', title: 'NEW HOT LEAD', body: [lead.name, lead.state, budget, D.TYPE_SHORT[topType] || '—', D.shortOf(D.TIMELINES, a.timeline), 'Skor ' + s.total].join(' · '), time: 'baru', leadId: id, unread: true });
      } else {
        notifs.unshift({ id: nid, kind: s.cls === 'WARM' ? 'warm' : 'cold', title: s.cls + ' lead baharu', body: [lead.name, lead.state, budget].join(' · '), time: 'baru', leadId: id, unread: true });
      }
      store.saveNotifs(notifs);
      return lead;
    },

    /** Restore the seed data (keeps the current login). */
    resetDemo() {
      const session = store.session();
      seed();
      try { localStorage.removeItem('crystal-semak-draft'); } catch (_) { /* ignore */ }
      if (session) store.setSession(session);
    }
  };

  C.store = store;
})(window.Crystal = window.Crystal || {});
