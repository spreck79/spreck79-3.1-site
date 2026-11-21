// spreck79 3.1 window manager: overlapping windows, MDI groups, menus, dialogs.
(function () {
  const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let z = 10;
  const all = new Set();
  let openMenu = null;

  const SVG_MIN = '<svg viewBox="0 0 10 10"><path d="M1 3 H9 L5 8 Z"/></svg>';
  const SVG_MAX = '<svg viewBox="0 0 10 10"><path d="M1 7 H9 L5 2 Z"/></svg>';
  const SVG_RES = '<svg viewBox="0 0 10 10"><path d="M1 4.4 H9 L5 0.5 Z M1 5.6 H9 L5 9.5 Z"/></svg>';

  function desktopEl() { return document.getElementById('desktop'); }

  // ---------------- menus ----------------
  function closeMenus() {
    if (openMenu) {
      openMenu.el.remove();
      if (openMenu.anchor) openMenu.anchor.classList.remove('open');
      if (openMenu.bar) openMenu.bar.querySelectorAll('.mi').forEach((m) => m.classList.remove('armed'));
      openMenu = null;
    }
  }

  function showMenu(items, x, y, anchor, bar) {
    closeMenus();
    const el = $('<div class="menu"></div>');
    for (const it of items) {
      if (!it) continue;
      if (it.sep) { el.appendChild($('<div class="sep"></div>')); continue; }
      const dis = typeof it.disabled === 'function' ? it.disabled() : !!it.disabled;
      const chk = typeof it.checked === 'function' ? it.checked() : !!it.checked;
      const row = $(`<div class="it${dis ? ' dis' : ''}${chk ? ' chk' : ''}"><span>${esc(it.label)}</span><span class="k">${esc(it.key || '')}</span></div>`);
      row.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        if (dis) return;
        closeMenus();
        setTimeout(() => it.action && it.action(), 0);
      });
      el.appendChild(row);
    }
    document.body.appendChild(el);
    const r = el.getBoundingClientRect();
    if (x + r.width > innerWidth) x = Math.max(0, innerWidth - r.width - 2);
    if (y + r.height > innerHeight) y = Math.max(0, innerHeight - r.height - 2);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    if (anchor) anchor.classList.add('open');
    if (bar) bar.querySelectorAll('.mi').forEach((m) => m.classList.add('armed'));
    openMenu = { el, anchor, bar };
  }

  // Close an open menu when the press lands outside it. Presses on the menu itself, or on its
  // menu bar (which toggles it), are left to their own handlers.
  document.addEventListener('pointerdown', (e) => {
    if (!openMenu) return;
    if (openMenu.el.contains(e.target)) return;
    if (openMenu.bar && openMenu.bar.contains(e.target)) return;
    if (openMenu.anchor && openMenu.anchor.contains(e.target)) return;
    closeMenus();
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openMenu) { closeMenus(); e.stopPropagation(); } }, true);

  function buildMenubar(win, menus) {
    const bar = $('<div class="menubar"></div>');
    for (const m of menus) {
      const mi = $(`<div class="mi">${esc(m.label)}</div>`);
      const open = () => {
        const r = mi.getBoundingClientRect();
        const items = typeof m.items === 'function' ? m.items() : m.items;
        showMenu(items, r.left, r.bottom, mi, bar);
      };
      mi.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        win.focus();
        if (openMenu && openMenu.anchor === mi) { closeMenus(); return; }
        open();
      });
      mi.addEventListener('pointerenter', () => { if (openMenu && openMenu.bar === bar && openMenu.anchor !== mi) open(); });
      bar.appendChild(mi);
    }
    return bar;
  }

  // ---------------- windows ----------------
  class Win {
    constructor(o) {
      this.o = o;
      this.container = o.parent || desktopEl();
      this.tray = o.tray || document.getElementById('icon-tray');
      this.owner = o.owner || null; // top-level Win that hosts an MDI child
      this.children = new Set();
      this.state = 'normal';
      this.icon = o.icon || S79Icons.exe;

      const el = $(`<div class="win${o.dialog ? ' dialog fixed frame-thin' : ''}${o.resizable === false ? ' fixed' : ''} ${o.className || ''}">
        <div class="titlebar">
          ${o.dialog ? '<button class="ctl sys" tabindex="-1" title="Control menu"><i></i></button>' : '<button class="ctl sys" tabindex="-1" title="Control menu"><i></i></button>'}
          <div class="title"></div>
          ${o.minimizable === false || o.dialog ? '' : `<button class="ctl min" tabindex="-1" title="Minimize">${SVG_MIN}</button>`}
          ${o.maximizable === false || o.dialog || o.resizable === false ? '' : `<button class="ctl max" tabindex="-1" title="Maximize">${SVG_MAX}</button>`}
        </div>
        <div class="trim"><i></i><i></i><i></i></div>
        <div class="client"></div>
        <div class="grip n"></div><div class="grip s"></div><div class="grip e"></div><div class="grip w"></div>
        <div class="grip ne"></div><div class="grip nw"></div><div class="grip se"></div><div class="grip sw"></div>
      </div>`);
      this.el = el;
      el._win = this;
      this.titleEl = el.querySelector('.title');
      this.client = el.querySelector('.client');
      if (o.white) this.client.classList.add('white');
      this.setTitle(o.title || 'Untitled');
      if (o.menu) this.setMenu(o.menu);

      const cw = this.container.clientWidth, ch = this.container.clientHeight;
      const w = Math.min(o.w || 480, cw - 8), h = Math.min(o.h || 320, ch - 8);
      const cascade = (Win.cascade = ((Win.cascade || 0) + 1) % 8);
      let x = o.x != null ? o.x : o.center ? (cw - w) / 2 : 40 + cascade * 26;
      let y = o.y != null ? o.y : o.center ? (ch - h) / 2.4 : 30 + cascade * 26;
      x = Math.max(0, Math.min(x, cw - w)); y = Math.max(0, Math.min(y, ch - h));
      Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      if (o.minW) el.style.minWidth = o.minW + 'px';
      if (o.minH) el.style.minHeight = o.minH + 'px';

      this.container.appendChild(el);
      all.add(this);
      if (this.owner) this.owner.children.add(this);

      // focus on any press
      el.addEventListener('pointerdown', () => this.focus(), true);

      // title drag
      const tb = el.querySelector('.titlebar');
      tb.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.ctl') || e.button !== 0 || this.state === 'max') return;
        this.drag(e, 'move');
      });
      tb.addEventListener('dblclick', (e) => {
        if (e.target.closest('.ctl')) return;
        if (o.dialog || o.resizable === false || o.maximizable === false) return;
        this.state === 'max' ? this.restore() : this.maximize();
      });
      el.querySelectorAll('.grip').forEach((g) => g.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        this.drag(e, g.classList[1]);
      }));

      const sys = el.querySelector('.ctl.sys');
      sys.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); this.focus();
        const r = sys.getBoundingClientRect();
        showMenu(this.sysMenu(), r.left, r.bottom);
      });
      sys.addEventListener('dblclick', () => { closeMenus(); this.close(); });
      const mn = el.querySelector('.ctl.min'); if (mn) mn.addEventListener('click', () => this.minimize());
      const mx = el.querySelector('.ctl.max'); if (mx) mx.addEventListener('click', () => (this.state === 'max' ? this.restore() : this.maximize()));

      if (o.content) this.client.appendChild(o.content);
      this.focus();
      if (o.maximized) this.maximize();
    }

    sysMenu() {
      const d = this.o.dialog;
      return [
        { label: 'Restore', disabled: this.state === 'normal', action: () => this.restore() },
        d ? null : { label: 'Minimize', disabled: this.o.minimizable === false || this.state === 'min', action: () => this.minimize() },
        d || this.o.resizable === false || this.o.maximizable === false ? null : { label: 'Maximize', disabled: this.state === 'max', action: () => this.maximize() },
        { sep: true },
        { label: 'Close', key: this.owner ? 'Ctrl+F4' : 'Alt+F4', action: () => this.close() },
        this.owner || d ? null : { sep: true },
        this.owner || d ? null : { label: 'Switch To...', key: 'Ctrl+Esc', action: () => S79.taskList() },
      ];
    }

    setTitle(t) { this.title = t; this.titleEl.textContent = t; if (this.trayIcon) this.trayIcon.querySelector('.label').textContent = t; }

    setMenu(menus) {
      const old = this.el.querySelector('.menubar');
      const bar = buildMenubar(this, menus);
      if (old) old.replaceWith(bar); else this.el.insertBefore(bar, this.client);
    }

    drag(e, mode) {
      e.preventDefault();
      const el = this.el, sx = e.clientX, sy = e.clientY;
      const r0 = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      const minW = parseInt(getComputedStyle(el).minWidth) || 160, minH = parseInt(getComputedStyle(el).minHeight) || 80;
      const cw = this.container.clientWidth, ch = this.container.clientHeight;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        let { x, y, w, h } = r0;
        if (mode === 'move') {
          x = Math.max(-w + 60, Math.min(cw - 60, x + dx));
          y = Math.max(0, Math.min(ch - 24, y + dy));
        } else {
          if (mode.includes('e')) w = Math.max(minW, r0.w + dx);
          if (mode.includes('s')) h = Math.max(minH, r0.h + dy);
          if (mode.includes('w')) { w = Math.max(minW, r0.w - dx); x = r0.x + r0.w - w; }
          if (mode.includes('n')) { h = Math.max(minH, r0.h - dy); y = Math.max(0, r0.y + r0.h - h); }
        }
        Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        if (mode !== 'move' && this.o.onResize) this.o.onResize();
      };
      // While dragging, embedded pages (Lookout) must not swallow the pointer, or the drag sticks.
      document.body.classList.add('dragging');
      const up = () => { document.body.classList.remove('dragging'); removeEventListener('pointermove', move); removeEventListener('pointerup', up); if (this.o.onResize) this.o.onResize(); };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
    }

    focus() {
      if (this.state === 'min') return;
      if (this.owner) this.owner.focus();
      if (S79.modal && S79.modal !== this && !this.isInside(S79.modal)) return;
      this.el.style.zIndex = ++z;
      for (const w of all) if (w !== this && w.container === this.container) w.el.classList.remove('active');
      this.el.classList.add('active');
      if (!this.owner) Win.active = this;
      if (this.o.onFocus) this.o.onFocus();
    }

    isInside(w) { return w.el.contains(this.el); }

    minimize() {
      if (this.state === 'min') return;
      this.prevState = this.state;
      this.state = 'min';
      this.el.classList.add('hidden');
      this.el.classList.remove('active');
      const ic = $(`<div class="icon" tabindex="0"><span class="glyph">${this.icon}</span><span class="label"></span></div>`);
      ic.querySelector('.label').textContent = this.title;
      ic.addEventListener('dblclick', () => this.restore());
      ic.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.restore(); });
      ic.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (e.button === 0) {
          const r = ic.getBoundingClientRect();
          setTimeout(() => { if (this.state === 'min') showMenu(this.sysMenu(), r.left, r.top - 4 - 140 > 0 ? r.top - 140 : r.bottom); }, 0);
        }
      });
      this.trayIcon = ic;
      this.tray.appendChild(ic);
      const next = [...all].filter((w) => w.container === this.container && w.state !== 'min' && w !== this).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
      if (next) next.focus();
      if (this.o.onMinimize) this.o.onMinimize();
    }

    restore() {
      if (this.state === 'min') {
        this.el.classList.remove('hidden');
        if (this.trayIcon) { this.trayIcon.remove(); this.trayIcon = null; }
        this.state = this.prevState === 'max' ? 'normal' : 'normal';
        if (this.prevState === 'max') { this.focus(); this.maximize(); return; }
      } else if (this.state === 'max') {
        const r = this.saved;
        Object.assign(this.el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
        this.el.classList.remove('max');
        const mx = this.el.querySelector('.ctl.max'); if (mx) mx.innerHTML = SVG_MAX;
      }
      this.state = 'normal';
      this.focus();
      if (this.o.onResize) this.o.onResize();
    }

    maximize() {
      if (this.state === 'min') { this.restore(); }
      if (this.state !== 'max') this.saved = { x: this.el.offsetLeft, y: this.el.offsetTop, w: this.el.offsetWidth, h: this.el.offsetHeight };
      this.state = 'max';
      this.el.classList.add('max');
      this.fit();
      const mx = this.el.querySelector('.ctl.max'); if (mx) mx.innerHTML = SVG_RES;
      this.focus();
    }

    fit() {
      if (this.state !== 'max') return;
      Object.assign(this.el.style, { left: '-4px', top: '-4px', width: this.container.clientWidth + 8 + 'px', height: this.container.clientHeight + 8 + 'px' });
      if (this.o.onResize) this.o.onResize();
    }

    async close(force) {
      if (!force && this.o.onClose) {
        const ok = await this.o.onClose();
        if (ok === false) return false;
      }
      for (const c of [...this.children]) await c.close(true);
      all.delete(this);
      if (this.owner) this.owner.children.delete(this);
      if (this.trayIcon) this.trayIcon.remove();
      this.el.remove();
      if (this.o.onClosed) this.o.onClosed();
      if (Win.active === this) {
        Win.active = null;
        const next = [...all].filter((w) => !w.owner && w.state !== 'min').sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
        if (next) next.focus();
      }
      return true;
    }
  }

  addEventListener('resize', () => { for (const w of all) w.fit(); });

  // ---------------- dialogs ----------------
  function modal(o, build) {
    return new Promise((resolve) => {
      const prevModal = S79.modal;
      const blocker = $('<div style="position:absolute;inset:0;"></div>');
      blocker.style.zIndex = ++z;
      desktopEl().appendChild(blocker);
      const content = $('<div style="display:flex;flex-direction:column;flex:1;"></div>');
      let done = false;
      const finish = (v) => {
        if (done) return; done = true;
        S79.modal = prevModal;
        blocker.remove();
        win.close(true);
        if (prevWin && prevWin.state !== 'min') prevWin.focus();
        resolve(v);
      };
      const prevWin = Win.active;
      const win = new Win(Object.assign({ dialog: true, center: true, content, onClose: () => { finish(o.cancelValue != null ? o.cancelValue : null); return false; } }, o));
      S79.modal = win;
      win.focus();
      build(content, finish, win);
      // auto-height
      requestAnimationFrame(() => {
        if (!o.h) {
          const need = win.el.querySelector('.titlebar').offsetHeight + content.scrollHeight + 14;
          win.el.style.height = need + 'px';
          win.el.style.top = Math.max(0, (win.container.clientHeight - need) / 2.4) + 'px';
        }
        const f = content.querySelector('[autofocus]') || content.querySelector('.btn.default') || content.querySelector('.btn');
        if (f) f.focus();
      });
      content.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); finish(o.cancelValue != null ? o.cancelValue : null); }
      });
    });
  }

  function msgBox(o) {
    if (typeof o === 'string') o = { text: o };
    const buttons = o.buttons || ['OK'];
    return modal({ title: o.title || 'spreck79', w: o.w || 420, cancelValue: buttons.includes('Cancel') ? 'Cancel' : buttons[buttons.length - 1] }, (c, finish) => {
      const icon = S79Icons[o.icon || 'info'];
      c.appendChild($(`<div class="dlg-body"><span class="dlg-glyph">${icon}</span><div class="msg"></div></div>`));
      c.querySelector('.msg').textContent = o.text;
      const bb = $('<div class="dlg-btns"></div>');
      buttons.forEach((b, i) => {
        const btn = $(`<button class="btn${i === 0 ? ' default' : ''}">${esc(b)}</button>`);
        btn.addEventListener('click', () => finish(b));
        bb.appendChild(btn);
      });
      c.appendChild(bb);
    });
  }

  function promptBox(o) {
    return modal({ title: o.title || 'spreck79', w: o.w || 400 }, (c, finish) => {
      c.appendChild($(`<div class="col" style="padding:16px 18px 6px;"><label class="label-caps"></label><input class="field" autofocus spellcheck="false"></div>`));
      c.querySelector('label').textContent = o.label || '';
      const inp = c.querySelector('input'); inp.value = o.value || '';
      setTimeout(() => inp.select(), 30);
      const bb = $('<div class="dlg-btns" style="padding-top:10px"><button class="btn default">OK</button><button class="btn">Cancel</button></div>');
      bb.children[0].onclick = () => finish(inp.value);
      bb.children[1].onclick = () => finish(null);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(inp.value); });
      c.appendChild(bb);
    });
  }

  function fileDialog(o) {
    const FS = S79FS;
    let cwd = o.dir || 'C:\\DOCS';
    if (!FS.isDir(cwd)) cwd = 'C:\\';
    return modal({ title: o.title || (o.mode === 'save' ? 'Save As' : 'Open'), w: 460, h: 360 }, (c, finish) => {
      c.style.padding = '12px 14px';
      c.style.gap = '8px';
      c.appendChild($(`<div class="col" style="flex:1;min-height:0;">
        <label class="label-caps">File name</label>
        <input class="field fname" autofocus spellcheck="false">
        <div class="path" style="font-family:var(--mono);font-size:13px;color:var(--ink-muted)"></div>
        <div class="row" style="flex:1;min-height:0;align-items:stretch;gap:10px">
          <div class="listbox files" style="flex:1"></div>
          <div class="listbox dirs" style="flex:1"></div>
        </div>
        <div class="row" style="justify-content:flex-end;gap:12px;padding-top:4px">
          <button class="btn default ok">${o.mode === 'save' ? 'Save' : 'Open'}</button><button class="btn cancel">Cancel</button>
        </div></div>`));
      const fname = c.querySelector('.fname'), files = c.querySelector('.files'), dirs = c.querySelector('.dirs'), pathEl = c.querySelector('.path');
      fname.value = o.name || '';
      const ext = o.ext ? o.ext.toUpperCase() : null;
      function render() {
        pathEl.textContent = cwd;
        files.innerHTML = ''; dirs.innerHTML = '';
        if (cwd !== 'C:\\') {
          const up = $(`<div class="li"><span class="ic">${S79Icons.folder}</span>..</div>`);
          up.ondblclick = () => { cwd = FS.resolve(cwd, '..'); render(); };
          dirs.appendChild(up);
        }
        for (const { name, node } of FS.list(cwd)) {
          if (node.type === 'dir') {
            const d = $(`<div class="li"><span class="ic">${S79Icons.folder}</span>${esc(name)}</div>`);
            d.ondblclick = () => { cwd = FS.resolve(cwd, name); render(); };
            d.onclick = () => { dirs.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); d.classList.add('sel'); };
            dirs.appendChild(d);
          } else {
            if (ext && !name.endsWith('.' + ext) && !(ext === 'TXT' && /\.(BAT|SYS|INI|TXT)$/.test(name))) continue;
            const f = $(`<div class="li"><span class="ic">${S79Icons.forFile(name, node)}</span>${esc(name)}</div>`);
            f.onclick = () => { files.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); f.classList.add('sel'); fname.value = name; };
            f.ondblclick = () => { fname.value = name; ok(); };
            files.appendChild(f);
          }
        }
      }
      async function ok() {
        let n = fname.value.trim();
        if (!n) return;
        const p = FS.resolve(cwd, n);
        if (FS.isDir(p)) { cwd = p; fname.value = ''; render(); return; }
        if (o.mode === 'save') {
          if (ext && !/\./.test(n)) { n += '.' + ext; }
          const p2 = FS.resolve(cwd, n);
          const nm = FS.parentOf(p2).name;
          if (!FS.validName(nm)) { await msgBox({ title: 'Save As', icon: 'warn', text: nm + '\nis not a valid S79-DOS file name.\nUse up to 8 letters, a dot, and up to 3 more.' }); return; }
          if (FS.exists(p2)) {
            const a = await msgBox({ title: 'Save As', icon: 'question', text: p2 + ' already exists.\nReplace it?', buttons: ['Yes', 'No'] });
            if (a !== 'Yes') return;
          }
          finish(p2);
        } else {
          if (!FS.isFile(p)) { await msgBox({ title: 'Open', icon: 'warn', text: p + '\nFile not found.' }); return; }
          finish(p);
        }
      }
      fname.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
      c.querySelector('.ok').onclick = ok;
      c.querySelector('.cancel').onclick = () => finish(null);
      render();
    });
  }

  window.WM = { Win, msgBox, promptBox, fileDialog, modal, showMenu, closeMenus, all, $, esc, topZ: () => ++z };
})();
