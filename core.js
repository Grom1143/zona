// МикроТест Вижн – ОСНОВА (общее для всех блоков). Порядок файлов важен: core.js → home.js → f1.js → logo.js
// (index.html подключает их по очереди). Всё объявленное здесь видно в следующих файлах.
// Здесь: состояние P, геометрия зон, картинки, обрезка при загрузке, история «отменить / вернуть»,
// сохранение в браузере (IndexedDB), скачивание файлов и файл проекта.
// МикроТест Вижн – интерфейс: чашки, разметка мышью, таблица, сохранение, Excel, клавиши.
// Подключается после analysis.js и пользуется его функциями (analyze, makeSample, sample, median).
// ===== Интерфейс =====
const $ = id => document.getElementById(id);
// cv – только фото (в его разрешении); разметка рисуется отдельно на ov – в разрешении экрана, поэтому
// при приближении не размывается. ctx – холст, на котором сейчас рисуется разметка (ov, лупа или снимок)
const cv = $("cv"), pctx = cv.getContext("2d"), ov = $("ov"), octx = ov.getContext("2d");
let ctx = pctx;
const MAX_SIDE = 1100;   // большие фото уменьшаем: точность не страдает, анализ быстрее
// P – всё приложение; чашки лежат в P.dishes, открыта P.dishes[P.cur]
const P = { dishes: [], cur: -1, sel: -1, mode: "idle", calib: null, drag: null, hover: -1, zoom: 1, breaks: [], general: { on: true, s: 22, r: 19 }, dirty: false, savedAt: null, alpha: 1, ver: 0, trash: [] };
const D = () => P.dishes[P.cur] || null;

const len = r => Math.hypot(r.bx - r.ax, r.by - r.ay);
const mid = r => ({ x: (r.ax + r.bx) / 2, y: (r.ay + r.by) / 2 });
const rulerAt = (x, y, d) => ({ ax: x - d / 2, ay: y, bx: x + d / 2, by: y });
const fmt = v => v.toFixed(1).replace(".", ",");
const round1 = v => Math.round(v * 10) / 10;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const today = () => new Date().toLocaleDateString("sv-SE");
const tick = () => new Promise(r => setTimeout(r, 20));
let uid = 0;
const newId = () => Date.now().toString(36) + (uid++).toString(36);

const diskMm = () => { const d = D(); return d && d.diskMm > 0 ? d.diskMm : 6; };
const mmPerPx = (d = D()) => d && d.scalePx ? (d.diskMm > 0 ? d.diskMm : 6) / d.scalePx : null;
// Зона бывает двух видов: круг – линейка-диаметр it.r (классика, для ровных зон),
// или гибкий контур из 12 точек по краю it.pts (для сложных); точка i смотрит под углом i·30° от центра
const N_PTS = 12;
const ringPts = (x, y, radii) => radii.map((r, i) => {
  const a = i * 2 * Math.PI / N_PTS;
  return { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r };
});
const circlePts = (x, y, d) => ringPts(x, y, new Array(N_PTS).fill(d / 2));
// Гладкая замкнутая линия через точки (сплайн Катмулла – Рома), по 8 отрезков между соседями
function outline(pts) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < 8; s++) {
      const t = s / 8, t2 = t * t, t3 = t2 * t;
      const f = k => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
      out.push({ x: f("x"), y: f("y") });
    }
  }
  return out;
}
function areaOf(poly) {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return Math.abs(s) / 2;
}
function inside(poly, p) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
// Диаметр неровной зоны – диаметр круга той же площади. Линия через 12 точек круга чуть
// меньше самого круга (~0,5 %), делим на эту поправку, чтобы круг давал ровно свой диаметр
const ROUND_K = Math.sqrt(areaOf(outline(circlePts(0, 0, 2))) / Math.PI);
const diamPx = it => it.pts ? 2 * Math.sqrt(areaOf(outline(it.pts)) / Math.PI) / ROUND_K : len(it.r);
const center = it => it.pts
  ? { x: it.pts.reduce((t, p) => t + p.x, 0) / it.pts.length, y: it.pts.reduce((t, p) => t + p.y, 0) / it.pts.length }
  : mid(it.r);
// Контур из круга: форма – найденный программой край (it.shape), размер – как сейчас у линейки
function toContour(it) {
  const c = center(it), d = diamPx(it);
  if (!it.shape) return circlePts(c.x, c.y, d);
  const pts = ringPts(c.x, c.y, it.shape), k = d / diamPx({ pts });
  return ringPts(c.x, c.y, it.shape.map(r => r * k));
}
// Самый узкий и самый широкий размер – между противоположными точками
function spanPx(it) {
  const h = it.pts.length / 2, v = [];
  for (let i = 0; i < h; i++) v.push(Math.hypot(it.pts[i].x - it.pts[i + h].x, it.pts[i].y - it.pts[i + h].y));
  return { min: Math.min(...v), max: Math.max(...v) };
}
// Старые проекты хранили линейки r и r2 – превращаем их в контур (круг или овал)
function ptsFromRulers(r, r2) {
  const m1 = mid(r), m2 = r2 ? mid(r2) : m1, c = { x: (m1.x + m2.x) / 2, y: (m1.y + m2.y) / 2 };
  const A = len(r) / 2, B = r2 ? len(r2) / 2 : A, t = Math.atan2(r.by - r.ay, r.bx - r.ax), ct = Math.cos(t), st = Math.sin(t);
  return Array.from({ length: N_PTS }, (_, i) => {
    const a = i * 2 * Math.PI / N_PTS, u = A * Math.cos(a), v = B * Math.sin(a);
    return { x: c.x + u * ct - v * st, y: c.y + u * st + v * ct };
  });
}
const disksWord = n => n % 10 === 1 && n % 100 !== 11 ? "диск" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "диска" : "дисков";
// проверить: «нет зоны?» или зона, найденная неуверенно (пока её не поправили и не подтвердили)
const needsCheck = it => !it.ok && (it.src === "none" || (it.doubt && it.src === "auto"));
// Фото под углом: круглые диски выходят овалами. 1,06 – это наклон ~20°; у фото сверху вытянутость ~1,00–1,03
const TILT_WARN = 1.06, TILT_FEW = 1.2;   // TILT_FEW – порог, когда дисков найдено всего 1–2
const tiltOf = d => d && d.stretch >= TILT_WARN
  ? { pct: Math.round((d.stretch - 1) * 100), deg: Math.round(Math.acos(1 / d.stretch) * 180 / Math.PI) } : null;
// Состояние чашки – для цвета рамки миниатюры: err – ошибка (дисков нет / фото под углом), пока оператор ничего не разметил;
// chk – есть зоны «?»; fixed – оператор поправил или подтвердил и проверять больше нечего; "" – только автоматическая разметка
const dishErr = d => !d.items.length || !!tiltOf(d);
const dishWorked = d => d.items.some(it => it.ok || it.src === "edited" || it.src === "manual");
const dishState = d => dishErr(d) && !dishWorked(d) ? "err" : d.items.some(needsCheck) ? "chk" : dishWorked(d) ? "fixed" : "";
const tiltText = t => `Фото под углом (~${t.deg}°): диски вытянуты на ${t.pct} %. Лучше переснять сверху.`;
const STATUS = it => it.src === "none" ? (it.ok ? "нет зоны ✓" : "нет зоны?") :
  it.doubt && it.src === "auto" ? (it.ok ? "подтверждено" : "проверить?") : { auto: "авто", edited: "исправлено", manual: "вручную" }[it.src];

// ----- картинки -----
function fileToImage(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bad image")); };
    img.src = url;
  });
}
function toBase(src, w, h) {
  const k = Math.min(1, MAX_SIDE / Math.max(w, h)), c = document.createElement("canvas");
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return c;
}
const canvasBlob = c => new Promise(res => c.toBlob(res, "image/jpeg", 0.92));
function thumbOf(c) {
  const t = document.createElement("canvas"), k = 128 / Math.max(c.width, c.height);
  t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
  t.getContext("2d").drawImage(c, 0, 0, t.width, t.height);
  return t.toDataURL("image/jpeg", 0.8);
}
// превью для обложки датасета на странице выбора: 360 px – чётко на всю ширину карточки и всё ещё лёгкое
const PREV_PX = 360;
function prevOf(c) {
  const t = document.createElement("canvas"), k = Math.min(1, PREV_PX / Math.max(c.width, c.height));
  t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
  t.getContext("2d").drawImage(c, 0, 0, t.width, t.height);
  return t.toDataURL("image/jpeg", 0.8);
}
// у чашек, добавленных до превью, – делаем из самого фото (один раз; дальше хранится с чашкой)
async function prevFromBlob(b) {
  try { const bm = await createImageBitmap(b), p = prevOf(bm); bm.close && bm.close(); return p; } catch { return ""; }
}
const rgbaOf = d => d._rgba || (d._rgba = d._base.getContext("2d").getImageData(0, 0, d.w, d.h).data);
// Все диски стандартные, 6 мм: «нет зоны» – ровно диаметр диска (по медиане всех дисков, а не по одному,
// который на фото мог выйти 5,7 или 6,3), и зона не бывает меньше диска
const itemsFrom = res => res.disks.map(d => ({
  x: d.x, y: d.y, src: d.none ? "none" : "auto", drug: "", ok: false, doubt: !d.none && !!d.doubt,
  r: rulerAt(d.x, d.y, res.diskPx ? (d.none ? res.diskPx : Math.max(d.zonePx, res.diskPx)) : d.zonePx),
  shape: d.contour && !d.none ? d.contour : null, colonies: !d.none && !!d.colonies, pigment: !d.none && !!d.pigment,
}));

async function addDish(src, w, h, name, sample) {
  const base = toBase(src, w, h), prev = P.dishes[P.dishes.length - 1];
  const d = {
    id: newId(), name, sample: !!sample,
    meta: prev ? { ...prev.meta } : { date: today(), medium: "", group: "опыт", culture: "", person: "", org: "", dishMm: "" },
    diskMm: prev ? prev.diskMm : 6, w: base.width, h: base.height,
    img: await canvasBlob(base), thumb: thumbOf(base), prev: prevOf(base),
    items: [], scalePx: null, scaleSrc: "auto", nDisks: 0, _base: base, _rgba: null, _undo: [], _redo: [],
  };
  const res = analyze(rgbaOf(d), d.w, d.h);
  d.items = itemsFrom(res); d.scalePx = res.diskPx; d.nDisks = res.disks.length; d.stretch = res.stretch;
  // картинку в памяти держит только открытая чашка (~7 МБ на фото): openDish заново возьмёт её из d.img
  d._base = null; d._rgba = null;
  P.dishes.push(d);
  return d;
}
// Пример, который никто не трогал, убираем, когда появились настоящие фото
const dropSample = () => { P.dishes = P.dishes.filter(d => !(d.sample && !d._undo.length)); };

async function addFiles(files) {
  files = [...files];
  if (!files.length) return;
  const keep = D();
  let first = -1, bad = 0, skipped = 0, noCrop = false;
  // 1) сначала обрезаем все фото подряд, не закрывая окно обрезки
  const picked = [];
  for (let i = 0; i < files.length; i++) {
    let img;
    try { img = await fileToImage(files[i]); } catch { bad++; continue; }
    let src = img, w = img.naturalWidth, h = img.naturalHeight;
    if (!noCrop) {
      const r = await cropImage(img, i + 1, files.length);
      if (r === "skip") { skipped++; continue; }
      if (r === "all") { noCrop = true; $("cropBox").close(); }
      else if (r !== "full") {
        const cc = document.createElement("canvas");
        cc.width = r.w; cc.height = r.h;
        cc.getContext("2d").drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
        src = cc; w = r.w; h = r.h;
      }
    }
    picked.push({ src, w, h, name: files[i].name.replace(/\.[^.]+$/, "") });
  }
  if ($("cropBox").open) $("cropBox").close();
  // 2) потом ищем диски и зоны на всех сразу
  for (let k = 0; k < picked.length; k++) {
    const p = picked[k];
    setMsg(picked.length > 1 ? `Обрабатываю фото ${k + 1} из ${picked.length}…` : "Ищу диски и зоны…");
    await tick();
    if (first < 0) dropSample();                     // пример убираем, только когда есть что добавить
    await addDish(p.src, p.w, p.h, p.name || `Чашка ${P.dishes.length + 1}`);
    if (first < 0) first = P.dishes.length - 1;
  }
  if (first < 0) {
    P.cur = keep ? P.dishes.indexOf(keep) : -1;
    renderDishes(); render();
    if (bad) return setMsg("Не удалось открыть файл. Подойдут фото JPG или PNG (HEIC с iPhone сначала сохраните как JPG).", true);
    return setMsg("Фото не добавлены.");
  }
  markDirty();
  await openDish(first);
  const added = files.length - bad - skipped;
  if (added > 1 || bad || skipped) setMsg(`Добавлено чашек: ${added}${skipped ? `, пропущено: ${skipped}` : ""}${bad ? `, не открылось файлов: ${bad}` : ""}. ` + summary(D()), !!bad);
}

// ----- обрезка при загрузке -----
// Окно с фото и рамкой. Ответ: { x, y, w, h } в пикселях фото, "full" (без обрезки),
// "all" (без обрезки для этого и остальных фото) или "skip" (не добавлять)
function cropImage(img, n, total) {
  const box = $("cropBox"), c = $("cropCv"), g = c.getContext("2d");
  const W = img.naturalWidth, H = img.naturalHeight, k = 900 / Math.max(W, H);   // любое фото – 900 px по длинной стороне: маленькие тоже растягиваются на всё поле
  c.width = Math.round(W * k); c.height = Math.round(H * k);
  const R = { x: 0, y: 0, w: c.width, h: c.height }, MIN = 40;
  $("cropInfo").textContent = total > 1 ? `фото ${n} из ${total}` : "";
  $("cropAll").style.visibility = n >= total ? "hidden" : "";   // место кнопки остаётся: ряд кнопок не сдвигается
  const sc = () => c.width / (c.getBoundingClientRect().width || c.width);   // экранный пиксель в пикселях холста
  const handles = () => {
    const xs = [R.x, R.x + R.w / 2, R.x + R.w], ys = [R.y, R.y + R.h / 2, R.y + R.h], out = [];
    for (const x of xs) for (const y of ys) if (x !== xs[1] || y !== ys[1]) out.push([x, y]);
    return out;
  };
  const draw = () => {
    const s = sc();
    g.drawImage(img, 0, 0, c.width, c.height);
    g.fillStyle = "rgba(0,0,0,.6)";                   // всё вне рамки затемнено
    g.fillRect(0, 0, c.width, R.y); g.fillRect(0, R.y + R.h, c.width, c.height - R.y - R.h);
    g.fillRect(0, R.y, R.x, R.h); g.fillRect(R.x + R.w, R.y, c.width - R.x - R.w, R.h);
    g.strokeStyle = "#ff8c1a"; g.lineWidth = 2 * s; g.strokeRect(R.x, R.y, R.w, R.h);   // оранжевая рамка
    g.fillStyle = "#ff8c1a"; g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 1.5 * s;
    for (const [x, y] of handles()) { g.fillRect(x - 6 * s, y - 6 * s, 12 * s, 12 * s); g.strokeRect(x - 6 * s, y - 6 * s, 12 * s, 12 * s); }
  };
  const at = e => { const b = c.getBoundingClientRect(); return { x: (e.clientX - b.left) * c.width / b.width, y: (e.clientY - b.top) * c.height / b.height }; };
  // какие стороны рамки под курсором: l, r, t, b; внутри без сторон – сдвиг
  const grabOf = p => {
    const hit = 16 * sc(), inY = p.y > R.y - hit && p.y < R.y + R.h + hit, inX = p.x > R.x - hit && p.x < R.x + R.w + hit;
    const s = { l: inY && Math.abs(p.x - R.x) < hit, r: inY && Math.abs(p.x - R.x - R.w) < hit, t: inX && Math.abs(p.y - R.y) < hit, b: inX && Math.abs(p.y - R.y - R.h) < hit };
    if (s.l || s.r || s.t || s.b) return s;
    return p.x > R.x && p.x < R.x + R.w && p.y > R.y && p.y < R.y + R.h ? { move: true } : null;
  };
  const cursorOf = s => !s ? "" : s.move ? "move" : (s.l && s.t) || (s.r && s.b) ? "nwse-resize" : (s.r && s.t) || (s.l && s.b) ? "nesw-resize" : s.l || s.r ? "ew-resize" : "ns-resize";
  let drag = null;
  c.onpointerdown = e => {
    const p = at(e), s = grabOf(p);
    if (!s) return;
    drag = { s, p, R0: { ...R } };
    c.setPointerCapture(e.pointerId); e.preventDefault();
  };
  c.onpointermove = e => {
    const p = at(e);
    if (!drag) { c.style.cursor = cursorOf(grabOf(p)); return; }
    const { s, R0 } = drag, dx = p.x - drag.p.x, dy = p.y - drag.p.y;
    if (s.move) {
      R.x = Math.max(0, Math.min(c.width - R0.w, R0.x + dx)); R.y = Math.max(0, Math.min(c.height - R0.h, R0.y + dy));
    } else {
      let x0 = R0.x, y0 = R0.y, x1 = R0.x + R0.w, y1 = R0.y + R0.h;
      if (s.l) x0 = Math.max(0, Math.min(x1 - MIN, x0 + dx));
      if (s.r) x1 = Math.min(c.width, Math.max(x0 + MIN, x1 + dx));
      if (s.t) y0 = Math.max(0, Math.min(y1 - MIN, y0 + dy));
      if (s.b) y1 = Math.min(c.height, Math.max(y0 + MIN, y1 + dy));
      Object.assign(R, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
    draw();
  };
  c.onpointerup = c.onpointercancel = () => { drag = null; };
  return new Promise(res => {
    // окно не закрываем: для серии фото в нём сразу появится следующее (закрывает addFiles)
    const done = v => { window.removeEventListener("resize", draw); res(v); };
    $("cropOk").onclick = () => {
      if (R.w >= c.width - 1 && R.h >= c.height - 1) return done("full");
      done({ x: Math.round(R.x / k), y: Math.round(R.y / k), w: Math.round(R.w / k), h: Math.round(R.h / k) });
    };
    $("cropFull").onclick = () => done("full");
    $("cropAll").onclick = () => done("all");
    $("cropSkip").onclick = () => done("skip");
    box.oncancel = e => { e.preventDefault(); done("full"); };   // Esc – оставить фото целиком
    window.addEventListener("resize", draw);
    if (!box.open) box.showModal();
    draw();
  });
}

async function openDish(i) {
  P.cur = i; P.sel = -1; P.calib = null; P.drag = null; setMode("idle");
  if (!atHome()) setRoute(DS.cur, i, false);                       // в адресе – и чашка: после F5 откроется она же
  const d = D();
  for (const o of P.dishes) if (o !== d) { o._base = null; o._rgba = null; }   // освобождаем память закрытых чашек
  if (d && !d._base) {
    setMsg("Открываю фото…");
    try { d._base = toBase(await fileToImage(d.img), d.w, d.h); }
    catch { setMsg("Фото этой чашки повреждено и не открывается.", true); }
  }
  if (d) { cv.width = d.w; cv.height = d.h; $("diskMm").value = d.diskMm; P.zoom = 1; fitCanvas(); setZoom(1); }
  fillMeta(); renderDishes(); render();
  if (d) msgFor(d);
}
// Сообщение о чашке. Ошибку, с которой оператор уже поработал, не выделяем красным – она остаётся в окошке справа свёрнутой
function msgFor(d, text) {
  const err = dishState(d) === "err";
  const t = tiltOf(d), errText = !d.items.length ? summary(d) : t ? tiltText(t) : "";
  setMsg(text || summary(d), err, dishErr(d) && !err, errText);
  $("msg").classList.toggle("err", err);
}

function summary(d) {
  if (!d.items.length) return "Диски не найдены: задайте «Масштаб по линейке» и добавьте зоны вручную.";
  const n = d.items.filter(needsCheck).length, t = tiltOf(d);
  return (t ? tiltText(t) + " " : "") + `Дисков: ${d.items.length}.` + (n ? ` Проверьте зоны с «?»: ${n}.` : "");
}

// ----- история: отменить / вернуть -----
// Снимок – зоны, масштаб и текст чашки (название, паспорт, диаметр диска), без картинки.
// В стеке лежит { s: снимок, t: время }: по времени отмена решает, что было позже – правка этой чашки или удаление другой
const snap = d => JSON.stringify({ items: d.items, scalePx: d.scalePx, scaleSrc: d.scaleSrc, nDisks: d.nDisks, stretch: d.stretch,
  name: d.name, meta: d.meta, diskMm: d.diskMm });
function commit(prev) {
  const d = D();
  if (!d) return;
  d._undo.push({ s: prev ?? snap(d), t: Date.now() });
  if (d._undo.length > 200) d._undo.shift();
  d._redo = [];
  markDirty();
}
function restore(d, s) {
  const o = JSON.parse(s);
  d.items = o.items; d.scalePx = o.scalePx; d.scaleSrc = o.scaleSrc; d.nDisks = o.nDisks; d.stretch = o.stretch;
  d.name = o.name; d.meta = o.meta; d.diskMm = o.diskMm;
}
function afterHistory(d, text) {
  $("diskMm").value = d.diskMm;
  P.sel = -1; markDirty(); fillMeta(); renderDishes(); render(); setMsg(text);
}
function undo() {
  const d = D(), top = d && d._undo[d._undo.length - 1], del = P.trash[P.trash.length - 1];
  if (del && (!top || del.t > top.t)) return undeleteDish();   // удаление чашки было позже – возвращаем её
  if (!top) return;
  d._redo.push({ s: snap(d), t: Date.now() }); restore(d, d._undo.pop().s);
  afterHistory(d, "Действие отменено.");
}
function redo() {
  const d = D();
  if (!d || !d._redo.length) return;
  d._undo.push({ s: snap(d), t: Date.now() }); restore(d, d._redo.pop().s);
  afterHistory(d, "Действие возвращено.");
}
// Удалённые чашки (до 10 последних) лежат в P.trash до перезагрузки страницы – вместе со своей историей
async function undeleteDish() {
  const e = P.trash.pop();
  if (e.many) {                                    // несколько чашек сразу: каждая встаёт на своё прежнее место
    for (const { dish, i } of e.many) P.dishes.splice(Math.min(i, P.dishes.length), 0, dish);
    markDirty();
    await openDish(Math.min(e.many[0].i, P.dishes.length - 1));
    return setMsg(`Возвращено: ${e.many.length} ${dishWord(e.many.length)}.`);
  }
  const { dish, i } = e, at = Math.min(i, P.dishes.length);
  P.dishes.splice(at, 0, dish); markDirty();
  await openDish(at);
  setMsg(`Чашка «${dish.name}» возвращена.`);
}
// Текстовые поля: один шаг отмены на одну правку поля (от входа в поле до выхода из него), а не на каждую букву
const TEXT_SEL = "#mName, #mDate, #mGroup, #mMedium, #mCulture, #mPerson, #mOrg, #mDishMm, #diskMm, #zoomDrug, input.drug";
let textPre = null;
document.addEventListener("focusin", e => { if (D() && e.target.matches(TEXT_SEL)) textPre = snap(D()); });
document.addEventListener("change", e => {
  const d = D();
  if (!d || !textPre || !e.target.matches(TEXT_SEL)) return;
  if (snap(d) !== textPre) { commit(textPre); renderSide(); }
  textPre = snap(d);
});

// ----- сохранение -----
// Автосохранение: через 2 с после последнего изменения (серия правок – одно сохранение).
// P.ver растёт при каждом изменении: если во время записи что-то поменяли, чашки остаются «несохранёнными»
let saveTimer = 0, saving = false, persistAsked = false;
function markDirty() {
  P.dirty = true; P.ver++; renderSaveState();
  if (typeof refreshDishStates === "function") refreshDishStates();
  clearTimeout(saveTimer); saveTimer = setTimeout(() => saveBrowser(true), 2000);
}
// Просим браузер не стирать данные сайта при нехватке места (Chrome решает сам, Firefox может спросить)
function persistOnce() {
  if (persistAsked) return;
  persistAsked = true;
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch {}
}
function renderSaveState() {
  const el = $("saveState");
  el.className = "savestate" + (P.dirty ? " warn" : "");
  el.textContent = P.dirty ? (P.saveFailed ? "Не сохранено: браузер запретил – нажмите «Скачать проект»" : "Сохраняю…") :
    P.savedAt ? `Сохранено в ${P.savedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "";
  $("saveBtn2").classList.toggle("dirty", P.dirty);
  setLabel("saveBtn2", P.dirty ? "Сохранить" : P.savedAt ? `Сохранено в ${P.savedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Сохранить");
}
// hist – добавить историю отмены (последние 50 шагов): в браузере – да, в файл проекта – нет, чтобы он не раздувался
const HIST_KEEP = 50;
const pick = (d, hist) => ({
  ...(hist ? { undo: d._undo.slice(-HIST_KEEP), redo: d._redo.slice(-HIST_KEEP), prev: d.prev || "" } : {}),
  id: d.id, name: d.name, sample: d.sample && !d._undo.length, meta: { ...d.meta }, diskMm: d.diskMm, w: d.w, h: d.h, img: d.img, thumb: d.thumb,
  items: JSON.parse(JSON.stringify(d.items)), scalePx: d.scalePx, scaleSrc: d.scaleSrc, nDisks: d.nDisks, stretch: d.stretch,
});
// история из сохранения: только записи вида { s: снимок-строка, t: время }
const histOf = a => Array.isArray(a) ? a.filter(e => e && typeof e.s === "string" && typeof e.t === "number") : [];
function hydrate(o) {
  const meta = { date: "", medium: "", group: "опыт", culture: "", person: "", org: "", dishMm: "", ...(o.meta || {}) };
  const items = (o.items || []).map(it => {
    const z = { x: it.x, y: it.y, src: it.src || "manual", drug: it.drug || "", ok: !!it.ok, doubt: !!it.doubt, colonies: !!it.colonies, pigment: !!it.pigment, shape: Array.isArray(it.shape) ? it.shape : null };
    if (Array.isArray(it.pts) && it.pts.length === N_PTS) z.pts = it.pts;
    else if (it.r2) z.pts = ptsFromRulers(it.r, it.r2);   // старая «вторая ось» – уже неровная зона
    else z.r = it.r;
    return z;
  });
  const img = o.img instanceof ArrayBuffer ? new Blob([o.img], { type: o.imgType || "image/jpeg" }) : o.img;
  return { id: o.id || newId(), name: o.name || "Чашка", sample: !!o.sample, meta, diskMm: o.diskMm || 6, w: o.w, h: o.h, img, thumb: o.thumb || "", prev: o.prev || "",
    items, scalePx: o.scalePx || null, scaleSrc: o.scaleSrc || "auto", nDisks: o.nDisks || 0, stretch: o.stretch || null, _base: null, _rgba: null, _undo: histOf(o.undo), _redo: histOf(o.redo) };
}
function idb() {
  return new Promise((res, rej) => {
    const q = indexedDB.open("zona-ingibirovaniya", 1);
    q.onupgradeneeded = () => q.result.createObjectStore("kv");
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function idbDo(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction("kv", mode), q = fn(t.objectStore("kv"));
    t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
}
// auto = true – автосохранение: молча, без сообщения (кроме первой ошибки)
async function saveBrowser(auto) {
  clearTimeout(saveTimer);
  if (atHome()) return;            // на странице выбора чашек нет – нечего сохранять (иначе затёрли бы датасет пустым)
  if (saving) { saveTimer = setTimeout(() => saveBrowser(auto), 500); return; }   // прошлая запись ещё идёт
  saving = true;
  const v = P.ver, id = DS.cur;
  try {
    // фото храним байтами, а не Blob: в Safari Blob из IndexedDB после перезагрузки иногда не читается
    const dishes = [];
    for (const d of P.dishes) {
      if (!d.prev) d.prev = d._base ? prevOf(d._base) : await prevFromBlob(d.img);
      dishes.push({ ...pick(d, true), img: await d.img.arrayBuffer(), imgType: d.img.type || "image/jpeg" });
    }
    const now = Date.now(), k = DS.list.findIndex(x => x.id === id);
    const e = { ...(k >= 0 ? DS.list[k] : {}), id, name: dsName(), count: dishes.length, savedAt: now, v: 3, thumbs: dishes.map(d => [d.prev || d.thumb, d.name, markOf(d)]) };
    delete e.thumb;
    k >= 0 ? (DS.list[k] = e) : DS.list.push(e);
    await idbDo("readwrite", s => { s.put(DS.list, "datasets"); return s.put({ v: 5, cur: P.cur, savedAt: now, dishes, breaks: P.breaks, general: P.general }, dsKey(id)); });
    renderDsBtn();
    if (P.ver === v) P.dirty = false;
    P.saveFailed = false; P.savedAt = new Date(); renderSaveState();
    if (!auto) setMsg(`Сохранено: чашек ${P.dishes.length}.`);
    persistOnce();
  } catch {
    if (!auto || !P.saveFailed) setMsg("Браузер не дал сохранить (например, в режиме инкогнито). Нажмите «Скачать проект» – так разметка точно не пропадёт.", true);
    P.saveFailed = true; renderSaveState();
  } finally { saving = false; }
}
async function loadBrowser(id = DS.cur, dish = -1) {
  try {
    const o = await idbDo("readonly", s => s.get(dsKey(id)));
    if (!o || !Array.isArray(o.dishes) || !o.dishes.length) return false;
    P.dishes = o.dishes.map(hydrate);
    if (Array.isArray(o.breaks) && o.breaks.length) P.breaks = o.breaks;
    if (o.general) P.general = { ...P.general, ...o.general };
    saveBreaks(); renderBreaks(); renderGeneral();
    P.savedAt = o.savedAt ? new Date(o.savedAt) : null; P.dirty = false; renderSaveState();
    await openDish(Math.min(Math.max(0, dish >= 0 ? dish : o.cur | 0), P.dishes.length - 1));
    setMsg(`${DS.list.length > 1 ? `Датасет «${dsName()}»` : "Открыта сохранённая работа"}: чашек ${P.dishes.length}. ` + summary(D()), !D().items.length);
    return true;
  } catch { return false; }
}


// Скачивание файла: в окне Claude – через разрешение «downloads», в обычном браузере – ссылкой
const dlP = window.claude && window.claude.use ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
// Если сайт открыт по ссылке не участником организации, платформа скачивание запрещает –
// тогда пробуем обычную ссылку браузера и подсказываем, что делать, если файл так и не появился
const NO_DL = "Если файл не скачался: скачивание с этой страницы разрешено только участникам организации. " +
  "Таблицу можно перенести кнопкой «Копировать таблицу» и вставить в Excel (Ctrl+V), а для полной работы – открыть сайт файлом index.html на своём компьютере.";
async function saveFile(name, blob) {
  const dl = await dlP;
  if (dl) {
    try { await dl.save({ filename: name, data: blob }); return true; }
    catch (e) {
      if (e && e.code === "declined") { setMsg("Скачивание отменено."); return false; }
      linkDownload(name, blob);
      setMsg(NO_DL, true);
      return false;
    }
  }
  linkDownload(name, blob);
  return true;
}
function linkDownload(name, blob) {
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch {}
}
const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
function dataURLToBlob(u) {
  const [head, b64] = u.split(","), bin = atob(b64), a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: (head.match(/data:([^;]+)/) || [])[1] || "image/jpeg" });
}
async function saveProject() {
  if (!P.dishes.length) return setMsg("Нет чашек для сохранения.", true);
  setMsg("Собираю файл проекта…");
  const dishes = [];
  for (const d of P.dishes) dishes.push({ ...pick(d), img: await blobToDataURL(d.img) });
  const json = JSON.stringify({ app: "zona-ingibirovaniya", v: 5, cur: P.cur, dishes, breaks: P.breaks, general: P.general });
  if (await saveFile(`${DS.list.length > 1 ? dsName().replace(/[\\/:*?"<>|]/g, "-") : "Зоны ингибирования"} ${today()}.json`, new Blob([json], { type: "application/json" })))
    setMsg(`Файл проекта готов: чашек ${dishes.length}.`);
}
async function openProject(f) {
  if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    if (!o || o.app !== "zona-ingibirovaniya" || !Array.isArray(o.dishes)) throw 0;
    dropSample();
    const start = P.dishes.length;
    for (const x of o.dishes) P.dishes.push(hydrate({ ...x, img: dataURLToBlob(x.img) }));
    // пороги из файла добавляются к своим; при совпадении препарата берутся из файла
    for (const b of Array.isArray(o.breaks) ? o.breaks : []) {
      const own = P.breaks.find(x => normDrug(x.drug) === normDrug(b.drug));
      if (own) Object.assign(own, b); else P.breaks.push({ ...b });
    }
    if (o.general) P.general = { ...P.general, ...o.general };
    saveBreaks(); renderBreaks(); renderGeneral();
    markDirty();
    await openDish(start);
    setMsg(`Из файла добавлено чашек: ${o.dishes.length}.`);
  } catch {
    setMsg("Это не файл проекта. Нужен файл .json, скачанный кнопкой «Скачать проект».", true);
  }
}
