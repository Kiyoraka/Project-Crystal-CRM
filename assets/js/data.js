/* Crystal CRM v2 — shared data + scoring engine (brief §7, §8)
   Port of the Claude Design `crystal-data.js` as a classic script (works on file://). */
(function (C) {
  'use strict';

  const TODAY = new Date('2026-10-04T15:00:00+08:00'); // frozen demo clock
  const STATES = ['Penang', 'Kedah', 'Perak', 'Kuala Lumpur', 'Selangor', 'Johor', 'Kelantan', 'Lain-lain'];
  const PROPERTY_TYPES = ['Teres', 'Semi-D', 'Banglo', 'Kondominium', 'Apartmen / Flat', 'Rumah kedai', 'Lain-lain'];
  const RENO_TYPES = [
    { id: 'full', label: 'Renovasi penuh rumah', pts: 20 }, { id: 'renoid', label: 'Renovasi + Interior Design', pts: 20 }, { id: 'ext', label: 'Extension / tambahan', pts: 15 },
    { id: 'living', label: 'Ruang tamu', pts: 10 }, { id: 'kitchen', label: 'Dapur', pts: 10 }, { id: 'id', label: 'Interior Design sahaja', pts: 10 }, { id: 'bath', label: 'Bilik air', pts: 5 },
    { id: 'floor', label: 'Lantai', pts: 3 }, { id: 'ceiling', label: 'Siling plaster', pts: 3 }, { id: 'elec', label: 'Pendawaian elektrik', pts: 3 }, { id: 'plumb', label: 'Paip & sanitari', pts: 3 }, { id: 'cabinet', label: 'Kabinet', pts: 3 }, { id: 'bedroom', label: 'Bilik tidur', pts: 3 }
  ];
  const BUDGETS = [
    { id: 'b1', label: 'Bawah RM30,000', short: '<30k', pts: 10 }, { id: 'b2', label: 'RM30,000 – RM50,000', short: '30–50k', pts: 20 },
    { id: 'b3', label: 'RM50,000 – RM100,000', short: '50–100k', pts: 30 }, { id: 'b4', label: 'Melebihi RM100,000', short: '>100k', pts: 40 }
  ];
  const TIMELINES = [
    { id: 't1', label: 'Kurang 1 bulan', short: '<1 bln', pts: 20 }, { id: 't2', label: '1 – 3 bulan', short: '1–3 bln', pts: 15 }, { id: 't3', label: '3 – 6 bulan', short: '3–6 bln', pts: 8 },
    { id: 't4', label: 'Lebih 6 bulan', short: '>6 bln', pts: 3 }, { id: 't5', label: 'Sekadar tinjau', short: 'Tinjau', pts: 0 }
  ];
  const DESIGNS = [
    { id: 'd1', label: 'Renovasi + Interior Design', pts: 10 }, { id: 'd2', label: 'Perlu Interior Designer', pts: 8 }, { id: 'd3', label: 'Perlu konsultasi dahulu', pts: 5 },
    { id: 'd4', label: 'Sudah ada rekaan sendiri', pts: 3 }, { id: 'd5', label: 'Tidak pasti', pts: 2 }
  ];
  const OWNERSHIPS = [
    { id: 'o1', label: 'Kediaman sendiri', pts: 10 }, { id: 'o2', label: 'Dalam pembinaan', pts: 8 }, { id: 'o3', label: 'Sedang membeli', pts: 5 },
    { id: 'o4', label: 'Pelaburan', pts: 5 }, { id: 'o5', label: 'Rumah sewa', pts: 3 }, { id: 'o6', label: 'Lain-lain', pts: 2 }
  ];
  const SOURCES = ['Website', 'Facebook', 'Instagram', 'TikTok', 'Google', 'WhatsApp', 'Rujukan'];
  const LOST_REASONS = ['Bajet tidak sepadan', 'Pilih kontraktor lain', 'Tangguh projek', 'Tidak dapat dihubungi', 'Luar kawasan', 'Lain-lain'];
  const toMap = list => Object.fromEntries(list.map(x => [x.id, x.pts]));
  const DEFAULT_WEIGHTS = {
    version: 3,
    budget: toMap(BUDGETS),
    type: toMap(RENO_TYPES),
    timeline: toMap(TIMELINES),
    design: toMap(DESIGNS),
    ownership: toMap(OWNERSHIPS),
    hot: 70, warm: 40
  };

  function classify(total, w) { w = w || DEFAULT_WEIGHTS; return total >= w.hot ? 'HOT' : total >= w.warm ? 'WARM' : 'COLD'; }
  function pick(map, id) { return map[id] != null ? map[id] : 0; }
  function score(a, w) {
    w = w || DEFAULT_WEIGHTS;
    const parts = {
      budget: pick(w.budget, a.budget),
      type: Math.max(0, ...(a.renoTypes || []).map(id => pick(w.type, id))),
      timeline: pick(w.timeline, a.timeline),
      design: pick(w.design, a.design),
      ownership: pick(w.ownership, a.ownership)
    };
    const total = Object.values(parts).reduce((s, n) => s + n, 0);
    return { total, parts, cls: classify(total, w) };
  }

  const STAGES = [
    { id: 'new', label: 'New' }, { id: 'contacted', label: 'Contacted' }, { id: 'consult', label: 'Consultation' }, { id: 'site', label: 'Site Visit' },
    { id: 'quot', label: 'Quotation' }, { id: 'nego', label: 'Negotiation' }, { id: 'won', label: 'Won' }, { id: 'lost', label: 'Lost' }
  ];
  const NURTURE = { id: 'nurture', label: 'Nurturing' };
  const USERS = [
    { id: 'aiman', name: 'Aiman Hakim', initial: 'A', role: 'Owner', email: 'aiman@crystal.my', active: true, last: '2 min lalu' },
    { id: 'farid', name: 'Farid Mansor', initial: 'F', role: 'Sales', email: 'farid@crystal.my', active: true, last: '1 jam lalu' },
    { id: 'nor', name: 'Nor Hidayah', initial: 'N', role: 'Sales', email: 'nor@crystal.my', active: true, last: '3 jam lalu' },
    { id: 'hana', name: 'Hana Yusof', initial: 'H', role: 'Admin', email: 'hana@crystal.my', active: true, last: '20 min lalu' },
    { id: 'zul', name: 'Zulkifli Omar', initial: 'Z', role: 'Admin', email: 'zul@crystal.my', active: false, last: '12 Sep' }
  ];
  const TYPE_SHORT = { full: 'Full reno', renoid: 'Reno + ID', ext: 'Extension', living: 'Ruang tamu', kitchen: 'Dapur', id: 'ID', bath: 'Bilik air', floor: 'Lantai', ceiling: 'Siling', elec: 'Elektrik', plumb: 'Paip', cabinet: 'Kabinet', bedroom: 'Bilik tidur' };
  const STATUS_META = {
    new: { label: 'New', color: '#F5F5F4' }, contacted: { label: 'Contacted', color: '#F5F5F4' }, consult: { label: 'Consultation', color: '#F5F5F4' }, site: { label: 'Site Visit', color: '#F5F5F4' },
    quot: { label: 'Quotation', color: '#F5F5F4' }, nego: { label: 'Negotiation', color: '#F5F5F4' }, won: { label: 'Won', color: '#22C55E' }, lost: { label: 'Lost', color: '#EF4444' }, nurture: { label: 'Nurturing', color: '#9CA3AF' }
  };
  const STAGE_ORDER = ['new', 'contacted', 'consult', 'site', 'quot', 'nego', 'won'];

  const L = (n, o) => {
    const a = { budget: o.b, renoTypes: o.r, timeline: o.t, design: o.d, ownership: o.o };
    const s = score(a);
    const rest = Object.assign({}, o); ['b', 'r', 't', 'd', 'o'].forEach(k => delete rest[k]);
    return Object.assign({
      id: n, leadId: 'CI-LEAD-2026-' + String(n).padStart(6, '0'), email: '', propertyType: 'Teres', qualified: false, assigned: null,
      nextFollowUp: null, followUpPurpose: null, quotation: null, lostReason: null, contacted: false, info: '', daysInStage: 1, activity: [], read: true
    }, a, { score: s.total, parts: s.parts, cls: s.cls, scoringVersion: 3 }, rest);
  };
  const LEADS = [
    L(1, { name: 'Ahmad Abdullah', phone: '+60 12-345 6789', email: 'ahmad@mail.com', state: 'Penang', propertyType: 'Teres', b: 'b3', r: ['full'], t: 't1', d: 'd2', o: 'o1', source: 'Facebook', status: 'new', createdAt: '2026-10-04T10:12', info: 'Nak siap sebelum raya.', daysInStage: 0, read: false,
      activity: [{ at: '10:12', actor: 'system', text: 'Borang dihantar (Facebook · utm_campaign=raya2026)' }, { at: '10:12', actor: 'system', text: 'Skor 88 → HOT · scoring v3' }, { at: '10:12', actor: 'system', text: 'Push dihantar → Owner' }] }),
    L(2, { name: 'Siti Rahmah', phone: '+60 19-876 5432', state: 'Selangor', propertyType: 'Semi-D', b: 'b4', r: ['renoid', 'kitchen'], t: 't2', d: 'd1', o: 'o1', source: 'TikTok', status: 'contacted', qualified: true, assigned: 'farid', nextFollowUp: '2026-10-05T10:00', followUpPurpose: 'Call', contacted: true, createdAt: '2026-10-03T09:30', daysInStage: 1,
      activity: [{ at: '3 Okt 09:30', actor: 'system', text: 'Borang dihantar (TikTok)' }, { at: '3 Okt 09:30', actor: 'system', text: 'Skor 85 → HOT · v3' }, { at: '3 Okt 10:02', actor: 'Aiman', text: 'Assign — → Farid' }, { at: '3 Okt 11:15', actor: 'Farid', text: 'Status New → Contacted' }, { at: '3 Okt 11:16', actor: 'Farid', text: 'Nota: "Nak tengok contoh dapur dulu"' }, { at: '3 Okt 11:16', actor: 'Farid', text: 'Next follow-up 5 Okt 10:00 · Call' }] }),
    L(3, { name: 'Farid Mazlan', phone: '+60 13-222 1100', state: 'Johor', propertyType: 'Teres', b: 'b2', r: ['kitchen'], t: 't2', d: 'd3', o: 'o1', source: 'Website', status: 'quot', assigned: 'nor', nextFollowUp: '2026-10-04T10:00', followUpPurpose: 'Call', contacted: true, quotation: 88000, createdAt: '2026-09-25T14:20', daysInStage: 9,
      activity: [{ at: '25 Sep', actor: 'system', text: 'Borang dihantar (Website)' }, { at: '25 Sep', actor: 'system', text: 'Skor 55 → WARM · v3' }, { at: '26 Sep', actor: 'Aiman', text: 'Assign — → Nor' }, { at: '28 Sep', actor: 'Nor', text: 'Status Contacted → Consultation' }, { at: '1 Okt', actor: 'Nor', text: 'Status Site Visit → Quotation · RM88,000' }] }),
    L(4, { name: 'Lim Wei Keat', phone: '+60 16-555 0199', state: 'Perak', propertyType: 'Kondominium', b: 'b1', r: ['bath'], t: 't4', d: 'd5', o: 'o5', source: 'Instagram', status: 'new', nextFollowUp: '2026-10-02T15:00', followUpPurpose: 'Call', assigned: 'nor', createdAt: '2026-09-30T18:05', daysInStage: 4,
      activity: [{ at: '30 Sep', actor: 'system', text: 'Borang dihantar (Instagram)' }, { at: '30 Sep', actor: 'system', text: 'Skor 21 → COLD · v3' }] }),
    L(5, { name: 'Hafiz Rahman', phone: '+60 17-313 8800', state: 'Kuala Lumpur', propertyType: 'Banglo', b: 'b4', r: ['full', 'ext'], t: 't1', d: 'd1', o: 'o2', source: 'Google', status: 'nego', assigned: 'farid', nextFollowUp: '2026-10-04T16:30', followUpPurpose: 'Negotiation', contacted: true, quotation: 210000, createdAt: '2026-09-20T11:00', daysInStage: 12,
      activity: [{ at: '20 Sep', actor: 'system', text: 'Borang dihantar (Google)' }, { at: '20 Sep', actor: 'system', text: 'Skor 100 → HOT · v3' }, { at: '20 Sep', actor: 'Aiman', text: 'Assign — → Farid' }, { at: '22 Sep', actor: 'Farid', text: 'Status Consultation → Site Visit' }, { at: '27 Sep', actor: 'Farid', text: 'Quotation RM210,000' }] }),
    L(6, { name: 'Nor Hashimah', phone: '+60 11-2233 4455', state: 'Johor', propertyType: 'Teres', b: 'b2', r: ['living', 'ceiling'], t: 't3', d: 'd3', o: 'o1', source: 'Facebook', status: 'new', createdAt: '2026-10-04T08:40', daysInStage: 0, read: false,
      activity: [{ at: '08:40', actor: 'system', text: 'Borang dihantar (Facebook)' }, { at: '08:40', actor: 'system', text: 'Skor 43 → WARM · v3' }] }),
    L(7, { name: 'Puan Mei Ling', phone: '+60 12-808 7070', state: 'Penang', propertyType: 'Semi-D', b: 'b3', r: ['renoid'], t: 't2', d: 'd2', o: 'o1', source: 'Rujukan', status: 'site', assigned: 'farid', nextFollowUp: '2026-10-03T14:00', followUpPurpose: 'Site visit', contacted: true, createdAt: '2026-09-26T10:00', daysInStage: 5,
      activity: [{ at: '26 Sep', actor: 'system', text: 'Borang dihantar (Rujukan)' }, { at: '26 Sep', actor: 'system', text: 'Skor 73 → HOT · v3' }, { at: '26 Sep', actor: 'Aiman', text: 'Assign — → Farid' }] }),
    L(8, { name: 'Tan Chee Hong', phone: '+60 12-990 1234', state: 'Selangor', propertyType: 'Teres', b: 'b2', r: ['kitchen', 'cabinet'], t: 't3', d: 'd4', o: 'o1', source: 'Website', status: 'contacted', assigned: 'nor', nextFollowUp: '2026-10-07T11:00', followUpPurpose: 'Call', contacted: true, createdAt: '2026-09-30T09:00', daysInStage: 4,
      activity: [{ at: '30 Sep', actor: 'system', text: 'Borang dihantar (Website)' }, { at: '30 Sep', actor: 'system', text: 'Skor 41 → WARM · v3' }] }),
    L(9, { name: 'Encik Zulhilmi', phone: '+60 19-404 2020', state: 'Kedah', propertyType: 'Banglo', b: 'b4', r: ['full'], t: 't2', d: 'd1', o: 'o1', source: 'Facebook', status: 'won', assigned: 'farid', contacted: true, quotation: 320000, createdAt: '2026-08-12T10:00', daysInStage: 3,
      activity: [{ at: '12 Ogos', actor: 'system', text: 'Borang dihantar (Facebook)' }, { at: '1 Okt', actor: 'Farid', text: 'Status Negotiation → Won · RM320,000' }] }),
    L(10, { name: 'Rahim Bakar', phone: '+60 13-777 6565', state: 'Kelantan', propertyType: 'Teres', b: 'b2', r: ['ext'], t: 't3', d: 'd3', o: 'o4', source: 'TikTok', status: 'site', assigned: 'nor', nextFollowUp: '2026-10-04T11:30', followUpPurpose: 'Quotation', contacted: true, createdAt: '2026-09-27T16:00', daysInStage: 5, activity: [{ at: '27 Sep', actor: 'system', text: 'Skor 48 → WARM · v3' }] }),
    L(11, { name: 'Puan Aida Zainal', phone: '+60 12-345 6789', state: 'Penang', propertyType: 'Teres', b: 'b1', r: ['floor'], t: 't5', d: 'd5', o: 'o1', source: 'Website', status: 'lost', lostReason: 'Tangguh projek', contacted: true, createdAt: '2026-03-02T10:00', daysInStage: 180, activity: [{ at: '2 Mac', actor: 'system', text: 'Skor 25 → COLD · v1' }] }),
    L(12, { name: 'Ahmad A. (lama)', phone: '+60 12-345 6789', state: 'Penang', propertyType: 'Teres', b: 'b2', r: ['bath'], t: 't4', d: 'd5', o: 'o1', source: 'Facebook', status: 'nurture', contacted: true, createdAt: '2025-11-14T10:00', daysInStage: 300, activity: [{ at: '14 Nov 2025', actor: 'system', text: 'Skor 38 → COLD · v1' }] }),
    L(13, { name: 'Kavitha Raj', phone: '+60 16-123 9876', state: 'Selangor', propertyType: 'Kondominium', b: 'b3', r: ['id', 'living'], t: 't2', d: 'd2', o: 'o3', source: 'Instagram', status: 'consult', assigned: 'farid', nextFollowUp: '2026-10-04T14:00', followUpPurpose: 'Consultation', contacted: true, createdAt: '2026-09-29T12:00', daysInStage: 3, activity: [{ at: '29 Sep', actor: 'system', text: 'Skor 63 → WARM · v3' }] }),
    L(14, { name: 'Daniel Wong', phone: '+60 18-222 3344', state: 'Kuala Lumpur', propertyType: 'Rumah kedai', b: 'b3', r: ['renoid'], t: 't1', d: 'd1', o: 'o4', source: 'Google', status: 'new', createdAt: '2026-10-04T13:05', daysInStage: 0, read: false, activity: [{ at: '13:05', actor: 'system', text: 'Skor 85 → HOT · v3' }, { at: '13:05', actor: 'system', text: 'Push dihantar → Owner' }] }),
    L(15, { name: 'Encik Faizal', phone: '+60 12-611 7788', state: 'Perak', propertyType: 'Teres', b: 'b2', r: ['living'], t: 't2', d: 'd3', o: 'o1', source: 'WhatsApp', status: 'contacted', assigned: 'farid', nextFollowUp: '2026-10-04T10:00', followUpPurpose: 'Call', contacted: true, createdAt: '2026-10-01T10:00', daysInStage: 2, activity: [{ at: '1 Okt', actor: 'Aiman', text: 'Lead dimasukkan manual (WhatsApp)' }] }),
    L(16, { name: 'Lee Mei Fong', phone: '+60 17-888 1212', state: 'Johor', propertyType: 'Semi-D', b: 'b3', r: ['kitchen', 'bath'], t: 't3', d: 'd2', o: 'o1', source: 'Facebook', status: 'lost', lostReason: 'Pilih kontraktor lain', assigned: 'nor', contacted: true, quotation: 64000, createdAt: '2026-08-30T10:00', daysInStage: 6, activity: [{ at: '30 Ogos', actor: 'system', text: 'Skor 51 → WARM · v3' }] })
  ];
  const NOTIFICATIONS = [
    { id: 1, kind: 'hot', title: 'NEW HOT LEAD', body: 'Ahmad Abdullah · Penang · RM50–100k · Full reno · <1 bln · Skor 88', time: '2 min', leadId: 1, unread: true },
    { id: 2, kind: 'hot', title: 'NEW HOT LEAD', body: 'Daniel Wong · Kuala Lumpur · RM50–100k · Reno + ID · Skor 85', time: '1 jam', leadId: 14, unread: true },
    { id: 3, kind: 'assign', title: 'Lead diassign kepada anda', body: 'Siti Rahmah → Farid', time: '1 hari', leadId: 2, unread: true },
    { id: 4, kind: 'due', title: 'Follow-up due 10:00', body: 'Farid Mazlan · Call · Quotation RM88,000', time: '5 jam', leadId: 3, unread: false },
    { id: 5, kind: 'warm', title: 'WARM lead baharu', body: 'Nor Hashimah · Johor · RM30–50k', time: '6 jam', leadId: 6, unread: false }
  ];

  const labelOf = (list, id) => (list.find(x => x.id === id) || {}).label || '—';
  const shortOf = (list, id) => (list.find(x => x.id === id) || {}).short || labelOf(list, id);
  const fmtRM = n => n == null ? 'RM —' : 'RM ' + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : n);
  function followUpLabel(iso) {
    if (!iso) return { text: '—', tone: 'none' };
    const d = new Date(iso + '+08:00'); const t0 = new Date('2026-10-04T00:00:00+08:00'); const t1 = new Date('2026-10-05T00:00:00+08:00'); const t2 = new Date('2026-10-06T00:00:00+08:00');
    const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' });
    const day = Number(d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }));
    if (d < t0) return { text: day + ' Okt ' + hm, tone: 'overdue' };
    if (d < t1) return { text: 'Hari ini ' + hm, tone: 'today' };
    if (d < t2) return { text: 'Esok ' + hm, tone: 'soon' };
    return { text: day + ' Okt ' + hm, tone: 'later' };
  }
  function ago(iso) {
    const ms = TODAY - new Date(iso + '+08:00'); const h = Math.floor(ms / 36e5);
    if (h < 1) return Math.max(1, Math.floor(ms / 6e4)) + ' min lalu'; if (h < 24) return h + ' jam lalu'; const d = Math.floor(h / 24); return d + ' hari lalu';
  }

  C.data = {
    TODAY, STATES, PROPERTY_TYPES, RENO_TYPES, BUDGETS, TIMELINES, DESIGNS, OWNERSHIPS, SOURCES, LOST_REASONS, DEFAULT_WEIGHTS,
    classify, score, STAGES, NURTURE, USERS, TYPE_SHORT, STATUS_META, STAGE_ORDER, LEADS, NOTIFICATIONS,
    labelOf, shortOf, fmtRM, followUpLabel, ago
  };
})(window.Crystal = window.Crystal || {});
