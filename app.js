// ជម្រើសទាំងនេះត្រូវតែដូចគ្នា (លំដាប់ដូចគ្នា) នឹង DEVICE_TYPES / STATUSES / PRIORITIES ក្នុង bot.py
// ព្រោះយើងបញ្ជូនតែលេខ index ទៅ bot ដើម្បីកុំឱ្យលើសកំណត់ 4096 bytes របស់ Telegram
const TYPES = [
  "💻 Computer-Laptop",
  "📷 Camera-Logitech",
  "📠 Portable-Scanner",
  "👆 Finger-Print",
  "🔋 Power-Bank",
  "🔌 Type-C Hub",
  "📦 Others (ផ្សេងៗ)",
];
const STATUSES = [
  "⚠️ ប្រើបានតែមានភាពរអាក់រអួល",
  "❌ ខូច / ប្រើមិនបាន",
];
const REQUEST_LABEL = "🔄 ស្នើសុំផ្លាស់ប្តូរថ្មី"; // «សំណើ» ជាប៊ូតុងជ្រើស/មិនជ្រើស (checkbox)
const OTHER_INDEX = TYPES.length - 1; // "Others" នៅចុងបញ្ចប់ជានិច្ច
const PRIORITIES = ["🟢 ធម្មតា", "🟡 មធ្យម", "🔴 បន្ទាន់"];
const WEATHERS = ["☀️ ក្តៅ / ភ្លឺ", "⛅ ពពក", "🌧️ ភ្លៀង", "⛈️ ផ្គររន្ទះ"];
const STATES =["✅ គ្មានបញ្ហាសម្ភារៈ", "⚠️ មានបញ្ហាសម្ភារៈ"]; // 0 = គ្មានបញ្ហា, 1 = មានបញ្ហា

const tg = window.Telegram && window.Telegram.WebApp;
// initData ទទេ ពេលបើកពីប៊ូតុង keyboard (ដែលចាំបាច់សម្រាប់ sendData) ដូច្នេះប្រើ platform ជំនួស
const inTelegram = !!(tg && tg.platform && tg.platform !== "unknown");
const MAX_BYTES = 4000; // Telegram sendData អនុញ្ញាតអតិបរមា 4096 bytes

const $ = (id) => document.getElementById(id);
const form = $("form");

// emoji នៅដើមឈ្មោះ ត្រូវបំបែកជាអាយខុន (ឧ. "💻 Computer-Laptop" → 💻 + "Computer-Laptop")
const ICON_RE = /^(\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)\s*(.*)$/u;
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// subs = ពាក្យពណ៌នាខ្លីក្រោមឈ្មោះ (មិនចាំបាច់)
function renderOptions(containerId, items, multi = false, subs = []) {
  const box = $(containerId);
  items.forEach((label, i) => {
    const wrap = el("label", "opt");
    const input = el("input");
    input.type = multi ? "checkbox" : "radio";
    input.name = containerId;
    input.value = String(i);

    const m = label.match(ICON_RE);
    const card = el("span", "card");
    if (m) card.append(el("i", "ico", m[1]));
    const txt = el("span", "txt");
    txt.append(el("span", "t", m ? m[2] : label));
    if (subs[i]) txt.append(el("small", "s", subs[i]));
    card.append(txt, el("em", "mark"));

    wrap.append(input, card);
    box.append(wrap);
  });
}

function selected(name) {
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? Number(el.value) : null;
}

function selectedAll(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => Number(el.value));
}

function collect() {
  const state = selected("state");
  const w = selected("weather"); // ចាំបាច់ត្រូវជ្រើស (validate() ពិនិត្យ)
  if (state === 0) return { ok: true, w }; // គ្មានបញ្ហា: មិនបញ្ជូនអ្វីផ្សេងទៀត
  return {
    ok: state === 1 ? false : null,
    w,
    t: selectedAll("type"),
    o: $("other").value.trim(),
    s: selected("status"),
    x: $("detail").value.trim(),
    q: selectedAll("request").length ? 1 : 0,
    p: selected("priority"),
  };
}

function validate(data) {
  const issue = data.ok === false;
  const missing = {
    weather: data.w === null,
    state: data.ok === null,
    type: issue && data.t.length === 0,
    other: issue && data.t.includes(OTHER_INDEX) && !data.o,
    status: issue && data.s === null,
    priority: issue && data.p === null,
  };
  let first = null;
  document.querySelectorAll(".field").forEach((f) => {
    const bad = !!missing[f.dataset.field];
    f.classList.toggle("invalid", bad);
    if (bad && !first) first = f;
  });
  if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  return !first;
}

function submit() {
  const data = collect();
  if (!validate(data)) {
    if (inTelegram) tg.HapticFeedback.notificationOccurred("error");
    return;
  }
  const payload = JSON.stringify(data);
  if (new TextEncoder().encode(payload).length > MAX_BYTES) {
    const msg = "ព័ត៌មានវែងពេក សូមកាត់បន្ថយការពិពណ៌នា";
    inTelegram ? tg.showAlert(msg) : alert(msg);
    return;
  }
  if (inTelegram) {
    tg.HapticFeedback.notificationOccurred("success");
    tg.sendData(payload); // Telegram បិទ Mini App ដោយស្វ័យប្រវត្តិ
  } else {
    // បើកក្រៅ Telegram (សាកល្បង) - គ្រាន់តែបង្ហាញទិន្នន័យ
    console.log("payload:", payload);
    alert("(សាកល្បង) ទិន្នន័យ:\n" + payload);
  }
}

// កាលបរិច្ឆេទថ្ងៃនេះ (ម៉ោងកម្ពុជា UTC+7 ទោះទូរស័ព្ទកំណត់ម៉ោងផ្សេង)
function todayKh() {
  const days = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
  const months = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
                  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
  const kh = (n) => String(n).replace(/\d/g, (d) => "០១២៣៤៥៦៧៨៩"[d]);
  const d = new Date(Date.now() + (7 * 60 + new Date().getTimezoneOffset()) * 60000);
  return `ថ្ងៃ${days[d.getDay()]} ទី${kh(d.getDate())} ខែ${months[d.getMonth()]} ឆ្នាំ${kh(d.getFullYear())}`;
}
$("today").textContent = todayKh();

renderOptions("weather", WEATHERS);
renderOptions("state", STATES, false, ["ថ្ងៃនេះសម្ភារៈទាំងអស់ដំណើរការធម្មតា", "មានសម្ភារៈខូច ឬដំណើរការមិនល្អ"]);
renderOptions("type", TYPES, true);
renderOptions("status", STATUSES, false, ["នៅតែប្រើបាន ប៉ុន្តែមានបញ្ហាតិចតួច", "មិនអាចប្រើប្រាស់បានទេ"]);
renderOptions("request", [REQUEST_LABEL], true, ["បើកប្រសិនបើត្រូវការសម្ភារៈថ្មីជំនួស"]);
renderOptions("priority", PRIORITIES);

// ញ័របន្តិចពេលជ្រើស (Telegram ជំនាន់ថ្មីប៉ុណ្ណោះ)
function tick() {
  try { if (inTelegram) tg.HapticFeedback.selectionChanged(); } catch (_) { /* មិនគាំទ្រ */ }
}

// បង្ហាញប្រអប់បញ្ជាក់ ពេលជ្រើស Others
form.addEventListener("change", (e) => {
  tick();
  if (e.target.name === "state") {
    const issue = Number(e.target.value) === 1;
    $("issueFields").hidden = !issue;
    const label = issue ? "បញ្ជូនរបាយការណ៍" : "✅ បញ្ជូន: គ្មានបញ្ហា";
    if (inTelegram) tg.MainButton.setText(label);
    $("fallbackSubmit").textContent = label;
    return;
  }
  if (e.target.name !== "type") return;
  const otherOn = selectedAll("type").includes(OTHER_INDEX);
  $("otherField").hidden = !otherOn;
  if (otherOn && Number(e.target.value) === OTHER_INDEX) $("other").focus();
});

// លុបសញ្ញាកំហុសពេលអ្នកប្រើកែតម្រូវ
form.addEventListener("input", (e) => {
  const f = e.target.closest(".field");
  if (f) f.classList.remove("invalid");
});
$("detail").addEventListener("input", (e) => {
  $("count").textContent = e.target.value.length;
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  submit();
});

if (inTelegram) {
  tg.ready();
  tg.expand();
  try { // ឱ្យរបារ Telegram ស្របពណ៌ទំព័រ
    tg.setHeaderColor("secondary_bg_color");
    tg.setBackgroundColor("secondary_bg_color");
  } catch (_) { /* ជំនាន់ចាស់ */ }
  // ឈ្មោះអ្នករាយការណ៍ មិនបង្ហាញក្នុង form ទេ ព្រោះ bot យកពីគណនី Telegram ដោយខ្លួនឯង
  tg.MainButton.setText("បញ្ជូនរបាយការណ៍");
  tg.MainButton.onClick(submit);  tg.MainButton.show();
} else {
  $("fallbackSubmit").hidden = false;
}
