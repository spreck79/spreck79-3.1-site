// S79-DOS — the command line under spreck79 3.1.
(function () {
  const FS = window.S79FS;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
  const lpad = (s, n) => (' '.repeat(n) + String(s)).slice(-n);
  const num = (n) => n.toLocaleString('en-US');

  const SIDE_QUESTS = [
    'Print a tiny planter. Plant something tinier in it.',
    'Hike somewhere with a long, low horizon. Very Prairie.',
    'Finish one game. Just one. Any one.',
    'Re-level the printer bed before it asks you to.',
    'Take the long way home. Count the brick buildings.',
    'Start a new hobby. Abandon it with dignity.',
    'Design a stripe. Red, ochre, slate. Repeat.',
    'Find the best trail snack. Field test thoroughly.',
    'Speedrun the dishes.',
    'Print a replacement knob for something that never had a knob.',
    'Reorganize the filament by color. Then by vibe.',
    'Go outside. The graphics are incredible.',
    'Write a README for your weekend.',
    'Name a houseplant. Give it a side quest of its own.',
  ];

  const HELP = [
    ['CD', 'Show or change the current directory'],
    ['CLS', 'Clear the screen'],
    ['COLOR', 'Change screen colors: AMBER, CREAM, SLATE, SAGE, WALNUT'],
    ['COPY', 'Copy a file:  COPY source dest'],
    ['DATE', 'Show today\'s date'],
    ['DEL', 'Delete a file (also ERASE)'],
    ['DIR', 'List files  (DIR /W for wide)'],
    ['ECHO', 'Print a message, or ECHO ON/OFF'],
    ['EDIT', 'Edit a text file with S79EDIT'],
    ['EXIT', 'Leave S79-DOS'],
    ['FORMAT', 'Wipe drive C: back to factory side quests'],
    ['HELP', 'This list'],
    ['MD', 'Make a directory (also MKDIR)'],
    ['MEM', 'Show memory'],
    ['PROMPT', 'Change the prompt ($P path, $G >, $D date, $T time)'],
    ['QUEST', 'Get a random side quest'],
    ['RD', 'Remove an empty directory (also RMDIR)'],
    ['REBOOT', 'Restart the computer'],
    ['REN', 'Rename a file:  REN old new'],
    ['S79', 'Start the spreck79 3.1 desktop'],
    ['TIME', 'Show the time'],
    ['TREE', 'Show the directory tree'],
    ['TYPE', 'Show the contents of a text file'],
    ['VER', 'Show the S79-DOS version'],
    ['VOL', 'Show the disk label'],
  ];

  class Terminal {
    constructor(el, opts) {
      this.el = el;
      this.mode = opts.mode; // 'boot' | 'window'
      this.win = opts.win || null;
      this.cwd = 'C:\\';
      this.promptFmt = '$P$G';
      this.echo = true;
      this.history = [];
      this.alive = true;
      this.el.classList.add('term');
      this.el.addEventListener('mouseup', () => { if (!getSelection().toString()) this.focusInput(); });
      // iPhone: the keyboard only opens when focus happens inside a tap, so focus on the tap itself too.
      this.el.addEventListener('click', () => { if (!getSelection().toString()) this.focusInput(); });
      this.setColor(localStorage.getItem('s79-dos-color') || 'walnut', true);
    }

    setColor(name, quiet) {
      this.el.classList.remove('theme-amber', 'theme-cream', 'theme-slate', 'theme-sage');
      if (name && name !== 'walnut') this.el.classList.add('theme-' + name);
      if (!quiet) try { localStorage.setItem('s79-dos-color', name); } catch (e) {}
    }

    focusInput() { const i = this.el.querySelector('.inputline input'); if (i) i.focus({ preventScroll: true }); }

    print(html) {
      const d = document.createElement('div');
      d.innerHTML = html === '' ? '&nbsp;' : html;
      this.el.appendChild(d);
      this.scroll();
      return d;
    }
    out(text, cls) { return this.print(cls ? `<span class="${cls}">${esc(text)}</span>` : esc(text)); }
    scroll() { this.el.scrollTop = this.el.scrollHeight; }
    clear() { this.el.innerHTML = ''; }

    promptText() {
      const d = new Date();
      return this.promptFmt.replace(/\$(.)/g, (m, c) => {
        switch (c.toUpperCase()) {
          case 'P': return this.cwd;
          case 'G': return '>';
          case 'L': return '<';
          case 'B': return '|';
          case 'Q': return '=';
          case 'D': return d.toLocaleDateString('en-US');
          case 'T': return d.toLocaleTimeString('en-US');
          case 'V': return 'S79-DOS 5.0';
          case 'N': return 'C';
          case '$': return '$';
          case '_': return '\n';
          default: return '';
        }
      });
    }

    readLine(promptStr) {
      return new Promise((resolve) => {
        const line = document.createElement('div');
        line.className = 'inputline';
        line.innerHTML = `<span class="p"></span><input spellcheck="false" autocomplete="off">`;
        line.querySelector('.p').textContent = promptStr;
        const inp = line.querySelector('input');
        this.el.appendChild(line);
        this.scroll();
        let hi = this.history.length;
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const v = inp.value;
            line.innerHTML = '';
            line.className = '';
            line.textContent = promptStr + v;
            if (v.trim()) { this.history.push(v); if (this.history.length > 100) this.history.shift(); }
            resolve(v);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault(); if (hi > 0) { hi--; inp.value = this.history[hi]; }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault(); if (hi < this.history.length) { hi++; inp.value = this.history[hi] || ''; }
          } else if (e.key === 'Escape') {
            inp.value = '';
          } else if (e.key === 'c' && e.ctrlKey && !getSelection().toString()) {
            e.preventDefault();
            line.innerHTML = ''; line.className = ''; line.textContent = promptStr + inp.value + '^C';
            resolve('');
          } else if (e.key === 'Tab') {
            e.preventDefault();
            this.complete(inp);
          }
        });
        setTimeout(() => inp.focus({ preventScroll: true }), 0);
      });
    }

    complete(inp) {
      const v = inp.value;
      const m = v.match(/^(.*?)([^\s]*)$/);
      const head = m[1], word = m[2];
      const slash = word.lastIndexOf('\\');
      const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
      const pre = word.slice(slash + 1).toUpperCase();
      const dir = FS.resolve(this.cwd, dirPart || '.');
      const list = FS.list(dir) || [];
      const hits = list.filter((x) => x.name.startsWith(pre));
      if (hits.length === 1) inp.value = head + dirPart + hits[0].name + (hits[0].node.type === 'dir' ? '\\' : '');
      else if (hits.length > 1) { this.out(hits.map((h) => h.name).join('  '), 'dim'); }
    }

    // Waits for one key. For touch screens: opts.anyTap lets a tap on the screen count as a key,
    // and opts.buttons shows tappable keys (e.g. Y and N) on the last line.
    readKey(opts = {}) {
      return new Promise((resolve) => {
        const inp = document.createElement('input');
        inp.style.cssText = 'position:absolute;opacity:0;width:1px;height:1px;';
        this.el.appendChild(inp);
        inp.focus({ preventScroll: true });
        let btnBox = null;
        const finish = (key) => {
          inp.remove();
          if (btnBox) btnBox.remove();
          this.el.removeEventListener('mouseup', refocus);
          this.el.removeEventListener('click', onTap);
          resolve(key);
        };
        inp.addEventListener('keydown', (e) => {
          if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
          e.preventDefault();
          finish(e.key);
        });
        const refocus = () => { if (inp.isConnected) inp.focus({ preventScroll: true }); };
        this.el.addEventListener('mouseup', refocus);
        const onTap = (e) => { if (opts.anyTap && !(e.target.closest && e.target.closest('.tapkey'))) finish(' '); };
        this.el.addEventListener('click', onTap);
        if (opts.buttons) {
          btnBox = document.createElement('span');
          btnBox.className = 'tapkeys';
          for (const k of opts.buttons) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'tapkey'; b.textContent = k;
            b.addEventListener('click', (e) => { e.stopPropagation(); finish(k); });
            btnBox.appendChild(b);
          }
          (this.el.lastElementChild || this.el).appendChild(btnBox);
          this.scroll();
        }
      });
    }

    async confirm(q) {
      const line = this.print(esc(q) + ' (Y/N)?');
      for (;;) {
        const k = (await this.readKey({ buttons: ['Y', 'N'] })).toUpperCase();
        if (k === 'Y' || k === 'N') { line.appendChild(document.createTextNode(k)); return k === 'Y'; }
        if (k === 'ESCAPE') return false;
      }
    }

    // ---------------- main loop ----------------
    async run() {
      while (this.alive) {
        const line = await this.readLine(this.promptText());
        if (!this.alive) break;
        try { await this.exec(line); } catch (e) { this.out(e.message || String(e), 'err'); }
      }
    }

    async runBatch(path) {
      const text = FS.read(path);
      const prevEcho = this.echo;
      this.inBatch = true;
      for (const raw of text.split(/\r?\n/)) {
        if (!this.alive) break;
        let line = raw;
        if (!line.trim()) continue;
        const quiet = line.trimStart().startsWith('@');
        if (quiet) line = line.trimStart().slice(1);
        if (this.echo && !quiet) this.out(this.promptText() + line);
        try { await this.exec(line, true); } catch (e) { this.out(e.message || String(e), 'err'); }
      }
      this.inBatch = false;
      this.echo = prevEcho; // ECHO OFF ends with the batch
    }

    findProgram(name) {
      const up = name.toUpperCase();
      const exts = /\.(EXE|COM|BAT)$/.test(up) ? [''] : ['.EXE', '.COM', '.BAT'];
      const dirs = [this.cwd, 'C:\\S79', 'C:\\S79\\SYSTEM', 'C:\\S79DOS'];
      if (/[\\:]/.test(up)) {
        for (const e of exts) { const p = FS.resolve(this.cwd, up + e); if (FS.isFile(p)) return p; }
        return null;
      }
      for (const d of dirs) for (const e of exts) {
        const p = FS.resolve(d, up + e);
        if (FS.isFile(p)) return p;
      }
      return null;
    }

    async exec(line, inBatch) {
      line = line.trim();
      if (!line) return;
      if (line.startsWith('@')) line = line.slice(1).trim();
      // drive switch
      if (/^[A-Za-z]:$/.test(line)) {
        if (line.toUpperCase() === 'C:') { return; }
        this.out('Invalid drive specification. There is only C: out here on the prairie.', 'err');
        return;
      }
      let m = line.match(/^(cd|chdir|md|mkdir|rd|rmdir)(\.\.?|\\.*)$/i); // CD.. / CD\
      if (m) line = m[1] + ' ' + m[2];
      const sp = line.search(/\s/);
      const cmd = (sp < 0 ? line : line.slice(0, sp)).toUpperCase();
      const rest = sp < 0 ? '' : line.slice(sp + 1).trim();
      const args = rest ? rest.split(/\s+/) : [];
      const T = this;

      switch (cmd) {
        case 'HELP': case '/?': case '?':
          T.out('S79-DOS 5.0 commands', 'hi');
          T.print('');
          for (const [c, d] of HELP) T.print(`<span class="och">${esc(pad(c, 9))}</span>${esc(d)}`);
          T.print('');
          T.out('Programs on the PATH can be run by name: JOTTER, TALLY, SKETCH, GOPHER...', 'dim');
          T.out('Feeling brave? Type BACKLOG.', 'dim');
          return;
        case 'CLS': T.clear(); return;
        case 'VER':
          T.print('');
          T.print('<span class="hi">S79-DOS Version 5.0</span>   (C) 1979-2026 spreck79');
          T.out('All side quests. No main story.', 'dim');
          T.print('');
          return;
        case 'VOL':
          T.out(' Volume in drive C is SPRECK79');
          T.out(' Volume Serial Number is 1979-0079');
          return;
        case 'ECHO': case 'ECHO.':
          if (!rest) { if (cmd === 'ECHO.') T.print(''); else T.out('ECHO is ' + (T.echo ? 'on' : 'off')); return; }
          if (/^off$/i.test(rest)) { T.echo = false; return; }
          if (/^on$/i.test(rest)) { T.echo = true; return; }
          T.out(rest); return;
        case 'REM': return;
        case 'PAUSE':
          T.out(matchMedia('(pointer: coarse)').matches ? 'Press any key or tap to continue . . .' : 'Press any key to continue . . .');
          await T.readKey({ anyTap: true });
          return;
        case 'DATE':
          T.out('Current date is ' + new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }));
          if (rest) T.out('The prairie sun sets the date here.', 'dim');
          return;
        case 'TIME':
          T.out('Current time is ' + new Date().toLocaleTimeString('en-US'));
          if (rest) T.out('The prairie sun sets the time here.', 'dim');
          return;
        case 'PROMPT': T.promptFmt = rest || '$P$G'; return;
        case 'PATH': if (!rest) T.out('PATH=C:\\S79;C:\\S79\\SYSTEM;C:\\S79DOS'); return;
        case 'COLOR': {
          const c = (rest || '').toLowerCase();
          if (!['amber', 'cream', 'slate', 'sage', 'walnut'].includes(c)) { T.out('Usage: COLOR AMBER | CREAM | SLATE | SAGE | WALNUT', 'err'); return; }
          T.setColor(c); return;
        }
        case 'CD': case 'CHDIR': {
          if (!rest) { T.out(T.cwd); return; }
          const p = FS.resolve(T.cwd, rest);
          if (!FS.isDir(p)) { T.out('Invalid directory', 'err'); return; }
          T.cwd = p; return;
        }
        case 'MD': case 'MKDIR':
          if (!rest) { T.out('Required parameter missing', 'err'); return; }
          FS.mkdir(FS.resolve(T.cwd, rest)); return;
        case 'RD': case 'RMDIR': {
          if (!rest) { T.out('Required parameter missing', 'err'); return; }
          const p = FS.resolve(T.cwd, rest);
          if (!FS.isDir(p)) { T.out('Invalid path, not directory,\nor directory not empty', 'err'); return; }
          if (T.cwd === p || T.cwd.startsWith(p + '\\')) { T.out('Attempt to remove current directory', 'err'); return; }
          try { FS.remove(p); } catch (e) { T.out('Invalid path, not directory,\nor directory not empty', 'err'); }
          return;
        }
        case 'DIR': return T.dir(args);
        case 'TREE': return T.tree();
        case 'TYPE': {
          if (!rest) { T.out('Required parameter missing', 'err'); return; }
          const p = FS.resolve(T.cwd, rest);
          if (!FS.isFile(p)) { T.out('File not found - ' + rest.toUpperCase(), 'err'); return; }
          const n = FS.get(p);
          if (n.app || /\.(EXE|COM|SYS|DRV|FON)$/.test(p)) { T.out('MZ\u00e0\u00a7\u0001\u0002 ... (that is a program, not a text file)', 'dim'); return; }
          if (/\.PIC$/.test(p)) { T.out('[a picture. Open it with SKETCH to look at it]', 'dim'); return; }
          T.out(n.content.replace(/\r/g, '')); return;
        }
        case 'DEL': case 'ERASE': {
          if (!rest) { T.out('Required parameter missing', 'err'); return; }
          const target = FS.resolve(T.cwd, rest);
          const { dir, name } = FS.parentOf(target);
          if (name.includes('*') || name.includes('?')) {
            const re = new RegExp('^' + name.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            const list = (FS.list(dir) || []).filter((x) => x.node.type === 'file' && re.test(x.name));
            if (name === '*.*' && !(await T.confirm('All files in directory will be deleted!\nAre you sure'))) return;
            list.forEach((x) => FS.remove(dir + (dir.endsWith('\\') ? '' : '\\') + x.name));
            if (!list.length) T.out('File not found', 'err');
            return;
          }
          if (FS.isDir(target)) {
            if (!(await T.confirm('All files in directory will be deleted!\nAre you sure'))) return;
            for (const x of FS.list(target)) if (x.node.type === 'file') FS.remove(target + '\\' + x.name);
            return;
          }
          if (!FS.isFile(target)) { T.out('File not found', 'err'); return; }
          FS.remove(target); return;
        }
        case 'REN': case 'RENAME': {
          if (args.length < 2) { T.out('Required parameter missing', 'err'); return; }
          const p = FS.resolve(T.cwd, args[0]);
          if (!FS.exists(p)) { T.out('File not found', 'err'); return; }
          FS.rename(p, args[1]); return;
        }
        case 'COPY': {
          if (args.length < 2) { T.out('Required parameter missing', 'err'); return; }
          const s = FS.resolve(T.cwd, args[0]), d = FS.resolve(T.cwd, args[1]);
          if (!FS.isFile(s)) { T.out('File not found - ' + args[0].toUpperCase(), 'err'); return; }
          FS.copy(s, d);
          T.out('        1 file(s) copied'); return;
        }
        case 'MEM': {
          const used = FS.used();
          T.print('');
          T.out('Memory Type        Total       Used       Free');
          T.out('----------------  --------   --------   --------');
          T.out('Conventional          640K        79K       561K');
          T.out('Side quest            79K         79K         0K');
          T.out('Snack reserve        1024K       512K       512K');
          T.out('Drive C:         ' + lpad(Math.round(FS.capacity / 1024) + 'K', 9) + lpad(Math.ceil(used / 1024) + 'K', 11) + lpad(Math.floor((FS.capacity - used) / 1024) + 'K', 11));
          T.print('');
          T.out('S79-DOS is resident in the high prairie memory area.', 'dim');
          return;
        }
        case 'QUEST': case 'FORTUNE':
          T.print('<span class="red">\u2588\u2588</span><span class="och">\u2588\u2588</span><span class="sla">\u2588\u2588</span> <span class="hi">SIDE QUEST:</span> ' + esc(SIDE_QUESTS[Math.floor(Math.random() * SIDE_QUESTS.length)]));
          return;
        case 'FORMAT': {
          if (!/^c:?$/i.test(rest)) { T.out('Usage: FORMAT C:', 'err'); return; }
          T.out('WARNING: ALL DATA ON DRIVE C: WILL BE LOST!', 'err');
          if (!(await T.confirm('Proceed with Format'))) return;
          for (let i = 0; i <= 100; i += 4) { const l = T.el.lastChild; if (i > 0 && l.dataset.fmt) l.remove(); const d = T.out(i + ' percent completed.'); d.dataset.fmt = 1; await sleep(30); }
          FS.format();
          T.cwd = 'C:\\';
          T.out('Format complete. Fresh disk, fresh side quests.');
          return;
        }
        case 'REBOOT': case 'RESTART':
          T.out('Rebooting...');
          await sleep(500);
          location.reload();
          return;
        case 'EXIT':
          if (T.mode === 'window') { T.win && T.win.close(true); return; }
          if (inBatch) return;
          await S79.shutdown();
          return;
        case 'S79': case 'WIN':
          if (cmd === 'WIN') { T.out('Bad command or file name. (Did you mean S79?)', 'err'); return; }
          if (T.mode === 'window') { T.out('spreck79 3.1 is already running.', 'dim'); return; }
          if (inBatch && T.stayInDos) return; // ?dos: AUTOEXEC.BAT doesn't start the desktop
          await S79.startGUI();
          return;
        case 'EDIT': case 'S79EDIT':
          return T.edit(rest);
        case 'CALC': {
          if (!/^[\d\s+\-*/().%]+$/.test(rest)) { T.out('Usage: CALC 79*3+1', 'err'); return; }
          try { T.out(String(Function('"use strict";return (' + rest + ')')())); } catch (e) { T.out('Syntax error', 'err'); }
          return;
        }
      }

      // programs and batch files
      const prog = T.findProgram(cmd);
      if (prog) {
        if (prog.endsWith('.BAT')) return T.runBatch(prog);
        const node = FS.get(prog);
        if (node.app === 'edit') return T.edit(rest);
        if (node.app === 'dos') { T.out('S79-DOS is already running. You are in it!', 'dim'); return; }
        if (node.app === 'backlog') { // a DOS game: it takes over the S79-DOS screen until you quit
          if (T.mode === 'window') { T.out('This program cannot run while spreck79 3.1 is running.', 'err'); T.out('Exit spreck79 3.1 first (Quest Manager: File > Exit spreck79), then type BACKLOG at the S79-DOS prompt.', 'dim'); return; }
          T.out('Loading BACKLOG...', 'dim');
          const st = await S79Backlog.play(T);
          T.out('Thanks for playing BACKLOG. Side quests cleared: ' + st.kills + (st.levels ? ', levels finished: ' + st.levels : '') + '.');
          return;
        }
        if (T.mode === 'window') {
          const file = rest ? FS.resolve(T.cwd, rest) : null;
          S79.launch(node.app, file && FS.isFile(file) ? { file } : {});
          return;
        }
        if (node.app === 'questmgr') { if (inBatch && T.stayInDos) return; await S79.startGUI(); return; }
        if (node.app) { T.out('This program requires spreck79 3.1. Type S79 to start it.', 'err'); return; }
        T.out('Cannot run that file.', 'err');
        return;
      }
      T.out('Bad command or file name', 'err');
    }

    dir(args) {
      const wide = args.some((a) => /^\/w$/i.test(a));
      const pathArg = args.find((a) => !a.startsWith('/'));
      let path = FS.resolve(this.cwd, pathArg || '');
      let filter = null;
      if (!FS.isDir(path)) {
        const { dir, name } = FS.parentOf(path);
        if (FS.isDir(dir) && name) {
          filter = new RegExp('^' + name.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
          path = dir;
        } else { this.out('File not found', 'err'); return; }
      }
      let list = FS.list(path);
      if (filter) list = list.filter((x) => filter.test(x.name));
      this.print('');
      this.out(' Volume in drive C is SPRECK79');
      this.out(' Directory of ' + path);
      this.print('');
      const rows = [];
      if (path !== 'C:\\' && !filter) { rows.push({ name: '.', node: { type: 'dir', mtime: Date.now() } }, { name: '..', node: { type: 'dir', mtime: Date.now() } }); }
      rows.push(...list);
      let files = 0, bytes = 0;
      if (wide) {
        let lineStr = '';
        rows.forEach((r, i) => {
          const label = r.node.type === 'dir' ? '[' + r.name + ']' : r.name;
          lineStr += pad(label, 16);
          if ((i + 1) % 5 === 0) { this.out(lineStr); lineStr = ''; }
          if (r.node.type === 'file') { files++; bytes += FS.sizeOf(r.node); }
        });
        if (lineStr) this.out(lineStr);
      } else {
        for (const r of rows) {
          const [base, ext] = r.name === '.' || r.name === '..' ? [r.name, ''] : r.name.split('.');
          const d = new Date(r.node.mtime || Date.now());
          const date = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '-' + String(d.getFullYear()).slice(2);
          let h = d.getHours(); const ap = h >= 12 ? 'p' : 'a'; h = h % 12 || 12;
          const time = lpad(h, 2) + ':' + String(d.getMinutes()).padStart(2, '0') + ap;
          const sz = r.node.type === 'dir' ? pad('<DIR>', 14) : lpad(num(FS.sizeOf(r.node)), 10) + '    ';
          if (r.node.type === 'file') { files++; bytes += FS.sizeOf(r.node); }
          const line = pad(base, 9) + pad(ext || '', 4) + sz + date + '  ' + time;
          this.print(r.node.type === 'dir' ? `<span class="sla">${esc(line)}</span>` : esc(line));
        }
      }
      this.out(lpad(files, 9) + ' file(s)  ' + lpad(num(bytes), 12) + ' bytes');
      this.out(lpad('', 20) + lpad(num(FS.capacity - FS.used()), 12) + ' bytes free');
      this.print('');
    }

    tree() {
      this.out('Directory PATH listing for Volume SPRECK79');
      this.out('C:\\');
      const walk = (path, prefix) => {
        const dirs = FS.list(path).filter((x) => x.node.type === 'dir');
        dirs.forEach((d, i) => {
          const last = i === dirs.length - 1;
          this.out(prefix + (last ? '\u2514\u2500\u2500\u2500' : '\u251c\u2500\u2500\u2500') + d.name);
          walk(path.replace(/\\$/, '') + '\\' + d.name, prefix + (last ? '    ' : '\u2502   '));
        });
      };
      walk('C:\\', '');
    }

    async edit(rest) {
      const name = rest ? FS.resolve(this.cwd, rest) : null;
      if (name && FS.isDir(name)) { this.out('That is a directory.', 'err'); return; }
      if (this.mode === 'window') {
        S79.launch('jotter', name ? { file: name, create: true } : {});
        return;
      }
      // full-screen S79EDIT for boot mode
      await new Promise((resolve) => {
        let path = name;
        const host = this.el.parentElement;
        const ed = document.createElement('div');
        ed.className = 'dos-edit';
        // The key hints are buttons too, so phones (no F-keys or Esc) can tap them.
        ed.innerHTML = `<div class="bar"></div><textarea spellcheck="false"></textarea><div class="bar keys">`
          + `<button type="button" class="tapkey" data-k="F2"><b>F2</b>=Save</button>  <button type="button" class="tapkey" data-k="Esc"><b>Esc</b>=Exit</button>  <button type="button" class="tapkey" data-k="F3"><b>F3</b>=Save As</button>   <span class="ver">S79EDIT 5.0</span></div>`;
        const top = ed.querySelector('.bar'), ta = ed.querySelector('textarea');
        let dirty = false, busy = false;
        const setTop = (msg) => { top.textContent = '  S79EDIT  \u2502  ' + (path || 'UNTITLED') + (dirty ? ' *' : '') + (msg ? '   \u2502  ' + msg : ''); };
        ta.value = path && FS.isFile(path) ? FS.read(path).replace(/\r\n/g, '\n') : '';
        setTop();
        ta.addEventListener('input', () => { if (!dirty) { dirty = true; setTop(); } });
        const doSave = async (asNew) => {
          if (!path || asNew) {
            const v = await this.askInBar(ed, 'Save as: ', path || 'C:\\DOCS\\UNTITLED.TXT');
            if (!v) { setTop('Not saved'); ta.focus(); return false; }
            path = FS.resolve(this.cwd, v);
          }
          try { FS.write(path, ta.value.replace(/\n/g, '\r\n')); dirty = false; setTop('Saved'); }
          catch (e) { setTop(e.message); }
          ta.focus();
          return !dirty;
        };
        const exit = async () => {
          if (dirty) {
            const a = await this.askInBar(ed, 'Save changes? (Y/N/Esc) ', '', true);
            if (a === null) { ta.focus(); return; }
            if (a === 'Y' && !(await doSave(false))) return;
          }
          ed.remove();
          resolve();
        };
        // One command at a time, whether it came from a key or a tap.
        const command = async (k) => {
          if (busy) return;
          busy = true;
          try {
            if (k === 'F2') await doSave(false);
            else if (k === 'F3') await doSave(true);
            else if (k === 'Esc') await exit();
          } finally { busy = false; }
        };
        ed.querySelectorAll('.tapkey').forEach((b) => {
          b.addEventListener('pointerdown', (e) => e.preventDefault()); // keep the text box (and phone keyboard) focused
          b.addEventListener('click', () => command(b.dataset.k));
        });
        ta.addEventListener('keydown', async (e) => {
          if (e.key === 'F2') { e.preventDefault(); await command('F2'); }
          else if (e.key === 'F3') { e.preventDefault(); await command('F3'); }
          else if (e.key === 'Escape') { e.preventDefault(); await command('Esc'); }
          else if (e.key === 'Tab') {
            e.preventDefault();
            const s = ta.selectionStart;
            ta.setRangeText('    ', s, ta.selectionEnd, 'end');
          }
        });
        host.appendChild(ed);
        ta.focus();
      });
      this.focusInput();
    }

    // Asks on S79EDIT's top bar. Keys work as before; the buttons answer the same thing for touch screens.
    askInBar(ed, label, def, yn) {
      return new Promise((resolve) => {
        const bar = ed.querySelector('.bar');
        const old = bar.innerHTML;
        bar.innerHTML = '';
        bar.classList.add('asking');
        const lab = document.createElement('span'); lab.textContent = '  ' + label;
        const inp = document.createElement('input');
        inp.style.cssText = yn
          ? 'background:transparent;border:0;outline:0;font:inherit;color:inherit;width:1ch;caret-color:transparent'
          : 'background:transparent;border:0;outline:0;font:inherit;color:inherit;width:60%;min-width:10ch';
        inp.value = def;
        const answers = yn ? [['Yes', 'Y'], ['No', 'N'], ['Cancel', null]] : [['OK', 'ok'], ['Cancel', null]];
        const btns = answers.map(([text, v]) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'tapkey ask'; b.textContent = text;
          b.addEventListener('pointerdown', (e) => e.preventDefault());
          b.addEventListener('click', () => done(v === 'ok' ? inp.value.trim() : v));
          return b;
        });
        bar.append(lab, inp, ...btns);
        inp.focus(); inp.select();
        let finished = false;
        const done = (v) => { if (finished) return; finished = true; bar.classList.remove('asking'); bar.innerHTML = old; resolve(v); };
        inp.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (yn) {
            e.preventDefault();
            const k = e.key.toUpperCase();
            if (k === 'Y' || k === 'N') done(k); else if (e.key === 'Escape') done(null);
            return;
          }
          if (e.key === 'Enter') done(inp.value.trim());
          if (e.key === 'Escape') done(null);
        });
      });
    }
  }

  // ---------------- BIOS ----------------
  // An affectionate send-up of the beige-box BIOS screens of the early '90s: a vendor badge in the
  // corner, a racing memory counter, drive detection and a BIOS ID string nobody could read. All original.
  async function bios(T) {
    let setup = false;
    const del = (e) => { if (e.key === 'Delete' && !setup) { setup = true; e.preventDefault(); } };
    addEventListener('keydown', del);
    T.print('<div class="bios-badge" aria-hidden="true"><b>79</b><i></i><i></i><i></i><span>SIDE QUEST<br>ALLY</span></div>'
      + '<span class="hi">Awkward Modular BIOS v4.79PG</span>, A Side Quest Ally');
    T.out('Copyright (C) 1979-26, Awkward Prairie Software');
    T.print('');
    T.out('spreck79 486 PRAIRIE BIOS REVISION 3.1');
    T.print('');
    T.out('Main Processor   : Prairie 486DX2-79MHz');
    const mem = T.out('Memory Testing   :     0K');
    for (let k = 0; k <= 7979; k += 266) { mem.textContent = 'Memory Testing   : ' + lpad(Math.min(k, 7979), 5) + 'K'; await sleep(22); }
    mem.textContent = 'Memory Testing   :  7979K OK';
    await sleep(140);
    T.out('Side Quest Cache :    79K OK');
    await sleep(160);
    T.print('');
    T.out('Plug and Snack BIOS Extension v1.0A');
    T.out('Copyright (C) 1979-26, Awkward Prairie Software');
    await sleep(180);
    const drives = [['Primary Master  ', 'SPRECK79 79MB'], ['Primary Slave   ', 'None'], ['Secondary Master', 'Snack Drive'], ['Secondary Slave ', 'Out hiking']];
    for (const [where, found] of drives) {
      const line = T.out('   Detecting IDE ' + where + ' ...');
      await sleep(230);
      line.textContent += ' ' + found;
    }
    T.print('');
    const hint = T.print('Press <span class="hi">DEL</span> to enter SETUP');
    T.out('11/20/79-PRAIRIE-486-2A79SQ0BC-00', 'dim');
    for (let i = 0; i < 9 && !setup; i++) await sleep(100);
    if (setup) {
      hint.innerHTML = '<span class="hi">Entering SETUP...</span>';
      await sleep(700);
      hint.innerHTML = 'Everything is already set to beige. Nothing to change.';
      await sleep(1600);
    }
    removeEventListener('keydown', del);
  }

  // ---------------- boot ----------------
  // opts.mode: 'normal', 'dos' (?dos: boot and stay at the prompt) or 'desktop' (?desktop: skip S79-DOS).
  async function boot(term, opts = {}) {
    const T = term;
    if (opts.mode === 'desktop') {
      await S79.startGUI();
      T.run(); // after leaving the desktop, the S79-DOS prompt is waiting
      return;
    }
    let skip = false;
    const f8 = (e) => { if (e.key === 'F8') { skip = true; e.preventDefault(); } };
    addEventListener('keydown', f8);
    // Phones have no F8: a tap during the boot screen does the same.
    const touch = matchMedia('(pointer: coarse)').matches;
    const tapSkip = (e) => { if (e.pointerType === 'touch') skip = true; };
    addEventListener('pointerdown', tapSkip);
    await bios(T);
    T.clear();
    T.print('<span class="red">' + '\u2588'.repeat(34) + '</span>');
    T.print('<span class="och">' + '\u2584'.repeat(34) + '</span>');
    T.print('<span class="sla">' + '\u2588'.repeat(34) + '</span>   <span class="hi">S79-DOS 5.0</span>');
    T.print('');
    T.out('Starting S79-DOS...');
    T.out(touch ? 'Tap to skip AUTOEXEC.BAT' : 'Press F8 to skip AUTOEXEC.BAT', 'dim');
    await sleep(touch ? 1800 : 1100);
    removeEventListener('keydown', f8);
    removeEventListener('pointerdown', tapSkip);
    T.print('');
    if (skip) {
      T.out('S79-DOS is bypassing your AUTOEXEC.BAT file.', 'hi');
      T.print('');
    } else if (FS.isFile('C:\\AUTOEXEC.BAT')) {
      T.stayInDos = opts.mode === 'dos';
      await T.runBatch('C:\\AUTOEXEC.BAT');
      T.stayInDos = false;
    }
    T.run(); // the prompt is on screen as soon as this returns
    if (opts.onPrompt) opts.onPrompt();
  }

  window.S79DOS = { Terminal, boot, SIDE_QUESTS };
})();
