// S79 virtual disk — drive C:, saved in localStorage so DOS and the GUI share files.
(function () {
  const KEY = 's79-disk-v1';

  const now = () => Date.now();
  const file = (content, extra) => Object.assign({ type: 'file', content, mtime: now() }, extra || {});
  const dir = (children) => ({ type: 'dir', children: children || {}, mtime: now() });

  function defaultDisk() {
    return dir({
      'AUTOEXEC.BAT': file('@ECHO OFF\r\nPROMPT $P$G\r\nPATH C:\\S79;C:\\S79\\SYSTEM\r\nECHO Loading side quests...\r\nS79\r\n'),
      'CONFIG.SYS': file('FILES=79\r\nBUFFERS=79\r\nDEVICE=C:\\S79\\SYSTEM\\PRAIRIE.SYS\r\nSHELL=C:\\S79DOS\\COMMAND.COM /P\r\n'),
      'README.TXT': file([
        'spreck79 3.1',
        'All side quests. No main story.',
        '',
        'Welcome aboard. A few things to try:',
        '',
        '  * At the C:\\> prompt, type HELP for every S79-DOS command.',
        '  * Type S79 to start the spreck79 desktop.',
        '  * Edit AUTOEXEC.BAT and remove the S79 line to boot',
        '    straight to the prompt.',
        '  * Press F8 while booting to skip AUTOEXEC.BAT once.',
        '  * Ctrl+Esc on the desktop opens the Task List.',
        '',
        'Everything you save lives on drive C: and survives a reboot.',
        'Type FORMAT C: if you ever want a fresh disk.',
        '',
        '-- spreck79',
      ].join('\r\n')),
      S79DOS: dir({
        'COMMAND.COM': file('', { app: 'dos', size: 54619 }),
        'S79EDIT.EXE': file('', { app: 'edit', size: 41300 }),
      }),
      S79: dir({
        'QUESTMGR.EXE': file('', { app: 'questmgr', size: 115312 }),
        'JOTTER.EXE': file('', { app: 'jotter', size: 32816 }),
        'CABINET.EXE': file('', { app: 'cabinet', size: 146272 }),
        'TALLY.EXE': file('', { app: 'tally', size: 43072 }),
        'CLOCK.EXE': file('', { app: 'clock', size: 16416 }),
        'SKETCH.EXE': file('', { app: 'sketch', size: 79232 }),
        'GOPHER.EXE': file('', { app: 'gopher', size: 27904 }),
        'CONTROL.EXE': file('', { app: 'control', size: 57936 }),
        'S79PROMT.EXE': file('', { app: 'prompt', size: 9248 }),
        'LOOKOUT.EXE': file('', { app: 'lookout', size: 61979 }),
        'HARVEST.EXE': file('', { app: 'harvest', size: 31979 }),
        'BACKLOG.EXE': file('', { app: 'backlog', size: 79790 }),
        'S79.INI': file('[desktop]\r\ntheme=prairie\r\nwallpaper=grid\r\n\r\n[spreck79]\r\nmotto=All side quests. No main story.\r\n'),
        SYSTEM: dir({
          'PRAIRIE.SYS': file('', { size: 7979 }),
          'STRIPES.DRV': file('', { size: 3779 }),
          'GEORGIA.FON': file('', { size: 22079 }),
          'TREBUCHT.FON': file('', { size: 19779 }),
        }),
      }),
      QUESTS: dir({
        'GAMING.TXT': file('SIDE QUEST: GAMING\r\n\r\n[ ] Finish the backlog (never)\r\n[ ] Beat that one boss without a guide\r\n[x] Buy another game I will not play this year\r\n'),
        'PRINTING.TXT': file('SIDE QUEST: 3D PRINTING\r\n\r\n[ ] Level the bed. Again.\r\n[ ] Print a holder for the thing that holds the other thing\r\n[x] Spaghetti at 3 a.m.\r\n'),
        'HIKING.TXT': file('SIDE QUEST: HIKING\r\n\r\n[ ] Find a trail with a low, long view\r\n[ ] Pack the good snacks\r\n[ ] Leave no trace, take a few photos\r\n'),
        'NEXT.TXT': file('SIDE QUEST: WHATEVER COMES NEXT\r\n\r\nTo be decided. That is the whole point.\r\n'),
      }),
      DOCS: dir({}),
      PICTURES: dir({}),
      GAMES: dir({
        'GOPHER.EXE': file('', { app: 'gopher', size: 27904 }),
        'HARVEST.EXE': file('', { app: 'harvest', size: 31979 }),
        'BACKLOG.EXE': file('', { app: 'backlog', size: 79790 }),
        'SCORES.TXT': file('GOPHER FIELDS — BEST TIMES\r\n\r\nNo times yet. Go find some gophers.\r\n'),
      }),
    });
  }

  let root;
  try { root = JSON.parse(localStorage.getItem(KEY)); } catch (e) { root = null; }
  if (!root || root.type !== 'dir') root = defaultDisk();
  // Disks saved before a program shipped don't have it yet: add any missing programs to C:\S79.
  (function addNewPrograms() {
    const fresh = defaultDisk().children.S79.children, s79 = root.children && root.children.S79;
    if (!s79 || s79.type !== 'dir') return;
    for (const [name, node] of Object.entries(fresh)) if (node.app && !s79.children[name]) s79.children[name] = node;
  })();

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(root)); } catch (e) { /* disk full */ }
    }, 50);
  }

  // ---- paths ----
  // Canonical path form: "C:\\DIR\\FILE.TXT" (upper case, backslashes).
  function split(p) { return p.replace(/^[A-Za-z]:/, '').split(/[\\/]+/).filter(Boolean); }

  function resolve(cwd, p) {
    p = (p || '').trim();
    if (!p) return cwd;
    let parts;
    if (/^[A-Za-z]:/.test(p)) {
      const rest = p.slice(2);
      parts = /^[\\/]/.test(rest) || rest === '' ? [] : split(cwd);
      parts = parts.concat(split(rest));
    } else if (/^[\\/]/.test(p)) {
      parts = split(p);
    } else {
      parts = split(cwd).concat(split(p));
    }
    const out = [];
    for (const seg of parts) {
      if (seg === '.') continue;
      if (seg === '..') { out.pop(); continue; }
      if (/^\.{3,}$/.test(seg)) { for (let i = 2; i < seg.length; i++) out.pop(); continue; }
      out.push(seg.toUpperCase());
    }
    return 'C:\\' + out.join('\\');
  }

  function get(path) {
    let node = root;
    for (const seg of split(path)) {
      if (!node || node.type !== 'dir') return null;
      node = node.children[seg.toUpperCase()];
    }
    return node || null;
  }

  function parentOf(path) {
    const parts = split(path);
    const name = parts.pop();
    return { dir: 'C:\\' + parts.join('\\'), name: name ? name.toUpperCase() : '' };
  }

  const validName = (n) => /^[A-Z0-9_\-!#$%&'()@^{}~]{1,8}(\.[A-Z0-9_\-!#$%&'()@^{}~]{1,3})?$/.test(n);

  function sizeOf(node) {
    if (!node) return 0;
    if (node.type === 'file') return node.size != null ? node.size : (node.content || '').length;
    return Object.values(node.children).reduce((a, n) => a + sizeOf(n), 0);
  }

  const api = {
    resolve, get, parentOf, validName, sizeOf, save,
    isDir: (p) => { const n = get(p); return !!n && n.type === 'dir'; },
    isFile: (p) => { const n = get(p); return !!n && n.type === 'file'; },
    exists: (p) => !!get(p),

    list(path) {
      const n = get(path);
      if (!n || n.type !== 'dir') return null;
      return Object.keys(n.children).sort((a, b) => {
        const da = n.children[a].type === 'dir', db = n.children[b].type === 'dir';
        if (da !== db) return da ? -1 : 1;
        return a < b ? -1 : a > b ? 1 : 0;
      }).map((name) => ({ name, node: n.children[name] }));
    },

    read(path) {
      const n = get(path);
      if (!n || n.type !== 'file') throw new Error('File not found');
      return n.content || '';
    },

    write(path, content) {
      const { dir: d, name } = parentOf(path);
      const pd = get(d);
      if (!pd || pd.type !== 'dir') throw new Error('Path not found');
      if (!validName(name)) throw new Error('Invalid file name (use 8.3 names, e.g. NOTES.TXT)');
      const ex = pd.children[name];
      if (ex && ex.type === 'dir') throw new Error('A directory with that name exists');
      if (ex) { ex.content = content; delete ex.size; ex.mtime = now(); }
      else pd.children[name] = file(content);
      save();
    },

    mkdir(path) {
      const { dir: d, name } = parentOf(path);
      const pd = get(d);
      if (!pd || pd.type !== 'dir') throw new Error('Path not found');
      if (!validName(name)) throw new Error('Invalid directory name');
      if (pd.children[name]) throw new Error('Directory or file already exists');
      pd.children[name] = dir();
      save();
    },

    remove(path, recursive) {
      const { dir: d, name } = parentOf(path);
      const pd = get(d);
      if (!name || !pd || !pd.children[name]) throw new Error('File not found');
      const n = pd.children[name];
      if (n.type === 'dir' && !recursive && Object.keys(n.children).length) throw new Error('Directory not empty');
      delete pd.children[name];
      save();
    },

    rename(path, newName) {
      newName = newName.toUpperCase();
      const { dir: d, name } = parentOf(path);
      const pd = get(d);
      if (!pd || !pd.children[name]) throw new Error('File not found');
      if (!validName(newName)) throw new Error('Invalid file name');
      if (pd.children[newName]) throw new Error('Duplicate file name');
      pd.children[newName] = pd.children[name];
      delete pd.children[name];
      save();
    },

    copy(src, dst) {
      const n = get(src);
      if (!n || n.type !== 'file') throw new Error('File not found');
      if (api.isDir(dst)) dst = dst.replace(/\\$/, '') + '\\' + parentOf(src).name;
      const { dir: d, name } = parentOf(dst);
      const pd = get(d);
      if (!pd || pd.type !== 'dir') throw new Error('Path not found');
      if (!validName(name)) throw new Error('Invalid file name');
      pd.children[name] = JSON.parse(JSON.stringify(n));
      pd.children[name].mtime = now();
      save();
    },

    used() { return sizeOf(root); },
    capacity: 79 * 1024 * 1024,

    format() { root = defaultDisk(); save(); },
  };

  window.S79FS = api;
})();
