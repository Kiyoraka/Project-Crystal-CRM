/* Crystal CRM — Users (Admin): team list + create/edit sheet (role, active, reset password). */
(function (C) {
  'use strict';
  const S = C.store, U = C.ui, html = U.html, icon = U.icon;
  let ctx = null;

  function render(view, c) {
    ctx = c;
    const users = S.users();
    const counts = id => S.leads().filter(l => l.assigned === id && l.status !== 'won' && l.status !== 'lost').length;
    U.render(view, html`
      <div class="page-head">
        <h1>Users</h1>
        <button class="btn btn-primary btn-sm" data-act="newUser">${icon('plus', 16)}Pengguna</button>
      </div>
      <section class="glass users-list">
        <div class="user-row user-head hide-phone"><span>Nama</span><span>Emel</span><span>Peranan</span><span>Status</span><span>Lead aktif</span><span>Aktif terakhir</span></div>
        ${users.map(u => html`
          <button type="button" class="user-row${u.active ? '' : ' is-off'}" data-act="edit" data-id="${u.id}" aria-label="Edit ${u.name}">
            <span class="user-name">${U.avatar(u.initial)}<strong>${u.name}</strong></span>
            <span class="muted hide-phone">${u.email}</span>
            <span><span class="role-pill role-${u.role.toLowerCase()}">${u.role}</span></span>
            <span class="${u.active ? 't-won' : 't-lost'} small"><span class="state-dot"></span>${u.active ? 'aktif' : 'dilumpuhkan'}</span>
            <span class="num hide-phone">${u.role === 'Sales' ? counts(u.id) : '—'}</span>
            <span class="muted small hide-phone">${u.last}</span>
          </button>`)}
      </section>
      <p class="muted small" style="margin-top:12px">Pengguna yang dilumpuhkan kekal dalam sejarah; lead mereka menjadi "belum assign" sehingga Owner assign semula.</p>`);
  }

  function sheet(u) {
    const isNew = !u.id;
    const isPhone = window.matchMedia('(max-width: 767px)').matches;
    U.open({
      kind: isPhone ? 'sheet' : 'slide', label: isNew ? 'Pengguna baharu' : 'Edit pengguna',
      content: html`
        <form class="user-form" novalidate>
          <div class="overlay-head"><h2>${isNew ? 'Pengguna baharu' : 'Edit pengguna'}</h2><button type="button" class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Tutup">${icon('close', 18)}</button></div>
          <label class="field">Nama<input class="input" name="name" value="${u.name || ''}" autocomplete="off" required></label>
          <label class="field">Emel<input class="input" name="email" type="email" value="${u.email || ''}" autocomplete="off" required></label>
          <label class="field">Peranan<select class="select" name="role">${['Owner', 'Admin', 'Sales'].map(r => html`<option${r === (u.role || 'Sales') ? U.raw(' selected') : ''}>${r}</option>`)}</select></label>
          <label class="check"><input type="checkbox" name="active"${u.active !== false ? U.raw(' checked') : ''}>Aktif</label>
          ${isNew ? '' : html`<button type="button" class="btn btn-secondary btn-sm" data-reset style="align-self:flex-start">${icon('refresh', 14)}Reset kata laluan</button>`}
          <div class="field-error" data-err hidden></div>
          <div class="overlay-actions"><button type="button" class="btn btn-secondary" data-close>Batal</button><button type="submit" class="btn btn-primary">Simpan</button></div>
        </form>`,
      onMount(panel, close) {
        const form = panel.querySelector('form');
        const err = panel.querySelector('[data-err]');
        const reset = panel.querySelector('[data-reset]');
        if (reset) reset.addEventListener('click', () => U.toast('Pautan reset dihantar ke ' + (form.email.value || 'emel')));
        form.addEventListener('input', () => { err.hidden = true; });
        form.addEventListener('submit', e => {
          e.preventDefault();
          if (ctx.actions.guard()) return;
          const name = form.name.value.trim(), email = form.email.value.trim().toLowerCase(), role = form.role.value, active = form.active.checked;
          const fail = msg => { err.textContent = msg; err.hidden = false; };
          if (name.length < 2) return fail('Masukkan nama pengguna.');
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Emel tidak sah.');
          const users = S.users();
          if (users.some(x => x.email === email && x.id !== u.id)) return fail('Emel ini sudah digunakan.');
          if (u.id && u.id === ctx.me.id && (!active || role !== u.role)) return fail('Anda tidak boleh melumpuhkan atau menukar peranan akaun sendiri.');
          const record = Object.assign({}, u, { name, email, role, active, initial: name[0].toUpperCase(), last: u.id ? u.last : 'belum log masuk' });
          if (isNew) record.id = 'u' + Date.now();
          S.saveUsers(isNew ? users.concat(record) : users.map(x => x.id === u.id ? record : x));
          // Disabling a user frees their open leads for reassignment (history stays intact)
          if (!isNew && u.active && !active) {
            S.leads().filter(l => l.assigned === u.id && l.status !== 'won' && l.status !== 'lost')
              .forEach(l => S.updateLead(l.id, { assigned: null }, 'Assign ' + u.name + ' → — (pengguna dilumpuhkan)', ctx.me.first));
          }
          close();
          U.toast(isNew ? 'Pengguna dicipta · jemputan dihantar' : 'Pengguna dikemas kini');
        });
      }
    });
  }

  ctx = C.shell.mount({
    screen: 'users', title: 'Users', access: 'admin', render,
    bind: {
      newUser: () => sheet({ id: null, name: '', email: '', role: 'Sales', active: true }),
      edit: el => { const u = S.user(el.dataset.id); if (u) sheet(u); }
    }
  });
})(window.Crystal);
