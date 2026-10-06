const FORMSPREE_VENDOR = "";
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

function hideBrokenMedia() {
  qsa("img").forEach((img) => {
    const drop = () => {
      img.classList.add("is-broken");
      const frame = img.closest("figure, .frame, .shot");
      if (frame) frame.classList.add("is-broken");
    };
    if (img.complete && img.naturalWidth === 0) drop();
    img.addEventListener("error", drop);
  });
}

function injectMobile() {
  const css = document.createElement("style");
  css.textContent = `
    img.is-broken, figure.is-broken, .frame.is-broken { display: none !important; }
    @media (max-width: 900px) {
      html, body { overflow-x: hidden; }
      .wrap { width: min(100% - 28px, 1180px); }
      .nav-inner { height: 60px; gap: 8px; }
      .brand { font-size: 12px; }
      .brand img { width: 34px; height: 34px; }
      .nav-links, .nav-cta .btn { display: none !important; }
      .menu-btn { display: grid !important; place-items: center; }
      .mobile-panel { inset: 68px 14px auto; }
      .mobile-panel a { min-height: 48px; display: flex; align-items: center; font-size: 16px; }
      .hero { min-height: 0 !important; padding: 28px 0 8px !important; align-items: start; }
      h1 { font-size: 40px !important; }
      h2 { font-size: 32px !important; }
      .lede, .sub { font-size: 16px; }
      .hero-actions { display: grid; grid-template-columns: 1fr; }
      .hero-actions .btn, .btn-wide { width: 100%; }
      .hero-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .film { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; margin-top: 16px; }
      .shot { flex: 0 0 78%; min-height: 160px; scroll-snap-align: start; }
      .shot img, .frame img { height: 160px; min-height: 160px; }
      .frame { min-height: 0; }
      .section { padding: 40px 0; }
      .cards-3, .cards-4, .split, .grid-2 { grid-template-columns: 1fr !important; }
      .card, .form-card, .locals { padding: 16px; min-height: 0; }
      .field input, .field textarea, .field select { font-size: 16px; }
      .legal { flex-direction: column; }
    }
  `;
  document.head.appendChild(css);
}

document.addEventListener("DOMContentLoaded", () => {
  injectMobile();
  wireMenu();
  wireDays();
  hideBrokenMedia();
  wireForm(qs("[data-vendor-form]"), "vendors", FORMSPREE_VENDOR);
  wireForm(qs("[data-waitlist-form]"), "waitlist", FORMSPREE_WAITLIST);
});
