// ជម្រើសទាំងនេះត្រូវតែដូចគ្នា (លំដាប់ដូចគ្នា) នឹង DEVICE_TYPES / STATUSES / PRIORITIES ក្នុង bot.py
// ព្រោះយើងបញ្ជូនតែលេខ index ទៅ bot ដើម្បីកុំឱ្យលើសកំណត់ 4096 bytes របស់ Telegram
const TYPES = [
  "🖥️ កុំព្យូទ័រតុ (Desktop)",
  "💻 កុំព្យូទ័រយួរដៃ (Laptop)",
  "🖨️ ម៉ាស៊ីនព្រីន (Printer)",
  "🖵 ម៉ូនីទ័រ (Monitor)",
  "🌐 បណ្តាញ (Router/Switch/WiFi)",
  "🔋 ឧបករណ៍បម្រុងភ្លើង (UPS)",
  "⌨️ ក្តារចុច/ម៉ៅស៍",
  "📦 ផ្សេងៗ",
];
const STATUSES = [
  "✅ ប្រើបានល្អ",
  "⚠️ ប្រើបាន តែមានបញ្ហា",
  "❌ ខូច / ប្រើមិនបាន",
  "🔧 កំពុងជួសជុល",
];
const PRIORITIES = ["🟢 ធម្មតា", "🟡 មធ្យម", "🔴 បន្ទាន់"];

const tg = window.Telegram && window.Telegram.WebApp;
const inTelegram = !!(tg && tg.initData);
const MAX_BYTES = 4000; // Telegram sendData អនុញ្ញាតអតិបរមា 4096 bytes

const $ = (id) => document.getElementById(id);
const form = $("form");

function renderOptions(containerId, items) {
  const box = $(containerId);
  items.forEach((label, i) => {
    const wrap = document.createElement("label");
    wrap.className = "opt";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = containerId;
    input.value = String(i);
    const text = document.createElement("span");
    text.textContent = label;
    wrap.append(input, text);
    box.append(wrap);
  });
}

function selected(name) {
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? Number(el.value) : null;
}

function collect() {
  return {
    d: $("dept").value.trim(),
    t: selected("type"),
    a: $("asset").value.trim(),
    s: selected("status"),
    x: $("detail").value.trim(),
    p: selected("priority"),
  };
}

function validate(data) {
  const missing = {
    dept: !data.d,
    type: data.t === null,
    status: data.s === null,
    priority: data.p === null,
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

renderOptions("type", TYPES);
renderOptions("status", STATUSES);
renderOptions("priority", PRIORITIES);

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
  const u = tg.initDataUnsafe && tg.initDataUnsafe.user;
  // ឈ្មោះពិតប្រាកដយកដោយ bot ពី Telegram; ត្រង់នេះគ្រាន់តែបង្ហាញឱ្យអ្នកប្រើឃើញ
  if (u) {
    $("reporterName").textContent = [u.first_name, u.last_name].filter(Boolean).join(" ");
    $("reporter").hidden = false;
  }
  tg.MainButton.setText("បញ្ជូនរបាយការណ៍");
  tg.MainButton.onClick(submit);
  tg.MainButton.show();
} else {
  $("fallbackSubmit").hidden = false;
}
