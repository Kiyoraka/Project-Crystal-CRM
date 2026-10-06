/* Crystal CRM — Analytics-lite: leads by source (stacked by class), lead quality per week, funnel conversion. */
(function (C) {
  'use strict';
  const D = C.data, S = C.store, U = C.ui, html = U.html;
  let range = '30 hari';
  // Weekly HOT % series (fixed demo history, as in the design)
  const WEEKLY = [8, 12, 10, 15, 18, 14, 20, 16, 22, 19, 25, 21];

  function render(view, c) {
    const v = c.data().visible;
    const sources = S.lists().sources || D.SOURCES;
    const groups = sources.map(src => {
      const g = v.filter(l => l.source === src);
      const hot = g.filter(l => l.cls === 'HOT').length, warm = g.filter(l => l.cls === 'WARM').length;
      return { src, total: g.length, hot, warm, cold: g.length - hot - warm };
    }).sort((a, b) => b.total - a.total);
    const max = Math.max(1, ...groups.map(g => g.total));

    const idx = st => D.STAGE_ORDER.indexOf(st);
    const won = v.filter(l => l.status === 'won').length;
    const steps = [['Lead', v.length], ['Contacted', v.filter(l => idx(l.status) >= 1 || l.status === 'nurture').length], ['Consult', v.filter(l => idx(l.status) >= 2).length], ['Site', v.filter(l => idx(l.status) >= 3).length], ['Quotation', v.filter(l => idx(l.status) >= 4).length], ['Won', won]];
    const conv = steps.slice(1).map(([label, n], i) => { const prev = steps[i][1]; const pct = prev ? Math.round(n / prev * 100) : 0; return { label: steps[i][0] + ' → ' + label, pct }; });
    const overall = v.length ? Math.round(won / v.length * 1000) / 10 : 0;

    const pts = WEEKLY.map((y, i) => [36 + i * (434 / 11), 130 - y / 40 * 110]);
    const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const area = line + ' 470,130 36,130';
    const grid = [0, 10, 20, 30, 40];

    U.render(view, html`
      <div class="page-head">
        <h1>Analytics</h1>
        <label class="actions small muted">Tarikh
          <select class="select select-sm" data-change="range" aria-label="Julat tarikh">${['7 hari', '30 hari', '90 hari'].map(r => html`<option${r === range ? U.raw(' selected') : ''}>${r}</option>`)}</select>
        </label>
      </div>

      <section class="glass panel chart-panel">
        <div class="panel-head"><span>Leads mengikut sumber <span class="muted small" style="font-weight:400">· bertindan HOT / WARM / COLD</span></span>
          <span class="legend"><span><i class="lg lg-hot"></i>HOT</span><span><i class="lg lg-warm"></i>WARM</span><span><i class="lg lg-cold"></i>COLD</span></span></div>
        <div class="src-bars">${groups.map(g => html`
          <div class="src-row">
            <span class="src-label">${g.src}</span>
            <div class="src-track" role="img" aria-label="${g.src}: ${g.total} lead, ${g.hot} HOT, ${g.warm} WARM, ${g.cold} COLD">
              <span class="seg seg-hot" style="width:${g.hot / max * 100}%" title="HOT ${g.hot}"></span><span class="seg seg-warm" style="width:${g.warm / max * 100}%" title="WARM ${g.warm}"></span><span class="seg seg-cold" style="width:${g.cold / max * 100}%" title="COLD ${g.cold}"></span>
            </div>
            <span class="src-num num">${g.total}</span>
          </div>`)}</div>
      </section>

      <div class="cols-2" style="margin-top:16px">
        <section class="glass panel chart-panel">
          <div class="panel-head">Kualiti lead <span class="muted small" style="font-weight:400">· HOT % per minggu</span></div>
          <svg class="line-chart" viewBox="0 0 500 150" role="img" aria-label="HOT peratus mingguan, minggu 1 hingga 12, naik dari 8% ke 21%">
            <defs><linearGradient id="hotFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7A1A" stop-opacity="0.28"></stop><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"></stop></linearGradient></defs>
            ${grid.map(g => { const y = 130 - g / 40 * 110; return html`<line x1="36" x2="470" y1="${y}" y2="${y}" stroke="rgba(17,17,19,0.08)"></line><text x="28" y="${y + 4}" text-anchor="end" class="ax">${g}%</text>`; })}
            <polygon points="${area}" fill="url(#hotFill)"></polygon>
            <polyline points="${line}" fill="none" stroke="#FF7A1A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>
            ${pts.map((p, i) => html`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}" fill="${i === pts.length - 1 ? '#C2410C' : '#FFFFFF'}" stroke="#FF7A1A" stroke-width="2"><title>W${i + 1}: ${WEEKLY[i]}%</title></circle>`)}
            ${pts.map((p, i) => i % 2 === 0 || i === 11 ? html`<text x="${p[0].toFixed(1)}" y="146" text-anchor="middle" class="ax">W${i + 1}</text>` : '')}
          </svg>
        </section>
        <section class="glass panel chart-panel">
          <div class="panel-head">Funnel conversion</div>
          <div class="conv-list">${conv.map(r => html`
            <div class="conv-row"><span class="conv-label">${r.label}</span><div class="conv-track"><div class="conv-bar ${r.pct >= 50 ? 'is-good' : r.pct >= 30 ? 'is-mid' : 'is-low'}" style="width:${r.pct}%"></div></div><span class="conv-pct num ${r.pct >= 50 ? 't-hot' : r.pct >= 30 ? 't-warm' : 't-lost'}">${r.pct} %</span></div>`)}
            <div class="conv-row conv-total"><span class="conv-label">Keseluruhan (Lead → Won)</span><span></span><span class="conv-pct num">${overall} %</span></div>
          </div>
        </section>
      </div>
      <p class="muted small" style="margin-top:12px">Penapis penuh (sumber / negeri / kelas / sales / status / bajet) ialah Fasa 2.</p>`);
  }

  C.shell.mount({
    screen: 'analytics', title: 'Analytics', render,
    bind: { range: el => { range = el.value; U.toast('Julat: ' + range); } }
  });
})(window.Crystal);
