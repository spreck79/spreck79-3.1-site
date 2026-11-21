// The programs that ship with spreck79 3.1.
(function () {
  const { Win, msgBox, promptBox, fileDialog, $, esc } = WM;
  const FS = S79FS, I = S79Icons;
  const A = {};

  // ======================= Quest Manager =======================
  const GROUPS = [
    { id: 'main', title: 'Main', x: 12, y: 12, w: 380, h: 190, items: ['prompt', 'cabinet', 'control', 'readme', 'about'] },
    { id: 'side', title: 'Side Quests', x: 404, y: 12, w: 330, h: 190, items: ['jotter', 'sketch', 'tally', 'clock', 'lookout'] },
    { id: 'games', title: 'Games', x: 12, y: 214, w: 240, h: 150, items: ['gopher'], min: true },
    { id: 'log', title: 'Quest Log', x: 264, y: 214, w: 360, h: 150, dynamic: 'C:\\QUESTS', min: true },
  ];
  const ITEM = {
    prompt: { label: 'S79-DOS Prompt', icon: 'prompt', run: () => S79.launch('prompt') },
    cabinet: { label: 'File Cabinet', icon: 'cabinet', run: () => S79.launch('cabinet') },
    control: { label: 'Control Panel', icon: 'control', run: () => S79.launch('control') },
    readme: { label: 'Read Me', icon: 'file', run: () => S79.launch('jotter', { file: 'C:\\README.TXT' }) },
    about: { label: 'About 3.1', icon: 'about', run: () => S79.launch('about') },
    jotter: { label: 'Jotter', icon: 'jotter', run: () => S79.launch('jotter') },
    sketch: { label: 'Sketch', icon: 'sketch', run: () => S79.launch('sketch') },
    tally: { label: 'Tally', icon: 'tally', run: () => S79.launch('tally') },
    clock: { label: 'Clock', icon: 'clock', run: () => S79.launch('clock') },
    gopher: { label: 'Gopher Fields', icon: 'gopher', run: () => S79.launch('gopher') },
    lookout: { label: 'Lookout', icon: 'lookout', run: () => S79.launch('lookout') },
  };

  function iconEl(label, svg, run) {
    const ic = $(`<div class="icon" tabindex="0"><span class="glyph">${svg}</span><span class="label"></span></div>`);
    ic.querySelector('.label').textContent = label;
    ic.addEventListener('pointerdown', () => {
      ic.parentElement.querySelectorAll('.icon.selected').forEach((x) => x.classList.remove('selected'));
      ic.classList.add('selected');
    });
    // Mouse: double-click opens. Touch: a single tap opens (phones have no double-click).
    let tappedAt = 0;
    ic.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') { tappedAt = Date.now(); run(); } });
    ic.addEventListener('dblclick', () => { if (Date.now() - tappedAt > 700) run(); });
    ic.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    return ic;
  }

  A.questmgr = {
    title: 'Quest Manager', icon: 'questmgr',
    open() {
      if (S79.questmgr) { S79.questmgr.state === 'min' ? S79.questmgr.restore() : S79.questmgr.focus(); return S79.questmgr; }
      const mdi = $('<div class="mdi"><div class="tray"></div></div>');
      const groups = [];
      const win = new Win({
        title: 'Quest Manager', icon: I.questmgr, x: 30, y: 24, w: Math.min(760, innerWidth - 80), h: Math.min(440, innerHeight - 100), content: mdi,
        onClose: () => S79.exitGUI(),
        onResize: () => { groups.forEach((g) => g.fit()); if (WM.isSmall() && groups.length) arrange('tile'); },
      });
      const tray = mdi.querySelector('.tray');
      const fillGroup = (g, field) => {
        field.innerHTML = '';
        if (g.dynamic) {
          for (const { name, node } of FS.list(g.dynamic) || []) {
            if (node.type !== 'file') continue;
            const p = g.dynamic + '\\' + name;
            field.appendChild(iconEl(name.replace(/\.TXT$/, '').toLowerCase().replace(/^./, (c) => c.toUpperCase()), I.forFile(name, node), () => S79.openFile(p)));
          }
        } else {
          for (const id of g.items) { const it = ITEM[id]; field.appendChild(iconEl(it.label, I[it.icon], it.run)); }
        }
      };
      for (const g of GROUPS) {
        const field = $('<div class="iconfield"></div>');
        const gw = new Win({ parent: mdi, tray, owner: win, title: g.title, icon: I.group, x: g.x, y: g.y, w: g.w, h: g.h, content: field, minW: 180, minH: 100, onClose: () => { gw.minimize(); return false; } });
        gw.fill = () => fillGroup(g, field);
        gw.fill();
        gw.def = g;
        if (g.min) gw.minimize();
        groups.push(gw);
      }
      groups[0].focus();
      function arrange(mode) {
        const open = groups.filter((g) => g.state !== 'min');
        const W = mdi.clientWidth, H = mdi.clientHeight - (tray.children.length ? 80 : 0);
        if (!W || !H) return;
        open.forEach((g, i) => {
          if (g.state === 'max') g.restore();
          if (mode === 'cascade') Object.assign(g.el.style, { left: 10 + i * 24 + 'px', top: 10 + i * 24 + 'px', width: Math.max(220, W * 0.6) + 'px', height: Math.max(140, H * 0.6) + 'px' });
          else {
            // Narrow screens stack the groups top to bottom; wide ones tile in a grid.
            const cols = W < 600 ? 1 : Math.ceil(Math.sqrt(open.length)), rows = Math.ceil(open.length / cols);
            const cw = W / cols, rh = H / rows;
            Object.assign(g.el.style, { left: (i % cols) * cw + 'px', top: Math.floor(i / cols) * rh + 'px', width: cw + 'px', height: rh + 'px' });
          }
          g.focus();
        });
      }
      // Phones: Quest Manager opens maximized (window manager), so stack its groups to fit.
      if (WM.isSmall()) requestAnimationFrame(() => arrange('tile'));
      win.setMenu([
        { label: 'File', items: [
          { label: 'Open', key: 'Enter', action: () => { const s = mdi.querySelector('.win.active .icon.selected'); if (s) s.dispatchEvent(new MouseEvent('dblclick')); } },
          { label: 'New Note...', action: () => S79.launch('jotter') },
          { sep: true },
          { label: 'Run...', action: () => S79.runDialog() },
          { sep: true },
          { label: 'Exit spreck79...', action: () => win.close() },
        ] },
        { label: 'Options', items: () => [
          { label: 'Prairie theme', checked: S79.settings.theme === 'prairie', action: () => S79.set('theme', 'prairie') },
          { label: 'Prairie dark theme', checked: S79.settings.theme === 'dark', action: () => S79.set('theme', 'dark') },
          { sep: true },
          { label: 'Startup chime', checked: S79.settings.chime, action: () => S79.set('chime', !S79.settings.chime) },
          document.fullscreenEnabled ? { label: 'Full screen', key: 'F11', action: () => S79.fullscreen() } : null, // iPhone Safari has no full screen
        ] },
        { label: 'Window', items: () => [
          { label: 'Cascade', key: 'Shift+F5', action: () => arrange('cascade') },
          { label: 'Tile', key: 'Shift+F4', action: () => arrange('tile') },
          { label: 'Refresh Quest Log', action: () => groups.forEach((g) => g.fill()) },
          { sep: true },
          ...groups.map((g, i) => ({ label: `${i + 1} ${g.title}`, checked: g.el.classList.contains('active') && g.state !== 'min', action: () => (g.state === 'min' ? g.restore() : g.focus()) })),
        ] },
        { label: 'Help', items: [
          { label: 'Read Me', action: () => S79.launch('jotter', { file: 'C:\\README.TXT' }) },
          { label: 'S79-DOS Commands', action: () => S79.launch('prompt', { run: 'HELP' }) },
          { sep: true },
          { label: 'About spreck79 3.1...', action: () => S79.launch('about') },
        ] },
      ]);
      win.groups = groups;
      win.refresh = () => groups.forEach((g) => g.fill());
      S79.questmgr = win;
      win.o.onClosed = () => { S79.questmgr = null; };
      return win;
    },
  };

  // ======================= Jotter (text editor) =======================
  A.jotter = {
    title: 'Jotter', icon: 'jotter',
    open(opts = {}) {
      const box = $('<div style="flex:1;display:flex;flex-direction:column;min-height:0"><textarea class="jotter" spellcheck="false"></textarea><div class="statusbar"><span class="pos">Ln 1, Col 1</span><span class="info"></span></div></div>');
      const ta = box.querySelector('textarea'), pos = box.querySelector('.pos'), info = box.querySelector('.info');
      let path = null, dirty = false, wrap = localStorage.getItem('s79-jot-wrap') === '1';
      ta.classList.toggle('wrap', wrap);
      const name = () => (path ? FS.parentOf(path).name : '(Untitled)');
      const win = new Win({ title: 'Jotter', icon: I.jotter, w: 600, h: 420, content: box, white: true, onClose: () => askSave(), onFocus: () => setTimeout(() => ta.focus(), 0) });
      const setT = () => win.setTitle('Jotter - ' + name() + (dirty ? ' *' : ''));
      const load = (p) => { path = p; ta.value = FS.read(p).replace(/\r\n/g, '\n'); dirty = false; setT(); ta.setSelectionRange(0, 0); ta.scrollTop = 0; info.textContent = p; };
      async function save(as) {
        if (!path || as) {
          const p = await fileDialog({ mode: 'save', title: 'Save As', ext: 'TXT', dir: path ? FS.parentOf(path).dir : 'C:\\DOCS', name: path ? FS.parentOf(path).name : '' });
          if (!p) return false;
          path = p;
        }
        try { FS.write(path, ta.value.replace(/\n/g, '\r\n')); } catch (e) { await msgBox({ title: 'Jotter', icon: 'stop', text: e.message }); return false; }
        dirty = false; setT(); info.textContent = path + ' saved';
        S79.refresh();
        return true;
      }
      async function askSave() {
        if (!dirty) return true;
        const a = await msgBox({ title: 'Jotter', icon: 'question', text: 'Save the changes to ' + name() + '?', buttons: ['Yes', 'No', 'Cancel'] });
        if (a === 'Cancel') return false;
        if (a === 'Yes') return save();
        return true;
      }
      const updPos = () => {
        const before = ta.value.slice(0, ta.selectionStart).split('\n');
        pos.textContent = `Ln ${before.length}, Col ${before[before.length - 1].length + 1}`;
      };
      ta.addEventListener('input', () => { if (!dirty) { dirty = true; setT(); } updPos(); });
      ['keyup', 'click'].forEach((ev) => ta.addEventListener(ev, updPos));
      const stamp = () => { ta.setRangeText(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('en-US'), ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); };
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'F5') { e.preventDefault(); stamp(); }
        if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
        if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('\t', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
      });
      win.setMenu([
        { label: 'File', items: [
          { label: 'New', action: async () => { if (await askSave()) { path = null; ta.value = ''; dirty = false; setT(); info.textContent = ''; } } },
          { label: 'Open...', action: async () => { if (!(await askSave())) return; const p = await fileDialog({ mode: 'open', ext: 'TXT', dir: path ? FS.parentOf(path).dir : 'C:\\DOCS' }); if (p) load(p); } },
          { label: 'Save', key: 'Ctrl+S', action: () => save() },
          { label: 'Save As...', action: () => save(true) },
          { sep: true },
          { label: 'Exit', action: () => win.close() },
        ] },
        { label: 'Edit', items: [
          { label: 'Undo', key: 'Ctrl+Z', action: () => { ta.focus(); document.execCommand('undo'); } },
          { sep: true },
          { label: 'Cut', key: 'Ctrl+X', action: () => { ta.focus(); document.execCommand('cut'); } },
          { label: 'Copy', key: 'Ctrl+C', action: () => { ta.focus(); document.execCommand('copy'); } },
          { label: 'Paste', key: 'Ctrl+V', action: async () => { ta.focus(); try { const t = await navigator.clipboard.readText(); ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); } catch (e) {} } },
          { sep: true },
          { label: 'Select All', key: 'Ctrl+A', action: () => { ta.focus(); ta.select(); } },
          { label: 'Time/Date', key: 'F5', action: () => { ta.focus(); stamp(); } },
        ] },
        { label: 'Format', items: () => [
          { label: 'Word Wrap', checked: wrap, action: () => { wrap = !wrap; ta.classList.toggle('wrap', wrap); try { localStorage.setItem('s79-jot-wrap', wrap ? '1' : '0'); } catch (e) {} } },
        ] },
        { label: 'Help', items: [{ label: 'About Jotter...', action: () => msgBox({ title: 'Jotter', icon: 'about', text: 'Jotter 3.1\nFor notes, lists, and quest logs.\nF5 stamps the time and date.' }) }] },
      ]);
      if (opts.file) {
        if (FS.isFile(opts.file)) load(opts.file);
        else if (opts.create) { path = opts.file; setT(); info.textContent = path + ' (new file)'; }
      } else setT();
      setTimeout(() => ta.focus(), 0);
      return win;
    },
  };

  // ======================= File Cabinet =======================
  A.cabinet = {
    title: 'File Cabinet', icon: 'cabinet',
    open() {
      const box = $(`<div style="flex:1;display:flex;flex-direction:column;min-height:0">
        <div class="cab"><div class="drivebar"></div></div></div>`);
      box.innerHTML = `<div class="drivebar" style="display:flex;gap:10px;align-items:center;padding:4px 8px;border-bottom:1px solid var(--frame);font-size:13px"><span class="label-caps">Drive</span><b>C: SPRECK79</b><span class="path" style="font-family:var(--mono);color:var(--ink-muted);margin-left:auto"></span></div>
        <div class="cab"><div class="listbox tree"></div><div class="listbox files"></div></div>
        <div class="statusbar"><span class="st"></span></div>`;
      const tree = box.querySelector('.tree'), files = box.querySelector('.files'), st = box.querySelector('.st'), pathEl = box.querySelector('.path');
      let cwd = 'C:\\', sel = null;
      const win = new Win({ title: 'File Cabinet - C:\\', icon: I.cabinet, w: 640, h: 420, content: box, minW: 380, minH: 220 });
      const join = (d, n) => (d.endsWith('\\') ? d : d + '\\') + n;
      function render() {
        if (!FS.isDir(cwd)) cwd = 'C:\\';
        win.setTitle('File Cabinet - ' + cwd);
        pathEl.textContent = cwd;
        tree.innerHTML = '';
        const walk = (p, depth, label) => {
          const li = $(`<div class="li" style="padding-left:${6 + depth * 16}px"><span class="ic">${I.folder}</span><span></span></div>`);
          li.lastChild.textContent = label;
          if (p === cwd) li.classList.add('sel');
          li.onclick = () => { cwd = p; sel = null; render(); };
          tree.appendChild(li);
          if (cwd === p || cwd.startsWith(p === 'C:\\' ? p : p + '\\') || depth === 0) {
            for (const { name, node } of FS.list(p)) if (node.type === 'dir') walk(join(p, name), depth + 1, name);
          }
        };
        walk('C:\\', 0, 'C:\\');
        files.innerHTML = '';
        let n = 0, bytes = 0;
        for (const { name, node } of FS.list(cwd)) {
          const p = join(cwd, name);
          const sz = node.type === 'dir' ? '' : FS.sizeOf(node).toLocaleString('en-US');
          const li = $(`<div class="li"><span class="ic">${I.forFile(name, node)}</span><span style="flex:1"></span><span style="color:inherit;opacity:.7;font-size:12px">${sz}</span></div>`);
          li.children[1].textContent = name;
          if (sel === p) li.classList.add('sel');
          li.onclick = () => { sel = p; files.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); li.classList.add('sel'); st.textContent = p; };
          li.ondblclick = () => open(p);
          files.appendChild(li);
          if (node.type === 'file') { n++; bytes += FS.sizeOf(node); }
        }
        st.textContent = `${n} file(s), ${bytes.toLocaleString('en-US')} bytes · ${(FS.capacity - FS.used()).toLocaleString('en-US')} bytes free`;
      }
      function open(p) {
        if (FS.isDir(p)) { cwd = p; sel = null; render(); }
        else S79.openFile(p);
      }
      async function del() {
        if (!sel) return;
        const isDir = FS.isDir(sel);
        const a = await msgBox({ title: 'Delete', icon: 'warn', text: `Delete ${sel}${isDir ? '\nand everything inside it' : ''}?`, buttons: ['Yes', 'No'] });
        if (a !== 'Yes') return;
        try { FS.remove(sel, true); sel = null; } catch (e) { msgBox({ title: 'Delete', icon: 'stop', text: e.message }); }
        S79.refresh();
      }
      async function ren() {
        if (!sel) return;
        const v = await promptBox({ title: 'Rename', label: 'New name for ' + FS.parentOf(sel).name, value: FS.parentOf(sel).name });
        if (!v) return;
        try { FS.rename(sel, v); sel = join(FS.parentOf(sel).dir, v.toUpperCase()); } catch (e) { msgBox({ title: 'Rename', icon: 'stop', text: e.message }); }
        S79.refresh();
      }
      async function mkd() {
        const v = await promptBox({ title: 'Create Directory', label: 'Name (in ' + cwd + ')' });
        if (!v) return;
        try { FS.mkdir(join(cwd, v)); } catch (e) { msgBox({ title: 'Create Directory', icon: 'stop', text: e.message }); }
        S79.refresh();
      }
      async function copy() {
        if (!sel || !FS.isFile(sel)) return;
        const v = await promptBox({ title: 'Copy', label: 'Copy ' + FS.parentOf(sel).name + ' to', value: sel });
        if (!v) return;
        try { FS.copy(sel, FS.resolve(cwd, v)); } catch (e) { msgBox({ title: 'Copy', icon: 'stop', text: e.message }); }
        S79.refresh();
      }
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Delete') del();
        if (e.key === 'F2') ren();
        if (e.key === 'Enter' && sel) open(sel);
        if (e.key === 'Backspace' && cwd !== 'C:\\') { cwd = FS.resolve(cwd, '..'); render(); }
      });
      box.tabIndex = 0;
      win.setMenu([
        { label: 'File', items: [
          { label: 'Open', key: 'Enter', action: () => sel && open(sel) },
          { label: 'Copy...', action: copy },
          { label: 'Rename...', key: 'F2', action: ren },
          { label: 'Delete', key: 'Del', action: del },
          { sep: true },
          { label: 'Create Directory...', action: mkd },
          { label: 'New Text File...', action: async () => { const v = await promptBox({ title: 'New Text File', label: 'File name', value: 'NOTES.TXT' }); if (v) { try { FS.write(join(cwd, v), ''); S79.refresh(); } catch (e) { msgBox({ title: 'New File', icon: 'stop', text: e.message }); } } } },
          { sep: true },
          { label: 'Exit', action: () => win.close() },
        ] },
        { label: 'View', items: [
          { label: 'Up One Level', key: 'Bksp', action: () => { cwd = FS.resolve(cwd, '..'); render(); } },
          { label: 'Refresh', action: render },
        ] },
        { label: 'Help', items: [{ label: 'About File Cabinet...', action: () => msgBox({ title: 'File Cabinet', icon: 'cabinet', text: 'File Cabinet 3.1\nEverything on drive C:, filed neatly.\nThe same disk S79-DOS uses.' }) }] },
      ]);
      win.refresh = render;
      render();
      return win;
    },
  };

  // ======================= Tally (calculator) =======================
  A.tally = {
    title: 'Tally', icon: 'tally',
    open() {
      const box = $(`<div class="tally"><div class="disp"><span class="mem"></span><span class="v">0</span></div><div class="keys"></div></div>`);
      const keys = box.querySelector('.keys'), out = box.querySelector('.v'), memEl = box.querySelector('.mem');
      const layout = [
        ['MC', 'fn'], ['MR', 'fn'], ['M+', 'fn'], ['M-', 'fn'], ['\u221a', 'fn'],
        ['7'], ['8'], ['9'], ['/', 'op'], ['C', 'clr'],
        ['4'], ['5'], ['6'], ['*', 'op'], ['CE', 'clr'],
        ['1'], ['2'], ['3'], ['-', 'op'], ['%', 'fn'],
        ['0'], ['.'], ['\u00b1', 'fn'], ['+', 'op'], ['=', 'eq'],
      ];
      let cur = '0', acc = null, op = null, fresh = true, mem = 0;
      const fmt = (n) => { if (!isFinite(n)) return 'Error'; const s = String(+n.toPrecision(12)); return s.length > 14 ? n.toExponential(6) : s; };
      const show = () => { out.textContent = cur; memEl.textContent = mem ? 'M' : ''; };
      const calc = (a, b, o) => (o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : o === '/' ? a / b : b);
      function press(k) {
        if (/^[0-9]$/.test(k)) { cur = fresh || cur === '0' ? k : cur.length < 14 ? cur + k : cur; fresh = false; }
        else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
        else if ('+-*/'.includes(k)) { if (op && !fresh) cur = fmt(calc(acc, +cur, op)); acc = +cur; op = k; fresh = true; }
        else if (k === '=') { if (op) { cur = fmt(calc(acc, +cur, op)); op = null; acc = null; fresh = true; } }
        else if (k === 'C') { cur = '0'; acc = null; op = null; fresh = true; }
        else if (k === 'CE') { cur = '0'; fresh = true; }
        else if (k === '\u00b1') { cur = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur; }
        else if (k === '\u221a') { cur = fmt(Math.sqrt(+cur)); fresh = true; }
        else if (k === '%') { cur = fmt(acc != null ? (acc * +cur) / 100 : +cur / 100); fresh = true; }
        else if (k === 'MC') mem = 0; else if (k === 'MR') { cur = fmt(mem); fresh = true; }
        else if (k === 'M+') { mem += +cur; fresh = true; } else if (k === 'M-') { mem -= +cur; fresh = true; }
        else if (k === 'BS') { if (!fresh) cur = cur.length > 1 ? cur.slice(0, -1) : '0'; }
        show();
      }
      for (const [k, c] of layout) {
        const b = $(`<button class="btn${c ? ' ' + c : ''}">${k}</button>`);
        b.addEventListener('click', () => press(k));
        keys.appendChild(b);
      }
      box.tabIndex = 0;
      box.addEventListener('keydown', (e) => {
        const map = { Enter: '=', Escape: 'C', Delete: 'CE', Backspace: 'BS' };
        const k = map[e.key] || e.key;
        if (/^[0-9.+\-*/=%]$/.test(k) || ['C', 'CE', 'BS'].includes(k)) { e.preventDefault(); press(k); }
        if (e.ctrlKey && e.key === 'c') navigator.clipboard.writeText(cur).catch(() => {});
      });
      const win = new Win({ title: 'Tally', icon: I.tally, w: 300, h: 330, resizable: false, content: box, onFocus: () => setTimeout(() => box.focus(), 0) });
      win.setMenu([
        { label: 'Edit', items: [
          { label: 'Copy', key: 'Ctrl+C', action: () => navigator.clipboard.writeText(cur).catch(() => {}) },
          { label: 'Paste', key: 'Ctrl+V', action: async () => { try { const t = (await navigator.clipboard.readText()).trim(); if (!isNaN(+t)) { cur = t; fresh = true; show(); } } catch (e) {} } },
        ] },
        { label: 'Help', items: [{ label: 'About Tally...', action: () => msgBox({ title: 'Tally', icon: 'tally', text: 'Tally 3.1\nCounts filament, miles and snacks.\nType on the keyboard, too.' }) }] },
      ]);
      requestAnimationFrame(() => { win.el.style.height = win.el.querySelector('.titlebar').offsetHeight + win.el.querySelector('.menubar').offsetHeight + box.scrollHeight + 14 + 'px'; });
      setTimeout(() => box.focus(), 0);
      return win;
    },
  };

  // ======================= Clock =======================
  A.clock = {
    title: 'Clock', icon: 'clock',
    open() {
      const box = $('<div class="clock"><canvas></canvas><div class="digital" style="display:none"></div></div>');
      const cv = box.querySelector('canvas'), dg = box.querySelector('.digital');
      let mode = localStorage.getItem('s79-clock') || 'analog', secs = true;
      const win = new Win({ title: 'Clock', icon: I.clock, w: 260, h: 300, content: box, minW: 180, minH: 180, onClosed: () => clearInterval(t) });
      const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      function draw() {
        const d = new Date();
        if (win.state === 'min') { win.setTitle(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })); return; }
        win.setTitle('Clock');
        cv.style.display = mode === 'analog' ? 'block' : 'none';
        dg.style.display = mode === 'analog' ? 'none' : 'block';
        if (mode !== 'analog') {
          dg.innerHTML = esc(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: secs ? '2-digit' : undefined })) + '<small>' + esc(d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })) + '</small>';
          return;
        }
        const W = box.clientWidth, H = box.clientHeight, s = Math.max(60, Math.min(W, H) - 24), dpr = devicePixelRatio || 1;
        cv.width = s * dpr; cv.height = s * dpr; cv.style.width = cv.style.height = s + 'px';
        const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const c = s / 2, ink = css('--ink');
        // square Prairie face
        g.fillStyle = css('--field'); g.fillRect(0, 0, s, s);
        g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2);
        g.strokeRect(s * 0.06, s * 0.06, s * 0.88, s * 0.88);
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * Math.PI * 2, r = s * 0.38;
          const x = c + Math.sin(a) * r, y = c - Math.cos(a) * r;
          if (i % 5 === 0) { const q = i % 15 === 0 ? s * 0.05 : s * 0.03; g.fillStyle = i % 15 === 0 ? css('--primary') : ink; g.fillRect(x - q / 2, y - q / 2, q, q); }
          else if (s > 140) { g.fillStyle = css('--line'); g.fillRect(x - 1, y - 1, 2, 2); }
        }
        const hand = (ang, len, w, col) => { g.save(); g.translate(c, c); g.rotate(ang); g.fillStyle = col; g.fillRect(-w / 2, -len, w, len + w * 1.5); g.restore(); };
        const h = d.getHours() % 12, m = d.getMinutes(), sc = d.getSeconds();
        hand(((h + m / 60) / 12) * Math.PI * 2, s * 0.22, Math.max(4, s * 0.035), css('--pop'));
        hand(((m + sc / 60) / 60) * Math.PI * 2, s * 0.32, Math.max(3, s * 0.025), ink);
        if (secs) hand((sc / 60) * Math.PI * 2, s * 0.35, 2, css('--primary'));
        g.fillStyle = css('--secondary'); const k = Math.max(6, s * 0.05); g.fillRect(c - k / 2, c - k / 2, k, k);
      }
      win.setMenu([{ label: 'Settings', items: () => [
        { label: 'Analog', checked: mode === 'analog', action: () => { mode = 'analog'; localStorage.setItem('s79-clock', mode); draw(); } },
        { label: 'Digital', checked: mode === 'digital', action: () => { mode = 'digital'; localStorage.setItem('s79-clock', mode); draw(); } },
        { sep: true },
        { label: 'Seconds', checked: secs, action: () => { secs = !secs; draw(); } },
      ] }]);
      win.o.onResize = draw;
      const t = setInterval(draw, 1000);
      requestAnimationFrame(draw);
      return win;
    },
  };

  // ======================= Sketch (paint) =======================
  A.sketch = {
    title: 'Sketch', icon: 'sketch',
    open(opts = {}) {
      const TOOLS = {
        pencil: '<path d="M3 13 L11 5 L13 7 L5 15 L2 15 Z"/>',
        brush: '<path d="M10 2 L14 6 L8 12 L5 9 Z M5 10 Q2 11 2 15 Q6 15 7 12"/>',
        line: '<path d="M2 14 L14 2"/>',
        rect: '<rect x="2.5" y="4.5" width="11" height="8"/>',
        rectf: '<rect x="2.5" y="4.5" width="11" height="8" fill="currentColor"/>',
        ellipse: '<ellipse cx="8" cy="8.5" rx="6" ry="4.5"/>',
        ellipsef: '<ellipse cx="8" cy="8.5" rx="6" ry="4.5" fill="currentColor"/>',
        fill: '<path d="M3 8 L8 3 L13 8 L8 13 Z M13 9 Q15 12 13.5 13.5"/>',
        eraser: '<path d="M2 11 L8 5 L13 10 L9 14 L5 14 Z M5 8 L10 13"/>',
        picker: '<path d="M12 2 L14 4 L7 11 L4 12 L5 9 Z M2 14 L4 12"/>',
      };
      const COLORS = ['#2E2620', '#5E5245', '#C9B897', '#E4D8C1', '#F2EBDD', '#FFFFFF', '#9E3324', '#E0735C', '#C08A2E', '#D9A441', '#5F6E41', '#A9B884', '#3E5C6B', '#8FB0BF', '#171310', '#7A2618'];
      const box = $(`<div style="flex:1;display:flex;flex-direction:column;min-height:0">
        <div class="sketch"><div class="tools"></div><div class="canvas-wrap"><canvas width="640" height="420"></canvas></div></div>
        <div class="palette"><div class="cur"><i class="fg"></i><i class="bg"></i></div></div></div>`);
      const toolsEl = box.querySelector('.tools'), cv = box.querySelector('canvas'), g = cv.getContext('2d', { willReadFrequently: true }), pal = box.querySelector('.palette');
      let tool = 'pencil', size = 3, fg = '#2E2620', bg = '#FFFFFF', path = null, dirty = false;
      const undo = [];
      const win = new Win({ title: 'Sketch - (Untitled)', icon: I.sketch, w: 760, h: 560, content: box, onClose: () => askSave() });
      const setT = () => win.setTitle('Sketch - ' + (path ? FS.parentOf(path).name : '(Untitled)') + (dirty ? ' *' : ''));
      const clear = () => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, cv.width, cv.height); };
      clear();
      for (const [k, svg] of Object.entries(TOOLS)) {
        const b = $(`<button title="${k}" style="color:var(--ink)"><svg viewBox="0 0 16 16">${svg}</svg></button>`);
        if (k === tool) b.classList.add('on');
        b.onclick = () => { tool = k; toolsEl.querySelectorAll('button[title]').forEach((x) => x.classList.toggle('on', x === b)); };
        toolsEl.appendChild(b);
      }
      const sizes = $('<div class="sizes"></div>');
      [1, 3, 6, 10].forEach((s) => {
        const b = $(`<button><i style="height:${Math.min(s, 8)}px;margin:auto"></i></button>`);
        if (s === size) b.classList.add('on');
        b.onclick = () => { size = s; sizes.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
        sizes.appendChild(b);
      });
      toolsEl.appendChild(sizes);
      const curFg = pal.querySelector('.fg'), curBg = pal.querySelector('.bg');
      const showCur = () => { curFg.style.background = fg; curBg.style.background = bg; };
      showCur();
      for (const c of COLORS) {
        const sw = $(`<div class="sw" style="background:${c}"></div>`);
        sw.addEventListener('pointerdown', (e) => { if (e.button === 2) bg = c; else fg = c; showCur(); });
        sw.addEventListener('contextmenu', (e) => e.preventDefault());
        pal.appendChild(sw);
      }
      const pushUndo = () => { undo.push(g.getImageData(0, 0, cv.width, cv.height)); if (undo.length > 25) undo.shift(); };
      const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      function flood(x, y, col) {
        const W = cv.width, H = cv.height, img = g.getImageData(0, 0, W, H), d = img.data;
        const i0 = (y * W + x) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]], [r, gg, b] = hex(col);
        if (t[0] === r && t[1] === gg && t[2] === b) return;
        const same = (i) => Math.abs(d[i] - t[0]) < 8 && Math.abs(d[i + 1] - t[1]) < 8 && Math.abs(d[i + 2] - t[2]) < 8 && Math.abs(d[i + 3] - t[3]) < 8;
        const st = [[x, y]];
        while (st.length) {
          let [px, py] = st.pop();
          let i = (py * W + px) * 4;
          while (px >= 0 && same(i)) { px--; i -= 4; }
          px++; i += 4;
          let up = false, dn = false;
          while (px < W && same(i)) {
            d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
            if (py > 0) { const u = i - W * 4; if (same(u)) { if (!up) { st.push([px, py - 1]); up = true; } } else up = false; }
            if (py < H - 1) { const v = i + W * 4; if (same(v)) { if (!dn) { st.push([px, py + 1]); dn = true; } } else dn = false; }
            px++; i += 4;
          }
        }
        g.putImageData(img, 0, 0);
      }
      const pt = (e) => { const r = cv.getBoundingClientRect(); return [Math.floor(((e.clientX - r.left) * cv.width) / r.width), Math.floor(((e.clientY - r.top) * cv.height) / r.height)]; };
      let drawing = null;
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      cv.addEventListener('pointerdown', (e) => {
        const [x, y] = pt(e), col = e.button === 2 ? bg : fg;
        if (tool === 'picker') { const p = g.getImageData(x, y, 1, 1).data; const h = '#' + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); if (e.button === 2) bg = h; else fg = h; showCur(); return; }
        pushUndo(); dirty = true; setT();
        if (tool === 'fill') { flood(x, y, col); return; }
        cv.setPointerCapture(e.pointerId);
        drawing = { x0: x, y0: y, lx: x, ly: y, col: tool === 'eraser' ? bg : col, snap: g.getImageData(0, 0, cv.width, cv.height) };
        if (['pencil', 'brush', 'eraser'].includes(tool)) stroke(x, y, x, y);
      });
      const lw = () => (tool === 'pencil' ? Math.max(1, Math.ceil(size / 2)) : tool === 'eraser' ? size * 3 + 4 : size * 2);
      function stroke(a, b, c, d) {
        g.strokeStyle = drawing.col; g.lineWidth = lw(); g.lineCap = tool === 'brush' ? 'round' : 'square'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(a + 0.5, b + 0.5); g.lineTo(c + 0.5, d + 0.5); g.stroke();
      }
      cv.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        const [x, y] = pt(e);
        if (['pencil', 'brush', 'eraser'].includes(tool)) { stroke(drawing.lx, drawing.ly, x, y); drawing.lx = x; drawing.ly = y; return; }
        g.putImageData(drawing.snap, 0, 0);
        g.strokeStyle = g.fillStyle = drawing.col; g.lineWidth = Math.max(1, size); g.lineCap = 'square';
        let { x0, y0 } = drawing;
        if (e.shiftKey && tool !== 'line') { const m = Math.max(Math.abs(x - x0), Math.abs(y - y0)); x = x0 + Math.sign(x - x0 || 1) * m; y = y0 + Math.sign(y - y0 || 1) * m; }
        g.beginPath();
        if (tool === 'line') { g.moveTo(x0 + 0.5, y0 + 0.5); g.lineTo(x + 0.5, y + 0.5); g.stroke(); }
        else if (tool === 'rect') g.strokeRect(Math.min(x0, x) + 0.5, Math.min(y0, y) + 0.5, Math.abs(x - x0), Math.abs(y - y0));
        else if (tool === 'rectf') g.fillRect(Math.min(x0, x), Math.min(y0, y), Math.abs(x - x0) + 1, Math.abs(y - y0) + 1);
        else { g.ellipse((x0 + x) / 2, (y0 + y) / 2, Math.abs(x - x0) / 2 + 0.01, Math.abs(y - y0) / 2 + 0.01, 0, 0, Math.PI * 2); tool === 'ellipsef' ? g.fill() : g.stroke(); }
      });
      const end = () => { drawing = null; };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

      async function save(as) {
        if (!path || as) {
          const p = await fileDialog({ mode: 'save', title: 'Save Picture', ext: 'PIC', dir: 'C:\\PICTURES', name: path ? FS.parentOf(path).name : '' });
          if (!p) return false; path = p;
        }
        try { FS.write(path, cv.toDataURL('image/png')); } catch (e) { await msgBox({ title: 'Sketch', icon: 'stop', text: e.message.includes('quota') ? 'Drive C: is full.' : e.message }); return false; }
        dirty = false; setT(); S79.refresh(); return true;
      }
      async function askSave() {
        if (!dirty) return true;
        const a = await msgBox({ title: 'Sketch', icon: 'question', text: 'Save changes to this picture?', buttons: ['Yes', 'No', 'Cancel'] });
        if (a === 'Cancel') return false;
        return a === 'Yes' ? save() : true;
      }
      function load(p) {
        const img = new Image();
        img.onload = () => { cv.width = img.width; cv.height = img.height; clear(); g.drawImage(img, 0, 0); path = p; dirty = false; undo.length = 0; setT(); };
        img.onerror = () => msgBox({ title: 'Sketch', icon: 'stop', text: 'That picture could not be read.' });
        img.src = FS.read(p);
      }
      const doUndo = () => { const u = undo.pop(); if (u) { g.putImageData(u, 0, 0); dirty = true; setT(); } };
      box.tabIndex = 0;
      box.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); } if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
      win.setMenu([
        { label: 'File', items: [
          { label: 'New', action: async () => { if (await askSave()) { cv.width = 640; cv.height = 420; clear(); path = null; dirty = false; undo.length = 0; setT(); } } },
          { label: 'Open...', action: async () => { if (!(await askSave())) return; const p = await fileDialog({ mode: 'open', ext: 'PIC', dir: 'C:\\PICTURES' }); if (p) load(p); } },
          { label: 'Save', key: 'Ctrl+S', action: () => save() },
          { label: 'Save As...', action: () => save(true) },
          { sep: true },
          { label: 'Exit', action: () => win.close() },
        ] },
        { label: 'Edit', items: [
          { label: 'Undo', key: 'Ctrl+Z', action: doUndo },
          { label: 'Clear Picture', action: () => { pushUndo(); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height); dirty = true; setT(); } },
        ] },
        { label: 'Prairie', items: [
          { label: 'Paint Stripes', action: () => { pushUndo(); const y = cv.height * 0.62, w = cv.width; g.fillStyle = '#9E3324'; g.fillRect(0, y, w, 12); g.fillStyle = '#C08A2E'; g.fillRect(0, y + 18, w, 8); g.fillStyle = '#3E5C6B'; g.fillRect(0, y + 32, w, 18); dirty = true; setT(); } },
          { label: 'Prairie Grid', action: () => { pushUndo(); g.fillStyle = '#2E2620'; for (let x = 80; x < cv.width; x += 120) g.fillRect(x, 0, 2, cv.height); for (let y = 70; y < cv.height; y += 110) g.fillRect(0, y, cv.width, 2); [['#9E3324', 202, 72], ['#C08A2E', 442, 182], ['#5F6E41', 82, 292]].forEach(([c, x, y]) => { g.fillStyle = c; g.fillRect(x, y, 26, 26); }); dirty = true; setT(); } },
        ] },
        { label: 'Help', items: [{ label: 'About Sketch...', action: () => msgBox({ title: 'Sketch', icon: 'sketch', text: 'Sketch 3.1\nLeft click paints with the front color, right click with the back color.\nHold Shift for squares and circles.' }) }] },
      ]);
      if (opts.file) load(opts.file);
      return win;
    },
  };

  // ======================= Gopher Fields =======================
  A.gopher = {
    title: 'Gopher Fields', icon: 'gopher',
    open() {
      const LEVELS = { beginner: [9, 9, 10], intermediate: [16, 16, 40], expert: [30, 16, 99] };
      let level = localStorage.getItem('s79-gopher') || 'beginner';
      const FACE = {
        ok: `<svg viewBox="0 0 20 20" width="22" height="22" shape-rendering="crispEdges"><rect x="3" y="3" width="14" height="14" fill="#C08A2E" stroke="#2E2620"/><rect x="6" y="7" width="2" height="2" fill="#2E2620"/><rect x="12" y="7" width="2" height="2" fill="#2E2620"/><rect x="8" y="12" width="4" height="1" fill="#2E2620"/><rect x="9" y="13" width="2" height="2" fill="#F2EBDD"/></svg>`,
        win: `<svg viewBox="0 0 20 20" width="22" height="22" shape-rendering="crispEdges"><rect x="3" y="3" width="14" height="14" fill="#C08A2E" stroke="#2E2620"/><rect x="5" y="7" width="10" height="2" fill="#2E2620"/><rect x="5" y="7" width="4" height="3" fill="#2E2620"/><rect x="11" y="7" width="4" height="3" fill="#2E2620"/><rect x="7" y="13" width="6" height="1" fill="#2E2620"/></svg>`,
        lose: `<svg viewBox="0 0 20 20" width="22" height="22" shape-rendering="crispEdges"><rect x="3" y="3" width="14" height="14" fill="#C08A2E" stroke="#2E2620"/><path d="M6 6 L8 8 M8 6 L6 8 M12 6 L14 8 M14 6 L12 8" stroke="#2E2620" stroke-width="1"/><rect x="8" y="12" width="4" height="3" fill="#2E2620"/></svg>`,
        wow: `<svg viewBox="0 0 20 20" width="22" height="22" shape-rendering="crispEdges"><rect x="3" y="3" width="14" height="14" fill="#C08A2E" stroke="#2E2620"/><rect x="6" y="6" width="2" height="3" fill="#2E2620"/><rect x="12" y="6" width="2" height="3" fill="#2E2620"/><rect x="9" y="11" width="2" height="3" fill="#2E2620"/></svg>`,
      };
      const GOPHER = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="3" y="3" width="10" height="11" fill="#C08A2E" stroke="#2E2620"/><rect x="5" y="6" width="2" height="2" fill="#2E2620"/><rect x="9" y="6" width="2" height="2" fill="#2E2620"/><rect x="7" y="10" width="2" height="2" fill="#F2EBDD"/></svg>';
      const FLAG = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="7" y="2" width="2" height="11" fill="#2E2620"/><path d="M9 2 H14 L12 4.5 L14 7 H9 Z" fill="#9E3324"/><rect x="4" y="12" width="8" height="2" fill="#2E2620"/></svg>';
      const box = $(`<div class="gopher"><div class="hud"><div class="led left">010</div><button class="face"></button><div class="led time">000</div></div><div class="board"></div></div>`);
      const board = box.querySelector('.board'), face = box.querySelector('.face'), ledL = box.querySelector('.left'), ledT = box.querySelector('.time');
      let W, H, N, cells, over, started, timer, secs, flags, opened;
      const win = new Win({ title: 'Gopher Fields', icon: I.gopher, w: 300, h: 380, resizable: false, content: box, onClosed: () => clearInterval(timer) });
      const led = (n) => (n < 0 ? '-' + String(-n).padStart(2, '0') : String(Math.min(999, n)).padStart(3, '0'));
      function fitWin() {
        requestAnimationFrame(() => {
          const tb = win.el.querySelector('.titlebar').offsetHeight + win.el.querySelector('.menubar').offsetHeight + 8;
          win.el.style.width = Math.max(220, board.offsetWidth + 30) + 'px';
          win.el.style.height = tb + box.scrollHeight + 6 + 'px';
        });
      }
      function reset() {
        [W, H, N] = LEVELS[level];
        cells = []; over = false; started = false; secs = 0; flags = 0; opened = 0;
        clearInterval(timer);
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${W}, 24px)`;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const el = document.createElement('div');
          el.className = 'cell';
          const c = { x, y, el, g: false, open: false, flag: false, n: 0 };
          // Touch: a long press plants a flag (no right-click on phones); tapping a number clears around it.
          let press = null, longPressed = false;
          el.addEventListener('pointerdown', (e) => {
            if (!over && e.button === 0 && !c.open && !c.flag) face.innerHTML = FACE.wow;
            if (e.pointerType === 'touch' && !over && !c.open) {
              longPressed = false;
              press = setTimeout(() => { longPressed = true; face.innerHTML = FACE.ok; flag(c); if (navigator.vibrate) navigator.vibrate(15); }, 420);
            }
          });
          const cancelPress = () => { clearTimeout(press); press = null; };
          el.addEventListener('pointercancel', cancelPress);
          el.addEventListener('pointerleave', cancelPress);
          el.addEventListener('pointerup', (e) => {
            cancelPress();
            if (over) return;
            face.innerHTML = FACE.ok;
            if (e.pointerType === 'touch') { if (longPressed) { longPressed = false; return; } if (c.open) { chord(c); return; } reveal(c); return; }
            if (e.button === 0) reveal(c); else if (e.button === 2) flag(c);
          });
          el.addEventListener('dblclick', () => chord(c));
          el.addEventListener('contextmenu', (e) => e.preventDefault());
          cells.push(c); board.appendChild(el);
        }
        face.innerHTML = FACE.ok; ledL.textContent = led(N); ledT.textContent = '000';
        fitWin();
      }
      const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? cells[y * W + x] : null);
      const around = (c) => { const r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx || dy) { const n = at(c.x + dx, c.y + dy); if (n) r.push(n); } } return r; };
      function plant(safe) {
        const forbid = new Set([safe, ...around(safe)]);
        let k = 0;
        while (k < N) { const c = cells[Math.floor(Math.random() * cells.length)]; if (!c.g && !forbid.has(c)) { c.g = true; k++; } }
        cells.forEach((c) => { c.n = around(c).filter((n) => n.g).length; });
        started = true;
        timer = setInterval(() => { secs++; ledT.textContent = led(secs); }, 1000);
      }
      function reveal(c) {
        if (c.open || c.flag) return;
        if (!started) plant(c);
        if (c.g) { c.el.classList.add('boom'); return lose(); }
        const st = [c];
        while (st.length) {
          const k = st.pop();
          if (k.open || k.flag) continue;
          k.open = true; opened++;
          k.el.classList.add('open');
          if (k.n) { k.el.textContent = k.n; k.el.classList.add('n' + k.n); }
          else around(k).forEach((n) => { if (!n.open) st.push(n); });
        }
        if (opened === W * H - N) winGame();
      }
      function flag(c) { if (c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; c.el.innerHTML = c.flag ? FLAG : ''; ledL.textContent = led(N - flags); }
      function chord(c) {
        if (!c.open || !c.n || over) return;
        const ns = around(c);
        if (ns.filter((n) => n.flag).length === c.n) ns.forEach((n) => { if (!over) reveal(n); });
      }
      function lose() {
        over = true; clearInterval(timer); face.innerHTML = FACE.lose;
        cells.forEach((c) => { if (c.g && !c.flag) { c.el.innerHTML = GOPHER; c.el.classList.add('open'); if (!c.el.classList.contains('boom')) c.el.style.background = 'var(--surface-alt)'; } if (!c.g && c.flag) c.el.style.opacity = '.45'; });
      }
      async function winGame() {
        over = true; clearInterval(timer); face.innerHTML = FACE.win;
        cells.forEach((c) => { if (c.g && !c.flag) { c.flag = true; c.el.innerHTML = FLAG; } });
        ledL.textContent = '000';
        const key = 's79-gopher-best-' + level, best = +localStorage.getItem(key) || 0;
        if (!best || secs < best) {
          try { localStorage.setItem(key, secs); } catch (e) {}
          const lines = Object.keys(LEVELS).map((l) => `${l.toUpperCase().padEnd(14)} ${localStorage.getItem('s79-gopher-best-' + l) ? localStorage.getItem('s79-gopher-best-' + l) + ' seconds' : '-'}`);
          try { FS.write('C:\\GAMES\\SCORES.TXT', 'GOPHER FIELDS - BEST TIMES\r\n\r\n' + lines.join('\r\n') + '\r\n'); } catch (e) {}
          await msgBox({ title: 'Gopher Fields', icon: 'gopher', text: `Field cleared in ${secs} seconds.\nA new best time for ${level}!` });
        }
      }
      face.addEventListener('click', reset);
      win.setMenu([
        { label: 'Game', items: () => [
          { label: 'New', key: 'F2', action: reset },
          { sep: true },
          ...Object.keys(LEVELS).map((l) => ({ label: l[0].toUpperCase() + l.slice(1), checked: level === l, action: () => { level = l; try { localStorage.setItem('s79-gopher', l); } catch (e) {} reset(); } })),
          { sep: true },
          { label: 'Best Times...', action: () => msgBox({ title: 'Best Times', icon: 'gopher', text: Object.keys(LEVELS).map((l) => `${l[0].toUpperCase() + l.slice(1)}:  ${localStorage.getItem('s79-gopher-best-' + l) ? localStorage.getItem('s79-gopher-best-' + l) + ' s' : 'no time yet'}`).join('\n') }) },
          { sep: true },
          { label: 'Exit', action: () => win.close() },
        ] },
        { label: 'Help', items: [{ label: 'How to Play...', action: () => msgBox({ title: 'Gopher Fields', icon: 'gopher', w: 440, text: 'Gophers are hiding under the prairie grass.\n\nClick to check a square. Numbers say how many gophers are next door.\nRight-click to plant a flag where you think one is.\nDouble-click a number to clear around it once its flags are placed.\n\nClear every gopher-free square to win.' }) }] },
      ]);
      box.tabIndex = 0;
      box.addEventListener('keydown', (e) => { if (e.key === 'F2') { e.preventDefault(); reset(); } });
      reset();
      return win;
    },
  };

  // ======================= Control Panel =======================
  A.control = {
    title: 'Control Panel', icon: 'control', single: true,
    open() {
      const st = S79.settings;
      const WPS = [['grid', 'Prairie grid'], ['stripes', 'Stripes'], ['slate', 'Slate'], ['plaster', 'Plaster'], ['walnut', 'Walnut']];
      const box = $(`<div class="cpl">
        <fieldset><legend>Color scheme</legend>
          <label class="radio"><input type="radio" name="th" value="prairie"> Prairie (plaster cream)</label>
          <label class="radio"><input type="radio" name="th" value="dark"> Prairie dark (after sundown)</label>
        </fieldset>
        <fieldset><legend>Desktop wallpaper</legend><div class="swatches" style="padding-bottom:18px"></div></fieldset>
        <fieldset><legend>Screen saver</legend>
          <div class="row"><select class="field saver"><option value="0">None</option><option value="1">After 1 minute</option><option value="3">After 3 minutes</option><option value="5">After 5 minutes</option><option value="10">After 10 minutes</option></select>
          <button class="btn sm test">Test</button></div>
        </fieldset>
        <fieldset><legend>Startup</legend>
          <label class="radio"><input type="checkbox" class="boot"> Start the desktop from AUTOEXEC.BAT</label>
          <label class="radio"><input type="checkbox" class="chime"> Play the startup chime</label>
        </fieldset>
        <div class="row" style="justify-content:flex-end;gap:12px"><button class="btn fs">Full screen</button><button class="btn default ok">OK</button></div>
      </div>`);
      box.querySelectorAll('input[name=th]').forEach((r) => { r.checked = r.value === st.theme; r.onchange = () => S79.set('theme', r.value); });
      const sw = box.querySelector('.swatches');
      const swStyle = { grid: 'background:linear-gradient(90deg,transparent 62%,#2E2620 62% 65%,transparent 65%),linear-gradient(transparent 55%,#2E2620 55% 59%,transparent 59%),linear-gradient(#9E3324,#9E3324) 20% 22%/12px 10px no-repeat #E4D8C1', stripes: 'background:linear-gradient(transparent 40%,#9E3324 40% 50%,transparent 50% 55%,#C08A2E 55% 62%,transparent 62% 67%,#3E5C6B 67% 82%,transparent 82%) #F2EBDD', slate: 'background:#3E5C6B', plaster: 'background:#E4D8C1', walnut: 'background:#171310' };
      for (const [id, label] of WPS) {
        const d = $(`<div class="wp" style="${swStyle[id]}"><span>${label}</span></div>`);
        if (st.wallpaper === id) d.classList.add('on');
        d.onclick = () => { S79.set('wallpaper', id); sw.querySelectorAll('.wp').forEach((x) => x.classList.toggle('on', x === d)); };
        sw.appendChild(d);
      }
      const saver = box.querySelector('.saver'); saver.value = String(st.saver); saver.onchange = () => S79.set('saver', +saver.value);
      box.querySelector('.test').onclick = () => S79.saver.start();
      const chime = box.querySelector('.chime'); chime.checked = st.chime; chime.onchange = () => S79.set('chime', chime.checked);
      const boot = box.querySelector('.boot');
      const ae = () => (FS.isFile('C:\\AUTOEXEC.BAT') ? FS.read('C:\\AUTOEXEC.BAT') : '');
      boot.checked = /^\s*S79\s*$/im.test(ae());
      boot.onchange = () => {
        let t = ae();
        if (boot.checked) { if (!/^\s*S79\s*$/im.test(t)) t = t.replace(/\s*$/, '') + '\r\nS79\r\n'; }
        else t = t.replace(/^\s*S79\s*\r?\n?/gim, '');
        FS.write('C:\\AUTOEXEC.BAT', t);
        S79.refresh();
      };
      box.querySelector('.fs').onclick = () => S79.fullscreen();
      if (!document.fullscreenEnabled) box.querySelector('.fs').remove(); // iPhone Safari has no full screen
      const win = new Win({ title: 'Control Panel', icon: I.control, w: 470, h: 520, resizable: false, content: box });
      box.querySelector('.ok').onclick = () => win.close();
      requestAnimationFrame(() => { win.el.style.height = win.el.querySelector('.titlebar').offsetHeight + box.scrollHeight + 14 + 'px'; });
      return win;
    },
  };

  // ======================= About =======================
  A.about = {
    title: 'About', icon: 'about',
    open() {
      return WM.modal({ title: 'About spreck79 3.1', w: 400 }, (c, finish) => {
        const used = FS.used();
        // Both logos are in the page; the theme's CSS shows the right one, even after a theme switch.
        c.appendChild($(`<div class="about">
          <img class="logo-light" src="assets/logo.svg" alt="spreck79"><img class="logo-dark" src="assets/logo-white.svg" alt="spreck79">
          <h1>spreck79 3.1</h1>
          <p>All side quests. No main story.</p>
          <div class="stripes" style="width:100%;margin:6px 0"><i></i><i></i><i></i></div>
          <p style="font-size:13px">Running on S79-DOS 5.0 in Prairie mode<br>Drive C: ${(FS.capacity - used).toLocaleString('en-US')} bytes free<br>Side quests in progress: too many</p>
          <p style="font-size:12px">spreck79.com · (C) 1979-2026 spreck79</p>
        </div>`));
        const bb = $('<div class="dlg-btns"><button class="btn default">OK</button></div>');
        bb.firstChild.onclick = () => finish();
        c.appendChild(bb);
      });
    },
  };

  // ======================= Lookout (web browser) =======================
  // Shows spreck79.com. Look, don't touch: any click inside the page crashes spreck79 3.1.
  // Browsers hide clicks inside another site's page, so a click is detected when keyboard focus
  // moves into the embedded page (the window loses focus to the frame), or when the frame loads a new page.
  A.lookout = {
    title: 'Lookout', icon: 'lookout',
    open() {
      const HOME = 'https://spreck79.com/';
      const box = $(`<div class="lookout">
        <div class="lk-bar">
          <button class="btn sm home" title="Back to the home page">Home</button>
          <span class="label-caps">Address</span>
          <input class="field addr" readonly spellcheck="false" tabindex="-1">
        </div>
        <div class="lk-view"><div class="lk-loading">Looking out over spreck79.com...</div></div>
        <div class="statusbar"><span class="st">Opening spreck79.com...</span></div>
      </div>`);
      const view = box.querySelector('.lk-view'), st = box.querySelector('.st'), loading = box.querySelector('.lk-loading');
      box.querySelector('.addr').value = HOME;
      let frame = null, loads = 0;

      function go() {
        if (frame) frame.remove();
        loads = 0;
        loading.style.display = '';
        st.textContent = 'Opening spreck79.com...';
        frame = document.createElement('iframe');
        frame.title = 'spreck79.com';
        // No allow-popups: links that open a new tab can't escape; no allow-top-navigation: the page can't take over.
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
        frame.referrerPolicy = 'no-referrer';
        frame.src = HOME;
        frame.addEventListener('load', () => {
          loads++;
          loading.style.display = 'none';
          st.textContent = 'Done';
          if (loads > 1) S79.crash('Lookout followed a link it was told not to touch.'); // the page went somewhere new
        });
        view.appendChild(frame);
      }

      // A click inside the frame moves focus into it, which blurs this page.
      const onBlur = () => setTimeout(() => { if (frame && document.activeElement === frame && win.state !== 'min') S79.crash('Lookout tried to follow a link off the prairie.'); }, 0);
      addEventListener('blur', onBlur);

      const win = new Win({
        title: 'Lookout - spreck79.com', icon: I.lookout, w: Math.min(980, innerWidth - 120), h: Math.min(640, innerHeight - 120), minW: 320, minH: 220, content: box,
        onClosed: () => removeEventListener('blur', onBlur),
      });
      box.querySelector('.home').onclick = go;
      win.setMenu([
        { label: 'File', items: [
          { label: 'Home', action: go },
          { sep: true },
          { label: 'Exit', action: () => win.close() },
        ] },
        { label: 'Help', items: [{ label: 'About Lookout...', action: () => msgBox({ title: 'Lookout', icon: 'lookout', text: 'Lookout 3.1\nA window onto spreck79.com.\nLook all you like. Just don’t touch.' }) }] },
      ]);
      go();
      return win;
    },
  };

  // ======================= S79-DOS Prompt (windowed) =======================
  A.prompt = {
    title: 'S79-DOS Prompt', icon: 'prompt',
    open(opts = {}) {
      const box = $('<div style="flex:1;min-height:0;background:var(--dos-bg);padding:6px 10px;font:15px/20px var(--mono);color:var(--dos-fg);position:relative;display:flex"><div style="flex:1"></div></div>');
      const termEl = box.firstChild;
      const win = new Win({ title: 'S79-DOS Prompt', icon: I.prompt, w: 660, h: 400, content: box, onClosed: () => { term.alive = false; }, onFocus: () => setTimeout(() => term.focusInput(), 0) });
      const term = new S79DOS.Terminal(termEl, { mode: 'window', win });
      term.out('S79-DOS 5.0 prompt. Type HELP for commands, EXIT to close.', 'dim');
      term.print('');
      (async () => {
        if (opts.run) { term.out(term.promptText() + opts.run); await term.exec(opts.run); }
        if (opts.batch) await term.runBatch(opts.batch);
        term.run();
      })();
      return win;
    },
  };

  window.S79Apps = A;
})();
