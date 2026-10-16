// МикроТест Вижн – анализ изображения: поиск дисков, масштаб, края зон, колонии, пример чашки.
// Без интерфейса (не трогает страницу), поэтому его можно проверять отдельно. Главная функция – analyze(rgba, w, h).
// ===== Анализ изображения: без DOM, чтобы можно было проверить отдельно =====
// Признаки цвета для каждого пикселя:
// W – «белизна»: светлый и без оттенка (так выглядят бумажные диски);
// Z – самый тёмный из каналов R, G, B: у жёлтого газона мало синего, у прозрачной зоны больше
// B – «яркость без самого тёмного канала»: запасной признак для цветных (кремовых, жёлтых) дисков,
// у которых «белизна» W низкая
function features(d, w, h) {
  const n = w * h, W = new Float32Array(n), Z = new Float32Array(n), B = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const mn = Math.min(d[j], d[j + 1], d[j + 2]), mx = Math.max(d[j], d[j + 1], d[j + 2]);
    Z[i] = mn; W[i] = mn - (mx - mn); B[i] = (d[j] + d[j + 1] + d[j + 2] - mn) / 2;
  }
  return { W, Z, B };
}
function median(a) {
  if (!a.length) return NaN;
  const s = Float64Array.from(a).sort(), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function sample(g, w, h, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) return NaN;
  const fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return g[i] * (1 - fx) * (1 - fy) + g[i + 1] * fx * (1 - fy) + g[i + w] * (1 - fx) * fy + g[i + w + 1] * fx * fy;
}

// Расширение (grow) или сужение маски квадратом 2r+1: сначала по строкам, потом по столбцам.
// Расширить и сузить обратно = «закрытие»: чёрные буквы на диске закрашиваются белым
function morph(m, w, h, r, grow) {
  const a = new Uint8Array(m.length), b = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let s = 0;
    for (let x = 0; x < Math.min(r, w); x++) s += m[o + x];
    for (let x = 0; x < w; x++) {
      if (x + r < w) s += m[o + x + r];
      if (x - r - 1 >= 0) s -= m[o + x - r - 1];
      const cnt = Math.min(w - 1, x + r) - Math.max(0, x - r) + 1;
      a[o + x] = grow ? +(s > 0) : +(s === cnt);
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = 0; y < Math.min(r, h); y++) s += a[y * w + x];
    for (let y = 0; y < h; y++) {
      if (y + r < h) s += a[(y + r) * w + x];
      if (y - r - 1 >= 0) s -= a[(y - r - 1) * w + x];
      const cnt = Math.min(h - 1, y + r) - Math.max(0, y - r) + 1;
      b[y * w + x] = grow ? +(s > 0) : +(s === cnt);
    }
  }
  return b;
}

// Круглые пятна в маске: связные области нужного размера и формы
function blobs(mask, w, h, minD, maxD, seen, stack) {
  seen.fill(0);
  const out = [], n = w * h;
  for (let i = 0; i < n; i++) {
    if (seen[i] || !mask[i]) continue;
    let sp = 0, area = 0, sx = 0, sy = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
    stack[sp++] = i; seen[i] = 1;
    while (sp) {
      const p = stack[--sp], x = p % w, y = (p - x) / w;
      area++; sx += x; sy += y;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !seen[p - 1] && mask[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1; }
      if (x < w - 1 && !seen[p + 1] && mask[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1; }
      if (y > 0 && !seen[p - w] && mask[p - w]) { seen[p - w] = 1; stack[sp++] = p - w; }
      if (y < h - 1 && !seen[p + w] && mask[p + w]) { seen[p + w] = 1; stack[sp++] = p + w; }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw < minD || bh < minD || bw > maxD || bh > maxD) continue;
    if (x0 === 0 || y0 === 0 || x1 === w - 1 || y1 === h - 1) continue;
    const asp = bw / bh;
    if (asp < 0.75 || asp > 1.33) continue;
    if (area / (bw * bh) < 0.6) continue;          // у круга 0,785
    out.push({ x: sx / area, y: sy / area, d: (bw + bh) / 2 });
  }
  if (!out.length) return out;
  const md = median(out.map(b => b.d));            // все диски одного размера
  return out.filter(b => b.d > 0.7 * md && b.d < 1.4 * md);
}

// Уточняем диаметр диска: от края внутрь по 36 лучам до первой белой точки (надписи внутри не мешают).
// stretch – во сколько раз диск вытянут: самый длинный диаметр к самому короткому (90-й и 10-й процентили
// из 18 диаметров, чтобы один неровный луч не мешал). У диска на фото сверху ≈ 1, на фото под углом – больше
function refineDisk(F, w, h, b) {
  const r0 = b.d / 2, inner = [], ring = [], radii = [], byK = new Array(36).fill(NaN);
  for (let k = 0; k < 36; k++) {
    const a = k * Math.PI / 18, c = Math.cos(a), s = Math.sin(a);
    for (const f of [0.2, 0.4, 0.6]) inner.push(sample(F, w, h, b.x + c * r0 * f, b.y + s * r0 * f));
    ring.push(sample(F, w, h, b.x + c * r0 * 1.7, b.y + s * r0 * 1.7));
  }
  const inn = inner.filter(isFinite).sort((p, q) => p - q);
  const mid = (inn[Math.floor(inn.length * 0.75)] + median(ring.filter(isFinite))) / 2;
  for (let k = 0; k < 36; k++) {
    const a = k * Math.PI / 18, c = Math.cos(a), s = Math.sin(a);
    for (let r = r0 * 1.6; r > 0; r -= 0.25) {
      if (sample(F, w, h, b.x + c * r, b.y + s * r) > mid) { radii.push(r); byK[k] = r; break; }
    }
  }
  const dia = [];
  for (let k = 0; k < 18; k++) if (isFinite(byK[k]) && isFinite(byK[k + 18])) dia.push(byK[k] + byK[k + 18]);
  dia.sort((p, q) => p - q);
  const stretch = dia.length >= 12 ? dia[Math.floor((dia.length - 1) * 0.9)] / dia[Math.floor((dia.length - 1) * 0.1)] : NaN;
  // направление вытянутости (удвоенный угол длинной оси: ось под 0° и 180° – одна и та же)
  let cx = 0, cy = 0;
  byK.forEach((r, k) => { if (isFinite(r)) { cx += r * r * Math.cos(k * Math.PI / 9); cy += r * r * Math.sin(k * Math.PI / 9); } });
  return { x: b.x, y: b.y, d: radii.length > 10 ? 2 * median(radii) : b.d, stretch, axis: Math.atan2(cy, cx) };
}

// 96 лучей от диска; вдоль каждого – значение Z, сглаженное окном 5
function rayProfiles(Z, w, h, disk, disks) {
  const rd = disk.d / 2, r0 = rd * 1.5;            // 1,5 радиуса: пропускаем тень от диска
  let rMax = rd * 8;
  for (const o of disks) if (o !== disk) rMax = Math.min(rMax, Math.hypot(o.x - disk.x, o.y - disk.y) - o.d / 2 * 1.6);
  const rays = [];
  for (let k = 0; k < 96; k++) {
    const a = k * Math.PI / 48, c = Math.cos(a), s = Math.sin(a), prof = [];
    for (let r = r0; r <= rMax; r += 1) {
      const v = sample(Z, w, h, disk.x + c * r, disk.y + s * r);
      if (!isFinite(v)) break;
      prof.push(v);
    }
    rays.push(prof.map((_, i) => {
      let t = 0, n = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(prof.length - 1, i + 2); j++) { t += prof[j]; n++; }
      return t / n;
    }));
  }
  return { r0, rays };
}

// Край зоны: первое место на луче, где значение перешло середину между «зоной у диска» и «газоном»
function measureZones(Z, w, h, disks) {
  const P = disks.map(d => rayProfiles(Z, w, h, d, disks));
  // процентили, а не min/max: тени дисков – маленькие тёмные пятна, они не должны сбивать уровни
  const q = (r, f) => { const t = Float64Array.from(r).sort(); return t[Math.floor((t.length - 1) * f)]; };
  const pool = [];
  const st = P.map(p => {
    const ok = p.rays.filter(r => r.length >= 12);
    if (ok.length < 20) return null;
    for (const r of ok) for (let j = 0; j < r.length; j += 3) pool.push(r[j]);
    return {
      start: median(ok.map(r => median(r.slice(0, 15)))),
      lo: median(ok.map(r => q(r, 0.1))),
      hi: median(ok.map(r => q(r, 0.9))),
    };
  });
  if (!pool.length) { for (const d of disks) { d.zonePx = d.d; d.none = true; } return; }
  // Зона светлее газона или темнее? Решаем по всей чашке сразу
  let score = 0;
  for (const s of st) if (s) score += (s.start - s.lo) - (s.hi - s.start);
  const down = score > 0;
  const lawn = q(pool, down ? 0.12 : 0.88);       // уровень газона – один на всю чашку
  const contrast = st.map(s => s ? Math.abs(s.start - lawn) : 0);
  // эталон контраста – медиана заметных зон, а не самая контрастная: одна необычная (например, жёлтая)
  // зона не должна отсеивать обычные
  const visible = contrast.filter(c => c > 15), ref = visible.length ? median(visible) : 0;
  disks.forEach((d, i) => {
    const s = st[i], none = () => { d.zonePx = d.d; d.none = true; };
    if (!s || contrast[i] < Math.max(15, 0.4 * ref)) return none();
    const thr = (s.start + lawn) / 2;
    const beyond = v => down ? v < thr : v > thr;
    const edges = [], byRay = new Array(96).fill(NaN);
    P[i].rays.forEach((r, k) => {
      let j0 = 0;                                  // сначала выходим из тени диска в зону
      while (j0 < r.length && beyond(r[j0])) j0++;
      for (let j = Math.max(j0, 1); j + 2 < r.length; j++) {
        if (!(beyond(r[j]) && beyond(r[j + 1]) && beyond(r[j + 2]))) continue;
        byRay[k] = P[i].r0 + j - 1 + (r[j - 1] - thr) / ((r[j - 1] - r[j]) || 1);
        edges.push(byRay[k]);
        break;
      }
    });
    // Радиус – самая плотная группа лучей (±7 %). Лучи, ушедшие в соседнюю зону, дают
    // слишком большой радиус и в группу не попадают. При равенстве берём меньший радиус
    edges.sort((a, b) => a - b);
    let best = 0, cnt = 0;
    for (const R of edges) {
      let c = 0;
      for (const e of edges) if (Math.abs(e - R) <= 0.07 * R) c++;
      if (c > cnt) { cnt = c; best = R; }
    }
    const keep = edges.filter(e => Math.abs(e - best) <= 0.07 * best);
    if (keep.length < Math.max(12, edges.length * 0.15) || best < P[i].r0 + 2) return none();
    d.zonePx = 2 * keep.reduce((t, e) => t + e, 0) / keep.length;
    d.none = false;
    // Неуверенно, если с выбранным краем согласны меньше 40 % лучей: зоны сливаются с соседними
    // или край размыт – лучи находят «край» на разном расстоянии. Такую зону должен проверить человек
    d.doubt = keep.length < 0.4 * P[i].rays.length;
    // Форма края: 12 секторов по 8 лучей, в каждом медиана. Допуск шире (±25 %), чтобы
    // неровная зона осталась неровной; луч, ушедший в соседнюю зону, всё равно отбрасывается
    const R = d.zonePx / 2;
    d.contour = Array.from({ length: 12 }, (_, s) => {
      const v = [];
      for (let k = s * 8 - 4; k < s * 8 + 4; k++) {
        const e = byRay[(k + 96) % 96];
        if (isFinite(e) && Math.abs(e - R) <= 0.25 * R) v.push(e);
      }
      return v.length >= 3 ? median(v) : R;
    });
  });
}

// Колонии внутри зоны: настоящая зона подавления гладкая, а зона, где растут отдельные колонии, – пятнистая.
// Зернистость – среднее |значение − среднее по маленькому кольцу вокруг| в кольце от тени диска до 0,85 радиуса зоны.
// Подозрительно, если внутри зернистость заметная (≥ 7 из 255) и в 1,3 раза больше, чем у газона снаружи.
// Подобрано на тестовых фото: у чистых зон ≤ 5, у зоны с колониями (OB 5 на кровяном агаре) – 10.
// Зону не меняем, только спрашиваем человека (по правилам МАКМАХ п. 2.7 такую зону меряют по внутреннему краю)
function grainIn(Z, w, h, x, y, a, b, s) {
  let t = 0, n = 0;
  for (let r = a; r <= b; r += Math.max(1, s / 2)) {
    const m = Math.max(12, Math.round(2 * Math.PI * r / s));
    for (let k = 0; k < m; k++) {
      const u = 2 * Math.PI * k / m, px = x + Math.cos(u) * r, py = y + Math.sin(u) * r, c = sample(Z, w, h, px, py);
      if (!isFinite(c)) continue;
      let sum = 0, cnt = 0;
      for (let j = 0; j < 8; j++) {
        const q = sample(Z, w, h, px + Math.cos(j * Math.PI / 4) * s, py + Math.sin(j * Math.PI / 4) * s);
        if (isFinite(q)) { sum += q; cnt++; }
      }
      if (cnt) { t += Math.abs(c - sum / cnt); n++; }
    }
  }
  return n ? t / n : NaN;
}
function markColonies(Z, w, h, disks, diskPx) {
  if (!diskPx) return;
  const rd = diskPx / 2, s = Math.max(2, diskPx * 0.12);
  for (const d of disks) {
    const R = d.zonePx / 2;
    if (d.none || R < rd * 1.9) continue;            // узкое кольцо – мерить нечего
    const inside = grainIn(Z, w, h, d.x, d.y, rd * 1.6, R * 0.85, s), outside = grainIn(Z, w, h, d.x, d.y, R * 1.15, R * 1.15 + rd, s);
    if (inside >= 7 && (!(outside > 0) || inside >= 1.3 * outside)) { d.colonies = true; d.doubt = true; }
  }
}

function analyze(rgba, w, h) {
  const { W, Z, B } = features(rgba, w, h);
  const side = Math.min(w, h), minD = side * 0.025, maxD = side * 0.13;
  const rc = Math.max(2, Math.round(side * 0.008));
  const n = w * h, seen = new Uint8Array(n), stack = new Int32Array(n), mask = new Uint8Array(n);
  // Порог перебираем сверху вниз и берём тот, при котором круглых пятен одного размера больше всего
  const find = (F, lo) => {
    let best = [];
    for (let T = 250; T >= lo; T -= 5) {
      for (let i = 0; i < n; i++) mask[i] = F[i] > T ? 1 : 0;
      const closed = morph(morph(mask, w, h, rc, true), w, h, rc, false);
      const b = blobs(closed, w, h, minD, maxD, seen, stack);
      if (b.length > best.length) best = b;
    }
    return best;
  };
  // Местный контраст: на сколько точка ярче средней яркости вокруг себя (окно ~2 диаметра диска).
  // Ловит диски, которые по общему порогу не отделить от светлого агара или видны только в своей зоне
  const local = () => {
    const R = Math.max(4, Math.round(side * 0.06)), S = new Float64Array((w + 1) * (h + 1)), L = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0, row = 0; x < w; x++) {
      row += B[y * w + x]; S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
      const sum = S[y1 * (w + 1) + x1] - S[y0 * (w + 1) + x1] - S[y1 * (w + 1) + x0] + S[y0 * (w + 1) + x0];
      L[y * w + x] = 128 + B[y * w + x] - sum / ((x1 - x0) * (y1 - y0));
    }
    // пятно – кандидат, если нашлось хотя бы при двух порогах (случайный блик обычно при одном)
    const cand = [];
    for (let T = 190; T >= 140; T -= 4) {
      for (let i = 0; i < n; i++) mask[i] = L[i] > T ? 1 : 0;
      const closed = morph(morph(mask, w, h, rc, true), w, h, rc, false);
      for (const b of blobs(closed, w, h, minD, maxD, seen, stack)) {
        const c = cand.find(c => Math.hypot(c.x - b.x, c.y - b.y) < Math.max(c.d, b.d) / 2);
        if (c) { c.hits++; if (b.d > c.d) { c.x = b.x; c.y = b.y; c.d = b.d; } } else cand.push({ ...b, hits: 1 });
      }
    }
    return { L, cand: cand.filter(c => c.hits >= 2) };
  };
  // До 120, а не до 150: на тёмных фото бумажные диски серые (яркость ~150–170)
  let best = find(W, 120), F = W;
  // Белых дисков почти нет – возможно, диски кремовые или жёлтые: ищем по яркости без требования «без оттенка»
  if (best.length < 3) {
    const alt = find(B, 100);
    if (alt.length > best.length) { best = alt; F = B; }
  }
  let disks = best.map(b => refineDisk(F, w, h, b));
  // Добираем пропущенные диски по местному контрасту: того же размера, что найденные, и не поверх них
  const { L, cand } = local();
  const md0 = disks.length ? median(disks.map(d => d.d)) : cand.length ? median(cand.map(c => c.d)) : 0;
  for (const c of cand) {
    if (!(c.d > 0.7 * md0 && c.d < 1.4 * md0)) continue;
    if (disks.some(d => Math.hypot(d.x - c.x, d.y - c.y) < (d.d + c.d) / 2)) continue;
    const r = refineDisk(L, w, h, c);
    if (r.d > 0.7 * md0 && r.d < 1.4 * md0) disks.push(r);
  }
  const diskPx = disks.length ? median(disks.map(d => d.d)) : null;
  // Фото под углом – все диски вытянуты одинаково и в одну сторону. Если вытянуты кто куда – это неровные края
  // и шум поиска, а не наклон. Нужно ≥ 3 дисков; согласие направлений – длина среднего единичного вектора (≥ 0,7)
  const ok = disks.filter(d => isFinite(d.stretch));
  const ax = ok.reduce((t, d) => t + Math.cos(d.axis), 0), ay = ok.reduce((t, d) => t + Math.sin(d.axis), 0);
  const aligned = ok.length >= 3 && Math.hypot(ax, ay) / ok.length >= 0.7;
  // На сильно наклонённом фото диски плохо находятся, и их бывает 1–2. Тогда предупреждаем, только если
  // вытянутость явная (≥ 20 %, шум столько не даёт), а у двух дисков – ещё и в одну сторону
  const few = ok.length >= 1 && ok.length <= 2 && Math.hypot(ax, ay) / ok.length >= 0.7 && ok.every(d => d.stretch >= TILT_FEW);
  const stretch = aligned || few ? median(ok.map(d => d.stretch)) : null;
  measureZones(Z, w, h, disks);
  markColonies(Z, w, h, disks, diskPx);
  return { disks, diskPx, stretch };
}

// Искусственная чашка Петри для примера: 4 диска, зоны 24, 17, 13 мм и одна без зоны
function makeSample() {
  const W = 900, H = 900, pm = 9.5, cx = 450, cy = 450, dishR = 44 * pm;
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const disks = [[285, 320, 24], [625, 300, 17], [320, 640, 13], [640, 625, 6]];
  const lawn = [218, 206, 184], clear = [128, 122, 114], paper = [246, 246, 242], table = [40, 44, 50], rim = [176, 179, 182];
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = Math.hypot(x - cx, y - cy);
    let c;
    if (r > dishR + 4) c = table;
    else if (r > dishR - 5) c = rim;
    else {
      const light = 1 - 0.1 * (r / dishR) ** 2 + 0.05 * (x - cx) / dishR;
      let t = 1, p = 0;
      for (const [dx, dy, z] of disks) {
        const dd = Math.hypot(x - dx, y - dy), zr = z * pm / 2;
        t = Math.min(t, ss(zr - 4, zr + 4, dd));
        p = Math.max(p, 1 - ss(3 * pm - 1.2, 3 * pm + 1.2, dd));
      }
      c = clear.map((v, i) => (v + (lawn[i] - v) * t) * light);
      c = c.map((v, i) => v + (paper[i] - v) * p);
    }
    const n = gauss() * 6, i = (y * W + x) * 4;
    data[i] = c[0] + n; data[i + 1] = c[1] + n; data[i + 2] = c[2] + n; data[i + 3] = 255;
  }
  return { data, w: W, h: H };
}
