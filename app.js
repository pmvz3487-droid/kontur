// ===== Данные: массив занятий и описание фильтруемых характеристик =====
const AS = "Анна Серова", MO = "Максим Орлов", DK = "Дмитрий Козлов", IV = "Игорь Власов", ML = "Мария Лебедева";
const S = (day, time, type, trainer, level, spots) => ({ day, time, type, trainer, level, spots });
const sessions = [
  S("Пн", "07:30", "Йога", AS, "Начальный", 9),
  S("Пн", "12:00", "Пилатес", AS, "Начальный", 7),
  S("Пн", "18:30", "Интервальная тренировка", MO, "Средний", 4),
  S("Пн", "20:00", "Силовая тренировка", IV, "Средний", 8),
  S("Вт", "08:00", "Сайкл", ML, "Средний", 10),
  S("Вт", "18:00", "Бокс", DK, "Начальный", 6),
  S("Вт", "19:30", "Растяжка", ML, "Начальный", 11),
  S("Вт", "20:30", "Йога", AS, "Продвинутый", 3),
  S("Ср", "07:30", "Йога", AS, "Средний", 8),
  S("Ср", "12:00", "Силовая тренировка", IV, "Начальный", 9),
  S("Ср", "18:30", "Интервальная тренировка", MO, "Продвинутый", 2),
  S("Ср", "20:00", "Сайкл", ML, "Средний", 5),
  S("Чт", "08:00", "Пилатес", AS, "Средний", 7),
  S("Чт", "12:30", "Растяжка", ML, "Начальный", 12),
  S("Чт", "18:00", "Бокс", DK, "Средний", 5),
  S("Чт", "19:30", "Силовая тренировка", IV, "Продвинутый", 4),
  S("Пт", "07:30", "Интервальная тренировка", MO, "Средний", 9),
  S("Пт", "12:00", "Йога", AS, "Начальный", 10),
  S("Пт", "18:30", "Сайкл", ML, "Продвинутый", 3),
  S("Пт", "20:00", "Растяжка", ML, "Начальный", 8),
  S("Сб", "10:00", "Интервальная тренировка", MO, "Начальный", 11),
  S("Сб", "11:30", "Йога", AS, "Средний", 6),
  S("Сб", "13:00", "Бокс", DK, "Начальный", 9),
  S("Сб", "15:00", "Силовая тренировка", IV, "Средний", 7),
  S("Вс", "11:00", "Пилатес", AS, "Начальный", 8),
  S("Вс", "12:30", "Растяжка", ML, "Начальный", 12),
  S("Вс", "17:00", "Сайкл", ML, "Начальный", 6)
];
sessions.forEach(s => { const h = +s.time.slice(0, 2); s.part = h < 12 ? "Утро" : h < 18 ? "День" : "Вечер"; });

const properties = { day: "День недели", part: "Время суток", type: "Направление", trainer: "Тренер", level: "Уровень" };
const order = { day: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], part: ["Утро", "День", "Вечер"], level: ["Начальный", "Средний", "Продвинутый"] };

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const word = n => n % 10 === 1 && n % 100 !== 11 ? "место" : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? "места" : "мест";

// ===== Вывод занятий и фильтров =====
function printSessions(arr, selector) {
  const el = $(selector);
  if (!arr.length) { el.innerHTML = '<p class="empty">Нет занятий по выбранным параметрам.</p>'; return; }
  let out = '<table><caption>Групповые занятия</caption><thead><tr><th scope="col">День</th><th scope="col">Время</th><th scope="col">Занятие</th><th scope="col">Тренер</th><th scope="col">Уровень</th><th scope="col">Свободно</th></tr></thead><tbody>';
  for (const s of arr)
    out += `<tr><td>${s.day}</td><td>${s.time}</td><td>${s.type}</td><td>${s.trainer}</td><td>${s.level}</td><td class="${s.spots < 6 ? "low" : ""}">${s.spots}</td></tr>`;
  el.innerHTML = out + "</tbody></table>";
}

function printFilters(arr, props, selector) {
  let out = "";
  for (const p in props) {
    const vals = [...new Set(arr.map(s => s[p]))];
    vals.sort(order[p] ? (a, b) => order[p].indexOf(a) - order[p].indexOf(b) : (a, b) => a.localeCompare(b, "ru"));
    out += `<fieldset><legend>${props[p]}</legend>` +
      vals.map(v => `<label><input type="checkbox" name="${p}" value="${v}"><span>${v}</span><em></em></label>`).join("") + "</fieldset>";
  }
  $(selector).innerHTML = out;
}

// ===== Логика фильтра =====
function readCurFilters() {
  const result = {};
  for (const p in properties)
    result[p] = $$(`#filters input[name="${p}"]:checked`).map(i => i.value);
  return result;
}

// skip - характеристика, которую не учитываем (нужно для «умного» подсчёта)
function applyFilters(data, filter, props, skip) {
  return data.filter(item => Object.keys(props).every(p => p === skip || !filter[p].length || filter[p].includes(item[p])));
}

// Умный фильтр: для каждого значения считаем, сколько занятий останется, если его выбрать
// при текущем выборе в остальных группах. Если 0 - значение блокируется.
function updateAvailability(filter) {
  for (const p in properties) {
    const base = applyFilters(sessions, filter, properties, p);
    $$(`#filters input[name="${p}"]`).forEach(input => {
      const n = base.filter(s => s[p] === input.value).length;
      input.disabled = n === 0 && !input.checked;
      input.parentElement.classList.toggle("off", input.disabled);
      input.parentElement.querySelector("em").textContent = n;
    });
  }
}

function update() {
  const f = readCurFilters();
  const res = applyFilters(sessions, f, properties);
  printSessions(res, "#elements");
  updateAvailability(f);
  const chosen = Object.keys(properties).filter(p => f[p].length).map(p => `${properties[p]}: ${f[p].join(", ")}`);
  $("#summary").textContent = `Найдено занятий: ${res.length} из ${sessions.length}. ` + (chosen.length ? chosen.join(" · ") : "Фильтры не выбраны.");
}

printFilters(sessions, properties, "#groups");
$("#filters").addEventListener("change", update);
$("#reset").addEventListener("click", () => { $$("#filters input").forEach(i => i.checked = false); update(); });
update();

// ===== Блок «Сегодня в клубе» =====
const today = order.day[(new Date().getDay() + 6) % 7];
$("#board").innerHTML = sessions.filter(s => s.day === today).slice(0, 4).map(s =>
  `<li><span class="t">${s.time}</span><span><span class="n">${s.type}</span><br><span class="w">${s.trainer} · ${s.spots} ${word(s.spots)}</span></span></li>`).join("");

// ===== Версии сайта: переключение стилевых файлов без перезагрузки =====
const THEMES = { normal: "css/style.css", print: "css/print.css", low: "css/lowvision.css" };
const root = document.documentElement;
const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

function markPressed(attr, value) {
  $$(`button[data-${attr}]`).forEach(b => b.setAttribute("aria-pressed", b.dataset[attr] === value));
}
function setMode(m) {
  $("#theme").setAttribute("href", THEMES[m]);
  root.dataset.mode = m; save("mode", m); markPressed("mode", m);
  $("#lowTools").hidden = m !== "low";
  $("#doPrint").hidden = m !== "print";
}
function setOption(attr, value) { root.dataset[attr] = value; save(attr, value); markPressed(attr, value); }

$(".toolbar").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.mode) setMode(b.dataset.mode);
  else if (b.dataset.size) setOption("size", b.dataset.size);
  else if (b.dataset.scheme) setOption("scheme", b.dataset.scheme);
  else if (b.id === "doPrint") window.print();
});
setMode(root.dataset.mode || "normal");
markPressed("size", root.dataset.size || "1");
markPressed("scheme", root.dataset.scheme || "bw");

// ===== Форма записи =====
$("#form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#fName").value.trim(), phone = $("#fPhone").value.trim(), err = $("#err");
  if (!name) { err.textContent = "Укажите имя, чтобы администратор знал, как к вам обращаться."; $("#fName").focus(); return; }
  if (phone.replace(/\D/g, "").length < 10) { err.textContent = "Введите телефон полностью, например +7 495 000-00-00."; $("#fPhone").focus(); return; }
  err.textContent = "";
  const safe = t => t.replace(/[<>&]/g, "");
  const done = $("#done");
  done.innerHTML = `<b>Заявка отправлена</b>${safe(name)}, мы позвоним вам на ${safe(phone)} в течение рабочего дня и подберём время для пробной тренировки.`;
  done.hidden = false; e.target.hidden = true;
});
