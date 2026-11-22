// BACKLOG — a first-person side quest for S79-DOS.
// An original game: original levels, monsters, art and sounds, drawn and synthesized in code.
// Your unfinished side quests have come alive. Clear them out of the house with a foam-dart blaster.
(function () {
  const W = 320, VH = 168, HUD = 32, H = VH + HUD, T = 64;

  // ---------------- small helpers ----------------
  const rgba = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const shade = (c, f) => rgba(((c & 255) * f) | 0, (((c >> 8) & 255) * f) | 0, (((c >> 16) & 255) * f) | 0);
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function paint(draw) {
    const c = document.createElement('canvas'); c.width = c.height = T;
    const g = c.getContext('2d'); draw(g, c);
    return new Uint32Array(g.getImageData(0, 0, T, T).data.buffer);
  }
  const speckle = (g, base, spots, n, seed) => {
    g.fillStyle = base; g.fillRect(0, 0, T, T);
    const r = rng(seed);
    for (let i = 0; i < n; i++) { g.fillStyle = spots[(r() * spots.length) | 0]; g.fillRect((r() * T) | 0, (r() * T) | 0, 1, 1); }
  };

  // ---------------- wall textures (Prairie house) ----------------
  const WALL_TEX = [
    // 0 brick
    paint((g) => {
      speckle(g, '#C9B897', ['#B9A787', '#D4C4A4'], 120, 1);
      for (let row = 0; row < 8; row++) {
        const off = row % 2 ? 8 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 16 + off;
          g.fillStyle = (row + col) % 3 ? '#9E3324' : '#8A2B1E';
          g.fillRect(x + 1, row * 8 + 1, 14, 6);
          g.fillStyle = '#B8503E'; g.fillRect(x + 1, row * 8 + 1, 14, 1);
        }
      }
    }),
    // 1 plaster with the spreck79 stripe trim
    paint((g) => {
      speckle(g, '#E4D8C1', ['#D8CAB0', '#EDE3D0', '#CDBFA3'], 260, 2);
      g.fillStyle = '#9E3324'; g.fillRect(0, 38, T, 4);
      g.fillStyle = '#C08A2E'; g.fillRect(0, 44, T, 3);
      g.fillStyle = '#3E5C6B'; g.fillRect(0, 49, T, 6);
      g.fillStyle = '#5E5245'; g.fillRect(0, 60, T, 4);
    }),
    // 2 slate Prairie panel
    paint((g) => {
      speckle(g, '#3E5C6B', ['#38535F', '#456673'], 160, 3);
      g.fillStyle = '#2E2620';
      g.fillRect(0, 0, T, 3); g.fillRect(0, 61, T, 3); g.fillRect(0, 0, 3, T); g.fillRect(61, 0, 3, T);
      g.fillRect(8, 8, 48, 2); g.fillRect(8, 54, 48, 2); g.fillRect(8, 8, 2, 48); g.fillRect(54, 8, 2, 48);
      g.fillRect(31, 10, 2, 44);
      g.fillStyle = '#C08A2E'; g.fillRect(38, 16, 8, 8);
      g.fillStyle = '#9E3324'; g.fillRect(16, 40, 6, 6);
    }),
    // 3 wood planks
    paint((g) => {
      speckle(g, '#6B4E33', ['#5E4329', '#775A3C', '#634830'], 300, 4);
      g.fillStyle = '#3D2B1C';
      for (let x = 0; x < T; x += 16) g.fillRect(x, 0, 2, T);
      g.fillStyle = '#4A3523'; g.fillRect(6, 20, 3, 3); g.fillRect(38, 44, 3, 3);
    }),
    // 4 the EXIT door
    paint((g) => {
      g.fillStyle = '#2E2620'; g.fillRect(0, 0, T, T);
      g.fillStyle = '#F2EBDD'; g.fillRect(8, 6, 48, 58);
      g.fillStyle = '#9E3324'; g.fillRect(14, 6, 6, 58);
      g.fillStyle = '#C08A2E'; g.fillRect(23, 6, 4, 58);
      g.fillStyle = '#3E5C6B'; g.fillRect(30, 6, 8, 58);
      g.fillStyle = '#2E2620'; g.font = 'bold 11px monospace'; g.fillText('EXIT', 18, 22);
      g.fillStyle = '#C08A2E'; g.fillRect(48, 34, 4, 4);
    }),
  ];
  const WALLS = { '#': 0, P: 1, S: 2, W: 3, X: 4 };

  // ---------------- sprites (transparent 64x64) ----------------
  function spaghetti(g, tint) {
    const r = rng(79);
    g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      g.strokeStyle = tint || ['#D9A441', '#C08A2E', '#E6B85C'][i % 3];
      g.lineWidth = 3;
      g.beginPath();
      const cx = 18 + r() * 28, cy = 26 + r() * 30, rad = 6 + r() * 9;
      g.arc(cx, cy, rad, r() * 6, r() * 6 + 3 + r() * 3);
      g.stroke();
    }
    g.fillStyle = '#F2EBDD'; g.beginPath(); g.arc(25, 34, 6, 0, 7); g.arc(40, 33, 7, 0, 7); g.fill();
    g.fillStyle = '#171310'; g.beginPath(); g.arc(27, 35, 2.5, 0, 7); g.arc(38, 35, 3, 0, 7); g.fill();
  }
  function bunny(g, tint) {
    const r = rng(7);
    g.fillStyle = '#5E5245';
    for (let i = 0; i < 70; i++) { const a = r() * 6.3, d = r() * 14; g.fillStyle = tint || ['#8C7F6A', '#A89A82', '#CDBFA3'][i % 3]; g.beginPath(); g.arc(32 + Math.cos(a) * d, 48 + Math.sin(a) * d * 0.8, 3 + r() * 3, 0, 7); g.fill(); }
    g.fillStyle = tint || '#A89A82'; g.fillRect(22, 24, 5, 16); g.fillRect(36, 22, 5, 18);
    g.fillStyle = '#E0735C'; g.fillRect(27, 44, 3, 3); g.fillRect(35, 44, 3, 3);
  }
  const SPRITES = {
    gremlin: paint((g) => spaghetti(g)),
    gremlinHit: paint((g) => spaghetti(g, '#F2EBDD')),
    gremlinDead: paint((g) => { g.translate(0, 34); g.scale(1, 0.45); spaghetti(g, '#8A6A2A'); }),
    bunny: paint((g) => bunny(g)),
    bunnyHit: paint((g) => bunny(g, '#F2EBDD')),
    bunnyDead: paint((g) => { g.translate(0, 30); g.scale(1, 0.5); bunny(g, '#5E5245'); }),
    darts: paint((g) => {
      g.fillStyle = '#C08A2E'; g.fillRect(16, 42, 32, 20); g.fillStyle = '#9E3324'; g.fillRect(16, 42, 32, 4);
      for (let i = 0; i < 5; i++) { g.fillStyle = '#3E5C6B'; g.fillRect(20 + i * 5, 30, 3, 14); g.fillStyle = '#E0735C'; g.fillRect(20 + i * 5, 27, 3, 4); }
    }),
    snack: paint((g) => {
      g.fillStyle = '#D9A441'; g.fillRect(18, 44, 28, 6); g.fillRect(18, 56, 28, 6);
      g.fillStyle = '#A9B884'; g.fillRect(16, 50, 32, 3); g.fillStyle = '#9E3324'; g.fillRect(19, 53, 26, 3);
    }),
  };
  const ENEMY = {
    g: { kind: 'gremlin', hp: 3, speed: 1.15, dmg: 9, scale: 0.75, name: 'Spaghetti Gremlin' },
    b: { kind: 'bunny', hp: 1, speed: 2.1, dmg: 5, scale: 0.55, name: 'Dust Bunny' },
  };

  // ---------------- levels (original) ----------------
  const LEVELS = [
    { name: 'The Garage', map: [
      '################',
      '#@..#......d...#',
      '#...#..g.......#',
      '#...P...PPPP...#',
      '#...........#..#',
      '##.##..h....#.g#',
      '#......g....#..#',
      '#..SSSS.....P..#',
      '#..S..S..d.....#',
      '#..S..........g#',
      '#..S..SSSS..####',
      '#.g......h.....X',
      '################',
    ] },
    { name: 'The Workshop', map: [
      '####################',
      '#@....#.....W....d.#',
      '#.....#..g..W......#',
      '#..d..W.....W..b...#',
      '#.....W..WWWW......#',
      '###.###.......g....#',
      '#.....#..SSS....####',
      '#.g...#..S.S..h....#',
      '#.....P..S.S.......#',
      '#..h..P..S.......b.#',
      '#.....PPPP..SSSS...#',
      '#..b.........g...#.#',
      '#####.......d....#.X',
      '####################',
    ] },
    { name: 'The Long Hallway', map: [
      '####################',
      '#@.#...g......#..h.#',
      '#..#.####.###.#....#',
      '#..#.#..b...#.#.g..#',
      '#....#.d....#......#',
      '#.####.##P###.###.##',
      '#.#..g.#....#...#..#',
      '#.#.##.#.h..#.b.#..#',
      '#...#..#....#...#..#',
      '###.#.##P.P##.###..#',
      '#...#.......g......#',
      '#.d.#####.#####.##.#',
      '#.....b...#.g.....h#',
      '#########.#..d.....#',
      '#..g......#.....b..X',
      '####################',
    ] },
  ];

  // ---------------- sound (tiny synth) ----------------
  let ac = null;
  function beep(freq, dur, type = 'square', vol = 0.06, slide = 0) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const SFX = {
    fire: () => beep(520, 0.09, 'square', 0.05, -360),
    hit: () => beep(220, 0.12, 'sawtooth', 0.05, -120),
    kill: () => { beep(330, 0.1, 'triangle', 0.07, 220); setTimeout(() => beep(660, 0.12, 'triangle', 0.06), 90); },
    hurt: () => beep(120, 0.18, 'sawtooth', 0.07, -60),
    pickup: () => { beep(660, 0.06, 'triangle', 0.06); setTimeout(() => beep(990, 0.08, 'triangle', 0.06), 60); },
    empty: () => beep(90, 0.05, 'square', 0.04),
    exit: () => [392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.07), i * 120)),
  };

  // ---------------- the game ----------------
  // play(term) runs BACKLOG inside the terminal's screen and resolves when the player quits.
  function play(term) {
    return new Promise((resolve) => {
      const host = term.el.parentElement;
      const touch = matchMedia('(pointer: coarse)').matches;
      const root = document.createElement('div');
      root.className = 'bl-game';
      root.tabIndex = 0;
      root.innerHTML = `<canvas width="${W}" height="${H}"></canvas>
        <div class="bl-pad">
          <div class="bl-move"><button data-k="up" aria-label="Forward">&#9650;</button><button data-k="left" aria-label="Turn left">&#9664;</button><button data-k="down" aria-label="Back">&#9660;</button><button data-k="right" aria-label="Turn right">&#9654;</button></div>
          <button class="bl-fire" data-k="fire">FIRE</button>
        </div>
        <button class="bl-pausebtn" aria-label="Pause">&#10074;&#10074;</button>
        <div class="bl-menu hidden"><div class="bl-box"><b>PAUSED</b><button data-a="resume">Resume</button><button data-a="quit">Quit to S79-DOS</button></div></div>`;
      if (!touch) root.querySelector('.bl-pad').remove();
      host.appendChild(root);
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
      const img = ctx.createImageData(W, VH), buf = new Uint32Array(img.data.buffer), zbuf = new Float32Array(W);
      const menu = root.querySelector('.bl-menu');

      // pre-shaded floor and ceiling rows
      const ceil = new Uint32Array(VH), floor = new Uint32Array(VH);
      for (let y = 0; y < VH; y++) {
        const d = Math.abs(y - VH / 2) / (VH / 2);
        const f = 0.25 + d * 0.75;
        ceil[y] = shade(rgba(228, 216, 193), f);
        floor[y] = shade(rgba(94, 82, 69), 0.35 + d * 0.65);
      }

      let level = 0, map, ents, px, py, dirX, dirY, planeX, planeY;
      let hp = 100, darts = 30, state = 'title', paused = false, raf = 0, last = performance.now(), clock = 0;
      let fireCd = 0, fireAnim = 0, walk = 0, hurtFlash = 0, msg = '', msgT = 0, kills = 0, total = 0, levelTime = 0;
      const stats = { kills: 0, levels: 0 };
      const keys = new Set();

      function load(n) {
        level = n;
        map = LEVELS[n].map.map((r) => r.split(''));
        ents = []; total = 0; kills = 0; levelTime = 0;
        for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
          const ch = map[y][x];
          if (ch === '@') { px = x + 0.5; py = y + 0.5; dirX = 1; dirY = 0; planeX = 0; planeY = 0.66; map[y][x] = '.'; }
          else if (ENEMY[ch]) { const e = ENEMY[ch]; ents.push({ x: x + 0.5, y: y + 0.5, enemy: true, kind: e.kind, hp: e.hp, speed: e.speed, dmg: e.dmg, scale: e.scale, awake: false, hurt: 0, cd: 0, dead: false, bob: Math.random() * 6 }); total++; map[y][x] = '.'; }
          else if (ch === 'd' || ch === 'h') { ents.push({ x: x + 0.5, y: y + 0.5, pickup: ch === 'd' ? 'darts' : 'snack', scale: 0.4 }); map[y][x] = '.'; }
        }
        say(LEVELS[n].name + '. Clear the side quests, then find the EXIT.');
      }
      const say = (t) => { msg = t; msgT = 3.2; };
      const cell = (x, y) => (map[y | 0] && map[y | 0][x | 0]) || '#';
      const isWall = (x, y) => WALLS[cell(x, y)] !== undefined;
      const blocked = (x, y, r) => isWall(x - r, y - r) || isWall(x + r, y - r) || isWall(x - r, y + r) || isWall(x + r, y + r);
      const touches = (x, y, r, ch) => cell(x - r, y - r) === ch || cell(x + r, y - r) === ch || cell(x - r, y + r) === ch || cell(x + r, y + r) === ch;
      function sight(ax, ay, bx, by) {
        const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 0.1);
        for (let i = 1; i < n; i++) if (isWall(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
        return true;
      }

      // ---------- update ----------
      function move(nx, ny) {
        const r = 0.22;
        if (touches(nx, ny, r, 'X')) return finishLevel();
        if (!blocked(nx, py, r)) px = nx;
        if (!blocked(px, ny, r)) py = ny;
      }
      function rotate(a) {
        const c = Math.cos(a), s = Math.sin(a);
        [dirX, dirY] = [dirX * c - dirY * s, dirX * s + dirY * c];
        [planeX, planeY] = [planeX * c - planeY * s, planeX * s + planeY * c];
      }
      function fire() {
        if (fireCd > 0) return;
        if (darts <= 0) { SFX.empty(); say('Out of darts. Find a dart box.'); fireCd = 0.4; return; }
        darts--; fireCd = 0.32; fireAnim = 1; SFX.fire();
        // hit the nearest visible enemy near the crosshair
        const inv = 1 / (planeX * dirY - dirX * planeY);
        let best = null;
        for (const e of ents) {
          if (!e.enemy || e.dead) continue;
          const sx = e.x - px, sy = e.y - py;
          const tx = inv * (dirY * sx - dirX * sy), ty = inv * (-planeY * sx + planeX * sy);
          if (ty <= 0.1 || ty > zbuf[W >> 1] + 0.3) continue;
          const scr = (W / 2) * (1 + tx / ty), half = ((VH / ty) * e.scale) / 2;
          if (Math.abs(scr - W / 2) < Math.max(6, half * 0.7) && (!best || ty < best.ty)) best = { e, ty };
        }
        if (best) {
          const e = best.e; e.hp--; e.hurt = 0.15; e.awake = true;
          if (e.hp <= 0) { e.dead = true; kills++; stats.kills++; SFX.kill(); say(kills === total ? 'Every side quest here is done. Find the EXIT.' : 'Side quest cleared. ' + (total - kills) + ' to go.'); }
          else SFX.hit();
        }
      }
      function finishLevel() {
        SFX.exit();
        stats.levels = Math.max(stats.levels, level + 1);
        state = level === LEVELS.length - 1 ? 'won' : 'cleared';
        keys.clear();
      }
      function update(dt) {
        clock += dt;
        if (msgT > 0) msgT -= dt;
        if (state !== 'play' || paused) return;
        levelTime += dt;
        fireCd = Math.max(0, fireCd - dt); fireAnim = Math.max(0, fireAnim - dt * 4); hurtFlash = Math.max(0, hurtFlash - dt * 2);
        const fwd = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
        const strafe = (keys.has('sright') ? 1 : 0) - (keys.has('sleft') ? 1 : 0);
        const turn = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
        if (turn) rotate(turn * 2.4 * dt);
        if (fwd || strafe) {
          const sp = 3.0 * dt;
          move(px + (dirX * fwd + planeX / 0.66 * strafe) * sp, py + (dirY * fwd + planeY / 0.66 * strafe) * sp);
          walk += dt * 9;
        }
        if (state !== 'play') return; // reached the exit this frame
        if (keys.has('fire')) fire();
        // pickups
        for (const e of ents) {
          if (!e.pickup || e.taken || Math.hypot(e.x - px, e.y - py) > 0.55) continue;
          if (e.pickup === 'darts') { darts += 15; e.taken = true; SFX.pickup(); say('+15 foam darts.'); }
          else if (hp < 100) { hp = Math.min(100, hp + 25); e.taken = true; SFX.pickup(); say('A snack. +25 health.'); }
        }
        // enemies
        for (const e of ents) {
          if (!e.enemy || e.dead) continue;
          e.hurt = Math.max(0, e.hurt - dt);
          const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy);
          if (!e.awake && d < 8 && sight(e.x, e.y, px, py)) e.awake = true;
          if (!e.awake) continue;
          e.bob += dt * 8;
          if (d > 0.75) {
            const s = (e.speed * dt) / d, nx = e.x + dx * s, ny = e.y + dy * s;
            if (!blocked(nx, e.y, 0.25)) e.x = nx;
            if (!blocked(e.x, ny, 0.25)) e.y = ny;
          } else {
            e.cd -= dt;
            if (e.cd <= 0) {
              e.cd = 0.9; hp -= e.dmg; hurtFlash = 0.6; SFX.hurt();
              if (hp <= 0) { hp = 0; state = 'dead'; keys.clear(); }
            }
          }
        }
      }

      // ---------- draw ----------
      function render3d() {
        for (let y = 0; y < VH; y++) buf.fill(y < VH / 2 ? ceil[y] : floor[y], y * W, y * W + W);
        for (let x = 0; x < W; x++) {
          const cam = (2 * x) / W - 1, rdx = dirX + planeX * cam, rdy = dirY + planeY * cam;
          let mx = px | 0, my = py | 0;
          const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
          let stx, sty, sdx, sdy, side = 0, ch = '#';
          if (rdx < 0) { stx = -1; sdx = (px - mx) * ddx; } else { stx = 1; sdx = (mx + 1 - px) * ddx; }
          if (rdy < 0) { sty = -1; sdy = (py - my) * ddy; } else { sty = 1; sdy = (my + 1 - py) * ddy; }
          for (let i = 0; i < 80; i++) {
            if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; }
            ch = (map[my] && map[my][mx]) || '#';
            if (WALLS[ch] !== undefined) break;
          }
          const dist = Math.max(0.05, side === 0 ? sdx - ddx : sdy - ddy);
          zbuf[x] = dist;
          const lh = VH / dist, y0 = (VH - lh) / 2;
          let wx = side === 0 ? py + dist * rdy : px + dist * rdx; wx -= Math.floor(wx);
          let tx = (wx * T) | 0; if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = T - tx - 1;
          const tex = WALL_TEX[WALLS[ch]];
          const f = Math.max(0.22, Math.min(1, 1.5 / (dist * 0.5 + 0.55))) * (side ? 0.8 : 1);
          const ys = Math.max(0, y0 | 0), ye = Math.min(VH, (y0 + lh) | 0), step = T / lh;
          let tpos = (ys - y0) * step;
          for (let y = ys; y < ye; y++) { buf[y * W + x] = shade(tex[((tpos | 0) & 63) * T + tx], f); tpos += step; }
        }
        // sprites, far to near
        const inv = 1 / (planeX * dirY - dirX * planeY);
        const list = ents.filter((e) => !e.taken).map((e) => ({ e, d: (e.x - px) ** 2 + (e.y - py) ** 2 })).sort((a, b) => b.d - a.d);
        for (const { e } of list) {
          const sx = e.x - px, sy = e.y - py;
          const tx = inv * (dirY * sx - dirX * sy), ty = inv * (-planeY * sx + planeX * sy);
          if (ty <= 0.15) continue;
          const scr = (W / 2) * (1 + tx / ty);
          const size = (VH / ty) * (e.dead ? e.scale * 0.8 : e.scale);
          const floorY = VH / 2 + VH / ty / 2;
          const bob = e.enemy && !e.dead && e.awake ? Math.sin(e.bob) * size * 0.04 : 0;
          const top = floorY - size + bob, left = scr - size / 2;
          const tex = e.pickup ? SPRITES[e.pickup] : SPRITES[e.kind + (e.dead ? 'Dead' : e.hurt > 0 ? 'Hit' : '')];
          const f = Math.max(0.3, Math.min(1, 1.5 / (ty * 0.5 + 0.55)));
          const x0 = Math.max(0, left | 0), x1 = Math.min(W, (left + size) | 0);
          const y0 = Math.max(0, top | 0), y1 = Math.min(VH, (top + size) | 0);
          for (let x = x0; x < x1; x++) {
            if (ty >= zbuf[x]) continue;
            const tcx = (((x - left) / size) * T) | 0;
            for (let y = y0; y < y1; y++) {
              const c = tex[((((y - top) / size) * T) | 0) * T + tcx];
              if (c >>> 24 < 128) continue;
              buf[y * W + x] = shade(c, f);
            }
          }
        }
        ctx.putImageData(img, 0, 0);
      }
      function drawBlaster() {
        const bx = W / 2 - 22 + Math.sin(walk) * 3, by = VH - 40 + Math.abs(Math.cos(walk)) * 3 + fireAnim * 7;
        ctx.fillStyle = '#C08A2E'; ctx.fillRect(bx + 14, by + 28, 14, 14);
        ctx.fillStyle = '#3E5C6B'; ctx.fillRect(bx, by + 10, 44, 22);
        ctx.fillStyle = '#9E3324'; ctx.fillRect(bx + 4, by + 16, 36, 3);
        ctx.fillStyle = '#C08A2E'; ctx.fillRect(bx + 4, by + 21, 36, 2);
        ctx.fillStyle = '#2E2620'; ctx.fillRect(bx + 16, by, 12, 12);
        ctx.fillStyle = '#E0735C'; ctx.fillRect(bx + 17, by - 4, 10, 5);
        if (fireAnim > 0.55) { ctx.fillStyle = '#F2EBDD'; ctx.beginPath(); ctx.arc(bx + 22, by - 8, 5 * fireAnim, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#F2EBDD'; ctx.fillRect(W / 2 - 4, VH / 2, 3, 1); ctx.fillRect(W / 2 + 2, VH / 2, 3, 1); ctx.fillRect(W / 2, VH / 2 - 4, 1, 3); ctx.fillRect(W / 2, VH / 2 + 2, 1, 3);
      }
      function drawHud() {
        ctx.fillStyle = '#171310'; ctx.fillRect(0, VH, W, HUD);
        ctx.fillStyle = '#9E3324'; ctx.fillRect(0, VH, W, 2); ctx.fillStyle = '#C08A2E'; ctx.fillRect(0, VH + 3, W, 1); ctx.fillStyle = '#3E5C6B'; ctx.fillRect(0, VH + 5, W, 2);
        const item = (label, value, x, col) => {
          ctx.fillStyle = '#8C7F6A'; ctx.font = 'bold 7px monospace'; ctx.fillText(label, x, VH + 15);
          ctx.fillStyle = col; ctx.font = 'bold 13px monospace'; ctx.fillText(value, x, VH + 28);
        };
        item('HEALTH', String(hp).padStart(3, ' '), 8, hp > 60 ? '#A9B884' : hp > 30 ? '#D9A441' : '#E0735C');
        item('DARTS', String(darts).padStart(3, ' '), 62, '#D9A441');
        item('SIDE QUESTS', (total - kills) + ' LEFT', 196, '#F2EBDD');
        item('LEVEL', String(level + 1), 278, '#8FB0BF');
        // the 79 badge: changes color with health, flashes when hurt
        const badge = hurtFlash > 0.3 ? '#E0735C' : hp > 60 ? '#5F6E41' : hp > 30 ? '#C08A2E' : '#9E3324';
        ctx.fillStyle = badge; ctx.fillRect(140, VH + 9, 34, 21);
        ctx.fillStyle = '#F2EBDD'; ctx.font = 'bold 15px Georgia, serif'; ctx.fillText('79', 147, VH + 26);
      }
      function centerText(t, y, font, col) { ctx.font = font; ctx.fillStyle = col; ctx.fillText(t, (W - ctx.measureText(t).width) / 2, y); }
      function screen(title, lines, prompt) {
        ctx.fillStyle = 'rgba(23,19,16,.82)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#9E3324'; ctx.fillRect(0, 34, W, 4); ctx.fillStyle = '#C08A2E'; ctx.fillRect(0, 40, W, 3); ctx.fillStyle = '#3E5C6B'; ctx.fillRect(0, 45, W, 5);
        centerText(title, 28, 'bold 20px Georgia, serif', '#F2EBDD');
        lines.forEach((l, i) => centerText(l, 72 + i * 14, '9px monospace', '#E4D8C1'));
        if (Math.floor(clock * 2) % 2 === 0) centerText(prompt, 178, 'bold 10px monospace', '#D9A441');
      }
      function draw() {
        if (state === 'title') {
          ctx.fillStyle = '#171310'; ctx.fillRect(0, 0, W, H);
          // slowly drifting Prairie stripes behind the title
          const o = (clock * 20) % W;
          [[96, 8, '#9E3324'], [108, 5, '#C08A2E'], [117, 12, '#3E5C6B']].forEach(([y, h, c]) => { ctx.fillStyle = c; ctx.fillRect(-o, y, W * 2, h); });
          centerText('BACKLOG', 62, 'bold 40px Georgia, serif', '#D9A441');
          centerText('A FIRST-PERSON SIDE QUEST', 80, 'bold 8px monospace', '#E4D8C1');
          centerText('Your unfinished side quests came alive. Clear them out.', 146, '8px monospace', '#CDBFA3');
          centerText(touch ? 'Arrows move/turn  FIRE shoots  ❚❚ pauses' : 'Arrows/WASD move  Q/E strafe  SPACE fires  ESC pauses', 158, '8px monospace', '#8C7F6A');
          if (Math.floor(clock * 2) % 2 === 0) centerText(touch ? 'TAP TO START' : 'PRESS ANY KEY TO START', 182, 'bold 10px monospace', '#F2EBDD');
          centerText('(C) 1979-2026 spreck79', 196, '7px monospace', '#5E5245');
          return;
        }
        render3d();
        drawBlaster();
        if (hurtFlash > 0) { ctx.fillStyle = `rgba(158,51,36,${Math.min(0.55, hurtFlash)})`; ctx.fillRect(0, 0, W, VH); }
        if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT); ctx.fillStyle = '#F2EBDD'; ctx.font = '8px monospace'; ctx.fillText(msg, 6, 12); ctx.globalAlpha = 1; }
        drawHud();
        const t = Math.round(levelTime);
        if (state === 'cleared') screen('LEVEL ' + (level + 1) + ' DONE', [LEVELS[level].name, '', 'Side quests cleared: ' + kills + ' of ' + total, 'Time: ' + t + ' seconds', '', 'Next: ' + LEVELS[level + 1].name], touch ? 'TAP TO CONTINUE' : 'PRESS ANY KEY');
        else if (state === 'dead') screen('QUEST FAILED', ['The backlog got you.', '', 'Cleared ' + kills + ' of ' + total + ' here.', '', 'Back to the start of ' + LEVELS[level].name + '.'], touch ? 'TAP TO TRY AGAIN' : 'PRESS ANY KEY TO TRY AGAIN');
        else if (state === 'won') screen('BACKLOG CLEARED', ['Every room is quiet.', 'Side quests cleared: ' + stats.kills, '', 'All side quests. No main story.'], touch ? 'TAP TO RETURN TO S79-DOS' : 'PRESS ANY KEY TO RETURN TO S79-DOS');
      }

      // ---------- flow ----------
      function advance() {
        if (state === 'title') { hp = 100; darts = 30; stats.kills = 0; load(0); state = 'play'; }
        else if (state === 'cleared') { load(level + 1); state = 'play'; }
        else if (state === 'dead') { hp = 100; darts = Math.max(darts, 20); load(level); state = 'play'; }
        else if (state === 'won') quit();
      }
      function setPaused(p) { paused = p; menu.classList.toggle('hidden', !p); keys.clear(); if (!p) root.focus({ preventScroll: true }); }
      let done = false;
      function quit() {
        if (done) return; done = true;
        cancelAnimationFrame(raf);
        removeEventListener('blur', onBlur);
        root.remove();
        resolve(stats);
      }
      function frame(t) {
        if (!root.isConnected) { quit(); return; } // the window was closed
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        update(dt); draw();
        raf = requestAnimationFrame(frame);
      }

      // ---------- input ----------
      const KEYMAP = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', q: 'sleft', e: 'sright', ' ': 'fire', control: 'fire', f: 'fire' };
      root.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'escape' || (k === 'p' && state === 'play')) { e.preventDefault(); if (state === 'title') quit(); else if (state === 'play') setPaused(!paused); return; }
        if (paused) { if (k === 'enter') setPaused(false); return; }
        if (state !== 'play') { if (!['shift', 'alt', 'meta', 'tab'].includes(k)) { e.preventDefault(); advance(); } return; }
        if (KEYMAP[k]) { e.preventDefault(); keys.add(KEYMAP[k]); if (KEYMAP[k] === 'fire') fire(); }
      });
      root.addEventListener('keyup', (e) => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keys.delete(k); });
      const onBlur = () => keys.clear();
      addEventListener('blur', onBlur);
      cv.addEventListener('pointerdown', (e) => {
        root.focus({ preventScroll: true });
        if (paused) return;
        if (state !== 'play') { advance(); return; }
        if (e.pointerType === 'mouse') fire();
      });
      root.querySelectorAll('.bl-pad [data-k]').forEach((b) => {
        const k = b.dataset.k;
        const on = (e) => { e.preventDefault(); if (state !== 'play') { advance(); return; } keys.add(k); if (k === 'fire') fire(); };
        const off = (e) => { e.preventDefault(); keys.delete(k); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
      });
      root.querySelector('.bl-pausebtn').addEventListener('click', () => { if (state === 'play') setPaused(!paused); else if (state === 'title') quit(); else setPaused(true); });
      menu.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'resume') setPaused(false); else quit();
      });

      // Read-only snapshot of the running game, for testing and curiosity: S79Backlog.status()
      current = () => ({
        state, paused, level: level + 1, hp, darts, kills, total,
        x: +(px || 0).toFixed(2), y: +(py || 0).toFixed(2), facing: Math.round((Math.atan2(dirY || 0, dirX || 1) * 180) / Math.PI),
        enemies: (ents || []).filter((e) => e.enemy).map((e) => ({ kind: e.kind, x: +e.x.toFixed(2), y: +e.y.toFixed(2), hp: e.hp, dead: e.dead, awake: e.awake })),
      });
      root.focus({ preventScroll: true });
      raf = requestAnimationFrame(frame);
    });
  }
  let current = null;

  window.S79Backlog = { play, LEVELS, WALLS, status: () => (current ? current() : null) };
})();
