const LEAD_INBOX = "whimsyandweeds@gmail.com";
const FORMSPREE_VENDOR = "https://formsubmit.co/ajax/" + LEAD_INBOX;
const FORMSPREE_WAITLIST = "https://formsubmit.co/ajax/" + LEAD_INBOX;

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
      const fixed = qs("[data-fixed]", dial);
      const moving = fixed && !fixed.classList.contains("on");
      const place = moving ? qs(".choice[data-place].on", dial) : null;
      payload.place = moving && place ? place.dataset.place : "Shop";
      payload.spot = moving ? qs("[data-spot]", dial).value : "";
      payload.pin = qs("[data-pin]", dial).value;
      const dealOn = qs("[data-deal]", dial).classList.contains("on");
      payload.deal = dealOn ? "yes" : "no";
      const customOn = qs("[data-custom]", dial).classList.contains("on");
      payload.perk = customOn ? "custom" : qs("[data-range]", dial).value + "% off";
      payload.perk_note = customOn ? qs("[data-perk]", dial).value : "";
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

function wirePin() {
  const dial = qs("[data-dial]");
  if (!dial) return;
  const input = qs("[data-pin]", dial);
  const list = qs("[data-pin-list]", dial);
  const here = { lat: 36.1699, lon: -115.1398 };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { here.lat = pos.coords.latitude; here.lon = pos.coords.longitude; },
      () => {},
      { enableHighAccuracy: false, timeout: 4000 }
    );
  }
  let timer;
  const search = async () => {
    const q = input.value.trim();
    if (q.length < 3) { list.hidden = true; return; }
    const url = "https://photon.komoot.io/api/?limit=5&lat=" + here.lat + "&lon=" + here.lon + "&q=" + encodeURIComponent(q);
    try {
      const res = await fetch(url);
      const data = await res.json();
      const hits = data.features || [];
      if (!hits.length) { list.hidden = true; return; }
      list.innerHTML = hits.map((hit) => {
        const p = hit.properties || {};
        const title = p.name || [p.street, p.housenumber].filter(Boolean).join(" ");
        const meta = [p.street, p.city, p.state].filter(Boolean).join(", ");
        const label = [title, meta].filter(Boolean).join(", ");
        return "<button type='button' data-label='" + label.replaceAll("'", "") + "'>" + title + "<small>" + meta + "</small></button>";
      }).join("");
      list.hidden = false;
      qsa("button", list).forEach((btn) => btn.addEventListener("click", () => {
        input.value = btn.dataset.label;
        list.hidden = true;
      }));
    } catch (_) { list.hidden = true; }
  };
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 220); });
  input.addEventListener("blur", () => setTimeout(() => { list.hidden = true; }, 180));
}

function wireOffer() {
  const dial = qs("[data-dial]");
  if (!dial) return;
  const fixed = qs("[data-fixed]", dial);
  const move = qs(".move-note", dial);
  fixed.addEventListener("click", () => {
    const on = fixed.classList.toggle("on");
    fixed.setAttribute("aria-pressed", on ? "true" : "false");
    move.hidden = on;
  });
  qsa(".choice[data-place]", dial).forEach((choice) => {
    choice.addEventListener("click", () => {
      qsa(".choice[data-place]", dial).forEach((c) => c.classList.remove("on"));
      choice.classList.add("on");
    });
  });
  const deal = qs("[data-deal]", dial);
  const note = qs(".deal-note", dial);
  const custom = qs("[data-custom]", dial);
  const box = qs("[data-perk]", dial);
  const range = qs("[data-range]", dial);
  const pct = qs("[data-pct]", dial);
  const rangeWrap = qs("[data-range-wrap]", dial);
  range.addEventListener("input", () => { pct.textContent = range.value + "%"; });
  custom.addEventListener("mousedown", (e) => e.preventDefault());
  custom.addEventListener("click", () => {
    const on = custom.classList.toggle("on");
    box.hidden = !on;
    rangeWrap.hidden = on;
    if (on) setTimeout(() => box.focus(), 30);
  });
  box.addEventListener("mousedown", (e) => e.stopPropagation());
  box.addEventListener("click", (e) => e.stopPropagation());
  const help = qs("[data-help]", dial);
  const helpNote = qs(".help-note", dial);
  help.addEventListener("click", () => { helpNote.hidden = !helpNote.hidden; });
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
      .nav-links { display: flex !important; gap: 6px; }
      .nav-links a { min-height: 34px; padding: 0 12px; font-size: 13px; }
      .nav-cta .btn { display: none !important; }
      .menu-btn { display: none !important; }
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
  wirePin();
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
