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
    const dial = qs("[data-dial]");
    if (dial) {
      payload.slow_days = qsa(".day.on", dial).map((d) => d.dataset.day).join(",");
      payload.slow_from = qs("[data-from]", dial).value;
      payload.slow_to = qs("[data-to]", dial).value;
      const place = qs(".choice.on", dial);
      payload.place = place ? place.dataset.place : "";
      payload.deal = qs("[data-deal]", dial).classList.contains("on") ? "yes" : "no";
      payload.perk_note = qs("[data-perk]", dial).value;
    }
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

function wireOffer() {
  const dial = qs("[data-dial]");
  if (!dial) return;
  qsa(".choice", dial).forEach((choice) => {
    choice.addEventListener("click", () => {
      qsa(".choice", dial).forEach((c) => c.classList.remove("on"));
      choice.classList.add("on");
    });
  });
  const deal = qs("[data-deal]", dial);
  const note = qs(".deal-note", dial);
  deal.addEventListener("click", () => {
    const on = deal.classList.toggle("on");
    deal.setAttribute("aria-pressed", on ? "true" : "false");
    note.hidden = !on;
  });
}

function wireDays() {
  const dial = qs("[data-dial]");
  if (!dial) return;
  const from = qs("[data-from]", dial);
  const to = qs("[data-to]", dial);
  const read = qs("[data-read]", dial);
  const paint = () => {
    const days = qsa(".day.on", dial).map((d) => d.dataset.day);
    const fmt = (value) => {
      const [h, m] = value.split(":").map(Number);
      const hour = h % 12 || 12;
      return hour + ":" + String(m).padStart(2, "0") + (h < 12 ? " AM" : " PM");
    };
    read.textContent = days.length
      ? days.join(", ") + " · " + fmt(from.value) + "–" + fmt(to.value)
      : "No days selected. AVI will not push.";
  };
  qsa(".day", dial).forEach((day) => day.addEventListener("click", () => { day.classList.toggle("on"); paint(); }));
  from.addEventListener("change", paint);
  to.addEventListener("change", paint);
  paint();
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
      .hero { min-height: 100svh !important; height: 100svh !important; padding: 72px 0 28px !important; align-items: end; }
      .page { height: 100svh !important; min-height: 100svh !important; max-height: 100svh !important; overflow: hidden; scroll-snap-align: start; scroll-snap-stop: always; }
      .page > .wrap { max-height: calc(100svh - 88px); overflow: auto; }
      .hero-copy { display: flex !important; flex-direction: column !important; align-items: stretch !important; width: min(100% - 28px, 1180px) !important; }
      .hero-left, .hero-right { width: 100% !important; }
      h1 { font-size: 40px !important; }
      h2 { font-size: 32px !important; }
      .lede, .sub { font-size: 16px; }
      .hero-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .hero-actions .btn { width: auto; padding: 0 16px; }
      .btn-wide { width: 100%; }
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
  wireOffer();
  hideBrokenMedia();
  wireForm(qs("[data-vendor-form]"), "vendors", FORMSPREE_VENDOR);
  wireForm(qs("[data-waitlist-form]"), "waitlist", FORMSPREE_WAITLIST);
});

function wirePager() {
  const links = [...document.querySelectorAll(".pager a")];
  const pages = [...document.querySelectorAll(".page")];
  if (!links.length || !pages.length) return;
  const mark = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = pages[0].id;
    pages.forEach((p) => { if (p.offsetTop <= y) current = p.id; });
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  };
  window.addEventListener("scroll", mark, { passive: true });
  mark();
}
function wireSnap() {
  if (!window.matchMedia("(max-width: 900px)").matches) return;
  const pages = () => [...document.querySelectorAll(".page")];
  const fit = () => {
    const h = window.innerHeight;
    pages().forEach((page) => {
      page.style.height = h + "px";
      page.style.minHeight = h + "px";
      page.style.maxHeight = h + "px";
    });
  };
  fit();
  window.addEventListener("resize", fit);
  let timer;
  let locked = false;
  const nearest = () => {
    const y = window.scrollY;
    return pages().reduce((best, page) => {
      const dist = Math.abs(page.offsetTop - y);
      return dist < best.dist ? { page, dist } : best;
    }, { page: pages()[0], dist: Infinity }).page;
  };
  const settle = () => {
    const page = nearest();
    if (!page) return;
    const top = page.offsetTop;
    if (Math.abs(top - window.scrollY) < 2) return;
    locked = true;
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => { locked = false; }, 500);
  };
  window.addEventListener("scroll", () => {
    if (locked) return;
    clearTimeout(timer);
    timer = setTimeout(settle, 120);
  }, { passive: true });
  window.addEventListener("touchend", () => {
    clearTimeout(timer);
    timer = setTimeout(settle, 90);
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", wireSnap);
