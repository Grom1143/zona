// МикроТест Вижн – БЛОК F:1 «Антибиотикорезистентность» (диско-диффузионный метод): категории S / I / R,
// названия антибиотиков, таблица и Excel, рисование разметки, мышь и палец, кнопки, редактор снимка.
// В конце – запуск страницы (dsStart). Подключается после core.js и home.js.
// ----- категории S / I / R -----
// Пороги диско-диффузионного метода из «Российских рекомендаций. Определение чувствительности микроорганизмов
// к антимикробным препаратам. Версия 2024-02» (МАКМАХ, по EUCAST). s – «Ч ≥», r – «Р <», atu – ЗТН [от, до],
// disk – содержание в диске; br – значения в таблице в скобках (применяются ограниченно, см. примечания таблицы).
// s = 50 в таблицах – «условное значение»: дикий тип такого микроорганизма относится к категории I, а не S.
const BP_SRC = "МАКМАХ 2024-02";
const BREAKPOINTS = {
  entero: { name: "Enterobacterales", table: "табл. 2.2", drugs: {
    AMP: { disk: "10", s: 14, r: 14, note: "ампициллин в/в" },
    AMC: { disk: "20–10", s: 19, r: 19, atu: [19, 20], note: "амоксициллин-клавуланат в/в" },
    TZP: { disk: "30–6", s: 20, r: 20, atu: [19, 19] },
    FEP: { disk: "30", s: 27, r: 24 },
    CTX: { disk: "5", s: 20, r: 17, note: "при всех инфекциях, кроме менингита" },
    CRO: { disk: "30", s: 25, r: 22, note: "при всех инфекциях, кроме менингита" },
    CAZ: { disk: "10", s: 22, r: 19 },
    IPM: { disk: "10", s: 22, r: 19, note: "кроме Morganellaceae" },
    MEM: { disk: "10", s: 22, r: 16, note: "при всех инфекциях, кроме менингита" },
    ETP: { disk: "10", s: 23, r: 23 },
    ATM: { disk: "30", s: 26, r: 21 },
    CIP: { disk: "5", s: 25, r: 22, atu: [22, 24], note: "при всех инфекциях, кроме менингита" },
    LEV: { disk: "5", s: 23, r: 19 },
    OFX: { disk: "5", s: 24, r: 22 },
    AK: { disk: "30", s: 18, r: 18, br: true, note: "системные инфекции" },
    CN: { disk: "10", s: 17, r: 17, br: true, note: "системные инфекции" },
    TOB: { disk: "10", s: 16, r: 16, br: true, note: "системные инфекции" },
    SXT: { disk: "1,25–23,75", s: 14, r: 11 },
  } },
  saureus: { name: "Staphylococcus aureus", table: "табл. 2.6", drugs: {
    P: { disk: "1 ЕД", s: 26, r: 26, note: "бензилпенициллин" },
    FOX: { disk: "30", s: 22, r: 22, note: "скрининг резистентности к оксациллину (MRSA)" },
    LEV: { disk: "5", s: 50, r: 22 },
    MXF: { disk: "5", s: 25, r: 25 },
    AK: { disk: "30", s: 15, r: 15, br: true },
    CN: { disk: "10", s: 18, r: 18, br: true },
    TOB: { disk: "10", s: 18, r: 18, br: true },
    E: { disk: "15", s: 21, r: 21 },
    DA: { disk: "2", s: 22, r: 22, note: "клиндамицин" },
    TE: { disk: "30", s: 22, r: 22 },
    TGC: { disk: "15", s: 19, r: 19 },
    LZD: { disk: "10", s: 21, r: 21 },
    C: { disk: "30", s: 18, r: 18 },
    FD: { disk: "10", s: 24, r: 24, note: "фузидовая кислота" },
    RD: { disk: "5", s: 26, r: 26, note: "рифампицин" },
    SXT: { disk: "1,25–23,75", s: 17, r: 14 },
  } },
  cons: { name: "Коагулазонегативные стафилококки", table: "табл. 2.6", drugs: {
    FOX: { disk: "30", s: 22, r: 22, note: "скрининг; у S. epidermidis и S. lugdunensis порог другой: 27 / 27, ЗТН 27" },
    LEV: { disk: "5", s: 50, r: 24 },
    MXF: { disk: "5", s: 28, r: 28 },
    AK: { disk: "30", s: 15, r: 15, br: true },
    CN: { disk: "10", s: 22, r: 22, br: true },
    TOB: { disk: "10", s: 20, r: 20, br: true },
    E: { disk: "15", s: 21, r: 21 },
    DA: { disk: "2", s: 22, r: 22, note: "клиндамицин" },
    TE: { disk: "30", s: 22, r: 22 },
    TGC: { disk: "15", s: 19, r: 19 },
    LZD: { disk: "10", s: 21, r: 21 },
    C: { disk: "30", s: 18, r: 18 },
    FD: { disk: "10", s: 24, r: 24, note: "фузидовая кислота" },
    RD: { disk: "5", s: 30, r: 30, note: "рифампицин" },
    SXT: { disk: "1,25–23,75", s: 17, r: 14 },
  } },
  paer: { name: "Pseudomonas aeruginosa", table: "табл. 2.3", drugs: {
    TZP: { disk: "30–6", s: 50, r: 18, atu: [18, 19] },
    FEP: { disk: "30", s: 50, r: 21 },
    CAZ: { disk: "10", s: 50, r: 17 },
    IPM: { disk: "10", s: 50, r: 20 },
    MEM: { disk: "10", s: 20, r: 14, note: "при всех инфекциях, кроме менингита" },
    ATM: { disk: "30", s: 50, r: 18 },
    CIP: { disk: "5", s: 50, r: 26 },
    LEV: { disk: "5", s: 50, r: 18 },
    AK: { disk: "30", s: 15, r: 15, br: true, note: "системные инфекции" },
    TOB: { disk: "10", s: 18, r: 18, br: true, note: "системные инфекции" },
  } },
  entc: { name: "Enterococcus spp.", table: "табл. 2.7", drugs: {
    AMP: { disk: "2", s: 10, r: 8 },
    IPM: { disk: "10", s: 50, r: 21 },
    LZD: { disk: "10", s: 20, r: 20 },
    VA: { disk: "5", s: 12, r: 12, note: "смотрите и на край зоны: нечёткий край – признак резистентности" },
    TEC: { disk: "30", s: 16, r: 16 },
  } },
};
// P.breaks – свои пороги: [{ drug: "CIP", s: 25, r: 22 }]; важнее табличных
const normDrug = s => String(s || "").trim().toUpperCase();
const breakOf = drug => P.breaks.find(b => b.drug && normDrug(b.drug) === normDrug(drug) && b.s > 0 && b.r > 0);
const CAT_TEXT = {
  S: "S (Ч) – чувствительный (стандартная доза): рост надёжно подавлен",
  I: "I (У) – чувствительный при повышенной экспозиции: рост подавлен частично",
  R: "R (Р) – резистентный: рост практически не подавлен",
};
// Правило для зоны: свои пороги препарата → строка таблицы для выбранного микроорганизма →
// общие пороги по размеру зоны для всех зон (по умолчанию S ≥ 22, R < 19 – как считала тётя)
function ruleOf(drug, d) {
  const own = drug && breakOf(drug);
  if (own) return { s: own.s, r: own.r, src: "свои пороги" };
  const g = BREAKPOINTS[d.meta.org], b = drug && g && g.drugs[normDrug(drug)];
  if (b) return { ...b, src: `${BP_SRC}, ${g.name}, ${g.table}` };
  const G = P.general;
  return G.on && G.s > 0 && G.r > 0 ? { s: G.s, r: G.r, src: "общие пороги по размеру зоны" } : null;
}
// Зона сравнивается с порогом с точностью до 1 мм (рекомендации, п. 2.7.1)
function categoryOf(it, d = D()) {
  const mpp = mmPerPx(d), rule = ruleOf(it.drug, d);
  if (!mpp || !rule) return null;
  const mm = Math.round(diamPx(it) * mpp);
  const cat = mm >= rule.s ? "S" : mm < rule.r ? "R" : "I";
  const atu = !!rule.atu && mm >= rule.atu[0] && mm <= rule.atu[1];
  return { cat, atu, mm, rule };
}
function saveBreaks() {
  try { localStorage.setItem("zona-breaks", JSON.stringify(P.breaks)); localStorage.setItem("zona-general", JSON.stringify(P.general)); } catch {}
}
function renderGeneral() {
  const G = P.general;
  $("gOn").checked = G.on; $("gS").value = G.s || ""; $("gR").value = G.r || "";
  $("generalBar").classList.toggle("off", !G.on);
}
function renderBreaks() {
  const n = P.breaks.filter(b => b.drug && b.s > 0 && b.r > 0).length;
  $("breaksCount").textContent = n ? `· заданы для ${n}` : "· не заданы";
  $("breaksTable").innerHTML = !P.breaks.length ? `<p class="empty">Порогов пока нет.</p>` :
    `<table><thead><tr><th>Препарат</th><th class="num">S, если зона ≥, мм</th><th class="num">R, если зона &lt;, мм</th><th></th></tr></thead><tbody>` +
    P.breaks.map((b, i) => `<tr><td><input data-b="${i}" data-k="drug" list="drugList" value="${esc(b.drug)}" placeholder="CIP" aria-label="Препарат" autocomplete="off"></td>` +
      `<td class="num"><input type="number" data-b="${i}" data-k="s" value="${b.s || ""}" min="0" max="60" step="1" aria-label="S, если зона не меньше, мм"></td>` +
      `<td class="num"><input type="number" data-b="${i}" data-k="r" value="${b.r || ""}" min="0" max="60" step="1" aria-label="R, если зона меньше, мм"></td>` +
      `<td><button class="btn icon" type="button" data-bdel="${i}" aria-label="Удалить порог" title="Удалить порог">×</button></td></tr>`).join("") +
    `</tbody></table>`;
}

// ----- названия антибиотиков по коду с диска -----
// Международные коды (EUCAST) и русские коды, в которых нет сомнений; неизвестный код остаётся как есть
const DRUG_NAMES = {
  AMP: "ампициллин", AMC: "амоксициллин/клавуланат", AZM: "азитромицин", CAZ: "цефтазидим", CIP: "ципрофлоксацин",
  CN: "гентамицин", CRO: "цефтриаксон", CTX: "цефотаксим", C: "хлорамфеникол", E: "эритромицин", FOX: "цефокситин",
  IPM: "имипенем", LEV: "левофлоксацин", LZD: "линезолид", MEM: "меропенем", OX: "оксациллин", P: "бензилпенициллин",
  SXT: "ко-тримоксазол", TE: "тетрациклин", VA: "ванкомицин", AK: "амикацин", TOB: "тобрамицин",
  TZP: "пиперациллин/тазобактам", FEP: "цефепим", ETP: "эртапенем", ATM: "азтреонам", MXF: "моксифлоксацин",
  OFX: "офлоксацин", DA: "клиндамицин", TEC: "тейкопланин", RD: "рифампицин", FD: "фузидовая кислота", TGC: "тигециклин",
  "АМП": "ампициллин", "ПЕН": "бензилпенициллин", "ОКС": "оксациллин", "ЦИП": "ципрофлоксацин", "ГЕН": "гентамицин",
  "ВАН": "ванкомицин", "ЭРИ": "эритромицин", "ТЕТ": "тетрациклин", "АЗМ": "азитромицин", "ЛИН": "линезолид",
};
// английские названия (международные непатентованные)
const EN_NAMES = {
  "ампициллин": "ampicillin", "амоксициллин/клавуланат": "amoxicillin/clavulanate", "азитромицин": "azithromycin",
  "цефтазидим": "ceftazidime", "ципрофлоксацин": "ciprofloxacin", "гентамицин": "gentamicin", "цефтриаксон": "ceftriaxone",
  "цефотаксим": "cefotaxime", "хлорамфеникол": "chloramphenicol", "эритромицин": "erythromycin", "цефокситин": "cefoxitin",
  "имипенем": "imipenem", "левофлоксацин": "levofloxacin", "линезолид": "linezolid", "меропенем": "meropenem",
  "оксациллин": "oxacillin", "бензилпенициллин": "benzylpenicillin", "ко-тримоксазол": "trimethoprim/sulfamethoxazole",
  "тетрациклин": "tetracycline", "ванкомицин": "vancomycin", "амикацин": "amikacin", "тобрамицин": "tobramycin",
  "пиперациллин/тазобактам": "piperacillin/tazobactam", "цефепим": "cefepime", "эртапенем": "ertapenem",
  "азтреонам": "aztreonam", "моксифлоксацин": "moxifloxacin", "офлоксацин": "ofloxacin", "клиндамицин": "clindamycin",
  "тейкопланин": "teicoplanin", "рифампицин": "rifampicin", "фузидовая кислота": "fusidic acid", "тигециклин": "tigecycline",
};
// ТЕСТОВО: русские коды, которые расшифрованы только предположительно (по буквам) – пометка «(?)»,
// пока тётя не скажет точно. Исправить или убрать здесь
const GUESS_NAMES = {
  "АКЦ": ["амоксициллин/клавуланат", "amoxicillin/clavulanate"],
  "ПФЦ": ["пефлоксацин", "pefloxacin"],
  "ПТК": ["пиперациллин/тазобактам", "piperacillin/tazobactam"],
  "АН": ["амикацин", "amikacin"],
};
// полное название тоже понимаем – на русском или на английском: «ампициллин», «Ampicillin»
const BY_NAME = {};
for (const [ru, en] of Object.entries(EN_NAMES)) { BY_NAME[ru.toUpperCase()] = ru; BY_NAME[en.toUpperCase()] = ru; }
// код с диска часто с дозой: «AZM 15», «P 10», «ОКС1» – для поиска названия дозу отбрасываем
const drugKey = s => normDrug(s).replace(/[\s\d.,]+$/, "").trim();
const guessOf = s => GUESS_NAMES[drugKey(s)];
const drugName = s => DRUG_NAMES[drugKey(s)] || BY_NAME[drugKey(s)] || (guessOf(s) ? guessOf(s)[0] + " (?)" : "");   // по-русски
const drugNameEn = s => EN_NAMES[drugName(s)] || (guessOf(s) ? guessOf(s)[1] + " (?)" : "");                         // по-английски

// подпись под полем «Препарат»: полное название на русском и английском
const dnameText = it => [drugName(it.drug), drugNameEn(it.drug)].filter(Boolean).join(" / ");

// ----- таблица Excel -----
function tableRows() {
  const head = ["Чашка", "Дата", "Питательная среда", "Группа", "Культура", "Диаметр чашки, мм", "№ диска", "Препарат (код с диска)", "Антибиотик", "Antibiotic (EN)",
    "Диаметр зоны, мм", "Категория", "Отметка"];
  const rows = [head];
  for (const d of P.dishes) {
    const mpp = mmPerPx(d), m = d.meta;
    d.items.forEach((it, i) => rows.push([
      d.name, m.date, m.medium, m.group, m.culture, m.dishMm ? +m.dishMm : "", i + 1, it.drug, drugName(it.drug) || it.drug, drugNameEn(it.drug),
      mpp ? round1(diamPx(it) * mpp) : "",
      (c => c ? c.cat + (c.atu ? " (ЗТН)" : "") : "")(categoryOf(it, d)),
      it.src === "none" ? (it.ok ? "нет зоны (подтверждено)" : "нет зоны (не проверено)") : needsCheck(it) ? (it.colonies ? "проверить (колонии в зоне?)" : it.pigment ? "проверить (цветной диск – окрашенный агар?)" : "проверить (найдена неуверенно)") : STATUS(it),
    ]));
  }
  return rows;
}
async function saveXlsx() {
  if (!P.dishes.length) return setMsg("Нет чашек для таблицы.", true);
  if (!window.XLSX) return setMsg("Не загрузилась библиотека для Excel (файл vendor/xlsx.full.min.js рядом с сайтом). Пока можно нажать «Копировать таблицу» и вставить в Excel.", true);
  const wb = XLSX.utils.book_new();
  const z = XLSX.utils.aoa_to_sheet(tableRows());
  z["!cols"] = [18, 11, 18, 10, 20, 12, 8, 14, 26, 28, 15, 12, 30].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, z, "Зоны");
  const dishes = [["Чашка", "Дата", "Питательная среда", "Группа", "Культура", "Диаметр чашки, мм", "Ответственный", "Дисков", "Не проверено", "Масштаб, px на 1 мм", "Как задан масштаб", "Фото под углом"]];
  for (const d of P.dishes) {
    const mpp = mmPerPx(d), m = d.meta, t = tiltOf(d);
    dishes.push([d.name, m.date, m.medium, m.group, m.culture, m.dishMm ? +m.dishMm : "", m.person, d.items.length, d.items.filter(needsCheck).length,
      mpp ? round1(1 / mpp) : "", d.scaleSrc === "manual" ? "линейкой вручную" : "по дискам",
      t ? `~${t.deg}°, диски вытянуты на ${t.pct} %` : ""]);
  }
  const s2 = XLSX.utils.aoa_to_sheet(dishes);
  s2["!cols"] = [18, 11, 18, 10, 20, 12, 18, 8, 13, 18, 18, 28].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, s2, "Чашки");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const unchecked = P.dishes.reduce((t, d) => t + d.items.filter(needsCheck).length, 0);
  if (await saveFile(`Зоны ингибирования ${today()}.xlsx`, blob))
    setMsg(`Таблица Excel готова: чашек ${P.dishes.length}.` + (unchecked ? ` Не проверено зон: ${unchecked} – они помечены в таблице.` : ""), !!unchecked);
}

// Подпись кнопки с иконкой: меняем только текст, иконка остаётся; в свёрнутом виде он виден как подсказка
function setLabel(id, text) {
  const b = $(id);
  b.querySelector(".lbl").textContent = text;
  b.setAttribute("aria-label", text); b.title = b.dataset.hk ? `${text} (${b.dataset.hk})` : text;
}
// Свернуть / развернуть инструменты; выбор запоминается в этом браузере
function foldTools(on, restoring) {
  document.querySelector(".tools").classList.toggle("folded", on);
  // при сворачивании кнопкой «Видимость и цвета» тоже сворачивается (но не прячется); при загрузке страницы – как было
  if (on && !restoring && typeof foldLook === "function") foldLook(true);
  const t = $("toolsToggle"), text = on ? "Развернуть инструменты (T)" : "Свернуть инструменты в иконки (T)";
  t.setAttribute("aria-expanded", String(!on)); t.setAttribute("aria-label", text); t.title = text;
  try { localStorage.setItem("zona-tools-folded", on ? "1" : "0"); } catch {}
}
// Во весь экран: настоящий полноэкранный режим, если браузер разрешит; иначе рабочая часть на всё окно
function setFocus(on) {
  document.body.classList.toggle("focus", on);
  const strip = $("dishes");
  if (on) document.querySelector(".tools").after(strip); else document.querySelector(".left").append(strip);
  const b = $("focusBtn"), t = on ? "Обычный вид (F или Esc)" : "Во весь экран (F, выход – Esc)";
  b.setAttribute("aria-pressed", String(on)); b.title = t; b.setAttribute("aria-label", t);
  b.classList.toggle("on", on);
  if (on && !document.fullscreenElement && document.documentElement.requestFullscreen)
    document.documentElement.requestFullscreen().then(() => { P.fs = true; }).catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (!on) P.fs = false;
  requestAnimationFrame(() => { fitCanvas(); draw(); });
}
$("focusBtn").addEventListener("click", () => setFocus(!document.body.classList.contains("focus")));
$("prevDish").addEventListener("click", () => stepDish(-1));
$("nextDish").addEventListener("click", () => stepDish(1));
// браузер сам вышел из полноэкранного (Esc) – выходим и из нашего режима
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && P.fs) setFocus(false);
  else requestAnimationFrame(() => { fitCanvas(); draw(); });
});
$("toolsToggle").addEventListener("click", () => foldTools(!document.querySelector(".tools").classList.contains("folded")));
try { if (localStorage.getItem("zona-tools-folded") === "1") foldTools(true, true); } catch {}
// «Чашка» (паспорт) свёрнута или развёрнута – запоминается в браузере
try { if (localStorage.getItem("zona-meta-open") === "0") $("metaBox").open = false; } catch {}
$("metaBox").addEventListener("toggle", () => { try { localStorage.setItem("zona-meta-open", $("metaBox").open ? "1" : "0"); } catch {} });
// треугольник «Видимость и цвета»: свернуть / развернуть, выбор запоминается в браузере
function foldLook(shut) {
  $("lookBox").classList.toggle("shut", shut);
  $("lookFold").setAttribute("aria-expanded", String(!shut));
  try { localStorage.setItem("zona-look-shut", shut ? "1" : "0"); } catch {}
}
$("lookFold").addEventListener("click", () => foldLook(!$("lookBox").classList.contains("shut")));
try { if (localStorage.getItem("zona-look-shut") === "1") foldLook(true); } catch {}

// ----- сообщения и подтверждения -----
// Сообщение показывается списком: каждое предложение – отдельный пункт. «−» сворачивает список до заголовка
// (видно, сколько там пунктов), «+» разворачивает; выбор запоминается в браузере
let msgShut = false;
try { msgShut = localStorage.getItem("zona-msg-shut") === "1"; } catch {}
function setMsg(t, warn) {
  const items = String(t).split(/(?<=[.!?])\s+(?=[«"(]?[А-ЯЁA-Z0-9⚠])/).map(x => x.trim()).filter(Boolean);
  $("msgList").innerHTML = items.map(x => `<li>${esc(x)}</li>`).join("");
  $("msg").dataset.n = items.length;
  $("msg").classList.toggle("warn", !!warn);
  showMsgFold();
}
function showMsgFold() {
  const n = +$("msg").dataset.n || 0;
  $("msg").classList.toggle("shut", msgShut);
  $("msgTitle").textContent = msgShut && n ? `свёрнуто: ${n}` : "";   // без заголовка; в свёрнутом виде – сколько пунктов
  $("msgFold").textContent = msgShut ? "+" : "−";
  $("msgFold").title = msgShut ? "Показать подсказки" : "Свернуть подсказки";
  $("msgFold").setAttribute("aria-expanded", String(!msgShut));
}
$("msgFold").addEventListener("click", () => {
  msgShut = !msgShut;
  try { localStorage.setItem("zona-msg-shut", msgShut ? "1" : "0"); } catch {}
  showMsgFold();
});

function setMode(m) {
  P.mode = m;
  $("addBtn").classList.toggle("on", m === "add");
  $("calibBtn").classList.toggle("on", m === "calib");
  setLabel("calibBtn", m === "calib" ? "Готово" : "Масштаб по линейке");
  $("calibField").hidden = m !== "calib";
  cv.classList.toggle("adding", m === "add");
  $("hint").textContent =
    m === "add" ? "Нажмите в центр диска, вокруг которого нужна зона." :
    m === "calib" ? "Поставьте жёлтую линейку на отрезок известной длины, введите длину и нажмите «Готово»." :
    "";
}

// ----- рисование -----
function drawRuler(r, color, k) {
  const L = len(r), ux = (r.bx - r.ax) / (L || 1), uy = (r.by - r.ay) / (L || 1), nx = -uy, ny = ux;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4 * k;
  ctx.beginPath(); ctx.moveTo(r.ax, r.ay); ctx.lineTo(r.bx, r.by); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5 * k;
  ctx.beginPath(); ctx.moveTo(r.ax, r.ay); ctx.lineTo(r.bx, r.by); ctx.stroke();
  const mpp = mmPerPx();
  if (mpp) {                                     // деления: 1 мм, длинные через 5 мм
    const step = 1 / mpp;
    ctx.lineWidth = Math.max(1, k);
    for (let i = 0, t = 0; t <= L + 0.01; i++, t = i * step) {
      if (step < 3 * k && i % 5) continue;
      const tl = (i % 5 ? 4 : 9) * k, px = r.ax + ux * t, py = r.ay + uy * t;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * tl, py + ny * tl); ctx.stroke();
    }
  }
  for (const [x, y] of [[r.ax, r.ay], [r.bx, r.by]]) drawHandle(x, y, color, k, 9);
}

// Ручка – пустое кольцо с точкой: край зоны под ней остаётся виден
function drawHandle(x, y, color, k, rad) {
  ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.lineWidth = 4.5 * k;
  ctx.beginPath(); ctx.arc(x, y, rad * k, 0, 7); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5 * k;
  ctx.beginPath(); ctx.arc(x, y, rad * k, 0, 7); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 1.6 * k, 0, 7); ctx.fill();
}

function label(text, x, y, k, color) {
  ctx.font = `600 ${Math.round(14 * k)}px "JetBrains Mono", Consolas, monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.lineJoin = "round";
  // подпись не уходит за край фото: у зоны с краю сдвигаем её внутрь
  const half = ctx.measureText(text).width / 2 + 4 * k, pad = 4 * k;
  x = Math.min(Math.max(x, half + pad), cv.width - half - pad);
  y = Math.min(Math.max(y, 18 * k), cv.height - pad);
  ctx.lineWidth = 4 * k; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}

// Лупа ×3, пока тянем край или конец линейки: отдельное окошко постоянного размера в правом верхнем
// углу окна разметки. В левый угол уходит, только если тянем точку прямо под ней
function drawLoupe(p, k) {
  const L = $("loupe"), g = L.getContext("2d"), s = 60 * k;      // 180 экранных px лупы = 60 экранных px фото
  L.hidden = false;
  const st = $("stage").getBoundingClientRect(), b = cv.getBoundingClientRect();
  const px = b.left + p.x / k - st.left, py = b.top + p.y / k - st.top;   // точка в координатах окна
  const right = !L.classList.contains("left");
  const nearRight = px > st.width - 20 - 180 - 30 && py < 20 + 180 + 30, nearLeft = px < 20 + 180 + 30 && py < 20 + 180 + 30;
  if (right && nearRight) L.classList.add("left");
  else if (!right && nearLeft && !nearRight) L.classList.remove("left");
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#000"; g.fillRect(0, 0, L.width, L.height);
  g.drawImage(cv, p.x - s / 2, p.y - s / 2, s, s, 0, 0, L.width, L.height);
  const z = L.width / s, was = ctx;                               // разметку в лупе рисуем заново – она чёткая
  ctx = g; g.setTransform(z, 0, 0, z, -(p.x - s / 2) * z, -(p.y - s / 2) * z);
  drawMarks(D(), k);
  g.setTransform(1, 0, 0, 1, 0, 0); ctx = was;
  const c = L.width / 2;
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(c - 28, c); g.lineTo(c - 8, c); g.moveTo(c + 8, c); g.lineTo(c + 28, c);
  g.moveTo(c, c - 28); g.lineTo(c, c - 8); g.moveTo(c, c + 8); g.lineTo(c, c + 28); g.stroke();
}

// Разметка (зоны, подписи, линейки) на холсте ctx в координатах фото; k – сколько px фото в 1 экранном px
function drawMarks(d, k) {
  ctx.globalAlpha = P.alpha;
  const mpp = mmPerPx();
  // при настройке масштаба зоны прячем: видны только линейка и сам диск
  if (P.mode !== "calib") d.items.forEach((it, i) => {
    const sel = i === P.sel, c = center(it), R = diamPx(it) / 2;
    const line = it.pts ? outline(it.pts) : null;
    const col = needsCheck(it) ? "#ff9a62" : it.src === "none" ? "#b8c4cc" : it.src === "auto" ? "#3ff0cf" : "#ffc845";
    const shape = () => {
      ctx.beginPath();
      if (line) { line.forEach((q, j) => j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); }
      else ctx.arc(c.x, c.y, R, 0, 2 * Math.PI);
    };
    ctx.lineJoin = "round";
    if (sel && line) { ctx.fillStyle = "rgba(255,200,69,.08)"; shape(); ctx.fill(); }
    ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = (sel ? 5 : 4) * k; shape(); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = (sel ? 3 : 2) * k;
    ctx.setLineDash(sel ? [] : [8 * k, 5 * k]); shape(); ctx.stroke(); ctx.setLineDash([]);
    const t = `${i + 1}` + (it.drug ? ` ${it.drug}` : "") + (mpp ? ` · ${fmt(diamPx(it) * mpp)} мм` : "") + (needsCheck(it) ? " ?" : "");
    const top = line ? line.reduce((a, q) => q.y < a.y ? q : a).y : c.y - R;
    label(t, c.x, top - 6 * k, k, col);
    if (sel && P.mode !== "calib") {
      if (!line) drawRuler(it.r, "#ffc845", k);
      else {                              // точки, за которые тянут край
        const hot = P.drag && P.drag.what === "pt" ? P.drag.i : P.hover;
        it.pts.forEach((q, j) => drawHandle(q.x, q.y, "#ffc845", k, j === hot ? 9 : 6));
      }
    }
  });
  if (P.mode === "calib" && P.calib) {
    drawRuler(P.calib, "#ffe066", k);
    label(`${fmt(calibMm())} мм`, mid(P.calib).x, Math.min(P.calib.ay, P.calib.by) - 14 * k, k, "#ffe066");
  }
  ctx.globalAlpha = 1;
}
// Холст разметки ov – ровно по окну разметки, в пикселях экрана (с учётом devicePixelRatio).
// Возвращает масштаб и сдвиг «координаты фото → px холста ov»
function placeOverlay() {
  const v = $("view"), dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(v.clientWidth * dpr)), h = Math.max(1, Math.round(v.clientHeight * dpr));
  Object.assign(ov.style, { left: v.offsetLeft + "px", top: v.offsetTop + "px", width: v.clientWidth + "px", height: v.clientHeight + "px" });
  if (ov.width !== w || ov.height !== h) { ov.width = w; ov.height = h; }
  octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, w, h);
  const cr = cv.getBoundingClientRect(), vr = v.getBoundingClientRect();
  return { scale: dpr * cr.width / cv.width, ox: dpr * (cr.left - vr.left), oy: dpr * (cr.top - vr.top) };
}
function draw() {
  const d = D(), o = placeOverlay();
  ctx = pctx;
  if (!d || !d._base) {
    ctx.fillStyle = "#1b2329"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#c9d3da"; ctx.font = `500 ${Math.round(cv.width / 30)}px "Onest", "Segoe UI", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(d ? "Фото этой чашки не открылось – загрузите его заново" : "Перетащите фото чашки сюда или нажмите «+ Добавить фото»", cv.width / 2, cv.height / 2);
    return;
  }
  const k = d.w / (cv.getBoundingClientRect().width || d.w);   // 1 экранный пиксель в пикселях фото
  pctx.globalAlpha = 1;
  pctx.drawImage(viewBase(d), 0, 0);
  ctx = octx; octx.setTransform(o.scale, 0, 0, o.scale, o.ox, o.oy);
  drawMarks(d, k);
  octx.setTransform(1, 0, 0, 1, 0, 0); ctx = pctx;
  if (P.drag && P.drag.what !== "move" && P.drag.what !== "pan" && P.drag.p) drawLoupe(P.drag.p, k);   // лупа: и для точки контура, и для линейки масштаба
  else $("loupe").hidden = true;
}

// стрелки и счётчик «2 / 5» – только когда фото больше одного
function renderNav() {
  const n = P.dishes.length, many = n > 1;
  $("prevDish").hidden = $("nextDish").hidden = $("navCount").hidden = !many;
  if (!many) return;
  $("prevDish").disabled = P.cur <= 0; $("nextDish").disabled = P.cur >= n - 1;
  $("navCount").textContent = `${P.cur + 1} / ${n}`;
}
function stepDish(k) {
  const i = P.cur + k;
  if (i >= 0 && i < P.dishes.length && !P.drag) openDish(i);
}
function renderDishes() {
  renderNav();
  // порядок: «Пример» → чашки → «+ Добавить фото»; «Пример» нужен, только пока чашек нет – добавили хоть одну, плитка исчезает
  $("dishes").innerHTML = (P.dishes.length ? "" :
    `<button class="dish sample-tile" type="button" title="Искусственная чашка – попробовать программу"><b>◎</b>Пример</button>`) + P.dishes.map((d, i) => {
    const n = d.items.filter(needsCheck).length;
    return `<div class="dish${i === P.cur ? " cur" : ""}" data-i="${i}" tabindex="0" role="button" aria-label="Открыть ${esc(d.name)}" title="Открыть. Перетащите, чтобы поменять порядок (Shift + ← →)">` +
      `<span class="dish-ph"><img src="${d.thumb}" alt="" draggable="false">${coverSvg(markOf(d), 70)}</span>` +   // разметка – как на обложках датасетов
      `<span class="nm" title="${esc(d.name)}">${esc(d.name)}</span>` +
      `<span class="ct${n ? " warn" : ""}">${d.items.length} ${disksWord(d.items.length)}${n ? ` · ${n} ?` : ""}</span>` +
      `<button class="x" type="button" data-del="${i}" aria-label="Удалить чашку ${esc(d.name)}" title="Удалить чашку">×</button></div>`;
  }).join("") + `<label class="dish add" for="file" tabindex="0" title="Выбрать фото. Можно и перетащить фото на окно или вставить Ctrl+V"><b>+</b>Добавить фото</label>`;
  $("delPickBtn").disabled = $("snapEditBtn").disabled = !P.dishes.length;
}

function fillMeta() {
  const d = D(), m = d ? d.meta : {};
  $("mName").value = d ? d.name : ""; $("mDate").value = m.date || ""; $("mGroup").value = m.group || "опыт";
  $("mMedium").value = m.medium || ""; $("mCulture").value = m.culture || ""; $("mPerson").value = m.person || ""; $("mOrg").value = m.org || ""; $("mDishMm").value = m.dishMm || "";
  for (const id of ["mName", "mDate", "mGroup", "mMedium", "mCulture", "mPerson", "mOrg", "mDishMm", "diskMm"]) $(id).disabled = !d;
  $("metaTitle").textContent = d ? `· ${d.name}` : "";
}

function catCell(it) {
  const d = D(), c = categoryOf(it, d);
  if (c) {
    const r = c.rule, why = `${CAT_TEXT[c.cat]}\nЗона ${c.mm} мм (округлено до 1 мм). Пороги: Ч ≥ ${r.s}, Р < ${r.r}` +
      (r.atu ? `, ЗТН ${r.atu[0] === r.atu[1] ? r.atu[0] : r.atu.join("–")}` : "") + (r.disk ? `, диск ${r.disk} мкг` : "") +
      `.\nИсточник: ${r.src}${r.note ? ` (${r.note})` : ""}.` + (r.br ? "\nЗначения в таблице в скобках – применяются ограниченно, см. примечания." : "") +
      (c.atu ? "\nЗона попала в ЗТН – зону технической неопределённости: результат ненадёжен, по рекомендациям его не сообщают как «чувствительный» без подтверждения." : "");
    return `<span class="chip cat cat-${c.cat}" title="${esc(why)}">${c.cat}</span>` + (c.atu ? ` <span class="chip check" title="${esc(why)}">ЗТН</span>` : "");
  }
  if (!it.drug) return `<span class="nobreak" title="Впишите препарат (код с диска), чтобы узнать категорию">–</span>`;
  if (!d.meta.org) return `<span class="nobreak" title="Выберите микроорганизм в паспорте чашки – пороги подставятся из рекомендаций">выберите микроорганизм</span>`;
  return `<span class="nobreak" title="В таблице для «${esc(BREAKPOINTS[d.meta.org].name)}» нет «${esc(it.drug)}». Проверьте код препарата или задайте свои пороги ниже">нет в таблице</span>`;
}
// обновить только колонку «Категория», не трогая поля ввода (курсор в «Препарат» не теряется)
function refreshCats() {
  const d = D();
  if (!d) return;
  for (const td of $("tableBox").querySelectorAll(".catcell")) { const it = d.items[+td.dataset.i]; if (it) td.innerHTML = catCell(it); }
}
function renderTable() {
  const d = D(), mpp = mmPerPx();
  if (!d || !d.items.length) { $("tableBox").innerHTML = `<p class="empty">Зон пока нет.</p>`; return; }
  $("tableBox").innerHTML = `<table><thead><tr><th>№</th><th>Препарат</th><th class="num">Зона, мм</th><th>Категория</th><th>Отметка</th></tr></thead><tbody>` +
    d.items.map((it, i) => `<tr data-i="${i}" tabindex="0" class="${i === P.sel ? "sel" : ""}"><td>${i + 1}</td>` +
      `<td><input class="drug" id="drug-${d.id}-${i}" data-i="${i}" list="drugList" value="${esc(it.drug)}" placeholder="–" aria-label="Препарат у диска ${i + 1}" autocomplete="off"><span class="dname" data-i="${i}"${guessOf(it.drug) ? ` title="Название предположительное – уточнить у тёти"` : ""}>${esc(dnameText(it))}</span></td>` +
      `<td class="num">${mpp ? fmt(diamPx(it) * mpp) : "–"}${it.pts && mpp && spanPx(it).max - spanPx(it).min > 0.5 / mpp ? `<span class="sub">${fmt(spanPx(it).min * mpp)}–${fmt(spanPx(it).max * mpp)}</span>` : ""}</td>` +
      `<td class="catcell" data-i="${i}">${catCell(it)}</td>` +
      `<td><span class="chip ${needsCheck(it) ? "check" : it.src === "none" ? "none" : it.src === "auto" ? (it.ok ? "ok" : "") : "edited"}">${STATUS(it)}</span></td></tr>`).join("") +
    `</tbody></table>`;
}

// Выбранный диск крупно: чтобы прочитать маркировку антибиотика
function renderZoom(d, it) {
  $("zoomBox").hidden = !(it && d._base);
  if (!it || !d._base) return;
  const zc = $("zoomCv"), z = zc.getContext("2d"), s = (d.scalePx || d.w * 0.05) * 1.9;
  z.fillStyle = "#000"; z.fillRect(0, 0, zc.width, zc.height);
  z.drawImage(viewBase(d), it.x - s / 2, it.y - s / 2, s, s, 0, 0, zc.width, zc.height);
  $("zoomTitle").textContent = `Диск ${P.sel + 1} крупно: прочитайте надпись`;
  if (document.activeElement !== $("zoomDrug")) $("zoomDrug").value = it.drug;
}

function renderSide() {
  const d = D(), it = d && P.sel >= 0 ? d.items[P.sel] : null, mpp = mmPerPx();
  $("scale").innerHTML = mpp
    ? `<span>Масштаб: <b>1 мм = ${fmt(1 / mpp)} px</b></span><span>${d.scaleSrc === "manual" ? "задан линейкой вручную" : `по ${d.nDisks} дискам, медиана`} · диск ${fmt(diskMm())} мм</span>`
    : `<span>Масштаб: <b>не задан</b></span>`;
  const tilt = tiltOf(d);
  if (tilt) $("scale").innerHTML += `<span class="tilt">⚠ фото под углом ~${tilt.deg}°: диски вытянуты на ${tilt.pct} %</span>`;
  renderZoom(d, it);
  $("check").hidden = !(it && needsCheck(it));
  if (it && needsCheck(it)) {
    const none = it.src === "none";
    $("checkText").textContent = none ? `Зона у диска ${P.sel + 1} не найдена. Рост вплотную к диску?`
      : it.colonies ? `Внутри зоны у диска ${P.sel + 1}, похоже, колонии. Мерить по внутреннему краю; колонии до диска – зоны нет.`
      : it.pigment ? `Диск ${P.sel + 1} цветной: краска из него окрашивает агар вокруг, и край цветного пятна легко принять за край зоны. Мерить по краю прозрачной зоны (где нет роста), а не по краю цвета.`
      : `Край зоны у диска ${P.sel + 1} найден неуверенно: зона сливается с соседней или размыта. Проверьте круг.`;
    $("checkYes").textContent = none ? "Да, зоны нет" : "Всё верно";
    $("checkMark").textContent = none ? "Разметить зону вручную" : it.colonies ? "Зоны нет" : "Гибкий контур";
  }
  $("delBtn").disabled = !it;
  $("axisBtn").disabled = !it;
  setLabel("axisBtn", it && it.pts ? "Сделать кругом" : "Гибкий контур");
  $("roundBtn").disabled = !(it && it.pts);
  if (P.mode === "idle") $("hint").textContent = !it ? "" : it.pts
    ? "Тяните точку или край; изнутри – сдвинуть зону."
    : "Тяните концы линейки к краям зоны.";
  $("undoBtn").disabled = !(d && d._undo.length) && !P.trash.length;
  $("redoBtn").disabled = !d || !d._redo.length;
  for (const id of ["addBtn", "calibBtn", "resetBtn", "copyBtn"]) $(id).disabled = !d;
  $("xlsxBtn").disabled = $("projSaveBtn").disabled = !P.dishes.length;
}

function render() { draw(); renderTable(); renderSide(); renderTiltBar(); }
// Красная плашка над фото, если оно снято под углом. Крестик прячет её для этой чашки до перезагрузки
function renderTiltBar() {
  const d = D(), t = d && d._base && P.mode !== "calib" ? tiltOf(d) : null, show = !!t && !d._tiltHidden;
  $("tiltBar").hidden = !show;
  if (show) $("tiltBarText").textContent = `⚠ Фото под углом (~${t.deg}°): диски вытянуты на ${t.pct} %`;
}
$("tiltBarX").addEventListener("click", () => { const d = D(); if (d) d._tiltHidden = true; renderTiltBar(); });

// Выбор зоны без пересборки таблицы (чтобы не терять курсор в поле «Препарат»)
function select(i) {
  P.sel = i;
  for (const tr of $("tableBox").querySelectorAll("tr[data-i]")) tr.classList.toggle("sel", +tr.dataset.i === i);
  draw(); renderSide();
}

// ----- мышь и палец -----
function pos(e) {
  const b = cv.getBoundingClientRect(), d = D();
  return { x: (e.clientX - b.left) * d.w / b.width, y: (e.clientY - b.top) * d.h / b.height, k: d.w / b.width };
}
function distSeg(p, r) {
  const L2 = (r.bx - r.ax) ** 2 + (r.by - r.ay) ** 2 || 1;
  const t = Math.max(0, Math.min(1, ((p.x - r.ax) * (r.bx - r.ax) + (p.y - r.ay) * (r.by - r.ay)) / L2));
  return Math.hypot(p.x - r.ax - t * (r.bx - r.ax), p.y - r.ay - t * (r.by - r.ay));
}

// Что под курсором у зон: конец линейки (a, b) или точка контура / край (pt),
// линейка или середина контура (move), другая зона (pick)
function hitZone(p) {
  const d = D(), hit = 16 * p.k, it = P.sel >= 0 ? d.items[P.sel] : null;
  if (it && !it.pts) {
    const r = it.r;
    if (Math.hypot(p.x - r.ax, p.y - r.ay) < hit) return { what: "a", r };
    if (Math.hypot(p.x - r.bx, p.y - r.by) < hit) return { what: "b", r };
    if (distSeg(p, r) < hit * 0.7) return { what: "move" };
  }
  if (it && it.pts) {
    let bi = -1, bd = Infinity;
    it.pts.forEach((q, i) => { const s = Math.hypot(p.x - q.x, p.y - q.y); if (s < bd) { bd = s; bi = i; } });
    if (bd < hit) return { what: "pt", i: bi };
    const line = outline(it.pts);
    // за край можно хвататься в любом месте: тянется ближайшая точка
    if (line.some(q => Math.hypot(p.x - q.x, p.y - q.y) < hit * 0.7)) return { what: "pt", i: bi };
    if (inside(line, p)) return { what: "move" };
  }
  let best = -1, bestA = Infinity;
  d.items.forEach((z, i) => {
    const c = center(z), R = diamPx(z) / 2;
    const hitIn = z.pts ? inside(outline(z.pts), p) : Math.hypot(p.x - c.x, p.y - c.y) < R;
    if ((hitIn || Math.hypot(p.x - c.x, p.y - c.y) < 20 * p.k) && R < bestA) { best = i; bestA = R; }
  });
  return best >= 0 ? { what: "pick", i: best } : null;
}
// Контур как резинка: точка идёт за курсором, соседние – слабее, дальние стоят
const PULL = [1, 0.4, 0.1];
function pullPt(it, i, dx, dy) {
  const n = it.pts.length;
  for (let s = -2; s <= 2; s++) {
    const q = it.pts[(i + s + n) % n], w = PULL[Math.abs(s)];
    q.x += dx * w; q.y += dy * w;
  }
}

cv.addEventListener("pointerdown", e => {
  const d = D();
  if (!d || !d._base || e.button !== 0) return;     // правая кнопка – отдельно, через contextmenu
  const p = pos(e), hit = 16 * p.k;
  const grab = g => {
    P.drag = { ...g, last: p, p: null, pre: P.mode === "calib" ? null : snap(d), moved: false, sx: e.clientX, sy: e.clientY };
    cv.setPointerCapture(e.pointerId); e.preventDefault();
  };
  if (P.mode === "calib") {
    const r = P.calib;
    if (!r) return;
    if (Math.hypot(p.x - r.ax, p.y - r.ay) < hit) return grab({ what: "a", r });
    if (Math.hypot(p.x - r.bx, p.y - r.by) < hit) return grab({ what: "b", r });
    if (distSeg(p, r) < hit * 0.7) grab({ what: "move", r });
    return;
  }
  if (P.mode === "add") {
    commit();
    const mpp = mmPerPx(), dd = mpp ? 12 / mpp : d.w * 0.12;
    d.items.push({ x: p.x, y: p.y, src: "manual", r: rulerAt(p.x, p.y, dd), shape: null, drug: "", ok: false });
    P.sel = d.items.length - 1; setMode("idle"); renderDishes(); render(); return;
  }
  const g = hitZone(p);
  if (g && g.what !== "pick") return grab(g);
  if (!g && P.zoom > 1) {             // приближено и нажали мимо зон – тащим фото; без движения это просто клик мимо
    P.drag = { what: "pan", sx: e.clientX, sy: e.clientY, sl: $("view").scrollLeft, st: $("view").scrollTop, moved: false, pre: null };
    cv.setPointerCapture(e.pointerId); e.preventDefault(); cv.style.cursor = "grabbing";
    return;
  }
  select(g ? g.i : -1);
});
cv.addEventListener("pointermove", e => {
  const d = D();
  if (!d || !d._base) return;
  if (!P.drag) {                      // без нажатия: подсветка точки и вид курсора
    const p = pos(e), g = P.mode === "idle" ? hitZone(p) : null, hov = g && g.what === "pt" ? g.i : -1;
    cv.style.cursor = !g ? (P.zoom > 1 && P.mode === "idle" ? "grab" : "") : g.what === "pick" ? "pointer" : g.what === "move" ? "move" : "grab";
    if (hov !== P.hover) { P.hover = hov; draw(); }
    return;
  }
  const g = P.drag;
  if (g.what === "pan") {
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    g.cx = e.clientX; g.cy = e.clientY;              // где сейчас курсор – нужно setZoom, если лупу крутят прямо на ходу
    if (Math.abs(dx) + Math.abs(dy) > 3) g.moved = true;
    $("view").scrollLeft = g.sl - dx; $("view").scrollTop = g.st - dy;
    return;
  }
  g.cx = e.clientX; g.cy = e.clientY;
  if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 4) return;   // дрожание руки при нажатии – ещё не правка
  const p = pos(e), r = g.r;
  if (g.what === "a") { r.ax = p.x; r.ay = p.y; g.p = p; }
  else if (g.what === "b") { r.bx = p.x; r.by = p.y; g.p = p; }
  else if (g.what === "pt") { pullPt(d.items[P.sel], g.i, p.x - g.last.x, p.y - g.last.y); g.last = p; g.p = d.items[P.sel].pts[g.i]; }
  else {
    const dx = p.x - g.last.x, dy = p.y - g.last.y;
    const it = P.mode === "calib" ? null : d.items[P.sel];
    if (it && it.pts) for (const q of it.pts) { q.x += dx; q.y += dy; }
    else { const q = it ? it.r : r; q.ax += dx; q.bx += dx; q.ay += dy; q.by += dy; }
    g.last = p;
  }
  g.moved = true;
  if (P.mode !== "calib" && P.sel >= 0) {
    const it = d.items[P.sel];
    if (it.src === "auto" || it.src === "none") it.src = "edited";
  }
  if (P.mode === "calib") draw(); else render();
});
const endDrag = () => {
  const g = P.drag;
  if (!g) return;
  P.drag = null;
  if (g.what === "pan") { cv.style.cursor = "grab"; if (!g.moved) { select(-1); } return; }
  // Зону потрогали (например, проверяли край в лупе), но вернули на место с точностью до 0,1 мм – это проверка,
  // а не правка: зона остаётся как была, с прежней отметкой, и вопрос «Всё верно?» не пропадает
  if (g.pre && g.moved && P.sel >= 0) {
    const d = D(), it = d.items[P.sel], was = JSON.parse(g.pre).items[P.sel], mpp = mmPerPx();
    const ptsOf = z => z.pts || [{ x: z.r.ax, y: z.r.ay }, { x: z.r.bx, y: z.r.by }];
    const a = was && ptsOf(was), b = ptsOf(it);
    const same = a && a.length === b.length && a.every((q, j) => Math.hypot(q.x - b[j].x, q.y - b[j].y) * (mpp || 0.05) < 0.1);
    if (same) { d.items[P.sel] = was; g.moved = false; }
  }
  if (g.pre && g.moved) { commit(g.pre); renderDishes(); }
  render();
};
cv.addEventListener("pointerup", endDrag);
cv.addEventListener("pointercancel", endDrag);

// ----- кнопки -----
async function loadSample() {
  const have = P.dishes.findIndex(d => d.sample);
  if (have >= 0) return openDish(have);
  setMsg("Рисую пример…"); await tick();
  const s = makeSample(), c = document.createElement("canvas");
  c.width = s.w; c.height = s.h;
  c.getContext("2d").putImageData(new ImageData(s.data, s.w, s.h), 0, 0);
  await addDish(c, s.w, s.h, "Пример", true);
  await openDish(P.dishes.length - 1);
  setMsg("Пример: зоны 24, 17 и 13 мм и диск без зоны.");
}
const calibMm = () => { const v = parseFloat($("calibMm").value); return v > 0 ? v : diskMm(); };

$("file").addEventListener("change", e => { addFiles(e.target.files); e.target.value = ""; });
$("projFile").addEventListener("change", e => { openProject(e.target.files[0]); e.target.value = ""; });
$("projOpenBtn").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("projFile").click(); }
});
$("helpBtn").addEventListener("click", () => $("helpBox").showModal());
// тема: по кругу «как в системе» → светлая → тёмная; выбор запоминается в этом браузере
const THEMES = [["", "◐", "как в системе"], ["light", "☀", "светлая"], ["dark", "☾", "тёмная"]];
function showTheme() {
  const t = document.documentElement.dataset.theme || "", i = THEMES.findIndex(m => m[0] === t);
  const [, icon, name] = THEMES[i < 0 ? 0 : i], next = THEMES[(i + 1) % THEMES.length][2];
  $("themeBtn").textContent = icon;
  $("themeBtn").title = `Тема: ${name}. Нажмите – ${next}`;
  $("themeBtn").setAttribute("aria-label", `Тема оформления: ${name}`);
}
$("themeBtn").addEventListener("click", () => {
  const t = document.documentElement.dataset.theme || "", i = THEMES.findIndex(m => m[0] === t);
  const n = THEMES[(i + 1) % THEMES.length][0];
  if (n) document.documentElement.dataset.theme = n; else delete document.documentElement.dataset.theme;
  try { if (n) localStorage.setItem("zona-theme", n); else localStorage.removeItem("zona-theme"); } catch {}
  showTheme();
});
showTheme();
$("helpClose").addEventListener("click", () => $("helpBox").close());
$("helpBox").addEventListener("click", e => {          // клик мимо окна закрывает его
  const b = $("helpBox").getBoundingClientRect();
  if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) $("helpBox").close();
});
$("undoBtn").addEventListener("click", undo);
$("redoBtn").addEventListener("click", redo);
$("saveBtn2").addEventListener("click", () => saveBrowser(false));
// Снимок для отчёта: видимая часть окна разметки – как на экране (видимость разметки, приближение, выбранная зона),
// в разрешении фото, без надписей поверх: чашка и дата – только в имени файла
function grabView() {
  const d = D();
  if (!d || !d._base) { setMsg("Сначала откройте фото чашки.", true); return null; }
  draw();
  const cr = cv.getBoundingClientRect(), vr = $("view").getBoundingClientRect();
  const sx = cv.width / cr.width, sy = cv.height / cr.height;
  const x0 = Math.max(0, (vr.left - cr.left) * sx), y0 = Math.max(0, (vr.top - cr.top) * sy);
  const x1 = Math.min(cv.width, (vr.right - cr.left) * sx), y1 = Math.min(cv.height, (vr.bottom - cr.top) * sy);
  const w = Math.round(x1 - x0), h = Math.round(y1 - y0);
  if (w < 2 || h < 2) { setMsg("Фото не видно в окне – нажмите «Всё фото» (0).", true); return null; }
  // в имени файла: дата учёта из паспорта (нет – сегодняшняя) и время сохранения; «:» в именах файлов Windows запрещено – ЧЧ-ММ-СС
  const now = new Date(), date = (d.meta.date || today()).split("-").reverse().join(".");
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(v => String(v).padStart(2, "0")).join("-");
  // масштаб снимка – не меньше экранного: при приближении разметка на снимке тоже чёткая
  const sc = Math.max(1, (window.devicePixelRatio || 1) * cr.width / cv.width);
  const out = document.createElement("canvas"); out.width = Math.round(w * sc); out.height = Math.round(h * sc);
  const g = out.getContext("2d"), was = ctx;
  g.drawImage(cv, x0, y0, w, h, 0, 0, out.width, out.height);
  ctx = g; g.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc);
  drawMarks(d, d.w / cr.width);
  g.setTransform(1, 0, 0, 1, 0, 0); ctx = was;
  const name = `${(d.name || "чашка").replace(/[\\/:*?"<>|]+/g, "_").trim() || "чашка"}${" " + date + " " + time}.png`;
  return { canvas: out, name };
}
async function savePng(c, name) {
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  if (!blob) return setMsg("Снимок не получился.", true);
  if (await saveFile(name, blob)) setMsg(`Снимок сохранён: ${name} (${c.width}×${c.height} px).`);
}

// ----- редактор снимка -----
// E.src – исходный снимок, E.adj – он же после яркости / контраста / насыщенности, E.R – рамка обрезки (в px снимка)
const E = { src: null, adj: null, R: null, name: "", drag: null };
const EDIT_IDS = ["edBright", "edContrast", "edSat"];
// Яркость, контраст, насыщенность (каждое от −100 до +100): из холста src в холст dst того же размера
function adjustInto(src, dst, bright, contrast, saturation) {
  const b = bright * 2.55, c = contrast * 2.55, sat = 1 + saturation / 100;
  const f = 259 * (c + 255) / (255 * (259 - c));                 // стандартная формула контраста
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = f * (v - 128) + 128 + b;
  const img = src.getContext("2d").getImageData(0, 0, src.width, src.height), p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    let r = lut[p[i]], gg = lut[p[i + 1]], bb = lut[p[i + 2]];
    if (sat !== 1) { const y = 0.299 * r + 0.587 * gg + 0.114 * bb; r = y + (r - y) * sat; gg = y + (gg - y) * sat; bb = y + (bb - y) * sat; }
    p[i] = r; p[i + 1] = gg; p[i + 2] = bb;                       // Uint8ClampedArray сам обрежет до 0…255
  }
  dst.getContext("2d").putImageData(img, 0, 0);
}
function editAdjust() {
  adjustInto(E.src, E.adj, +$("edBright").value, +$("edContrast").value, +$("edSat").value);
  for (const id of EDIT_IDS) $(id + "Out").value = $(id).value;
  editDraw();
}
function editDraw() {
  const c = $("editCv"), g = c.getContext("2d"), R = E.R, s = c.width / (c.getBoundingClientRect().width || c.width);
  g.drawImage(E.adj, 0, 0);
  g.fillStyle = "rgba(0,0,0,.6)";                                 // вне рамки – затемнено
  g.fillRect(0, 0, c.width, R.y); g.fillRect(0, R.y + R.h, c.width, c.height - R.y - R.h);
  g.fillRect(0, R.y, R.x, R.h); g.fillRect(R.x + R.w, R.y, c.width - R.x - R.w, R.h);
  g.strokeStyle = "#ff8c1a"; g.lineWidth = 2 * s; g.strokeRect(R.x, R.y, R.w, R.h);
  $("editInfo").textContent = `${Math.round(R.w)}×${Math.round(R.h)} px`;
}
function openEditor() {
  const got = grabView();
  if (!got) return;
 
  E.src = got.canvas; E.name = got.name;
  E.adj = document.createElement("canvas"); E.adj.width = E.src.width; E.adj.height = E.src.height;
  const c = $("editCv"); c.width = E.src.width; c.height = E.src.height;
  E.R = { x: 0, y: 0, w: c.width, h: c.height };
  for (const id of EDIT_IDS) $(id).value = 0;
  $("editBox").showModal();
  editAdjust();
}
{
  const c = $("editCv"), MIN = 10;
  const at = e => { const b = c.getBoundingClientRect(); return { x: (e.clientX - b.left) * c.width / b.width, y: (e.clientY - b.top) * c.height / b.height }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // что под курсором: стороны рамки (l r t b), внутри – сдвиг, снаружи – новая рамка
  const grabOf = p => {
    const R = E.R, hit = 14 * c.width / (c.getBoundingClientRect().width || c.width);
    const inY = p.y > R.y - hit && p.y < R.y + R.h + hit, inX = p.x > R.x - hit && p.x < R.x + R.w + hit;
    const s = { l: inY && Math.abs(p.x - R.x) < hit, r: inY && Math.abs(p.x - R.x - R.w) < hit, t: inX && Math.abs(p.y - R.y) < hit, b: inX && Math.abs(p.y - R.y - R.h) < hit };
    if (s.l || s.r || s.t || s.b) return s;
    const full = R.w >= c.width - 1 && R.h >= c.height - 1;
    return !full && p.x > R.x && p.x < R.x + R.w && p.y > R.y && p.y < R.y + R.h ? { move: true } : { draw: true };
  };
  const cursorOf = s => s.draw ? "crosshair" : s.move ? "move" : (s.l && s.t) || (s.r && s.b) ? "nwse-resize" : (s.r && s.t) || (s.l && s.b) ? "nesw-resize" : s.l || s.r ? "ew-resize" : "ns-resize";
  c.onpointerdown = e => {
    if (!E.src) return;
    const p = at(e);
    E.drag = { s: grabOf(p), p, R0: { ...E.R } };
    c.setPointerCapture(e.pointerId); e.preventDefault();
  };
  c.onpointermove = e => {
    if (!E.src) return;
    const p = at(e);
    if (!E.drag) { c.style.cursor = cursorOf(grabOf(p)); return; }
    const { s, R0 } = E.drag, dx = p.x - E.drag.p.x, dy = p.y - E.drag.p.y;
    if (s.draw) {
      const x0 = clamp(Math.min(E.drag.p.x, p.x), 0, c.width), y0 = clamp(Math.min(E.drag.p.y, p.y), 0, c.height);
      const x1 = clamp(Math.max(E.drag.p.x, p.x), 0, c.width), y1 = clamp(Math.max(E.drag.p.y, p.y), 0, c.height);
      if (x1 - x0 >= MIN && y1 - y0 >= MIN) E.R = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    } else if (s.move) {
      E.R.x = clamp(R0.x + dx, 0, c.width - R0.w); E.R.y = clamp(R0.y + dy, 0, c.height - R0.h);
    } else {
      let x0 = R0.x, y0 = R0.y, x1 = R0.x + R0.w, y1 = R0.y + R0.h;
      if (s.l) x0 = clamp(x0 + dx, 0, x1 - MIN);
      if (s.r) x1 = clamp(x1 + dx, x0 + MIN, c.width);
      if (s.t) y0 = clamp(y0 + dy, 0, y1 - MIN);
      if (s.b) y1 = clamp(y1 + dy, y0 + MIN, c.height);
      E.R = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    editDraw();
  };
  c.onpointerup = c.onpointercancel = () => { E.drag = null; };
}
for (const id of EDIT_IDS) {
  $(id).addEventListener("input", editAdjust);
  $(id).addEventListener("dblclick", () => { $(id).value = 0; editAdjust(); });
}
$("snapEditBtn").addEventListener("click", openEditor);
$("editReset").addEventListener("click", () => {
  for (const id of EDIT_IDS) $(id).value = 0;
  E.R = { x: 0, y: 0, w: E.src.width, h: E.src.height };
  editAdjust();
});
$("editCancel").addEventListener("click", () => $("editBox").close());
$("editBox").addEventListener("close", () => { E.src = E.adj = null; E.drag = null; });   // память под снимок отпускаем
// готовый снимок: только то, что в рамке, с яркостью / контрастом / насыщенностью
function editResult() {
  const R = E.R, x = Math.round(R.x), y = Math.round(R.y), w = Math.max(1, Math.round(R.w)), h = Math.max(1, Math.round(R.h));
  const out = document.createElement("canvas"); out.width = w; out.height = h;
  out.getContext("2d").drawImage(E.adj, x, y, w, h, 0, 0, w, h);
  return out;
}
$("editSave").addEventListener("click", async () => {
  const out = editResult(), name = E.name;
  $("editBox").close();
  await savePng(out, name);
});
// В буфер обмена – без файла. Картинку отдаём обещанием (Promise): Safari требует, чтобы запись началась сразу по клику
$("editCopy").addEventListener("click", async () => {
  const out = editResult(), size = `${out.width}×${out.height} px`;
  try {
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error("no clipboard");
    const png = new Promise((res, rej) => out.toBlob(b => b ? res(b) : rej(new Error("no blob")), "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    $("editBox").close();
    setMsg(`Снимок скопирован (${size}) – вставьте Ctrl+V.`);
  } catch {
    $("editBox").close();
    setMsg("Скопировать не получилось: этот браузер или страница не дают доступ к буферу обмена. Нажмите «Сохранить PNG» – снимок сохранится файлом.", true);
  }
});
addEventListener("resize", () => { if (E.src) editDraw(); });
$("xlsxBtn").addEventListener("click", saveXlsx);
$("projSaveBtn").addEventListener("click", saveProject);
$("resetBtn").addEventListener("click", async () => {
  const d = D();
  if (!d || !d._base) return;
  commit(); setMsg("Ищу диски и зоны…"); await tick();
  const old = d.items, res = analyze(rgbaOf(d), d.w, d.h);
  d.items = itemsFrom(res); d.scalePx = res.diskPx; d.scaleSrc = "auto"; d.nDisks = res.disks.length; d.stretch = res.stretch;
  for (const it of d.items) {        // названия препаратов переносим на тот же диск
    const o = old.find(o => o.drug && Math.hypot(o.x - it.x, o.y - it.y) < (d.scalePx || 30));
    if (o) it.drug = o.drug;
  }
  P.sel = -1; renderDishes(); render();
  setMsg("Найдено заново. Прежнюю разметку можно вернуть стрелкой ↶. " + summary(d), !d.items.length || !!tiltOf(d));
});
$("addBtn").addEventListener("click", () => { if (D()) setMode(P.mode === "add" ? "idle" : "add"); draw(); });
$("calibBtn").addEventListener("click", () => {
  const d = D();
  if (!d) return;
  if (P.mode === "calib") {
    const L = len(P.calib);
    if (L > 3) {
      commit();
      d.scalePx = L * diskMm() / calibMm(); d.scaleSrc = "manual";   // масштаб храним как «пикселей на диск»
      setMsg(`Масштаб задан: ${fmt(calibMm())} мм = ${Math.round(L)} px. Диаметры зон пересчитаны.`);
    }
    P.calib = null; setMode("idle"); render(); return;
  }
 
  $("calibMm").value = diskMm();
  const first = d.items[0], dd = d.scalePx || d.w * 0.06;
  P.calib = first ? rulerAt(first.x, first.y, dd) : rulerAt(d.w / 2, d.h / 2, dd);
  setMode("calib"); render();
});
$("calibMm").addEventListener("input", draw);
$("axisBtn").addEventListener("click", () => {
  const d = D(), it = d && d.items[P.sel];
  if (!it) return;
  commit();
  if (it.pts) {                                   // контур → круг того же диаметра
    const c = center(it);
    it.r = rulerAt(c.x, c.y, diamPx(it)); delete it.pts;
    setMsg("Зона снова круг с линейкой, диаметр тот же. Вернуть контур – стрелка ↶.");
  } else {
    it.pts = toContour(it); delete it.r;
    setMsg("Гибкий контур: тяните точки или край.");
  }
  if (it.src === "auto" || it.src === "none") it.src = "edited";
  render();
});
$("roundBtn").addEventListener("click", () => {     // контур остаётся контуром, но ровным кругом
  const d = D(), it = d && d.items[P.sel];
  if (!it || !it.pts) return;
  commit();
  const c = center(it);
  it.pts = circlePts(c.x, c.y, diamPx(it));
  if (it.src === "auto" || it.src === "none") it.src = "edited";
  setMsg("Контур скруглён, диаметр тот же.");
  render();
});
// Зона удаляется сразу, без вопроса: вернуть можно стрелкой ↶ (Ctrl+Z)
function deleteZone(i) {
  const d = D(), it = d.items[i];
  commit(); d.items.splice(i, 1); P.sel = -1; renderDishes(); render();
  setMsg(`Зона ${i + 1}${it.drug ? ` (${it.drug})` : ""} удалена. Вернуть – стрелка ↶ или Ctrl+Z.`);
}
$("delBtn").addEventListener("click", () => { if (D() && P.sel >= 0) deleteZone(P.sel); });
// Правая кнопка мыши по зоне – удалить её
cv.addEventListener("contextmenu", e => {
  const d = D();
  if (!d || !d._base || P.mode !== "idle") return;
  e.preventDefault();
  const g = hitZone(pos(e)), i = !g ? -1 : g.what === "pick" ? g.i : P.sel;
  if (i >= 0) deleteZone(i);
});
$("checkYes").addEventListener("click", () => {
  const d = D(), it = d && d.items[P.sel];
  if (!it) return;
  const what = it.src === "none" ? "зоны нет" : "зона верная";
  commit(); it.ok = true; renderDishes(); render();
  const left = d.items.filter(needsCheck).length;
  setMsg(left ? `Отмечено: ${what}. Осталось проверить: ${left}.` : `Отмечено: ${what}. Все диски этой чашки проверены.`);
});
$("checkMark").addEventListener("click", () => {
  const d = D(), it = d && d.items[P.sel];
  if (!it) return;
  commit();
  if (it.colonies && it.src !== "none") {        // колонии доходят до диска – зоны нет: круг размером с диск, сразу подтверждено
    const c = center(it);
    it.src = "none"; it.ok = true; it.r = rulerAt(c.x, c.y, d.scalePx || diamPx(it)); delete it.pts;
    renderDishes(); render();
    return setMsg(`Диск ${P.sel + 1}: зоны нет.`);
  }
  if (it.src !== "none") {                       // неуверенная зона → гибкий контур по найденному краю
    it.pts = toContour(it); delete it.r; it.src = "edited";
    renderDishes(); render();
    return setMsg("Контур лёг по найденному краю – подтяните точки, где край другой.");
  }
  const c = center(it), mpp = mmPerPx(), dd = mpp ? 12 / mpp : diamPx(it) * 2;
  it.src = "manual"; it.ok = false; it.r = rulerAt(c.x, c.y, dd); delete it.pts;
  renderDishes(); render();
  setMsg("Поставьте концы линейки на края зоны.");
});

// Удаление чашки в два нажатия, без окошка: × → ✓ → удалено. Нажатие в другом месте или 3 с без нажатия – снова ×
let armTimer = 0;
function disarmDel() {
  clearTimeout(armTimer);
  for (const b of $("dishes").querySelectorAll(".x.arm")) {
    b.classList.remove("arm"); b.textContent = "×"; b.title = "Удалить чашку";
    b.setAttribute("aria-label", b.dataset.label);
  }
}
function armDel(x) {
  disarmDel();
  x.classList.add("arm"); x.textContent = "✓"; x.title = "Нажмите ещё раз, чтобы удалить (вернуть – ↶)";
  x.dataset.label = x.getAttribute("aria-label"); x.setAttribute("aria-label", "Подтвердить удаление: " + x.dataset.label);
  armTimer = setTimeout(disarmDel, 3000);
}
document.addEventListener("pointerdown", e => { if (!e.target.closest(".x.arm")) disarmDel(); });
$("dishes").addEventListener("click", e => {
  if (e.target.closest(".dish.sample-tile")) return loadSample();   // плитка «Пример» в ряду чашек
  const x = e.target.closest("[data-del]");
  if (x) {
    const i = +x.dataset.del;
    if (!x.classList.contains("arm")) return armDel(x);   // первое нажатие: × → ✓
    disarmDel();
    return (async () => {
      const [gone] = P.dishes.splice(i, 1);
      gone._base = null; gone._rgba = null;
      P.trash.push({ dish: gone, i, t: Date.now() });
      if (P.trash.length > 10) P.trash.shift();
      markDirty();
      const text = `Чашка «${gone.name}» удалена. Вернуть – стрелка ↶ или Ctrl+Z.`;
      if (!P.dishes.length) { P.cur = -1; fillMeta(); renderDishes(); render(); return setMsg(text + " Чашек больше нет: загрузите фото."); }
      await openDish(Math.min(P.cur > i ? P.cur - 1 : P.cur === i ? i : P.cur, P.dishes.length - 1));
      setMsg(text);
    })();
  }
  const t = e.target.closest(".dish[data-i]");
  if (t && +t.dataset.i !== P.cur) openDish(+t.dataset.i);
});
// удалить всю серию одним действием; ↶ возвращает её целиком
const dishWord = n => n % 10 === 1 && n % 100 !== 11 ? "чашка" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "чашки" : "чашек";
// удалить несколько чашек одним действием (номера по возрастанию); ↶ возвращает их все сразу
async function deleteDishes(idx, what) {
  const many = idx.map(i => ({ dish: P.dishes[i], i }));
  for (let k = idx.length - 1; k >= 0; k--) P.dishes.splice(idx[k], 1);
  for (const { dish } of many) { dish._base = null; dish._rgba = null; }
  P.trash.push({ many, t: Date.now() });
  if (P.trash.length > 10) P.trash.shift();
  P.sel = -1; markDirty();
  const text = `${what}: ${many.length} ${dishWord(many.length)}. Вернуть – стрелка ↶ или Ctrl+Z.`;
  if (!P.dishes.length) { P.cur = -1; fillMeta(); renderDishes(); render(); return setMsg(text); }
  // открытая чашка осталась – остаёмся на ней; удалена – открываем ближайшую
  const cur = P.cur, gone = idx.includes(cur);
  await openDish(gone ? Math.min(cur - idx.filter(i => i < cur).length, P.dishes.length - 1) : cur - idx.filter(i => i < cur).length);
  setMsg(text);
}
// окно с галочками
function pickCount() {
  const n = $("pickGrid").querySelectorAll("input:checked").length;
  $("pickDel").disabled = !n;
  $("pickDel").textContent = n ? `Удалить выбранные (${n})` : "Удалить выбранные";
}
$("delPickBtn").addEventListener("click", () => {
 
  $("pickGrid").innerHTML = P.dishes.map((d, i) =>
    `<label class="pick-item"><input type="checkbox" value="${i}" aria-label="Удалить ${esc(d.name)}">` +
    `<img src="${d.thumb}" alt=""><span title="${esc(d.name)}">${esc(d.name)}</span></label>`).join("");
  pickCount();
  $("pickBox").showModal();
});
$("pickGrid").addEventListener("change", pickCount);
$("pickAll").addEventListener("click", () => { for (const c of $("pickGrid").querySelectorAll("input")) c.checked = true; pickCount(); });
$("pickNone").addEventListener("click", () => { for (const c of $("pickGrid").querySelectorAll("input")) c.checked = false; pickCount(); });
$("pickClose").addEventListener("click", () => $("pickBox").close());
$("pickCancel").addEventListener("click", () => $("pickBox").close());
$("pickBox").addEventListener("click", e => {          // клик мимо окна закрывает его
  const b = $("pickBox").getBoundingClientRect();
  if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) $("pickBox").close();
});
$("pickDel").addEventListener("click", () => {
  const idx = [...$("pickGrid").querySelectorAll("input:checked")].map(c => +c.value).sort((a, b) => a - b);
  $("pickBox").close();
  if (idx.length) deleteDishes(idx, "Удалено");
});
$("dishes").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  if (e.target.matches(".dish.add")) { e.preventDefault(); $("file").click(); }
  else if (e.target.matches(".dish[data-i]")) { e.preventDefault(); openDish(+e.target.dataset.i); }
});

// Перетаскивание чашек: порядок в ряду = порядок в P.dishes (стрелки ← →, таблица, Excel, проект).
// Мышь – тянуть сразу; палец – подержать ~0,3 с (иначе это прокрутка ряда), потом тянуть. С клавиатуры – Shift + ← →
function moveDish(from, to) {
  if (from === to || from < 0 || to < 0 || from >= P.dishes.length || to >= P.dishes.length) return renderDishes();
  const open = D();
  P.dishes.splice(to, 0, P.dishes.splice(from, 1)[0]);
  P.cur = open ? P.dishes.indexOf(open) : -1;
  markDirty(); renderDishes(); render();
  setMsg(`Чашка «${P.dishes[to].name}» теперь ${to + 1}-я из ${P.dishes.length}.`);
}
const dd = { t: null, done: 0 };   // текущее перетаскивание; done – когда закончили (чтобы не сработал щелчок)
const dishTiles = () => [...$("dishes").querySelectorAll(".dish[data-i]")];
function startDishDrag() {
  const t = dd.t;
  if (!t || t.on) return;
  t.on = true; clearTimeout(t.timer); disarmDel();
  const r = t.tile.getBoundingClientRect();
  t.grab = t.x0 - r.left;
  t.tile.classList.add("lift"); $("dishes").classList.add("sorting");
  try { $("dishes").setPointerCapture(t.id); } catch (_) {}
  if (t.touch && navigator.vibrate) navigator.vibrate(15);
  const loop = () => {                       // у края ряда – прокручиваем его сами
    if (dd.t !== t || !t.on) return;
    const s = $("dishes"), b = s.getBoundingClientRect(), edge = 40;
    const v = t.x < b.left + edge ? -12 : t.x > b.right - edge ? 12 : 0;
    if (v) { s.scrollLeft += v; placeDrag(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  placeDrag();
}
function placeDrag() {
  const t = dd.t, tile = t.tile;
  tile.style.transform = "";
  const r = tile.getBoundingClientRect(), mid = t.x - t.grab + r.width / 2;
  // соседи, середину которых перешли, меняются местами с чашкой (плавно – FLIP: запомнили место, переставили, «доехали»)
  const others = dishTiles().filter(el => el !== tile);
  let before = others.find(el => { const q = el.getBoundingClientRect(); return mid < q.left + q.width / 2; }) || null;
  const next = before || (others.length ? others[others.length - 1].nextElementSibling : null);
  if (tile.nextElementSibling !== next && next !== tile) {
    const old = new Map(others.map(el => [el, el.getBoundingClientRect().left]));
    $("dishes").insertBefore(tile, next);
    for (const el of others) {
      const dx = old.get(el) - el.getBoundingClientRect().left;
      if (dx) el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: 160, easing: "ease-out" });
    }
  }
  const r2 = tile.getBoundingClientRect();
  tile.style.transform = `translateX(${t.x - t.grab - r2.left}px) scale(1.04)`;
}
function endDishDrag(apply) {
  const t = dd.t;
  if (!t) return;
  clearTimeout(t.timer); dd.t = null;
  if (!t.on) return;
  dd.done = Date.now();
  t.tile.classList.remove("lift"); t.tile.style.transform = ""; $("dishes").classList.remove("sorting");
  const to = dishTiles().indexOf(t.tile);
  apply ? moveDish(+t.tile.dataset.i, to) : renderDishes();
}
$("dishes").addEventListener("pointerdown", e => {
  const tile = e.target.closest(".dish[data-i]");
  if (!tile || e.target.closest(".x") || e.button !== 0 || P.dishes.length < 2 || dd.t) return;
  const touch = e.pointerType !== "mouse";
  dd.t = { tile, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, on: false, touch, timer: 0 };
  if (touch) dd.t.timer = setTimeout(startDishDrag, 300);
});
$("dishes").addEventListener("pointermove", e => {
  const t = dd.t;
  if (!t || e.pointerId !== t.id) return;
  t.x = e.clientX;
  if (!t.on) {
    if (Math.hypot(e.clientX - t.x0, e.clientY - t.y0) < 6) return;
    if (t.touch) return endDishDrag(false);     // палец поехал раньше, чем «подержали», – это прокрутка
    startDishDrag();
  }
  placeDrag();
});
$("dishes").addEventListener("pointerup", e => { if (dd.t && e.pointerId === dd.t.id) endDishDrag(true); });
$("dishes").addEventListener("pointercancel", e => { if (dd.t && e.pointerId === dd.t.id) endDishDrag(true); });
// пока тянем пальцем, ряд не прокручивается под ним и не всплывает меню картинки
$("dishes").addEventListener("touchmove", e => { if (dd.t && dd.t.on) e.preventDefault(); }, { passive: false });
$("dishes").addEventListener("contextmenu", e => { if (dd.t && dd.t.touch) e.preventDefault(); });
$("dishes").addEventListener("click", e => { if (Date.now() - dd.done < 300) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
$("dishes").addEventListener("keydown", e => {
  if (!e.shiftKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight") || !e.target.matches(".dish[data-i]")) return;
  e.preventDefault(); e.stopPropagation();
  const i = +e.target.dataset.i, j = i + (e.key === "ArrowLeft" ? -1 : 1);
  if (j < 0 || j >= P.dishes.length) return;
  moveDish(i, j);
  const el = $("dishes").querySelector(`.dish[data-i="${j}"]`);
  if (el) el.focus();
});

const metaKeys = { mDate: "date", mGroup: "group", mMedium: "medium", mCulture: "culture", mPerson: "person", mOrg: "org", mDishMm: "dishMm" };
for (const id of ["mName", ...Object.keys(metaKeys)]) $(id).addEventListener("input", () => {
  const d = D();
  if (!d) return;
  if (id === "mName") { d.name = $(id).value; $("metaTitle").textContent = `· ${d.name}`; }
  else d.meta[metaKeys[id]] = $(id).value;
  markDirty(); renderDishes();
  if (id === "mOrg") refreshCats();   // другой микроорганизм – другие пороги
});
$("diskMm").addEventListener("input", () => { const d = D(), v = parseFloat($("diskMm").value); if (d && v > 0) { d.diskMm = v; markDirty(); } render(); });
// Яркость / контраст / насыщенность фото в окне разметки – только для глаз: анализ всегда идёт по исходному фото (_base).
// Исправленная копия считается один раз и хранится, пока не сменятся чашка или ползунки
const LOOK_IDS = ["lkBright", "lkContrast", "lkSat"];
let lookCache = null;
function viewBase(d) {
  const v = LOOK_IDS.map(id => +$(id).value);
  if (v.every(x => x === 0)) return d._base;
  const key = v.join(",");
  if (!lookCache || lookCache.base !== d._base || lookCache.key !== key) {
    const c = lookCache && lookCache.base === d._base ? lookCache.c : document.createElement("canvas");
    c.width = d._base.width; c.height = d._base.height;
    adjustInto(d._base, c, v[0], v[1], v[2]);
    lookCache = { base: d._base, key, c };
  }
  return lookCache.c;
}
function lookChanged() {
  const v = LOOK_IDS.map(id => +$(id).value);
  LOOK_IDS.forEach((id, i) => { $(id + "Out").value = v[i]; });
  $("lkReset").disabled = v.every(x => x === 0);
  try { localStorage.setItem("zona-look", JSON.stringify(v)); } catch {}
  draw(); renderSide();
}
for (const id of LOOK_IDS) {
  $(id).addEventListener("input", lookChanged);
  $(id).addEventListener("dblclick", () => { $(id).value = 0; lookChanged(); });
}
$("lkReset").addEventListener("click", () => { for (const id of LOOK_IDS) $(id).value = 0; lookChanged(); });
// Число рядом с ползунком: ввод с клавиатуры двигает ползунок (в его пределах), Enter или уход из поля – поправить запись
for (const num of document.querySelectorAll("input.num")) {
  const range = $(num.id.replace(/Out$/, ""));
  const apply = fix => {
    const v = parseFloat(String(num.value).replace(",", "."));
    if (!isFinite(v)) { if (fix) num.value = range.value; return; }
    const c = Math.min(+range.max, Math.max(+range.min, Math.round(v)));
    if (fix) num.value = c;
    if (+range.value !== c) { range.value = c; range.dispatchEvent(new Event("input")); }
  };
  num.addEventListener("input", () => apply(false));
  num.addEventListener("change", () => apply(true));
  num.addEventListener("keydown", e => { if (e.key === "Enter") { apply(true); num.blur(); } });
}
$("alpha").addEventListener("input", () => {
  const v = +$("alpha").value; P.alpha = v / 100; $("alphaOut").value = v;
  try { localStorage.setItem("zona-vis", String(v)); } catch {}
  draw();
});

$("tableBox").addEventListener("click", e => {
  const tr = e.target.closest("tr[data-i]");
  if (tr) { select(+tr.dataset.i); }
});
$("tableBox").addEventListener("keydown", e => {
  const tr = e.target.closest("tr[data-i]");
  if (tr && e.key === "Enter" && e.target === tr) select(+tr.dataset.i);
});
$("tableBox").addEventListener("input", e => {
  const d = D();
  if (!d || !e.target.matches("input.drug")) return;
  const it = d.items[+e.target.dataset.i];
  it.drug = e.target.value.trim();
  const nm = $("tableBox").querySelector(`.dname[data-i="${e.target.dataset.i}"]`);
  if (nm) nm.textContent = dnameText(it);
  markDirty(); draw(); refreshCats();
});
// Общие пороги по размеру зоны
for (const id of ["gOn", "gS", "gR"]) $(id).addEventListener("input", () => {
  const G = P.general;
  G.on = $("gOn").checked; G.s = parseFloat($("gS").value) || 0; G.r = parseFloat($("gR").value) || 0;
  $("generalBar").classList.toggle("off", !G.on);
  saveBreaks(); markDirty(); refreshCats();
  if (G.on && G.s > 0 && G.r > 0 && G.r > G.s) setMsg(`Порог R (${G.r}) больше порога S (${G.s}) – проверьте: должно быть R ≤ S.`, true);
});
// Пороги: правка на месте, без пересборки таблицы (чтобы курсор оставался в поле)
$("breaksTable").addEventListener("input", e => {
  const el = e.target, b = P.breaks[+el.dataset.b];
  if (!b) return;
  b[el.dataset.k] = el.dataset.k === "drug" ? el.value.trim() : parseFloat(el.value) || 0;
  saveBreaks(); markDirty(); refreshCats();
  const n = P.breaks.filter(x => x.drug && x.s > 0 && x.r > 0).length;
  $("breaksCount").textContent = n ? `· заданы для ${n}` : "· не заданы";
  if (b.s > 0 && b.r > 0 && b.r > b.s) setMsg(`У «${b.drug}» порог R (${b.r}) больше порога S (${b.s}) – проверьте: должно быть R ≤ S.`, true);
});
$("breaksTable").addEventListener("click", e => {
  const x = e.target.closest("[data-bdel]");
  if (!x) return;
  P.breaks.splice(+x.dataset.bdel, 1); saveBreaks(); markDirty(); renderBreaks(); refreshCats();
});
$("breakAdd").addEventListener("click", () => {
  P.breaks.push({ drug: "", s: 0, r: 0 }); saveBreaks(); renderBreaks();
  const ins = $("breaksTable").querySelectorAll('input[data-k="drug"]'); ins[ins.length - 1].focus();
});
$("breakFromDishes").addEventListener("click", () => {
  const have = new Set(P.breaks.map(b => normDrug(b.drug))), add = [];
  for (const d of P.dishes) for (const it of d.items) { const k = normDrug(it.drug); if (k && !have.has(k)) { have.add(k); add.push(it.drug.trim()); } }
  for (const drug of add) P.breaks.push({ drug, s: 0, r: 0 });
  saveBreaks(); renderBreaks();
  setMsg(add.length ? `Добавлены препараты: ${add.join(", ")}. Впишите для них пороги из таблицы EUCAST.` : "Новых препаратов в чашках нет: впишите препараты в колонку «Препарат».");
});
$("zoomDrug").addEventListener("input", () => {
  const d = D(), it = d && d.items[P.sel];
  if (!it) return;
  it.drug = $("zoomDrug").value.trim();
  const f = document.querySelector(`input.drug[data-i="${P.sel}"]`);
  if (f) f.value = it.drug;
  const nm = $("tableBox").querySelector(`.dname[data-i="${P.sel}"]`);
  if (nm) nm.textContent = dnameText(it);
  markDirty(); draw(); refreshCats();
});
$("copyBtn").addEventListener("click", async () => {
  const text = tableRows().map(r => r.map(v => typeof v === "number" ? String(v).replace(".", ",") : v).join("\t")).join("\n");
  const done = () => setMsg("Таблица всех чашек скопирована. Вставьте её в Excel или Word (Ctrl+V).");
  try { await navigator.clipboard.writeText(text); return done(); } catch {}
  // запасной способ: старое копирование через скрытое поле – работает там, где новое запрещено
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  ta.remove();
  if (ok) return done();
  setMsg("Браузер не дал скопировать. Откройте сайт файлом index.html на своём компьютере – там работают и копирование, и скачивание.", true);
});

// Клавиши кнопок инструментов. e.code – физическая клавиша: работает и в русской раскладке (A = Ф, C = С …)
const HOTKEYS = { KeyA: "addBtn", KeyC: "axisBtn", KeyR: "roundBtn", KeyL: "calibBtn", KeyP: "snapEditBtn", KeyF: "focusBtn", KeyT: "toolsToggle",
  Equal: "zoomPlus", NumpadAdd: "zoomPlus", Minus: "zoomMinus", NumpadSubtract: "zoomMinus", Digit0: "zoomFit", Numpad0: "zoomFit" };
document.addEventListener("keydown", e => {
  const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  if (document.querySelector("dialog[open]")) return;   // открыта обрезка или справка
  if (atHome()) return;                                  // на странице выбора датасета клавиши работы с чашками не действуют
  const ctrl = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
  if (ctrl && (key === "s" || key === "ы")) { e.preventDefault(); saveBrowser(); return; }
  if (typing) return;
  if (ctrl && (key === "z" || key === "я") && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (ctrl && (key === "y" || key === "н" || ((key === "z" || key === "я") && e.shiftKey))) { e.preventDefault(); redo(); }
  else if ((e.key === "Delete" || e.key === "Backspace") && P.sel >= 0) { e.preventDefault(); $("delBtn").click(); }
  else if (!ctrl && !e.altKey && HOTKEYS[e.code]) {
    const b = $(HOTKEYS[e.code]);
    if (!b.disabled) { e.preventDefault(); b.click(); }
  }
  else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !ctrl && !e.altKey && P.mode === "idle") {
    e.preventDefault(); stepDish(e.key === "ArrowLeft" ? -1 : 1);       // ← → – предыдущее / следующее фото
  }
  else if (e.key === "Escape") {
    // Esc сначала отменяет режим (добавление зоны, масштаб), а если ничего не было – выходит из «Во весь экран»
    if (P.mode === "idle" && document.body.classList.contains("focus")) return setFocus(false);
    P.calib = null; setMode("idle"); render();
  }
});
window.addEventListener("beforeunload", e => { if (P.dirty) { e.preventDefault(); e.returnValue = ""; } });
// ушли со вкладки (свернули, переключились, закрывают телефоном) – сохраняем сразу, не дожидаясь 2 с
document.addEventListener("visibilitychange", () => { if (document.hidden && P.dirty && !P.saveFailed) saveBrowser(true); });
const stage = $("stage");
stage.addEventListener("dragover", e => { e.preventDefault(); stage.classList.add("drop"); });
stage.addEventListener("dragleave", () => stage.classList.remove("drop"));
stage.addEventListener("drop", e => { e.preventDefault(); stage.classList.remove("drop"); addFiles(e.dataTransfer.files); });
// Вставка из буфера обмена (Ctrl+V): снимок экрана, скопированная картинка из браузера, документа или чата.
// В текстовом поле обычная вставка текста не мешает: перехватываем, только если в буфере есть картинка
document.addEventListener("paste", e => {
  if (document.querySelector("dialog[open]") || atHome()) return;   // открыта обрезка, редактор, справка или выбор датасета
  const items = [...(e.clipboardData ? e.clipboardData.items : [])].filter(it => it.kind === "file" && it.type.startsWith("image/"));
  if (!items.length) return;
  e.preventDefault();
  const t = new Date(), stamp = `${String(t.getDate()).padStart(2, "0")}.${String(t.getMonth() + 1).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}-${String(t.getMinutes()).padStart(2, "0")}`;
  const files = items.map((it, i) => {
    const f = it.getAsFile(), ext = (f.type.split("/")[1] || "png").replace("jpeg", "jpg");
    return new File([f], `Вставка ${stamp}${items.length > 1 ? ` (${i + 1})` : ""}.${ext}`, { type: f.type });
  });
  addFiles(files);
});
// Окно разметки постоянного размера; фото вписывается в него целиком, с сохранением пропорций,
// и увеличивается лупой в P.zoom раз (1 – вписано)
function fitCanvas() {
  const v = $("view"), k = Math.min(v.clientWidth / cv.width, v.clientHeight / cv.height) * P.zoom;
  cv.style.width = Math.floor(cv.width * k) + "px";
  cv.style.height = Math.floor(cv.height * k) + "px";
}
// Лупа: точка фото под (cx, cy) остаётся на месте; без точки – приближаем к центру окна
function setZoom(z, cx, cy) {
  const v = $("view"), was = cv.getBoundingClientRect();
  if (cx === undefined) { const r = v.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
  const fx = (cx - was.left) / was.width, fy = (cy - was.top) / was.height;
  P.zoom = Math.min(8, Math.max(1, z));
  fitCanvas();
  const now = cv.getBoundingClientRect();
  v.scrollLeft += now.left + fx * now.width - cx;
  v.scrollTop += now.top + fy * now.height - cy;
  // фото тащат прямо сейчас: сдвиг дальше считаем от нового места, иначе следующее движение мыши
  // вернёт прокрутку к расчёту до лупы и фото «телепортируется»
  const g = P.drag;
  if (g && g.what === "pan") {
    if (g.cx !== undefined) { g.sx = g.cx; g.sy = g.cy; }
    g.sl = v.scrollLeft; g.st = v.scrollTop;
  } else if (g && g.last && g.cx !== undefined) {   // тащат зону или точку: точка фото под курсором теперь другая
    const b = cv.getBoundingClientRect();
    g.last = { x: (g.cx - b.left) * cv.width / b.width, y: (g.cy - b.top) * cv.height / b.height, k: cv.width / b.width };
  }
  $("zoomOut").textContent = Math.round(P.zoom * 100) + " %";
  $("zoomMinus").disabled = $("zoomFit").disabled = P.zoom <= 1;
  $("zoomPlus").disabled = P.zoom >= 8;
  draw();
}
window.addEventListener("resize", () => { fitCanvas(); draw(); });
$("view").addEventListener("scroll", () => draw(), { passive: true });
$("view").addEventListener("wheel", e => {         // лупа – Shift + колёсико; без Shift страница прокручивается как обычно
  const d = D();
  if (!d || !d._base || !e.shiftKey) return;
  e.preventDefault();
  // с Shift браузеры (Safari на Mac) часто отдают прокрутку как горизонтальную – берём ту ось, что не ноль
  const raw = e.deltaY || e.deltaX, dy = raw * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1);   // строки и страницы – в пиксели
  setZoom(P.zoom * Math.exp(-dy * 0.002), e.clientX, e.clientY);
}, { passive: false });
$("zoomPlus").addEventListener("click", () => setZoom(P.zoom * 1.5));
$("zoomMinus").addEventListener("click", () => setZoom(P.zoom / 1.5));
$("zoomFit").addEventListener("click", () => setZoom(1));

try {
  // видимость разметки; старая настройка «прозрачность» (zona-alpha) переводится: видимость = 100 − прозрачность
  const old = parseInt(localStorage.getItem("zona-alpha"), 10), saved = parseInt(localStorage.getItem("zona-vis"), 10);
  const v = saved >= 0 && saved <= 100 ? saved : old >= 0 && old <= 85 ? 100 - old : NaN;
  if (v >= 0) { $("alpha").value = v; $("alphaOut").value = v; P.alpha = v / 100; }
} catch {}
try {
  const v = JSON.parse(localStorage.getItem("zona-look"));
  if (Array.isArray(v) && v.length === 3) {
    LOOK_IDS.forEach((id, i) => { const x = Math.round(+v[i]); if (x >= -100 && x <= 100) $(id).value = x; });
    LOOK_IDS.forEach(id => { $(id + "Out").value = $(id).value; });
    $("lkReset").disabled = LOOK_IDS.every(id => +$(id).value === 0);
  }
} catch {}
try { const b = JSON.parse(localStorage.getItem("zona-breaks")); if (Array.isArray(b)) P.breaks = b; } catch {}
try { const g = JSON.parse(localStorage.getItem("zona-general")); if (g && typeof g === "object") P.general = { ...P.general, ...g }; } catch {}
try { localStorage.removeItem("zona-templates"); } catch {}     // примеры дисков от убранного автоузнавания больше не нужны
renderBreaks(); renderGeneral();
renderSaveState(); fillMeta(); renderDishes(); fitCanvas(); render();
dsStart();
