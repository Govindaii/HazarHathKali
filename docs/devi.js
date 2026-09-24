/*
 * HazarHathKali: the Devi and her 1000 hands, drawn on a canvas.
 * Inspired by the Hazar Hath Kali murti: a turquoise Devi with a third eye,
 * gold crown, red sari and marigold garlands, holding a trishul and a sword,
 * with a great fan of a thousand arms spreading out behind her.
 *
 * All shapes are drawn in "figure units": (0, 0) is the base of her neck, y points down.
 */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const FAN = { r0: 64, R: 215, start: (137 / 180) * Math.PI, end: (403 / 180) * Math.PI };
  const BOX = { left: -224, right: 224, top: -224, bottom: 258 };
  const DISCS = [50, 108, 166];
  const ROSETTES = [[-96, -60, 9], [-96, -37, 8]];

  function inEllipse(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  function segDist(x, y, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(x - (ax + vx * t), y - (ay + vy * t));
  }

  // True where the Devi's body, weapons or garlands cover the fan.
  function covered(x, y, pad) {
    if (inEllipse(x, y, 0, -95, 44 + pad, 88 + pad)) return true; // crown, face and hair
    if (inEllipse(x, y, 0, -40, 60 + pad, 70 + pad)) return true; // hair and shoulders
    if (y > -18 && Math.abs(x) < 72 + pad) return true; // body
    if (Math.abs(x + 86) < 5 + pad && y > -196 && y < 250) return true; // trishul staff
    if (x > -108 - pad && x < -64 + pad && y > -200 - pad && y < -144 + pad) return true; // trishul prongs
    for (const cy of DISCS) if (Math.hypot(x + 98, y - cy) < 26 + pad) return true;
    for (const [rx, ry, rr] of ROSETTES) if (Math.hypot(x - rx, y - ry) < rr + 1 + pad) return true;
    if (segDist(x, y, 75, 12, 97, -112) < 12 + pad) return true; // sword
    if (segDist(x, y, -48, 0, -64, 44) < 10 + pad || segDist(x, y, -64, 44, -86, 20) < 10 + pad) return true;
    if (segDist(x, y, 48, 0, 64, 44) < 10 + pad || segDist(x, y, 64, 44, 76, 18) < 10 + pad) return true;
    return false;
  }

  // Rows of arms on arcs, staggered like scales, skipping anything hidden behind the Devi.
  function buildRows(sp) {
    const out = [];
    const span = FAN.end - FAN.start;
    let k = 0;
    for (let r = FAN.R - sp * 0.5; r >= FAN.r0; r -= sp * 0.88, k++) {
      const n = Math.max(1, Math.floor((span * r) / sp));
      const step = span / n;
      for (let j = 0; j < n; j++) {
        const a = FAN.start + (j + (k % 2 ? 0.75 : 0.25)) * step;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (!covered(x, y, sp * 0.4)) out.push({ x, y, a, r });
      }
    }
    return out;
  }

  // Finds the largest hand spacing that still fits every hand, then spreads the hands into realm sectors.
  function layoutHands(count, sectors) {
    let lo = 2, hi = 40;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (buildRows(mid).length >= count) lo = mid;
      else hi = mid;
    }
    let pts = buildRows(lo);
    const extra = pts.length - count;
    if (extra > 0) {
      // Drop the few spare spots evenly so no gap shows.
      const drop = new Set();
      for (let k = 0; k < extra; k++) drop.add(Math.floor(((k + 0.5) * pts.length) / extra));
      pts = pts.filter((_, i) => !drop.has(i));
    }
    pts.sort((p, q) => p.a - q.a);
    const per = count / sectors;
    const hands = [];
    for (let s = 0; s < sectors; s++) {
      pts.slice(s * per, (s + 1) * per).sort((p, q) => p.r - q.r).forEach((p) => hands.push(p));
    }
    return { hands, spacing: lo };
  }

  // ---------- Drawing helpers (figure units) ----------
  function path(c, fn) {
    c.beginPath();
    fn();
  }
  function beadChain(c, p0, cp, p1, n, colors, r) {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * cp[0] + t * t * p1[0];
      const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * cp[1] + t * t * p1[1];
      c.fillStyle = colors[i % colors.length];
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(90,40,0,0.35)';
      c.lineWidth = 0.5;
      c.stroke();
    }
  }
  function disc(c, x, y, r) {
    const rings = [[1, '#f7c7d9'], [0.84, '#e0457b'], [0.66, '#f6e27a'], [0.5, '#2fa7c9'], [0.3, '#3fae5a'], [0.12, '#f7f1e3']];
    rings.forEach(([k, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, y, r * k, 0, TAU);
      c.fill();
    });
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      c.beginPath();
      c.arc(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92, r * 0.045, 0, TAU);
      c.fill();
    }
    c.strokeStyle = '#b3122d';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.stroke();
  }
  function rosette(c, x, y, r) {
    c.fillStyle = '#c8102e';
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    c.fillStyle = '#f05a7e';
    c.beginPath();
    c.arc(x, y, r * 0.6, 0, TAU);
    c.fill();
    c.fillStyle = '#f4b63f';
    c.beginPath();
    c.arc(x, y, r * 0.25, 0, TAU);
    c.fill();
  }
  function limb(c, pts, width) {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#0b4f4b';
    c.lineWidth = width + 2.4;
    path(c, () => { c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => c.lineTo(p[0], p[1])); });
    c.stroke();
    c.strokeStyle = '#27a99f';
    c.lineWidth = width;
    c.stroke();
  }
  function bangles(c, x, y, angle, w) {
    c.strokeStyle = '#e8b54a';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    for (const off of [-2.6, 0, 2.6]) {
      const bx = x + Math.cos(angle) * off;
      const by = y + Math.sin(angle) * off;
      c.beginPath();
      c.moveTo(bx - Math.sin(angle) * w, by + Math.cos(angle) * w);
      c.lineTo(bx + Math.sin(angle) * w, by - Math.cos(angle) * w);
      c.stroke();
    }
  }

  function drawFigure(c) {
    // Warm glow behind the head
    const glow = c.createRadialGradient(0, -100, 8, 0, -100, 130);
    glow.addColorStop(0, 'rgba(255,196,90,0.38)');
    glow.addColorStop(1, 'rgba(255,196,90,0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, -100, 130, 0, TAU);
    c.fill();

    // Pedestal
    c.fillStyle = '#241a3d';
    c.fillRect(-122, 236, 244, 20);
    c.strokeStyle = '#e0ae45';
    c.lineWidth = 2;
    path(c, () => { c.moveTo(-122, 236); c.lineTo(122, 236); });
    c.stroke();

    // Trishul: staff, prongs, rosettes and painted discs
    c.lineCap = 'round';
    c.strokeStyle = '#5c5a55';
    c.lineWidth = 5.5;
    path(c, () => { c.moveTo(-86, -150); c.lineTo(-86, 236); });
    c.stroke();
    c.strokeStyle = '#ebe5d6';
    c.lineWidth = 3.2;
    c.stroke();
    const prongs = [
      () => { c.moveTo(-86, -150); c.lineTo(-86, -186); },
      () => { c.moveTo(-86, -150); c.bezierCurveTo(-100, -152, -105, -164, -102, -181); },
      () => { c.moveTo(-86, -150); c.bezierCurveTo(-72, -152, -67, -164, -70, -181); },
    ];
    for (const [w, col] of [[5.5, '#5c5a55'], [3.2, '#ebe5d6']]) {
      c.strokeStyle = col;
      c.lineWidth = w;
      prongs.forEach((p) => { path(c, p); c.stroke(); });
    }
    c.fillStyle = '#ebe5d6';
    c.strokeStyle = '#5c5a55';
    c.lineWidth = 1;
    [[-86, -198, -86, -182], [-102.5, -192, -102, -178], [-69.5, -192, -70, -178]].forEach(([tx, ty, bx, by]) => {
      path(c, () => { c.moveTo(tx, ty); c.lineTo(bx - 4, by); c.lineTo(bx + 4, by); c.closePath(); });
      c.fill();
      c.stroke();
    });
    c.fillStyle = '#e0ae45';
    c.beginPath();
    c.arc(-86, -150, 4.5, 0, TAU);
    c.fill();
    ROSETTES.forEach(([x, y, r]) => rosette(c, x, y, r));
    DISCS.forEach((y) => disc(c, -98, y, 25));

    // Hair
    c.fillStyle = '#15101c';
    path(c, () => {
      c.moveTo(-24, -118);
      c.bezierCurveTo(-46, -112, -54, -84, -54, -56);
      c.bezierCurveTo(-56, -20, -64, 20, -58, 48);
      c.lineTo(58, 48);
      c.bezierCurveTo(64, 20, 56, -20, 54, -56);
      c.bezierCurveTo(54, -84, 46, -112, 24, -118);
      c.closePath();
    });
    c.fill();

    // Sari skirt with gold dots, pleats and border
    const skirt = () => {
      c.moveTo(-55, 66);
      c.bezierCurveTo(-63, 120, -80, 190, -90, 236);
      c.lineTo(90, 236);
      c.bezierCurveTo(80, 190, 63, 120, 55, 66);
      c.closePath();
    };
    c.fillStyle = '#b5122d';
    path(c, skirt);
    c.fill();
    c.save();
    path(c, skirt);
    c.clip();
    c.fillStyle = 'rgba(240,190,80,0.55)';
    for (let y = 72; y < 236; y += 9) {
      for (let x = -90 + ((y / 9) % 2) * 4.5; x < 90; x += 9) {
        c.beginPath();
        c.arc(x, y, 0.9, 0, TAU);
        c.fill();
      }
    }
    c.strokeStyle = 'rgba(70,0,15,0.35)';
    c.lineWidth = 1.2;
    [-32, -16, 0, 16, 32].forEach((x) => {
      path(c, () => { c.moveTo(x * 0.9, 76); c.lineTo(x * 1.5, 236); });
      c.stroke();
    });
    c.fillStyle = '#e0a43a';
    c.fillRect(-100, 222, 200, 14);
    c.fillStyle = '#b5122d';
    for (let x = -96; x < 96; x += 8) {
      path(c, () => { c.moveTo(x, 236); c.lineTo(x + 4, 227); c.lineTo(x + 8, 236); c.closePath(); });
      c.fill();
    }
    c.restore();

    // Upper body
    c.fillStyle = '#cf4a1c';
    path(c, () => {
      c.moveTo(-52, -8);
      c.bezierCurveTo(-58, 10, -58, 40, -55, 70);
      c.lineTo(55, 70);
      c.bezierCurveTo(58, 40, 58, 10, 52, -8);
      c.bezierCurveTo(30, -18, -30, -18, -52, -8);
      c.closePath();
    });
    c.fill();
    // Pallu draped across the body
    c.fillStyle = '#9a0f27';
    path(c, () => { c.moveTo(-52, -6); c.lineTo(-30, -15); c.lineTo(58, 92); c.lineTo(50, 118); c.closePath(); });
    c.fill();
    c.strokeStyle = '#e8b54a';
    c.lineWidth = 2.2;
    path(c, () => { c.moveTo(-30, -15); c.lineTo(58, 92); });
    c.stroke();
    path(c, () => { c.moveTo(-52, -6); c.lineTo(50, 118); });
    c.stroke();
    // Waist belt
    c.fillStyle = '#e0ae45';
    c.fillRect(-56, 64, 112, 7);

    // Garlands: white-green flowers, then marigold
    beadChain(c, [-24, -14], [-14, 330], [30, -10], 60, ['#f4f1e8', '#b9d98a'], 2.8);
    beadChain(c, [-17, -18], [0, 190], [17, -18], 46, ['#f7c520', '#f28c1b'], 3.2);
    beadChain(c, [-13, -20], [0, 110], [13, -20], 30, ['#f28c1b', '#f7c520'], 3.2);

    // Neck and necklace
    c.fillStyle = '#27a99f';
    path(c, () => { c.moveTo(-12, -62); c.lineTo(12, -62); c.lineTo(16, -14); c.lineTo(-16, -14); c.closePath(); });
    c.fill();
    c.strokeStyle = '#e8b54a';
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(0, -30, 17, 9, 0, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();

    // Face
    const skin = c.createRadialGradient(-6, -92, 4, 0, -84, 34);
    skin.addColorStop(0, '#46d1c3');
    skin.addColorStop(1, '#23a296');
    c.fillStyle = skin;
    c.beginPath();
    c.ellipse(0, -84, 25, 32, 0, 0, TAU);
    c.fill();
    c.strokeStyle = '#0e5550';
    c.lineWidth = 1.4;
    c.stroke();
    // Earrings
    c.fillStyle = '#e8b54a';
    [-26, 26].forEach((x) => {
      c.beginPath();
      c.arc(x, -76, 3.6, 0, TAU);
      c.fill();
      c.beginPath();
      c.arc(x, -68, 2.4, 0, TAU);
      c.fill();
    });
    // Eyebrows
    c.strokeStyle = '#111';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    [-1, 1].forEach((s) => {
      path(c, () => { c.moveTo(s * 3, -96); c.quadraticCurveTo(s * 12, -101, s * 21, -95); });
      c.stroke();
    });
    // Eyes: large, Bengali style, with long liner
    [-1, 1].forEach((s) => {
      const ex = s * 10.5, ey = -87;
      c.fillStyle = '#fbfaf5';
      path(c, () => {
        c.moveTo(ex - 8, ey);
        c.bezierCurveTo(ex - 4, ey - 6.5, ex + 4, ey - 6.5, ex + 8, ey);
        c.bezierCurveTo(ex + 4, ey + 5, ex - 4, ey + 5, ex - 8, ey);
        c.closePath();
      });
      c.fill();
      c.strokeStyle = '#0c0c0c';
      c.lineWidth = 1.6;
      c.stroke();
      path(c, () => { c.moveTo(ex + s * 8, ey); c.lineTo(ex + s * 12, ey - 3); });
      c.stroke();
      c.fillStyle = '#0c0c0c';
      c.beginPath();
      c.arc(ex, ey - 0.5, 3.3, 0, TAU);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(ex + 1, ey - 1.6, 0.9, 0, TAU);
      c.fill();
    });
    // Third eye
    c.fillStyle = '#fbfaf5';
    path(c, () => {
      c.moveTo(0, -109);
      c.bezierCurveTo(4, -106, 4, -100, 0, -97);
      c.bezierCurveTo(-4, -100, -4, -106, 0, -109);
      c.closePath();
    });
    c.fill();
    c.strokeStyle = '#c8102e';
    c.lineWidth = 1.3;
    c.stroke();
    c.fillStyle = '#0c0c0c';
    c.beginPath();
    c.ellipse(0, -103, 1.3, 2.8, 0, 0, TAU);
    c.fill();
    // Nose, nose ring and lips
    c.strokeStyle = '#0e5550';
    c.lineWidth = 1.2;
    path(c, () => { c.moveTo(0.5, -90); c.quadraticCurveTo(-2.5, -80, 0.5, -77); c.quadraticCurveTo(3, -76.5, 4, -78); });
    c.stroke();
    c.strokeStyle = '#e8b54a';
    c.lineWidth = 1.1;
    c.beginPath();
    c.arc(-4.5, -74.5, 3.4, 0, TAU);
    c.stroke();
    c.fillStyle = '#c8102e';
    c.beginPath();
    c.ellipse(0, -66, 6, 2.6, 0, 0, TAU);
    c.fill();
    c.strokeStyle = '#7a0716';
    c.lineWidth = 0.8;
    path(c, () => { c.moveTo(-6, -66); c.quadraticCurveTo(0, -64.5, 6, -66); });
    c.stroke();

    // Crown
    const gold = c.createLinearGradient(0, -184, 0, -110);
    gold.addColorStop(0, '#fbe3a0');
    gold.addColorStop(0.5, '#e2b453');
    gold.addColorStop(1, '#b8862b');
    c.fillStyle = gold;
    c.strokeStyle = '#7a5510';
    c.lineWidth = 1;
    path(c, () => {
      c.moveTo(-28, -113);
      c.quadraticCurveTo(0, -119, 28, -113);
      c.lineTo(29, -122);
      c.bezierCurveTo(33, -141, 23, -157, 11, -165);
      c.lineTo(0, -184);
      c.lineTo(-11, -165);
      c.bezierCurveTo(-23, -157, -33, -141, -29, -122);
      c.closePath();
    });
    c.fill();
    c.stroke();
    c.strokeStyle = 'rgba(122,85,16,0.7)';
    [-122, -134, -150].forEach((y) => {
      path(c, () => { c.moveTo(-26, y); c.quadraticCurveTo(0, y - 6, 26, y); });
      c.stroke();
    });
    c.fillStyle = '#fbe3a0';
    c.beginPath();
    c.arc(0, -142, 7, 0, TAU);
    c.fill();
    c.stroke();
    c.fillStyle = '#c8102e';
    c.beginPath();
    c.arc(0, -142, 3.2, 0, TAU);
    c.fill();
    c.fillStyle = '#7a5510';
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.arc(i * 7, -127, 1.1, 0, TAU);
      c.fill();
    }

    // Sword (khadga) held up on the right
    c.fillStyle = '#d9d4cf';
    c.strokeStyle = '#6f6a64';
    c.lineWidth = 1.2;
    path(c, () => {
      c.moveTo(72, 8);
      c.lineTo(80, 8);
      c.lineTo(96, -68);
      c.bezierCurveTo(105, -86, 104, -104, 95, -114);
      c.bezierCurveTo(86, -106, 83, -94, 86, -80);
      c.closePath();
    });
    c.fill();
    c.stroke();
    c.strokeStyle = '#6f6a64';
    c.beginPath();
    c.arc(95, -96, 2.6, 0, TAU);
    c.stroke();
    c.fillStyle = '#e0ae45';
    c.fillRect(68, 6, 16, 4);

    // Her two main arms with bangles
    limb(c, [[-47, 0], [-63, 44], [-84, 21]], 12);
    limb(c, [[47, 0], [63, 44], [76, 17]], 12);
    bangles(c, -76, 30, Math.atan2(21 - 44, -84 + 63), 6.5);
    bangles(c, 71, 29, Math.atan2(17 - 44, 76 - 63), 6.5);
    c.fillStyle = '#27a99f';
    c.strokeStyle = '#0b4f4b';
    c.lineWidth = 1.2;
    [[-86, 19], [77, 15]].forEach(([x, y]) => {
      c.beginPath();
      c.arc(x, y, 7.5, 0, TAU);
      c.fill();
      c.stroke();
    });
  }

  // One of the thousand arms: a teal forearm, gold bangle and pink palm, reaching outwards.
  function drawArm(c, X, Y, a, sp, dot, glow) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const bx = X - ca * sp * 1.35, by = Y - sa * sp * 1.35;
    const wx = X - ca * sp * 0.46, wy = Y - sa * sp * 0.46;
    c.lineCap = 'round';
    c.strokeStyle = '#0b4f4b';
    c.lineWidth = sp * 0.5;
    c.beginPath();
    c.moveTo(bx, by);
    c.lineTo(wx, wy);
    c.stroke();
    c.strokeStyle = '#26a79d';
    c.lineWidth = sp * 0.34;
    c.stroke();
    c.strokeStyle = '#e8b54a';
    c.lineWidth = sp * 0.14;
    const w = sp * 0.26;
    c.beginPath();
    c.moveTo(wx - sa * w, wy + ca * w);
    c.lineTo(wx + sa * w, wy - ca * w);
    c.stroke();
    if (glow) {
      c.save();
      c.shadowColor = glow;
      c.shadowBlur = sp * 1.4;
    }
    c.fillStyle = '#d65b9c';
    c.strokeStyle = '#8e2a62';
    c.lineWidth = Math.max(0.6, sp * 0.05);
    c.beginPath();
    c.ellipse(X + ca * sp * 0.3, Y + sa * sp * 0.3, sp * 0.24, sp * 0.3, a, 0, TAU);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(X, Y, sp * 0.4, sp * 0.36, a, 0, TAU);
    c.fill();
    c.stroke();
    if (glow) c.restore();
    c.fillStyle = '#f6d6e6';
    c.beginPath();
    c.arc(X, Y, sp * 0.18, 0, TAU);
    c.fill();
    c.strokeStyle = dot;
    c.lineWidth = Math.max(0.8, sp * 0.08);
    c.stroke();
  }

  /*
   * createDevi(canvas, hooks)
   * hooks: count, sectors, colorOf(i), isOn(i), isMet(i), activeIndex(), reduceMotion
   */
  function createDevi(canvas, hooks) {
    const ctx = canvas.getContext('2d');
    const base = document.createElement('canvas');
    const bctx = base.getContext('2d');
    const { hands, spacing } = layoutHands(hooks.count, hooks.sectors);
    const byRadius = hands.map((_, i) => i).sort((p, q) => hands[q].r - hands[p].r);
    const INTRO_MS = hooks.reduceMotion ? 0 : 1600;
    let w = 0, h = 0, dpr = 1, s = 1, ox = 0, oy = 0;
    let hover = -1, hoverDevi = false, raf = 0;
    const t0 = performance.now();

    function screen(i) {
      const p = hands[i];
      return { X: ox + p.x * s, Y: oy + p.y * s, a: p.a };
    }

    function drawWall(c) {
      const g = c.createRadialGradient(0, -30, 30, 0, -30, FAN.R + 20);
      g.addColorStop(0, 'rgba(26,120,112,0.6)');
      g.addColorStop(1, 'rgba(26,120,112,0.2)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, FAN.R + spacing * 0.9, FAN.start - 0.03, FAN.end + 0.03);
      c.closePath();
      c.fill();
    }

    function drawScene(c, progress) {
      c.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      drawWall(c);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sp = spacing * s;
      for (const i of byRadius) {
        const k = progress == null ? 1 : Math.min(1, Math.max(0, (progress - (hands[i].r - FAN.r0) / (FAN.R - FAN.r0) * 0.75) / 0.25));
        if (k <= 0) continue;
        const on = hooks.isOn(i);
        c.globalAlpha = (on ? 1 : 0.16) * k;
        const { X, Y, a } = screen(i);
        const reach = 1 - (1 - k) * 0.6;
        drawArm(c, ox + (X - ox) * reach, oy + (Y - oy) * reach, a, sp, hooks.colorOf(i), null);
        if (on && hooks.isMet(i) && k === 1) {
          c.strokeStyle = '#fff4dc';
          c.lineWidth = Math.max(1, sp * 0.09);
          c.beginPath();
          c.ellipse(X, Y, sp * 0.52, sp * 0.48, a, 0, TAU);
          c.stroke();
        }
      }
      c.globalAlpha = 1;
      c.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      drawFigure(c);
      c.setTransform(1, 0, 0, 1, 0, 0);
    }

    function renderBase() {
      base.width = canvas.width;
      base.height = canvas.height;
      bctx.clearRect(0, 0, base.width, base.height);
      drawScene(bctx, null);
    }

    function highlight(i, strong) {
      const { X, Y, a } = screen(i);
      const sp = spacing * s * 1.9;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawArm(ctx, X, Y, a, sp, hooks.colorOf(i), strong ? '#f4b63f' : '#ffffff');
      ctx.strokeStyle = strong ? '#f4b63f' : '#fff4dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(X, Y, sp * 0.56, sp * 0.52, a, 0, TAU);
      ctx.stroke();
    }

    function frame(now) {
      raf = 0;
      const t = now - t0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t < INTRO_MS) {
        drawScene(ctx, t / INTRO_MS);
      } else {
        ctx.drawImage(base, 0, 0);
      }
      // Third eye glow
      const pulse = hooks.reduceMotion ? 0.6 : 0.5 + 0.5 * Math.sin(now / 900);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      const g = ctx.createRadialGradient(0, -103, 0, 0, -103, 12);
      g.addColorStop(0, `rgba(255,90,110,${0.25 + 0.35 * pulse})`);
      g.addColorStop(1, 'rgba(255,90,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -103, 12, 0, TAU);
      ctx.fill();
      if (hoverDevi) {
        ctx.strokeStyle = 'rgba(244,182,63,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -84, 31, 38, 0, 0, TAU);
        ctx.stroke();
      }
      const active = hooks.activeIndex();
      if (active >= 0) highlight(active, true);
      if (hover >= 0 && hover !== active) highlight(hover, false);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!hooks.reduceMotion || t < INTRO_MS) schedule();
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const narrow = w < 560;
      const padTop = narrow ? 30 : 44;
      const padBottom = narrow ? 30 : 40;
      const bw = BOX.right - BOX.left;
      const bh = BOX.bottom - BOX.top;
      s = Math.min((w - 12) / bw, (h - padTop - padBottom) / bh);
      ox = w / 2;
      oy = padTop + (h - padTop - padBottom - bh * s) / 2 - BOX.top * s;
      renderBase();
      schedule();
    }

    function pick(x, y, coarse) {
      let best = -1, bd = Infinity;
      for (let i = 0; i < hands.length; i++) {
        if (!hooks.isOn(i)) continue;
        const p = screen(i);
        const d = (p.X - x) * (p.X - x) + (p.Y - y) * (p.Y - y);
        if (d < bd) { bd = d; best = i; }
      }
      const sp = spacing * s;
      if (best >= 0 && bd <= (sp * 0.6) * (sp * 0.6)) return best;
      if (covered((x - ox) / s, (y - oy) / s, 0)) return 'devi';
      const tol = Math.max(sp * 0.9, coarse ? 18 : 10);
      return best >= 0 && bd <= tol * tol ? best : -1;
    }

    return {
      resize,
      pick,
      refresh() { if (w) { renderBase(); schedule(); } },
      setHover(i, devi) {
        if (i === hover && devi === hoverDevi) return;
        hover = i;
        hoverDevi = devi;
        schedule();
      },
      redraw: schedule,
    };
  }

  window.HHK = Object.assign(window.HHK || {}, { createDevi });
})();
