// spreck79 3.1 shell: boot, desktop session, settings, launching, task list, screen saver.
(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SKEY = 's79-settings-v1';
  // True when another page shows this one in a frame (the card on spreck79.com).
  const FRAMED = window.top !== window;
  const defaults = { theme: 'prairie', wallpaper: 'grid', saver: 3, saverStyle: 'lines', chime: true };
  let settings;
  try { settings = Object.assign({}, defaults, JSON.parse(localStorage.getItem(SKEY) || '{}')); } catch (e) { settings = Object.assign({}, defaults); }

  const S79 = (window.S79 = {
    modal: null,
    settings,
    questmgr: null,
    guiRunning: false,

    set(k, v) {
      settings[k] = v;
      try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {}
      apply();
      if (k === 'saver') saver.reset();
    },

    // Where the crash screen sends the tab. Set to null to stay put (handy when testing).
    crashTarget: 'https://spreck79.com/',

    // The spreck79 crash screen: covers everything, counts down 6 seconds, then leaves for spreck79.com.
    crash(reason) {
      if (S79.crashed) return;
      S79.crashed = true;
      saver.stop();
      WM.closeMenus();
      const el = document.getElementById('crash');
      el.querySelector('.cr-why').textContent = reason || 'Something on the prairie went sideways.';
      el.classList.remove('hidden');
      const block = (e) => { e.preventDefault(); e.stopPropagation(); };
      ['keydown', 'pointerdown', 'contextmenu', 'wheel'].forEach((t) => addEventListener(t, block, { capture: true, passive: false }));
      const count = el.querySelector('.cr-count b');
      let left = 6;
      count.textContent = left;
      const tick = setInterval(() => {
        left--;
        count.textContent = Math.max(left, 0);
        if (left <= 0) {
          clearInterval(tick);
          if (S79.crashTarget) location.href = S79.crashTarget;
        }
      }, 1000);
    },

    fullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); },

    launch(id, opts) {
      const app = S79Apps[id];
      if (!app) return WM.msgBox({ title: 'spreck79', icon: 'stop', text: 'Cannot find that program.' });
      if (id === 'dos') return S79.launch('prompt');
      if (id === 'edit') return S79.launch('jotter', opts);
      if (app.single) {
        const ex = [...WM.all].find((w) => w.appId === id);
        if (ex) { ex.state === 'min' ? ex.restore() : ex.focus(); return ex; }
      }
      const w = app.open(opts || {});
      if (w && w.el) w.appId = id;
      return w;
    },

    openFile(p) {
      const FS = S79FS;
      const node = FS.get(p);
      if (!node) return;
      if (node.type === 'dir') return S79.launch('cabinet');
      if (node.app) return S79.launch(node.app);
      if (/\.PIC$/.test(p)) return S79.launch('sketch', { file: p });
      if (/\.BAT$/.test(p)) return S79.launch('prompt', { batch: p });
      if (/\.QST$/.test(p)) return WM.msgBox({ title: 'spreck79', icon: 'info', text: FS.parentOf(p).name + ' holds the levels for BACKLOG.\nIt is not something you open. It is something you play.' });
      if (/\.(SYS|DRV|FON)$/.test(p) && !node.content) return WM.msgBox({ title: 'spreck79', icon: 'info', text: FS.parentOf(p).name + ' is a system file.\nIt keeps the prairie running. Best left alone.' });
      return S79.launch('jotter', { file: p });
    },

    refresh() {
      for (const w of WM.all) if (w.refresh) w.refresh();
    },

    async runDialog() {
      const v = await WM.promptBox({ title: 'Run', label: 'Command line', value: '' });
      if (!v || !v.trim()) return;
      const first = v.trim().split(/\s+/)[0];
      const t = new S79DOS.Terminal(document.createElement('div'), { mode: 'window' });
      const prog = t.findProgram(first);
      const node = prog && S79FS.get(prog);
      if (node && node.app && !prog.endsWith('.BAT')) {
        const arg = v.trim().slice(first.length).trim();
        const file = arg ? S79FS.resolve('C:\\', arg) : null;
        S79.launch(node.app, file && S79FS.isFile(file) ? { file } : {});
      } else {
        S79.launch('prompt', { run: v.trim() });
      }
    },

    taskList() {
      if (!S79.guiRunning || S79.modal) return;
      const tops = () => [...WM.all].filter((w) => !w.owner && !w.o.dialog);
      return WM.modal({ title: 'Task List', w: 340, h: 320 }, (c, finish) => {
        c.appendChild(WM.$(`<div class="tasklist"><div class="listbox"></div>
          <div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px">
            <button class="btn default sw">Switch To</button><button class="btn end">End Task</button><button class="btn cancel">Cancel</button>
          </div>
          <div class="row" style="justify-content:center;gap:8px"><button class="btn cas">Cascade</button><button class="btn tile">Tile</button></div></div>`));
        const lb = c.querySelector('.listbox');
        let sel = null;
        const render = () => {
          lb.innerHTML = '';
          for (const w of tops()) {
            const li = WM.$(`<div class="li"><span class="ic">${w.icon}</span><span></span></div>`);
            li.lastChild.textContent = w.title;
            if (!sel) sel = w;
            if (w === sel) li.classList.add('sel');
            li.onclick = () => { sel = w; render(); };
            li.ondblclick = () => go();
            lb.appendChild(li);
          }
        };
        const go = () => { finish(); if (sel) setTimeout(() => (sel.state === 'min' ? sel.restore() : sel.focus()), 0); };
        c.querySelector('.sw').onclick = go;
        c.querySelector('.cancel').onclick = () => finish();
        c.querySelector('.end').onclick = async () => { if (sel) { const s = sel; sel = null; finish(); await s.close(); } };
        const arrange = (mode) => {
          finish();
          const ws = tops().filter((w) => w.state !== 'min');
          const D = document.getElementById('desktop'), W = D.clientWidth, H = D.clientHeight - 90;
          ws.forEach((w, i) => {
            if (w.state === 'max') w.restore();
            if (w.o.resizable === false) { w.el.style.left = 20 + i * 28 + 'px'; w.el.style.top = 20 + i * 28 + 'px'; }
            else if (mode === 'cascade') Object.assign(w.el.style, { left: 20 + i * 28 + 'px', top: 20 + i * 28 + 'px', width: W * 0.6 + 'px', height: H * 0.7 + 'px' });
            else {
              const cols = Math.ceil(Math.sqrt(ws.length)), rows = Math.ceil(ws.length / cols);
              Object.assign(w.el.style, { left: (i % cols) * (W / cols) + 'px', top: Math.floor(i / cols) * (H / rows) + 'px', width: W / cols + 'px', height: H / rows + 'px' });
            }
            if (w.o.onResize) w.o.onResize();
            w.focus();
          });
        };
        c.querySelector('.cas').onclick = () => arrange('cascade');
        c.querySelector('.tile').onclick = () => arrange('tile');
        render();
      });
    },

    // ---------- session ----------
    // Where booting from inside another site's frame sends the whole tab.
    desktopURL: 'https://os.spreck79.com/?desktop',

    startGUI() {
      // Shown in a frame (the card on spreck79.com): boot in the full tab instead of the little frame.
      if (FRAMED) { S79.bootInTab(); return Promise.resolve(); }
      return new Promise(async (resolve) => {
        S79._exitGUI = resolve;
        const splash = document.getElementById('splash');
        const bar = splash.querySelector('.bar i');
        bar.style.width = '0';
        splash.classList.remove('hidden');
        document.getElementById('dos-screen').classList.add('hidden');
        for (let i = 1; i <= 10; i++) { await sleep(110); bar.style.width = i * 10 + '%'; }
        await sleep(250);
        splash.classList.add('hidden');
        document.getElementById('desktop').classList.remove('hidden');
        S79.guiRunning = true;
        apply();
        if (settings.chime) chime();
        S79.launch('questmgr');
        saver.reset();
      });
    },

    bootInTab() {
      try {
        window.top.location.href = S79.desktopURL;
      } catch (e) {
        // The page around this frame doesn't allow it: open the desktop in a new tab instead.
        const w = window.open(S79.desktopURL, '_blank', 'noopener');
        if (!w && S79.term) S79.term.out('Open os.spreck79.com to boot spreck79 3.1.', 'dim');
      }
    },

    async exitGUI() {
      const a = await WM.msgBox({ title: 'Exit spreck79', icon: 'question', text: 'This will end your spreck79 session\nand return you to S79-DOS.', buttons: ['OK', 'Cancel'] });
      if (a !== 'OK') return false;
      for (const w of [...WM.all]) if (w !== S79.questmgr && !w.owner) { const ok = await w.close(); if (ok === false) return false; }
      S79.guiRunning = false;
      saver.stop();
      setTimeout(() => {
        S79.questmgr && S79.questmgr.close(true);
        document.getElementById('desktop').classList.add('hidden');
        const ds = document.getElementById('dos-screen');
        ds.classList.remove('hidden');
        const r = S79._exitGUI; S79._exitGUI = null;
        if (r) r();
        setTimeout(() => S79.term.focusInput(), 0);
      }, 0);
      return false; // the shell closes Quest Manager itself
    },

    async shutdown() {
      const T = S79.term;
      T.out('Saving side quests...');
      S79FS.save();
      await sleep(500);
      T.print('');
      T.print('<span class="hi">It is now safe to switch off. See you on the next side quest.</span>');
      await sleep(1400);
      T.out('(Close this tab, or type REBOOT.)', 'dim');
    },
  });

  function apply() {
    document.documentElement.dataset.theme = settings.theme === 'dark' ? 'dark' : 'prairie';
    const d = document.getElementById('desktop');
    d.className = d.className.replace(/\bwp-\S+/g, '').trim() + ' wp-' + settings.wallpaper;
  }

  function chime() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [[392, 0], [523.25, 0.16], [659.25, 0.32], [783.99, 0.48]];
      for (const [f, t] of notes) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime + t);
        g.gain.linearRampToValueAtTime(0.12, ac.currentTime + t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0008, ac.currentTime + t + 1.1);
        o.connect(g).connect(ac.destination);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 1.2);
      }
      setTimeout(() => ac.close(), 2200);
    } catch (e) {}
  }

  // ---------- screen savers: "Prairie Lines" and "Bouncing 79" ----------
  const saver = (S79.saver = (function () {
    let idle = null, raf = null, on = false;
    const el = () => document.getElementById('saver');
    function reset() {
      clearTimeout(idle);
      if (on) stop();
      if (S79.guiRunning && settings.saver > 0) idle = setTimeout(start, settings.saver * 60000);
    }
    function start(style) {
      style = style || settings.saverStyle || 'lines';
      if (style === 'bounce') return startBounce();
      return startLines();
    }

    // "Bouncing 79": the spreck79 logo on a tile drifts around and bounces off the edges.
    // Every bounce switches the tile's color; a perfect corner hit gets a little celebration.
    const logos = {};
    for (const [k, src] of [['color', 'assets/logo.svg'], ['white', 'assets/logo-white.svg']]) { const im = new Image(); im.src = src; logos[k] = im; }
    const TILES = [['#F2EBDD', 'color'], ['#3E5C6B', 'white'], ['#9E3324', 'white'], ['#5F6E41', 'white'], ['#C08A2E', 'white']];
    function startBounce() {
      const s = el(); const cv = s.querySelector('canvas');
      s.classList.remove('hidden'); on = true;
      const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tw = Math.round(Math.min(280, Math.max(150, W * 0.3))), th = Math.round(tw * 0.66);
      let x = Math.random() * (W - tw), y = Math.random() * (H - th);
      const speed = Math.max(1.4, Math.min(W, H) / 380);
      let vx = speed * (Math.random() < 0.5 ? -1 : 1), vy = speed * 0.82 * (Math.random() < 0.5 ? -1 : 1);
      let tile = 0, cheer = 0, corners = +localStorage.getItem('s79-saver-corners') || 0;
      const frame = () => {
        x += vx; y += vy;
        let hitX = false, hitY = false;
        if (x <= 0) { x = 0; vx = Math.abs(vx); hitX = true; } else if (x + tw >= W) { x = W - tw; vx = -Math.abs(vx); hitX = true; }
        if (y <= 0) { y = 0; vy = Math.abs(vy); hitY = true; } else if (y + th >= H) { y = H - th; vy = -Math.abs(vy); hitY = true; }
        if (hitX || hitY) tile = (tile + 1) % TILES.length;
        if (hitX && hitY) { cheer = 150; corners++; try { localStorage.setItem('s79-saver-corners', corners); } catch (e) {} }
        g.fillStyle = '#0d0b09'; g.fillRect(0, 0, W, H);
        const [bg, logo] = TILES[tile];
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 8, y + 8, tw, th); // flat Prairie shadow
        g.fillStyle = bg; g.fillRect(x, y, tw, th);
        const im = logos[logo];
        if (im.complete && im.naturalWidth) { const lw = tw * 0.78, lh = lw * (im.naturalHeight / im.naturalWidth); g.drawImage(im, x + (tw - lw) / 2, y + (th - lh) / 2, lw, lh); }
        if (cheer > 0) {
          cheer--;
          g.font = '700 ' + Math.round(Math.min(64, W / 9)) + 'px Georgia, serif'; g.textAlign = 'center';
          g.fillStyle = cheer % 20 < 10 ? '#D9A441' : '#E0735C';
          g.fillText('CORNER!', W / 2, H * 0.22);
          g.textAlign = 'left';
        }
        if (corners) { g.font = '13px Consolas, monospace'; g.fillStyle = '#8C7F6A'; g.fillText('Perfect corners: ' + corners, 14, H - 14); }
        raf = requestAnimationFrame(frame);
      };
      frame();
    }

    function startLines() {
      const s = el(); const cv = s.querySelector('canvas');
      s.classList.remove('hidden'); on = true;
      cv.style.width = ''; cv.style.height = '';
      const W = (cv.width = innerWidth), H = (cv.height = innerHeight), g = cv.getContext('2d');
      g.fillStyle = '#0d0b09'; g.fillRect(0, 0, W, H);
      const cols = ['#9E3324', '#C08A2E', '#3E5C6B', '#5F6E41', '#E0735C', '#D9A441', '#8FB0BF'];
      let t = 0;
      const startAt = performance.now();
      const frame = () => {
        t++;
        if (t % 3 === 0) {
          g.fillStyle = 'rgba(13,11,9,0.06)'; g.fillRect(0, 0, W, H);
          const y = Math.floor(Math.random() * (H / 24)) * 24;
          const x = Math.floor(Math.random() * (W / 24)) * 24;
          const kind = Math.random();
          if (kind < 0.55) {
            const yy = y, c = Math.floor(Math.random() * 3);
            g.fillStyle = ['#9E3324', '#C08A2E', '#3E5C6B'][c];
            const len = 120 + Math.random() * W * 0.6;
            g.fillRect(x, yy, len, [6, 4, 9][c]);
          } else if (kind < 0.85) {
            g.fillStyle = '#3D342B'; g.fillRect(x, 0, 2, H);
          } else {
            g.fillStyle = cols[Math.floor(Math.random() * cols.length)]; g.fillRect(x + 6, y + 6, 14, 14);
          }
        }
        if (performance.now() - startAt > 4000 && t % 200 === 0) {
          g.font = '700 28px Georgia, serif'; g.fillStyle = '#F2EBDD';
          g.fillText('All side quests. No main story.', 40 + Math.random() * (W - 520), 60 + Math.random() * (H - 120));
        }
        raf = requestAnimationFrame(frame);
      };
      frame();
    }
    function stop() { on = false; cancelAnimationFrame(raf); el().classList.add('hidden'); }
    let lastMove = 0;
    ['keydown', 'pointerdown', 'wheel'].forEach((ev) => addEventListener(ev, (e) => { if (on) { e.preventDefault(); e.stopPropagation(); } reset(); }, true));
    addEventListener('pointermove', (e) => { const n = performance.now(); if (on && n - lastMove < 300) { /* ignore jitter */ } lastMove = n; if (!on) reset(); else if (Math.abs(e.movementX) + Math.abs(e.movementY) > 3) reset(); }, true);
    return { reset, start, stop };
  })());

  // ---------- keyboard ----------
  addEventListener('keydown', (e) => {
    if (!S79.guiRunning) return;
    if (e.key === 'Escape' && e.ctrlKey) { e.preventDefault(); S79.taskList(); }
    if (e.key === 'F4' && e.altKey) { e.preventDefault(); const w = WM.Win.active; if (w) w.close(); }
    if (e.key === 'F4' && e.ctrlKey) {
      e.preventDefault();
      const w = WM.Win.active;
      const child = w && [...w.children].find((c) => c.el.classList.contains('active') && c.state !== 'min');
      if (child) child.close();
    }
    if (e.key === 'F11') { e.preventDefault(); S79.fullscreen(); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'F11' && !S79.guiRunning) { e.preventDefault(); S79.fullscreen(); } });

  // ---------- phone keyboard ----------
  // When an on-screen keyboard opens, fit full-screen S79-DOS (and S79EDIT) into the part of the
  // screen that's still visible, so the editor's buttons and the prompt aren't hidden behind it.
  if (window.visualViewport && matchMedia('(pointer: coarse)').matches) {
    const vv = window.visualViewport;
    const fit = () => {
      const ds = document.getElementById('dos-screen');
      if (!ds) return;
      const covered = innerHeight - vv.height > 80; // keyboard (or similar) is up
      ds.style.top = covered ? vv.offsetTop + 'px' : '';
      ds.style.height = covered ? vv.height + 'px' : '';
      ds.style.bottom = covered ? 'auto' : '';
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
  }

  // ---------- go ----------
  // ?desktop skips S79-DOS; ?dos boots and stays at the prompt (used by the card on spreck79.com).
  const params = new URLSearchParams(location.search);
  const bootMode = params.has('desktop') ? 'desktop' : params.has('dos') ? 'dos' : 'normal';
  // ?desktop is a one-time shortcut (used when booting from the card). Take it out of the address
  // so REBOOT and page refreshes go through the full BIOS and S79-DOS boot again.
  if (bootMode === 'desktop') {
    params.delete('desktop');
    const rest = params.toString();
    try { history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch (e) {}
  }

  addEventListener('DOMContentLoaded', () => {
    apply();
    const term = new S79DOS.Terminal(document.getElementById('dos-term'), { mode: 'boot' });
    S79.term = term;
    S79DOS.boot(term, {
      mode: bootMode,
      // In a frame, tell spreck79.com the real prompt is up so it can swap out its stand-in terminal.
      onPrompt: () => { if (FRAMED) try { parent.postMessage('s79dos:ready', 'https://spreck79.com'); } catch (e) {} },
    });
  });
})();
