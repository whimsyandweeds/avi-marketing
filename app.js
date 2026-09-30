const FORMSPREE_VENDOR = ""; // paste https://formspree.io/f/xxxxx later
const FORMSPREE_WAITLIST = "";

const logoSvg = `
<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <path d="M32 8 L52 52 H44.5 L32 22 L19.5 52 H12 L32 8Z" stroke="#d4a574" stroke-width="2.2" fill="none"/>
  <path d="M22 40 H42" stroke="#d4a574" stroke-width="2.2"/>
</svg>`;

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function saveLead(bucket, payload) {
  const key = `avi_${bucket}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push({ ...payload, captured_at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(existing));
}

async function postLead(endpoint, payload) {
  if (!endpoint) return { ok: false, skipped: true };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok };
}

function serializeForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  qsa(".checks input:checked", form).forEach((el) => {
    const name = el.name;
    if (!data[name]) data[name] = [];
    if (!Array.isArray(data[name])) data[name] = [data[name]];
    if (!data[name].includes(el.value)) data[name].push(el.value);
  });
  return data;
}

function wireForm(form, bucket, endpoint) {
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = serializeForm(form);
    saveLead(bucket, payload);
    form.querySelector("button[type=submit]").disabled = true;
    form.querySelector("button[type=submit]").textContent = "Sending…";
    try {
      await postLead(endpoint, payload);
    } catch (_) { /* local save still succeeded */ }
    form.classList.add("hidden");
    form.style.display = "none";
    const success = form.parentElement.querySelector(".form-success");
    if (success) success.classList.add("show");
  });
}

function wireMenu() {
  const btn = qs("[data-menu]");
  const panel = qs("[data-panel]");
  if (!btn || !panel) return;
  btn.addEventListener("click", () => {
    const open = panel.style.display === "block";
    panel.style.display = open ? "none" : "block";
  });
}

function wireCities() {
  qsa("[data-city]").forEach((chip) => {
    chip.addEventListener("click", () => {
      qsa("[data-city]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const input = qs("[name=requested_city]");
      if (input) input.value = chip.dataset.city;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  qsa("[data-logo]").forEach((el) => { el.innerHTML = logoSvg; });
  wireMenu();
  wireCities();
  wireForm(qs("[data-vendor-form]"), "vendors", FORMSPREE_VENDOR);
  wireForm(qs("[data-waitlist-form]"), "waitlist", FORMSPREE_WAITLIST);
});
