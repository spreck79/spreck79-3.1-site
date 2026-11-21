// Flat, square, Prairie-style icons (40x40). Brick, ochre, sage, slate on walnut outlines.
(function () {
  const R = '#9E3324', O = '#C08A2E', G = '#5F6E41', S = '#3E5C6B', C = '#F2EBDD', C2 = '#E4D8C1', W = '#2E2620';
  const wrap = (body) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${body}</svg>`;
  const stripes = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="3" fill="${R}"/><rect x="${x}" y="${y + 4}" width="${w}" height="2" fill="${O}"/><rect x="${x}" y="${y + 7}" width="${w}" height="4" fill="${S}"/>`;

  const I = {
    questmgr: wrap(`<rect x="3" y="5" width="34" height="30" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="4" y="6" width="32" height="6" fill="${S}"/>
      <rect x="8" y="16" width="8" height="8" fill="${R}"/><rect x="20" y="16" width="8" height="8" fill="${O}"/><rect x="8" y="26" width="8" height="5" fill="${G}"/><rect x="20" y="26" width="8" height="5" fill="${S}"/><rect x="30" y="16" width="3" height="15" fill="${W}"/>`),
    group: wrap(`<rect x="4" y="8" width="32" height="26" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="5" y="9" width="30" height="5" fill="${S}"/>
      <rect x="9" y="18" width="6" height="6" fill="${R}"/><rect x="17" y="18" width="6" height="6" fill="${O}"/><rect x="25" y="18" width="6" height="6" fill="${G}"/><rect x="9" y="26" width="22" height="2" fill="${W}"/>`),
    jotter: wrap(`<rect x="8" y="4" width="24" height="32" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="9" y="5" width="22" height="5" fill="${R}"/>
      <rect x="12" y="14" width="16" height="2" fill="${W}"/><rect x="12" y="19" width="16" height="2" fill="${W}"/><rect x="12" y="24" width="12" height="2" fill="${W}"/><rect x="12" y="29" width="14" height="2" fill="${S}"/>`),
    cabinet: wrap(`<rect x="7" y="3" width="26" height="34" fill="${O}" stroke="${W}" stroke-width="2"/>
      <rect x="10" y="7" width="20" height="12" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="10" y="22" width="20" height="12" fill="${C}" stroke="${W}" stroke-width="2"/>
      <rect x="16" y="11" width="8" height="3" fill="${W}"/><rect x="16" y="26" width="8" height="3" fill="${W}"/>`),
    tally: wrap(`<rect x="8" y="3" width="24" height="34" fill="${S}" stroke="${W}" stroke-width="2"/><rect x="11" y="7" width="18" height="7" fill="#171310"/><rect x="21" y="9" width="6" height="3" fill="${O}"/>
      <rect x="11" y="17" width="5" height="4" fill="${C}"/><rect x="18" y="17" width="5" height="4" fill="${C}"/><rect x="25" y="17" width="4" height="4" fill="${R}"/>
      <rect x="11" y="23" width="5" height="4" fill="${C}"/><rect x="18" y="23" width="5" height="4" fill="${C}"/><rect x="25" y="23" width="4" height="4" fill="${R}"/>
      <rect x="11" y="29" width="5" height="4" fill="${C}"/><rect x="18" y="29" width="5" height="4" fill="${C}"/><rect x="25" y="29" width="4" height="4" fill="${O}"/>`),
    clock: wrap(`<rect x="5" y="5" width="30" height="30" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="5" y="5" width="30" height="4" fill="${S}"/>
      <rect x="19" y="12" width="2" height="10" fill="${W}"/><rect x="19" y="20" width="9" height="2" fill="${R}"/>
      <rect x="19" y="11" width="2" height="1" fill="${W}"/><rect x="9" y="20" width="2" height="2" fill="${W}"/><rect x="29" y="20" width="2" height="2" fill="${W}"/><rect x="19" y="30" width="2" height="2" fill="${W}"/>`),
    sketch: wrap(`<rect x="3" y="8" width="34" height="26" fill="#FFFFFF" stroke="${W}" stroke-width="2"/>
      <rect x="7" y="22" width="9" height="8" fill="${R}"/><rect x="14" y="16" width="9" height="8" fill="${O}" opacity=".9"/><rect x="21" y="20" width="10" height="9" fill="${S}"/>
      <path d="M26 4 L34 12 L22 24 L18 26 L20 22 Z" fill="${G}" stroke="${W}" stroke-width="1.5" shape-rendering="geometricPrecision"/>`),
    gopher: wrap(`<rect x="3" y="22" width="34" height="14" fill="${G}" stroke="${W}" stroke-width="2"/>
      <rect x="12" y="10" width="16" height="16" fill="${O}" stroke="${W}" stroke-width="2"/><rect x="15" y="14" width="3" height="3" fill="${W}"/><rect x="22" y="14" width="3" height="3" fill="${W}"/>
      <rect x="18" y="19" width="4" height="2" fill="${W}"/><rect x="18" y="21" width="2" height="3" fill="${C}"/><rect x="20" y="21" width="2" height="3" fill="${C}"/>
      <rect x="11" y="26" width="18" height="3" fill="#2E2620"/>`),
    control: wrap(`<rect x="4" y="4" width="32" height="32" fill="${C2}" stroke="${W}" stroke-width="2"/>
      <rect x="9" y="9" width="2" height="22" fill="${W}"/><rect x="19" y="9" width="2" height="22" fill="${W}"/><rect x="29" y="9" width="2" height="22" fill="${W}"/>
      <rect x="6" y="12" width="8" height="5" fill="${R}" stroke="${W}"/><rect x="16" y="22" width="8" height="5" fill="${O}" stroke="${W}"/><rect x="26" y="15" width="8" height="5" fill="${S}" stroke="${W}"/>`),
    prompt: wrap(`<rect x="3" y="6" width="34" height="28" fill="#171310" stroke="${W}" stroke-width="2"/>
      <text x="7" y="21" font-family="Consolas, monospace" font-size="10" font-weight="700" fill="${O}">C:\\&gt;</text><rect x="7" y="25" width="8" height="2" fill="${C}"/>
      <text x="22" y="31" font-family="Georgia, serif" font-size="8" font-weight="700" fill="${R}">79</text>`),
    about: wrap(`<rect x="4" y="4" width="32" height="32" fill="${C}" stroke="${W}" stroke-width="2"/>${stripes(5, 22, 30)}
      <text x="10" y="18" font-family="Georgia, serif" font-size="13" font-weight="700" fill="${R}">79</text>`),
    folder: wrap(`<path d="M3 10 H15 L18 13 H37 V34 H3 Z" fill="${O}" stroke="${W}" stroke-width="2"/><rect x="4" y="16" width="32" height="2" fill="${W}" opacity=".35"/>`),
    file: wrap(`<path d="M9 4 H25 L32 11 V36 H9 Z" fill="${C}" stroke="${W}" stroke-width="2"/><path d="M25 4 V11 H32" fill="none" stroke="${W}" stroke-width="2"/>
      <rect x="13" y="16" width="14" height="2" fill="${W}"/><rect x="13" y="21" width="14" height="2" fill="${W}"/><rect x="13" y="26" width="10" height="2" fill="${W}"/>`),
    bat: wrap(`<path d="M9 4 H25 L32 11 V36 H9 Z" fill="${C2}" stroke="${W}" stroke-width="2"/><rect x="12" y="16" width="16" height="12" fill="#171310"/><rect x="14" y="19" width="4" height="2" fill="${O}"/><rect x="14" y="23" width="8" height="2" fill="${C}"/>`),
    exe: wrap(`<rect x="4" y="7" width="32" height="26" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="5" y="8" width="30" height="5" fill="${S}"/><rect x="9" y="17" width="22" height="2" fill="${R}"/><rect x="9" y="21" width="22" height="1" fill="${O}"/><rect x="9" y="23" width="22" height="3" fill="${S}"/>`),
    pic: wrap(`<rect x="4" y="6" width="32" height="28" fill="#FFFFFF" stroke="${W}" stroke-width="2"/><rect x="8" y="10" width="6" height="6" fill="${O}"/><path d="M6 32 L16 20 L22 27 L27 22 L35 32 Z" fill="${G}"/>`),
    sys: wrap(`<path d="M9 4 H25 L32 11 V36 H9 Z" fill="${C2}" stroke="${W}" stroke-width="2"/><rect x="14" y="17" width="12" height="12" fill="${S}"/><rect x="18" y="21" width="4" height="4" fill="${C}"/>`),
    info: wrap(`<rect x="3" y="3" width="34" height="34" fill="${S}" stroke="${W}" stroke-width="2"/><rect x="18" y="9" width="4" height="4" fill="${C}"/><rect x="18" y="16" width="4" height="15" fill="${C}"/>`),
    warn: wrap(`<path d="M20 3 L38 36 H2 Z" fill="${O}" stroke="${W}" stroke-width="2" stroke-linejoin="miter"/><rect x="18" y="14" width="4" height="11" fill="${W}"/><rect x="18" y="28" width="4" height="4" fill="${W}"/>`),
    stop: wrap(`<rect x="3" y="3" width="34" height="34" fill="${R}" stroke="${W}" stroke-width="2"/><rect x="10" y="18" width="20" height="4" fill="${C}"/>`),
    question: wrap(`<rect x="3" y="3" width="34" height="34" fill="${G}" stroke="${W}" stroke-width="2"/><path d="M14 14 Q14 9 20 9 Q26 9 26 14 Q26 18 21 20 L21 24" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="square" shape-rendering="geometricPrecision"/><rect x="19" y="28" width="4" height="4" fill="${C}"/>`),
    run: wrap(`<rect x="4" y="8" width="32" height="24" fill="${C}" stroke="${W}" stroke-width="2"/><path d="M14 13 L26 20 L14 27 Z" fill="${R}"/>`),
    // Lookout: a window onto a low prairie horizon, with a red sun.
    lookout: wrap(`<rect x="3" y="5" width="34" height="30" fill="${C}" stroke="${W}" stroke-width="2"/><rect x="4" y="6" width="32" height="5" fill="${S}"/>
      <rect x="5" y="13" width="30" height="12" fill="#8FB0BF"/><rect x="24" y="15" width="6" height="6" fill="${R}"/>
      <rect x="5" y="25" width="30" height="3" fill="${O}"/><rect x="5" y="28" width="30" height="6" fill="${G}"/><rect x="19" y="11" width="2" height="23" fill="${W}"/>`),
    // Harvest: a red tractor pulling a hay wagon across the field.
    harvest: wrap(`<rect x="2" y="26" width="36" height="10" fill="${G}" stroke="${W}" stroke-width="2"/>
      <rect x="3" y="15" width="11" height="9" fill="${O}" stroke="${W}" stroke-width="1.5"/><rect x="4" y="18" width="9" height="1.5" fill="#9E7020"/><rect x="4" y="21" width="9" height="1.5" fill="#9E7020"/>
      <rect x="14" y="21" width="4" height="2" fill="${W}"/>
      <rect x="18" y="14" width="17" height="10" fill="${R}" stroke="${W}" stroke-width="1.5"/><rect x="20" y="9" width="7" height="6" fill="${S}" stroke="${W}" stroke-width="1.5"/>
      <rect x="32" y="9" width="2" height="5" fill="${W}"/>
      <rect x="19" y="22" width="7" height="7" fill="#171310"/><rect x="21.5" y="24.5" width="2" height="2" fill="${C}"/><rect x="29" y="23" width="5" height="5" fill="#171310"/>`),
  };

  // small 16px versions just reuse the same svg
  I.forFile = function (name, node) {
    if (node && node.type === 'dir') return I.folder;
    const ext = (name.split('.')[1] || '').toUpperCase();
    if (ext === 'EXE' || ext === 'COM') return node && node.app && I[node.app === 'questmgr' ? 'questmgr' : node.app] || I.exe;
    if (ext === 'BAT') return I.bat;
    if (ext === 'PIC') return I.pic;
    if (ext === 'SYS' || ext === 'DRV' || ext === 'FON' || ext === 'INI') return I.sys;
    return I.file;
  };

  window.S79Icons = I;
})();
