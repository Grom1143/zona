// МикроТест Вижн – СТРАНИЦЫ ВЫБОРА: датасеты (обложки, разметка, прогресс), блоки F:1–F:3, адреса (#m=, #ds=),
// категории со своей палитрой цвета, фильтр, порядок датасетов. Подключается после core.js.
// ----- датасеты: отдельные наборы чашек (например, своя лаборатория – свой датасет) -----
// Сайт открывается со стартовой страницы «Датасеты»: карточки с фото, названием и описанием; «Открыть» – работа с чашками,
// кнопка «▤ Датасеты» в шапке – назад к выбору. Каждый датасет – отдельная запись в IndexedDB: самый первый – «project»
// (его же открывает телефонная версия и APK), новые – «project:<id>». Список (название, описание, число чашек, время,
// миниатюры) – запись «datasets»: стартовой странице хватает его, фото целиком она не читает
const DS = { list: [], cur: "project" };
const dsKey = id => id === "project" ? "project" : "project:" + id;
const dsName = () => (DS.list.find(x => x.id === DS.cur) || {}).name || "Мой датасет";
const atHome = () => document.body.classList.contains("at-home");
function renderDsBtn() {
  $("dsBtnName").textContent = dsName();
  $("dsBtn").setAttribute("aria-label", `Датасет «${dsName()}» – к выбору датасетов`);
  $("dsBtn").title = `Датасет «${dsName()}». Нажмите, чтобы вернуться к выбору датасетов`;
}
const dsPut = () => idbDo("readwrite", s => s.put(DS.list, "datasets")).catch(() => {});
async function dsLoadList() {
  const cats = await idbDo("readonly", s => s.get("dscats")).catch(() => null);
  DS.cats = Array.isArray(cats) ? cats.filter(c => c && c.id && c.name) : [];
  let list = await idbDo("readonly", s => s.get("datasets")).catch(() => null);
  if (!Array.isArray(list)) {        // сохранение из времён до датасетов становится первым датасетом
    list = [];
    const o = await idbDo("readonly", s => s.get("project")).catch(() => null);
    if (o && Array.isArray(o.dishes) && o.dishes.length) list.push({ id: "project", name: "Мой датасет", count: o.dishes.length, savedAt: o.savedAt || Date.now() });
  }
  DS.list = list.filter(x => x && typeof x.id === "string");
  // у датасетов, сохранённых до обложек с разметкой, превью и разметку собираем один раз из самой записи
  let fixed = false;
  for (const x of DS.list) {
    if (x.v === 3) continue;
    const o = await idbDo("readonly", s => s.get(dsKey(x.id))).catch(() => null), th = [];
    for (const d of o && Array.isArray(o.dishes) ? o.dishes : []) {
      const old = x.v === 2 && Array.isArray(x.thumbs) ? x.thumbs[th.length] : null;   // превью уже есть – не пересчитываем
      const prev = old && old[0] || d.prev || (d.img ? await prevFromBlob(d.img instanceof ArrayBuffer ? new Blob([d.img], { type: d.imgType || "image/jpeg" }) : d.img) : "") || d.thumb || "";
      th.push([prev, d.name || "", markOf(hydrate({ ...d, img: null }))]);
    }
    x.thumbs = th; x.count = th.length; x.v = 3; delete x.thumb; fixed = true;
  }
  if (fixed) await dsPut();
}
// дождаться текущей записи и сохранить несохранённое – перед сменой датасета
async function dsFlush() {
  for (let i = 0; i < 100 && saving; i++) await new Promise(r => setTimeout(r, 50));
  if (P.dirty) await saveBrowser(true);
}
// Адрес страницы показывает, где мы: …/zona/ – выбор датасетов, …/zona/#ds=<id>&c=<номер чашки> – открыт датасет.
// Часть после # остаётся в браузере (сервер её не видит), поэтому страница та же, а F5, закладка, ссылка
// и кнопки браузера «Назад/Вперёд» сами попадают туда, где были
// Три уровня: …/zona/ – блоки F:1–F:3; …/zona/#m=ab – датасеты блока «Антибиотикорезистентность»; #ds=… – открыт датасет
function routeOf() {
  const h = location.hash, m = /[#&]ds=([^&#]+)/.exec(h), c = /[#&]c=(\d+)/.exec(h), b = /[#&]m=([^&#]+)/.exec(h);
  let id = null;
  try { id = m ? decodeURIComponent(m[1]) : null; } catch {}
  return { id, dish: c ? +c[1] - 1 : -1, m: b ? b[1] : null };
}
// id – датасет; null – список датасетов (#m=ab); "methods" – выбор блока (адрес без #)
function setRoute(id, dish, push) {
  const base = location.pathname + location.search,
    url = base + (id === "methods" ? "" : id ? `#ds=${encodeURIComponent(id)}${dish >= 0 ? `&c=${dish + 1}` : ""}` : "#m=ab");
  if (url === base + location.hash) return;
  try { history[push ? "pushState" : "replaceState"](null, "", url); } catch {}   // в песочнице (artifact) история может быть запрещена
}
const dsKnown = id => !!id && (id === "project" || DS.list.some(x => x.id === id));
const atMethods = () => document.body.classList.contains("at-methods");
window.addEventListener("popstate", () => {
  const r = routeOf();
  if (dsKnown(r.id)) { if (atHome() || r.id !== DS.cur) dsOpen(r.id, r.dish, true); else if (r.dish >= 0 && r.dish !== P.cur && r.dish < P.dishes.length) openDish(r.dish); }
  else if (r.m || r.id) { if (r.id) setRoute(null, -1, false); if (!atHome() || atMethods()) showHome(true); }   // неизвестный датасет – адрес на список
  else if (!atMethods()) showMethods(true);
});
// открыть датасет (dish – номер чашки, если нажали на её фото; fromRoute – пришли по адресу, адрес уже верный)
async function dsOpen(id, dish = -1, fromRoute = false) {
  await dsFlush();
  DS.cur = id;
  if (!fromRoute) setRoute(id, dish, true);
  try { localStorage.setItem("zona-dataset", id); } catch {}
  clearTimeout(saveTimer);
  P.dishes = []; P.cur = -1; P.sel = -1; P.trash = []; P.drag = null; P.calib = null; P.dirty = false; P.savedAt = null;
  document.body.classList.remove("at-home", "at-methods"); $("home").hidden = true;
  setMode("idle"); renderDsBtn(); fitCanvas();
  if (!(await loadBrowser(id, dish))) {
    renderSaveState(); fillMeta(); renderDishes(); render();
    setMsg(`Датасет «${dsName()}»: чашек пока нет – добавьте фото плиткой «+ Добавить фото» или перетащите их на окно.`);
  }
  window.scrollTo(0, 0);
}
async function showHome(fromRoute = false) {
  await dsFlush();
  if (!fromRoute) setRoute(null, -1, true);
  await dsLoadList();
  document.body.classList.remove("at-methods"); document.body.classList.add("at-home"); $("home").hidden = false;
  renderHome(); window.scrollTo(0, 0);
}
// ----- блоки программы (первая страница): F:1 работает, F:2 и F:3 – «Скоро» -----
// Названия – от заказчицы (17.10.2026); переименовать – здесь
const METHODS = [
  { id: "ab", n: 1, name: "Антибиотикорезистентность", sub: "Диско-диффузионный метод: зоны подавления роста вокруг дисков с антибиотиками", ready: true },
  { id: "col", n: 2, name: "Подсчёт колоний на чашках Петри", sub: "Сколько колоний выросло на чашке", ready: false },
  { id: "area", n: 3, name: "Определение площади культур", sub: "Какую часть чашки занимает рост культуры", ready: false },
];
function renderMethods() {
  const dishes = DS.list.reduce((t, x) => t + (x.count || 0), 0);
  $("methodList").innerHTML = METHODS.map(m =>
    `<button class="m-tile${m.ready ? "" : " soon"}" type="button" data-m="${m.id}"${m.ready ? "" : ` aria-disabled="true" title="Блок в разработке"`}>` +
      `<span class="m-n">F:${m.n}</span><span class="m-name">${esc(m.name)}</span><span class="m-sub">${esc(m.sub)}</span>` +
      `<span class="m-foot">${m.ready ? `${DS.list.length} ${dsWord(DS.list.length)} · ${dishes} ${dishWord(dishes)}` : "Скоро"}</span>` +
    `</button>`).join("");
}
const dsWord = n => n % 10 === 1 && n % 100 !== 11 ? "датасет" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "датасета" : "датасетов";
async function showMethods(fromRoute = false) {
  await dsFlush();
  if (!fromRoute) setRoute("methods", -1, true);
  await dsLoadList();
  document.body.classList.add("at-home", "at-methods"); $("home").hidden = false;
  renderMethods(); window.scrollTo(0, 0);
}
$("methodList").addEventListener("click", e => {
  const t = e.target.closest("[data-m]");
  if (t && t.dataset.m === "ab") showHome();
});
$("toMethods").addEventListener("click", () => showMethods());
const dsWhen = t => new Date(t).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
let dsLast = null;
try { dsLast = localStorage.getItem("zona-dataset"); } catch {}
function renderHome() {
  const L = DS.list, F = L.filter(dsPass);
  renderCats();
  $("homeList").innerHTML = L.length ? F.map(x => {
    const th = x.thumbs || [], recent = x.id === DS.cur;
    const photos = th.length ?
      `<button class="ds-cover" type="button" data-open="${esc(x.id)}" data-dish="0" aria-label="Открыть датасет ${esc(x.name)}: фото 1 из ${th.length} – ${esc(th[0][1])}">` +
        `<img src="${th[0][0]}" alt="" draggable="false">` + coverSvg(th[0][2]) +
        `<span class="ds-bars" aria-hidden="true">${th.map((t, i) => `<i class="b-${workOf(t[2]).st}${i ? "" : " on"}"></i>`).join("")}</span>` +
        `<span class="ds-cap" aria-hidden="true">${capOf(th, 0)}</span>` +
      `</button>` : `<p class="ds-empty">Фото пока нет</p>`;
    // объём работы: сколько фото готово, сколько зон ждёт проверки, сколько фото ещё без разметки
    const W = th.map(t => workOf(t[2])), done = W.filter(w => w.st === "done").length, chk = W.reduce((a, w) => a + w.chk, 0),
      empty = W.filter(w => w.st === "empty").length, zones = W.reduce((a, w) => a + w.zones, 0);
    const work = th.length ? `<div class="ds-work"><div class="ds-prog" role="img" aria-label="Готово ${done} из ${th.length} фото">` +
        `<i class="p-done" style="width:${done / th.length * 100}%"></i><i class="p-chk" style="width:${(th.length - done - empty) / th.length * 100}%"></i></div>` +
        `<span><b>Готово ${done} из ${th.length} ${photosWord(th.length)}</b> · ${zones} ${zonesWord(zones)}` +
        (chk ? ` · <em class="st-chk">проверить ${chk}</em>` : "") + (empty ? ` · <em class="st-empty">без разметки ${empty} ${photosWord(empty)}</em>` : "") +
        (done === th.length ? ` · <em class="st-done">всё готово ✓</em>` : "") + `</span></div>` : "";
    const desc = x.desc ? `<details class="ds-desc"><summary>Описание</summary><p>${esc(x.desc)}</p>` +
      `<button class="linkbtn" type="button" data-desc="${esc(x.id)}">✎ Изменить описание</button></details>` :
      `<button class="linkbtn ds-adddesc" type="button" data-desc="${esc(x.id)}">+ Добавить описание</button>`;
    return `<article class="ds-card${recent ? " recent" : ""}" data-id="${esc(x.id)}">` +
      `<div class="ds-top"><div class="ds-title"><h3 class="ds-nm">${esc(x.name)}</h3>` +
      `<span class="ds-ct">${x.count || 0} ${dishWord(x.count || 0)} · ${dsWhen(x.savedAt)}${recent ? " · <b>открывали последним</b>" : ""}</span></div>` +
      `<button class="btn icon" type="button" data-ren="${esc(x.id)}" title="Переименовать" aria-label="Переименовать ${esc(x.name)}">✎</button>` +
      `<button class="btn icon ds-del" type="button" data-del="${esc(x.id)}" title="Удалить датасет" aria-label="Удалить датасет ${esc(x.name)}">×</button></div>` +
      `${catsRow(x)}${photos}${work}${desc}` +
      `<button class="btn primary ds-go" type="button" data-open="${esc(x.id)}"${DS.edit ? " disabled" : ""}>Открыть</button>` +
      // номер датасета: обычно – мелко и серым; в режиме «Порядок» – поле, вписал 5 – датасет встал пятым
      (DS.edit ? `<label class="ds-no">№ <input type="number" min="1" max="${L.length}" value="${L.indexOf(x) + 1}" data-num="${esc(x.id)}" aria-label="Номер датасета ${esc(x.name)}"></label>` :
        `<span class="ds-no">№ ${L.indexOf(x) + 1}</span>`) + `</article>`;
  }).join("") : `<div class="ds-none"><p>Датасетов пока нет. Создайте первый на панели «Новый датасет» – или посмотрите, как работает программа, на искусственной чашке.</p>` +
    `<button class="btn" type="button" id="homeSample">◎ Открыть пример</button></div>`;
  if (L.length && !F.length) $("homeList").innerHTML = `<div class="ds-none"><p>Нет датасетов с выбранными категориями.</p>` +
    `<button class="btn" type="button" id="homeAll">Показать все датасеты</button></div>`;
}
// Разметка для обложки: размер фото и зоны – [x, y, R] для круга или [путь SVG] для контура + состояние:
// chk – надо проверить (оранжевая), auto – найдена программой, man – поправлена вручную, none – диск без зоны.
// Цвета – как в окне разметки
const ZCOL = { chk: "#ff9a62", auto: "#3ff0cf", man: "#ffc845", none: "#b8c4cc" };
const zState = it => needsCheck(it) ? "chk" : it.src === "none" ? "none" : it.src === "auto" ? "auto" : "man";
function markOf(d) {
  const z = (d.items || []).map(it => {
    if (it.pts) {
      const line = outline(it.pts).filter((_, i) => i % 2 === 0);
      return ["M" + line.map(q => `${Math.round(q.x)} ${Math.round(q.y)}`).join("L") + "Z", zState(it)];
    }
    const c = center(it);
    return [Math.round(c.x), Math.round(c.y), Math.round(diamPx(it) / 2), zState(it)];
  });
  return { w: d.w, h: d.h, z };
}
// сколько работы: фото готово – есть зоны и ни одна не ждёт проверки
function workOf(m) {
  const z = m && m.z || [], chk = z.filter(q => q[q.length - 1] === "chk").length;
  return { zones: z.length, chk, st: !z.length ? "empty" : chk ? "chk" : "done" };
}
const zonesWord = n => n % 10 === 1 && n % 100 !== 11 ? "зона" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "зоны" : "зон";
const photosWord = n => n % 10 === 1 && n % 100 !== 11 ? "фото" : "фото";
function coverSvg(m, k = 160) {
  if (!m || !m.w || !m.z.length) return "";
  const sw = Math.max(m.w, m.h) / k;            // толщина линии ~ одинаковая на любом фото (на маленькой миниатюре – k меньше, линия толще)
  return `<svg class="ds-marks" viewBox="0 0 ${m.w} ${m.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` + m.z.map(q => {
    const st = q[q.length - 1], col = ZCOL[st] || ZCOL.auto;
    const shape = q.length === 2 ? `<path d="${q[0]}"` : `<circle cx="${q[0]}" cy="${q[1]}" r="${q[2]}"`;
    return `${shape} fill="none" stroke="rgba(0,0,0,.55)" stroke-width="${sw * 2}"/>` +
      `${shape} fill="${st === "chk" ? "rgba(255,154,98,.18)" : "none"}" stroke="${col}" stroke-width="${sw}"${st === "auto" ? ` stroke-dasharray="${sw * 3} ${sw * 2}"` : ""}/>`;
  }).join("") + `</svg>`;
}
function capOf(th, i) {
  const w = workOf(th[i][2]);
  const tag = w.st === "empty" ? `<em class="st-empty">без разметки</em>` : w.st === "chk" ? `<em class="st-chk">${w.zones} ${zonesWord(w.zones)} · проверить ${w.chk}</em>` :
    `<em class="st-done">✓ ${w.zones} ${zonesWord(w.zones)}</em>`;
  return `<b>${i + 1} / ${th.length}</b> ${esc(th[i][1])} ${tag}`;
}
// обложка: показать i-е фото датасета (курсор над левой частью – первые фото, над правой – последние; ← → с клавиатуры)
function coverShow(cv, i) {
  const x = DS.list.find(d => d.id === cv.dataset.open), th = x && x.thumbs || [];
  if (!th.length) return;
  i = Math.max(0, Math.min(th.length - 1, i));
  if (+cv.dataset.dish === i) return;
  cv.dataset.dish = i;
  cv.querySelector("img").src = th[i][0];
  const old = cv.querySelector(".ds-marks"), svg = coverSvg(th[i][2]);
  if (old) old.remove();
  if (svg) cv.querySelector("img").insertAdjacentHTML("afterend", svg);
  cv.querySelectorAll(".ds-bars i").forEach((b, k) => b.classList.toggle("on", k === i));
  cv.querySelector(".ds-cap").innerHTML = capOf(th, i);
  cv.setAttribute("aria-label", `Открыть датасет ${x.name}: фото ${i + 1} из ${th.length} – ${th[i][1]}`);
}
$("homeList").addEventListener("pointermove", e => {
  const cv = e.target.closest(".ds-cover");
  if (!cv || e.pointerType !== "mouse") return;
  const r = cv.getBoundingClientRect(), n = cv.querySelectorAll(".ds-bars i").length || 1;
  coverShow(cv, Math.floor((e.clientX - r.left) / r.width * n));
});
// курсор ушёл с фото – снова первое
$("homeList").addEventListener("pointerout", e => {
  const cv = e.target.closest(".ds-cover");
  if (cv && !cv.contains(e.relatedTarget)) coverShow(cv, 0);
});
$("homeList").addEventListener("keydown", e => {
  const cv = e.target.closest(".ds-cover");
  if (!cv || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
  e.preventDefault();
  coverShow(cv, +cv.dataset.dish + (e.key === "ArrowLeft" ? -1 : 1));
});
// видимость разметки на обложках – ползунок на панели; запоминается в этом браузере
function homeVis(v, keep) {
  v = Math.max(0, Math.min(100, Math.round(+v || 0)));
  $("homeVis").value = v; $("homeVisOut").value = v + " %";
  document.documentElement.style.setProperty("--mk-op", v / 100);   // и на обложках, и на миниатюрах чашек
  if (keep) try { localStorage.setItem("zona-home-vis", v); } catch {}
}
$("homeVis").addEventListener("input", () => homeVis($("homeVis").value, true));
try { const v = parseInt(localStorage.getItem("zona-home-vis"), 10); homeVis(v >= 0 && v <= 100 ? v : 100); } catch { homeVis(100); }
async function dsStart() {
  await dsLoadList();
  DS.cur = DS.list.some(x => x.id === dsLast) ? dsLast : DS.list.length ? DS.list[0].id : "project";
  renderDsBtn();
  // в адресе есть датасет (F5, закладка, ссылка) – сразу он; #m=ab или неизвестный датасет – список датасетов; пусто – блоки
  const r = routeOf();
  if (dsKnown(r.id)) return dsOpen(r.id, r.dish, true);
  if (r.id) setRoute(null, -1, false);
  if (r.m || r.id) return showHome(true);
  await showMethods(true);
}
$("dsBtn").addEventListener("click", () => showHome());   // браузерная «Назад» делает то же самое
// редактор прямо в карточке: название (одна строка) или описание (несколько строк)
function dsEdit(card, x, field) {
  const multi = field === "desc", inp = document.createElement(multi ? "textarea" : "input");
  inp.className = multi ? "ds-desc-edit" : "ds-rename"; inp.value = x[field] || "";
  inp.maxLength = multi ? 1000 : 60; if (multi) inp.rows = 4;
  inp.placeholder = multi ? "Например: лаборатория, кто делает, культуры, среда, даты посева" : "Название";
  inp.setAttribute("aria-label", multi ? "Описание датасета" : "Название датасета");
  const box = document.createElement("div"); box.className = "ds-editbox";
  box.innerHTML = `<div class="row"><button class="btn primary" type="button" data-ok>Сохранить</button><button class="btn" type="button" data-no>Отмена</button></div>`;
  box.prepend(inp);
  const place = multi ? (card.querySelector(".ds-desc") || card.querySelector(".ds-adddesc")) : card.querySelector(".ds-title");
  place.replaceWith(box); inp.focus(); inp.select();
  const finish = async ok => {
    const v = inp.value.trim();
    if (ok && (v || multi) && v !== (x[field] || "")) {
      if (v) x[field] = v; else delete x[field];
      await dsPut(); renderDsBtn();
    }
    renderHome();
    if (multi && ok && v) { const d = $("homeList").querySelector(`[data-id="${CSS.escape(x.id)}"] .ds-desc`); if (d) d.open = true; }
  };
  box.querySelector("[data-ok]").addEventListener("click", () => finish(true));
  box.querySelector("[data-no]").addEventListener("click", () => finish(false));
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter" && (!multi || e.ctrlKey)) { e.preventDefault(); finish(true); }
    if (e.key === "Escape") { e.preventDefault(); finish(false); }
  });
}
$("homeList").addEventListener("click", e => {
  if (e.target.closest("#homeSample")) return dsOpen("project").then(loadSample);
  if (e.target.closest("#homeAll")) { DS.filter = []; saveFilter(); return renderHome(); }
  const open = e.target.closest("[data-open]");
  if (open) return DS.edit ? undefined : dsOpen(open.dataset.open, open.dataset.dish ? +open.dataset.dish : -1);   // в режиме «Порядок» не открываем
  const card = e.target.closest(".ds-card");
  const x = card && DS.list.find(d => d.id === card.dataset.id);
  if (!x) return;
  if (e.target.closest("[data-ren]")) return dsEdit(card, x, "name");
  if (e.target.closest("[data-desc]")) return dsEdit(card, x, "desc");
  const del = e.target.closest("[data-del]");
  if (!del) return;
  if (!del.classList.contains("arm")) {         // первое нажатие: × → «Удалить навсегда?»; 3 с без нажатия – снова ×
    for (const b of $("homeList").querySelectorAll(".ds-del.arm")) { b.classList.remove("arm"); b.textContent = "×"; }
    del.classList.add("arm"); del.textContent = "Удалить навсегда?";
    del.title = `Нажмите ещё раз: датасет «${x.name}» (${x.count || 0} ${dishWord(x.count || 0)}) удалится из браузера без возврата`;
    setTimeout(() => { if (del.isConnected) { del.classList.remove("arm"); del.textContent = "×"; del.title = "Удалить датасет"; } }, 3000);
    return;
  }
  (async () => {
    DS.list = DS.list.filter(d => d.id !== x.id);
    try { await idbDo("readwrite", s => { s.put(DS.list, "datasets"); return s.delete(dsKey(x.id)); }); } catch {}
    if (x.id === DS.cur) { DS.cur = DS.list.length ? DS.list[0].id : "project"; renderDsBtn(); }
    renderHome();
  })();
});
// ----- категории датасетов: свои названия и свои цвета, фильтр на панели -----
// Список категорий – запись «dscats» в IndexedDB: { id, name, color }; у датасета – x.cats = [id, …].
// Фильтр: выбраны категории – видны датасеты, у которых есть хотя бы одна из них; выбор запоминается в браузере
DS.cats = []; DS.filter = [];
try { const v = JSON.parse(localStorage.getItem("zona-home-filter")); if (Array.isArray(v)) DS.filter = v; } catch {}
const catsPut = () => idbDo("readwrite", s => s.put(DS.cats, "dscats")).catch(() => {});
const catOf = id => DS.cats.find(c => c.id === id);
const dsCats = x => (x.cats || []).filter(catOf);
const dsPass = x => { const on = DS.filter.filter(catOf); return !on.length || dsCats(x).some(id => on.includes(id)); };
function saveFilter() { try { localStorage.setItem("zona-home-filter", JSON.stringify(DS.filter)); } catch {} }
// подпись на цветной метке – тёмная на светлом цвете и белая на тёмном (по яркости цвета)
function inkOn(hex) {
  const n = parseInt(String(hex).slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#14191d" : "#ffffff";
}
const chip = c => `<span class="cat-chip" style="--cc:${esc(c.color)};--ci:${inkOn(c.color)}">${esc(c.name)}</span>`;
// новая категория – случайный приятный оттенок, пользователь меняет его на свой
function randColor() {
  const h = Math.floor(Math.random() * 360), s = 0.62, l = 0.55, a = s * Math.min(l, 1 - l);
  const f = k => { const t = (k + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(t - 3, 9 - t, 1)))).toString(16).padStart(2, "0"); };
  return "#" + f(0) + f(8) + f(4);
}
// метки на карточке + «+ категория»: список с галочками, поставить / снять
function catsRow(x) {
  const mine = dsCats(x);
  const menu = DS.cats.length ? DS.cats.map(c =>
    `<label class="cat-opt"><input type="checkbox" data-cat="${esc(c.id)}"${mine.includes(c.id) ? " checked" : ""}>${chip(c)}</label>`).join("") :
    `<p class="cat-hint">Категорий пока нет – создайте на панели справа («Категории»).</p>`;
  return `<div class="ds-cats">${mine.map(id => chip(catOf(id))).join("")}` +
    `<details class="cat-pick"><summary title="Поставить или снять категории">${mine.length ? "✎" : "+ категория"}</summary><div class="cat-menu">${menu}</div></details></div>`;
}
// панель: категории (нажатие – фильтр), цвет меняется кружком, ✎ – название, × – удалить; внизу – новая категория
function renderCats() {
  const on = DS.filter.filter(catOf), cnt = id => DS.list.filter(x => dsCats(x).includes(id)).length;
  $("catList").innerHTML = DS.cats.length ? DS.cats.map(c =>
    `<li class="cat-row${on.includes(c.id) ? " on" : ""}" data-cid="${esc(c.id)}">` +
      `<button class="cat-color" type="button" data-color="${esc(c.id)}" style="--cc:${esc(c.color)}" title="Свой цвет" aria-label="Цвет категории ${esc(c.name)}"></button>` +
      `<button class="cat-filter" type="button" data-filter="${esc(c.id)}" aria-pressed="${on.includes(c.id)}" title="${on.includes(c.id) ? "Убрать из фильтра" : "Показать только датасеты с этой категорией"}">` +
        `${chip(c)}<span class="cat-n">${cnt(c.id)}</span></button>` +
      `<button class="btn icon" type="button" data-cren="${esc(c.id)}" title="Переименовать" aria-label="Переименовать категорию ${esc(c.name)}">✎</button>` +
      `<button class="btn icon cat-del" type="button" data-cdel="${esc(c.id)}" title="Удалить категорию" aria-label="Удалить категорию ${esc(c.name)}">×</button></li>`).join("") :
    `<li class="cat-hint">Категорий пока нет</li>`;
  $("catReset").hidden = !on.length;
  if (!$("catColor").dataset.value) setNewColor(freeColor());
}
function setNewColor(c) { $("catColor").dataset.value = c; $("catColor").style.setProperty("--cc", c); }
// цвета не повторяются: «похожий» – ближе 60 по расстоянию в RGB
const rgbOf = hex => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const colorDist = (a, b) => { const p = rgbOf(a), q = rgbOf(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
const colorTaken = (hex, skipId) => DS.cats.find(c => c.id !== skipId && colorDist(c.color, hex) < 60);
function freeColor() { let c = randColor(); for (let i = 0; i < 40 && colorTaken(c); i++) c = randColor(); return c; }
const catText = c => `${c.name} (${DS.list.filter(x => dsCats(x).includes(c.id)).length})`;
$("catNew").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("catName").value.trim(), color = $("catColor").dataset.value;
  if (!name) return $("catName").focus();
  if (DS.cats.some(c => c.name.toLowerCase() === name.toLowerCase())) return catNote(`Категория «${name}» уже есть`);
  const same = colorTaken(color);
  if (same) return catNote(`Цвет похож на «${same.name}» – выберите другой`);
  DS.cats.push({ id: newId(), name, color });
  await catsPut();
  $("catName").value = ""; delete $("catColor").dataset.value;
  renderHome();
});
// короткая подсказка под строкой новой категории (сама исчезает)
let catNoteT = 0;
function catNote(t) {
  let p = $("catNew").nextElementSibling;
  if (!p || !p.classList.contains("cat-note")) { p = document.createElement("p"); p.className = "cat-note"; $("catNew").after(p); }
  p.textContent = t; clearTimeout(catNoteT); catNoteT = setTimeout(() => p.remove(), 3500);
}
$("catColor").addEventListener("click", () => cpOpen($("catColor"), $("catColor").dataset.value, null,
  c => $("catColor").style.setProperty("--cc", c), c => setNewColor(c)));
$("catReset").addEventListener("click", () => { DS.filter = []; saveFilter(); renderHome(); });
// цвет категории: пока настраивают в палитре – меняется сразу на всех метках; закрыли палитру – сохраняется
function paintCat(c, color) {
  for (const el of document.querySelectorAll(".cat-chip")) if (el.textContent === c.name) { el.style.setProperty("--cc", color); el.style.setProperty("--ci", inkOn(color)); }
  const sw = $("catList").querySelector(`[data-color="${CSS.escape(c.id)}"]`);
  if (sw) sw.style.setProperty("--cc", color);
}
$("catList").addEventListener("click", async e => {
  const sw = e.target.closest("[data-color]");
  if (sw) {
    const c = catOf(sw.dataset.color);
    return cpOpen(sw, c.color, c.id, col => paintCat(c, col), async col => { c.color = col; await catsPut(); renderHome(); }, () => paintCat(c, c.color));
  }
  const fl = e.target.closest("[data-filter]");
  if (fl) {
    const id = fl.dataset.filter;
    DS.filter = DS.filter.includes(id) ? DS.filter.filter(x => x !== id) : [...DS.filter.filter(catOf), id];
    saveFilter(); return renderHome();
  }
  const ren = e.target.closest("[data-cren]");
  if (ren) {
    const c = catOf(ren.dataset.cren), row = ren.closest(".cat-row"), btn = row.querySelector(".cat-filter");
    const inp = document.createElement("input");
    inp.className = "ds-rename"; inp.value = c.name; inp.maxLength = 40; inp.setAttribute("aria-label", "Название категории");
    btn.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const fin = async ok => {
      if (done) return; done = true;
      const v = inp.value.trim();
      if (ok && v && v !== c.name) { c.name = v; await catsPut(); }
      renderHome();
    };
    inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); fin(true); } if (ev.key === "Escape") { ev.preventDefault(); fin(false); } });
    inp.addEventListener("blur", () => fin(true));
    return;
  }
  const del = e.target.closest("[data-cdel]");
  if (!del) return;
  const c = catOf(del.dataset.cdel);
  if (!del.classList.contains("arm")) {          // × → «Удалить?»; у датасетов метка снимется, сами датасеты останутся
    del.classList.add("arm"); del.textContent = "Удалить?"; del.title = `Ещё раз – удалить категорию «${c.name}» (датасеты останутся)`;
    setTimeout(() => { if (del.isConnected) { del.classList.remove("arm"); del.textContent = "×"; del.title = "Удалить категорию"; } }, 3000);
    return;
  }
  DS.cats = DS.cats.filter(x => x.id !== c.id);
  DS.filter = DS.filter.filter(x => x !== c.id); saveFilter();
  for (const x of DS.list) if (x.cats) x.cats = x.cats.filter(id => id !== c.id);
  await catsPut(); await dsPut(); renderHome();
});
// галочки в карточке: поставить / снять категорию датасету
$("homeList").addEventListener("change", async e => {
  const cb = e.target.closest("[data-cat]");
  if (!cb) return;
  const card = cb.closest(".ds-card"), x = DS.list.find(d => d.id === card.dataset.id);
  if (!x) return;
  const id = cb.dataset.cat, set = new Set(dsCats(x));
  cb.checked ? set.add(id) : set.delete(id);
  x.cats = [...set];
  await dsPut();
  // метки обновляем на месте, меню остаётся открытым – удобно поставить несколько
  const row = card.querySelector(".ds-cats");
  row.querySelectorAll(":scope > .cat-chip").forEach(el => el.remove());
  row.insertAdjacentHTML("afterbegin", x.cats.map(cid => chip(catOf(cid))).join(""));
  row.querySelector(".cat-pick > summary").textContent = x.cats.length ? "✎" : "+ категория";
  const counts = DS.cats.map(c => [c.id, DS.list.filter(d => dsCats(d).includes(c.id)).length]);
  for (const [cid, n] of counts) { const el = $("catList").querySelector(`[data-filter="${CSS.escape(cid)}"] .cat-n`); if (el) el.textContent = n; }
});
// меню категорий закрывается кликом мимо него; если включён фильтр – карточка, которую больше не пропускает фильтр, уходит
document.addEventListener("click", e => {
  for (const d of document.querySelectorAll(".cat-pick[open]")) if (!d.contains(e.target)) {
    d.open = false;
    if (DS.filter.filter(catOf).length) renderHome();
  }
});
// ----- своя палитра цвета (вместо системного окна): квадрат «насыщенность × яркость», полоска оттенка, код цвета -----
// Всплывает у нажатого кружка; щелчок мимо или Enter – закрыть и оставить цвет; Esc – отменить.
// Цвет, похожий на цвет другой категории, не сохраняется: в палитре – предупреждение, при закрытии остаётся прежний
const CP = { h: 0, s: 1, v: 1, start: "", anchor: null, skip: null, onInput: null, onDone: null, onCancel: null };
function hsvToHex(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return "#" + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}
function hexToHsv(hex) {
  const [r, g, b] = rgbOf(hex).map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx };
}
const cpHex = () => hsvToHex(CP.h, CP.s, CP.v);
function cpPaint(fromHex) {
  const c = cpHex();
  $("cpSV").style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${CP.h} 100% 50%)`;
  $("cpDot").style.left = CP.s * 100 + "%"; $("cpDot").style.top = (1 - CP.v) * 100 + "%"; $("cpDot").style.background = c;
  $("cpKnob").style.left = CP.h / 360 * 100 + "%";
  $("cpPrev").style.background = c;
  if (!fromHex) $("cpHex").value = c;
  const same = colorTaken(c, CP.skip);
  $("cpWarn").hidden = !same; $("cpWarn").textContent = same ? `Похож на «${same.name}» – выберите другой` : "";
  $("cpick").classList.toggle("bad", !!same);
  if (CP.onInput) CP.onInput(c);
}
function cpPlace() {
  const a = CP.anchor.getBoundingClientRect(), el = $("cpick"), w = el.offsetWidth, hh = el.offsetHeight;
  let x = a.left + a.width / 2 - w / 2, y = a.bottom + 8;
  if (y + hh > innerHeight - 8) y = a.top - hh - 8;              // внизу не помещается – над кружком
  x = Math.max(8, Math.min(innerWidth - w - 8, x)); y = Math.max(8, y);
  el.style.left = x + "px"; el.style.top = y + "px";
}
function cpOpen(anchor, color, skip, onInput, onDone, onCancel) {
  if (!$("cpick").hidden) cpClose(true);
  Object.assign(CP, hexToHsv(color), { start: color, anchor, skip, onInput, onDone, onCancel });
  $("cpick").hidden = false; anchor.classList.add("picking");
  cpPaint(); cpPlace(); $("cpSV").focus({ preventScroll: true });
}
function cpClose(keep) {
  if ($("cpick").hidden) return;
  const c = cpHex(), ok = keep && !colorTaken(c, CP.skip);
  $("cpick").hidden = true; CP.anchor.classList.remove("picking");
  if (ok && c !== CP.start) CP.onDone && CP.onDone(c);
  else { if (CP.onInput) CP.onInput(CP.start); if (CP.onCancel) CP.onCancel(); if (keep && c !== CP.start) catNote("Такой цвет уже занят – оставлен прежний"); }
}
// тянуть по квадрату и полоске (мышь и палец)
function cpDrag(el, fn) {
  el.addEventListener("pointerdown", e => {
    e.preventDefault(); el.setPointerCapture(e.pointerId); fn(e);
    const mv = ev => fn(ev), up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up);
  });
}
const clamp01 = x => Math.max(0, Math.min(1, x));
cpDrag($("cpSV"), e => { const r = $("cpSV").getBoundingClientRect(); CP.s = clamp01((e.clientX - r.left) / r.width); CP.v = 1 - clamp01((e.clientY - r.top) / r.height); cpPaint(); });
cpDrag($("cpHue"), e => { const r = $("cpHue").getBoundingClientRect(); CP.h = clamp01((e.clientX - r.left) / r.width) * 359.9; cpPaint(); });
$("cpSV").addEventListener("keydown", e => {
  const k = { ArrowLeft: [-.04, 0], ArrowRight: [.04, 0], ArrowUp: [0, .04], ArrowDown: [0, -.04] }[e.key];
  if (k) { e.preventDefault(); CP.s = clamp01(CP.s + k[0]); CP.v = clamp01(CP.v + k[1]); cpPaint(); }
});
$("cpHue").addEventListener("keydown", e => {
  const k = { ArrowLeft: -6, ArrowRight: 6 }[e.key];
  if (k) { e.preventDefault(); CP.h = (CP.h + k + 360) % 360; cpPaint(); }
});
$("cpHex").addEventListener("input", () => {
  const v = $("cpHex").value.trim(), m = /^#?([0-9a-f]{6})$/i.exec(v);
  if (m) { Object.assign(CP, hexToHsv("#" + m[1].toLowerCase())); cpPaint(true); }
});
$("cpick").addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); cpClose(false); CP.anchor.focus(); }
  if (e.key === "Enter") { e.preventDefault(); cpClose(true); CP.anchor.focus(); }
});
// щелчок мимо палитры – закрыть, цвет остаётся (нажатие на тот же кружок тоже просто закрывает)
document.addEventListener("pointerdown", e => {
  if ($("cpick").hidden || $("cpick").contains(e.target)) return;
  if (CP.anchor.contains(e.target)) { e.preventDefault(); cpClose(true); CP.justClosed = Date.now(); return; }
  cpClose(true);
}, true);
document.addEventListener("click", e => { if (CP.justClosed && Date.now() - CP.justClosed < 400 && CP.anchor && CP.anchor.contains(e.target)) { e.stopImmediatePropagation(); e.preventDefault(); CP.justClosed = 0; } }, true);
addEventListener("resize", () => { if (!$("cpick").hidden) cpPlace(); });
addEventListener("scroll", () => { if (!$("cpick").hidden) cpPlace(); }, true);
// ----- порядок датасетов: режим «Порядок» – номер в поле или перетаскивание карточек -----
DS.edit = false;
function dsMove(id, to) {                         // to – новое место, с 0
  const from = DS.list.findIndex(x => x.id === id);
  to = Math.max(0, Math.min(DS.list.length - 1, to));
  if (from < 0 || from === to) return renderHome();
  DS.list.splice(to, 0, DS.list.splice(from, 1)[0]);
  dsPut(); renderHome();
  const inp = $("homeList").querySelector(`[data-num="${CSS.escape(id)}"]`);
  if (inp) { inp.closest(".ds-card").classList.add("moved"); inp.focus(); inp.select(); }
}
$("homeEdit").addEventListener("click", () => {
  DS.edit = !DS.edit;
  $("homeEdit").setAttribute("aria-pressed", DS.edit);
  $("homeEdit").textContent = DS.edit ? "✓ Готово" : "⇅ Порядок";
  $("home").classList.toggle("editing", DS.edit);
  renderHome();
});
// номер: Enter или ушли из поля – переставить
$("homeList").addEventListener("change", e => {
  const inp = e.target.closest("[data-num]");
  if (inp) { const v = parseInt(inp.value, 10); if (v >= 1) dsMove(inp.dataset.num, v - 1); else renderHome(); }
});
$("homeList").addEventListener("keydown", e => {
  const inp = e.target.closest("[data-num]");
  if (inp && e.key === "Enter") { e.preventDefault(); inp.dispatchEvent(new Event("change", { bubbles: true })); }
});
// перетаскивание карточки (только в режиме «Порядок»): карточка едет за курсором, остальные расступаются;
// отпустили – порядок из страницы переносится в список (при фильтре – только среди видимых, на их места)
const cd = { t: null };
$("homeList").addEventListener("pointerdown", e => {
  if (!DS.edit || e.button !== 0) return;
  const card = e.target.closest(".ds-card");
  if (!card || e.target.closest("input, summary, label, details, button:not(.ds-cover)")) return;   // за фото тоже можно тянуть
  const r = card.getBoundingClientRect();
  cd.t = { card, id: e.pointerId, gx: e.clientX - r.left, gy: e.clientY - r.top, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, on: false };
});
function cardPlace() {
  const t = cd.t, card = t.card;
  card.style.transform = "";
  const under = document.elementsFromPoint(t.x, t.y).map(el => el.closest && el.closest(".ds-card")).find(c => c && c !== card);
  if (under) {
    const u = under.getBoundingClientRect(), after = t.x > u.left + u.width / 2;
    const ref = after ? under.nextElementSibling : under;
    if (ref !== card && card.nextElementSibling !== ref) {
      const others = [...$("homeList").querySelectorAll(".ds-card")].filter(c => c !== card);
      const old = new Map(others.map(c => { const b = c.getBoundingClientRect(); return [c, [b.left, b.top]]; }));
      $("homeList").insertBefore(card, ref);
      for (const c of others) {
        const b = c.getBoundingClientRect(), [l, tp] = old.get(c);
        if (l !== b.left || tp !== b.top) c.animate([{ transform: `translate(${l - b.left}px, ${tp - b.top}px)` }, { transform: "none" }], { duration: 180, easing: "ease-out" });
      }
    }
  }
  const r = card.getBoundingClientRect();
  card.style.transform = `translate(${t.x - t.gx - r.left}px, ${t.y - t.gy - r.top}px) scale(1.02)`;
}
$("homeList").addEventListener("pointermove", e => {
  const t = cd.t;
  if (!t || e.pointerId !== t.id) return;
  t.x = e.clientX; t.y = e.clientY;
  if (!t.on) {
    if (Math.hypot(t.x - t.x0, t.y - t.y0) < 6) return;
    t.on = true; t.card.classList.add("lift"); $("homeList").classList.add("sorting");
    try { $("homeList").setPointerCapture(t.id); } catch (_) {}
    // у верхнего / нижнего края окна страница прокручивается сама – можно утащить карточку далеко
    const loop = () => {
      if (cd.t !== t) return;
      const v = t.y < 70 ? -16 : t.y > innerHeight - 70 ? 16 : 0;
      if (v) { const y0 = scrollY; scrollBy(0, v); if (scrollY !== y0) cardPlace(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  cardPlace();
});
function cardDrop() {
  const t = cd.t;
  cd.t = null;
  if (!t || !t.on) return;
  t.card.classList.remove("lift"); t.card.style.transform = ""; $("homeList").classList.remove("sorting");
  const ids = [...$("homeList").querySelectorAll(".ds-card")].map(c => c.dataset.id);
  const slots = DS.list.map((x, i) => ids.includes(x.id) ? i : -1).filter(i => i >= 0);
  const by = new Map(DS.list.map(x => [x.id, x]));
  slots.forEach((slot, k) => { DS.list[slot] = by.get(ids[k]); });
  dsPut(); renderHome();
}
$("homeList").addEventListener("pointerup", cardDrop);
$("homeList").addEventListener("pointercancel", cardDrop);
$("homeNew").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("homeName").value.trim() || `Датасет ${DS.list.length + 1}`, desc = $("homeDesc").value.trim();
  // самый первый датасет занимает запись «project» – её видит и телефонная версия
  const id = DS.list.some(x => x.id === "project") ? newId() : "project";
  const cats = DS.filter.filter(catOf);
  DS.list.push({ id, name, ...(desc ? { desc } : {}), ...(cats.length ? { cats } : {}), count: 0, savedAt: Date.now(), thumbs: [] });
  await dsPut();
  $("homeName").value = $("homeDesc").value = ""; document.querySelector(".hn-desc").open = false;
  await dsOpen(id);
});
