const FORMSPREE_VENDOR = ""; // paste https://formspree.io/f/xxxxx
const FORMSPREE_WAITLIST = "";

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
  return Object.fromEntries(new FormData(form).entries());
}

function wireForm(form, bucket, endpoint) {
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = serializeForm(form);
    const days = qsa(".day.on").map((d) => d.dataset.day).filter(Boolean);
    if (days.length) payload.slow_days = days.join(",");
    saveLead(bucket, payload);
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    button.textContent = "Sending…";
    try { await postLead(endpoint, payload); } catch (_) {}
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
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  });
  qsa("a", panel).forEach((a) => a.addEventListener("click", () => { panel.style.display = "none"; }));
}

function wireDays() {
  qsa(".day").forEach((day) => {
    day.addEventListener("click", () => day.classList.toggle("on"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireMenu();
  wireDays();
  wireForm(qs("[data-vendor-form]"), "vendors", FORMSPREE_VENDOR);
  wireForm(qs("[data-waitlist-form]"), "waitlist", FORMSPREE_WAITLIST);
});
