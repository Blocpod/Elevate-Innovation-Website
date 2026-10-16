import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   Smooth scroll (Lenis) driving GSAP ScrollTrigger
------------------------------------------------------------ */
const lenis = new Lenis({ lerp: 0.1, smoothWheel: !prefersReduced });
(window as unknown as { __lenis: Lenis }).__lenis = lenis;
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ------------------------------------------------------------
   Pixel-grid entrance (CNC raster dissolve)
------------------------------------------------------------ */
function pixelIntro() {
  const overlay = document.querySelector<HTMLElement>(".pixel-overlay");
  if (!overlay) return;
  const cols = Math.ceil(window.innerWidth / 90);
  const rows = Math.ceil(window.innerHeight / 90);
  overlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  overlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  const cells: HTMLElement[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const s = document.createElement("span");
    overlay.appendChild(s);
    cells.push(s);
  }
  if (prefersReduced) {
    overlay.classList.add("done");
    revealHero(true);
    return;
  }
  gsap.to(cells, {
    opacity: 0,
    duration: 0.001,
    stagger: { each: 0.012, from: "random" },
    delay: 0.35,
    onComplete: () => overlay.classList.add("done"),
  });
  // a few cells flash orange on their way out
  cells
    .filter(() => Math.random() < 0.08)
    .forEach((c) => {
      c.style.background = "var(--orange)";
    });
  revealHero(false);
}

/* ------------------------------------------------------------
   Hero
------------------------------------------------------------ */
function splitChars(el: Element) {
  const text = el.textContent ?? "";
  el.textContent = "";
  el.setAttribute("aria-label", text);
  const frag = document.createDocumentFragment();
  for (const ch of text) {
    const wrap = document.createElement("span");
    wrap.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;";
    wrap.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.className = "char";
    inner.textContent = ch === " " ? " " : ch;
    wrap.appendChild(inner);
    frag.appendChild(wrap);
  }
  el.appendChild(frag);
  return el.querySelectorAll<HTMLElement>(".char");
}

function revealHero(instant: boolean) {
  const w1 = document.querySelector(".hero-word.w1");
  const w2 = document.querySelector(".hero-word.w2");
  if (!w1 || !w2) return;
  const c1 = splitChars(w1);
  const c2 = splitChars(w2);
  const meta = document.querySelectorAll(".hero-meta > *");
  if (instant) {
    gsap.set([c1, c2], { y: 0 });
    gsap.set(meta, { opacity: 1 });
    return;
  }
  gsap.set(meta, { opacity: 0, y: 14 });
  const tl = gsap.timeline({ delay: 0.7 });
  tl.to(c1, { y: 0, duration: 1.1, ease: "power4.out", stagger: 0.035 })
    .to(c2, { y: 0, duration: 1.1, ease: "power4.out", stagger: 0.03 }, 0.18)
    .to(meta, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.09 }, 0.65);

  // slight scroll parallax on the two words
  gsap.to(".hero-word.w1", {
    xPercent: -6,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero-word.w2", {
    xPercent: 5,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
}

/* ------------------------------------------------------------
   Hero canvas — the Λ mark assembled from fabrication units
------------------------------------------------------------ */
function heroCanvas() {
  const canvas = document.querySelector<HTMLCanvasElement>("#hero-canvas");
  if (!canvas || prefersReduced) return;
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio, 2);
  let W = 0, H = 0;

  interface P { hx: number; hy: number; x: number; y: number; vx: number; vy: number; s: number; c: string; }
  let parts: P[] = [];

  function build() {
    const rect = canvas!.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas!.width = W * dpr; canvas!.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = [];
    // sample the Λ glyph
    const off = document.createElement("canvas");
    off.width = 120; off.height = 120;
    const octx = off.getContext("2d")!;
    octx.font = "900 130px Archivo, sans-serif";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText("Λ", 60, 70);
    const data = octx.getImageData(0, 0, 120, 120).data;
    const step = 3;
    for (let y = 0; y < 120; y += step) {
      for (let x = 0; x < 120; x += step) {
        if (data[(y * 120 + x) * 4 + 3] > 128) {
          const hx = (x / 120) * W * 0.82 + W * 0.09;
          const hy = (y / 120) * H * 0.82 + H * 0.09;
          const r = Math.random();
          parts.push({
            hx, hy,
            x: hx + (Math.random() - 0.5) * W * 0.9,
            y: hy + (Math.random() - 0.5) * H * 0.9,
            vx: 0, vy: 0,
            s: W * 0.016 * (0.6 + Math.random() * 0.7),
            c: r < 0.82 ? "#f16725" : r < 0.93 ? "#094e79" : "#16181a",
          });
        }
      }
    }
  }

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener("pointermove", (e) => {
    const r = canvas!.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  let scrollDrift = 0;
  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => (scrollDrift = self.progress),
  });

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      const tx = p.hx;
      const ty = p.hy + scrollDrift * H * 0.55;
      let ax = (tx - p.x) * 0.045;
      let ay = (ty - p.y) * 0.045;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 110 * 110) {
        const d = Math.sqrt(d2) || 1;
        const f = ((110 - d) / 110) * 5.2;
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
      p.vx = (p.vx + ax) * 0.86;
      p.vy = (p.vy + ay) * 0.86;
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 1 - scrollDrift * 0.9;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  // ensure font is ready so glyph sampling works
  document.fonts.ready.then(() => {
    build();
    tick();
  });
  window.addEventListener("resize", build);
}

/* ------------------------------------------------------------
   Statement lines (masked rise on enter)
------------------------------------------------------------ */
function statements() {
  document.querySelectorAll<HTMLElement>(".statement-line .inner").forEach((el) => {
    gsap.to(el, {
      y: 0,
      duration: prefersReduced ? 0 : 1.05,
      ease: "power4.out",
      scrollTrigger: { trigger: el.parentElement, start: "top 88%" },
    });
  });
}

/* ------------------------------------------------------------
   Section heads: plumb line grows, heading rises
------------------------------------------------------------ */
function sectionHeads() {
  document.querySelectorAll<HTMLElement>(".section-head").forEach((head) => {
    const plumb = head.querySelector(".plumb");
    const h2 = head.querySelector("h2");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: head, start: "top 80%" },
    });
    if (prefersReduced) return;
    tl.from(plumb, { scaleY: 0, transformOrigin: "top", duration: 0.9, ease: "power3.inOut" })
      .from(h2, { yPercent: 60, opacity: 0, duration: 0.9, ease: "power4.out" }, "-=0.35");
  });
}

/* ------------------------------------------------------------
   Capabilities rows: rise stagger
------------------------------------------------------------ */
function capabilities() {
  document.querySelectorAll<HTMLElement>(".caps-item").forEach((item) => {
    if (prefersReduced) return;
    gsap.from(item.querySelectorAll(".idx, h3, p"), {
      y: 34,
      opacity: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.07,
      scrollTrigger: { trigger: item, start: "top 88%" },
    });
  });
}

/* ------------------------------------------------------------
   Process — pinned scrubbed sequence
------------------------------------------------------------ */
function processSection() {
  const steps = gsap.utils.toArray<HTMLElement>(".process-step");
  const segs = gsap.utils.toArray<HTMLElement>(".process-progress .seg i");
  if (!steps.length) return;

  gsap.set(steps[0], { opacity: 1 });
  gsap.set(segs[0], { scaleX: 1 });

  if (prefersReduced) {
    // static fallback: show all stacked
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".process",
      start: "top top",
      end: "+=" + steps.length * 90 + "%",
      scrub: 0.6,
      pin: ".process .stage",
      pinSpacing: true,
    },
  });

  steps.forEach((step, i) => {
    if (i === 0) {
      tl.fromTo(step.querySelector(".medium"), { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "none" }, 0);
      return;
    }
    const pos = i;
    tl.to(steps[i - 1], { opacity: 0, y: -40, duration: 0.3, ease: "none" }, pos)
      .fromTo(step, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "none" }, pos + 0.32)
      .fromTo(step.querySelector(".medium"), { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.4, ease: "none" }, pos + 0.38)
      .to(segs[i], { scaleX: 1, duration: 0.3, ease: "none" }, pos + 0.35);
  });
  tl.to({}, { duration: 0.5 }); // hold at end
}

/* ------------------------------------------------------------
   Catalog cards: staggered rise
------------------------------------------------------------ */
function catalogGrid() {
  const items = gsap.utils.toArray<HTMLElement>(".catalog-item");
  if (!items.length || prefersReduced) return;
  items.forEach((item, i) => {
    gsap.from(item, {
      y: 48,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: item, start: "top 90%" },
    });
  });
}

/* ------------------------------------------------------------
   Work items: parallax media + clip reveal
------------------------------------------------------------ */
function workItems() {
  document.querySelectorAll<HTMLElement>(".work-media").forEach((media) => {
    const inner = media.querySelector(".media-inner");
    if (!inner || prefersReduced) return;
    gsap.fromTo(
      inner,
      { yPercent: -9 },
      {
        yPercent: 9,
        ease: "none",
        scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
    gsap.fromTo(
      media,
      { clipPath: "inset(0 6% 14% 6%)" },
      {
        clipPath: "inset(0 0% 0% 0%)",
        ease: "none",
        scrollTrigger: { trigger: media, start: "top 95%", end: "top 35%", scrub: true },
      }
    );
  });
  document.querySelectorAll<HTMLElement>(".work-index").forEach((idx) => {
    if (prefersReduced) return;
    gsap.from(idx, {
      xPercent: -4,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: idx, start: "top 90%" },
    });
  });
}

/* ------------------------------------------------------------
   Client rows: cascade in
------------------------------------------------------------ */
function clientRows() {
  document.querySelectorAll<HTMLElement>(".client-row").forEach((row) => {
    if (prefersReduced) return;
    gsap.from(row.querySelector(".row-inner"), {
      yPercent: 100,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: row, start: "top 92%" },
    });
  });
}

/* ------------------------------------------------------------
   Footer wordmark rise
------------------------------------------------------------ */
function footerReveal() {
  const wm = document.querySelector(".footer-wordmark");
  if (!wm || prefersReduced) return;
  gsap.from(wm.children, {
    yPercent: 110,
    duration: 1.1,
    ease: "power4.out",
    stagger: 0.08,
    scrollTrigger: { trigger: wm, start: "top 94%" },
  });
}

/* ------------------------------------------------------------
   Cursor orb
------------------------------------------------------------ */
function cursor() {
  const orb = document.querySelector<HTMLElement>(".cursor-orb");
  if (!orb || window.matchMedia("(hover: none)").matches) return;
  const pos = { x: -100, y: -100 };
  const target = { x: -100, y: -100 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    document.body.classList.add("cursor-active");
  });
  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.18;
    pos.y += (target.y - pos.y) * 0.18;
    orb.style.transform = `translate(${pos.x - 11}px, ${pos.y - 11}px)`;
  });
  document.querySelectorAll("a, button, .caps-item, .client-row").forEach((el) => {
    el.addEventListener("pointerenter", () => orb.classList.add("is-hover"));
    el.addEventListener("pointerleave", () => orb.classList.remove("is-hover"));
  });
}

/* ------------------------------------------------------------
   Live clock (Fort Lauderdale, ET)
------------------------------------------------------------ */
function clock() {
  const el = document.querySelector("#local-time");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
  });
  const set = () => (el.textContent = fmt.format(new Date()) + " ET");
  set();
  setInterval(set, 30_000);
}

/* ------------------------------------------------------------
   Anchor nav via Lenis
------------------------------------------------------------ */
function anchors() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href")!;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.4 });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  pixelIntro();
  heroCanvas();
  statements();
  sectionHeads();
  capabilities();
  catalogGrid();
  processSection();
  workItems();
  clientRows();
  footerReveal();
  cursor();
  clock();
  anchors();
  window.addEventListener("load", () => ScrollTrigger.refresh());
});

/* Contact inquiries use the visitor's email app; no submission service. */
const contactForm = document.querySelector<HTMLFormElement>("#contact-form");
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const value = (key: string) => String(data.get(key) ?? "").trim();
  const name = value("name");
  const company = value("company");
  const subject = `Elevate Innovation inquiry — ${company || name}`.replace(/[\r\n]/g, " ");
  const body = [
    "Hello TK,", "", value("message"), "",
    "Contact details", `Name: ${name}`, `Email: ${value("email")}`,
    `Company: ${company || "Not provided"}`, `Phone: ${value("phone") || "Not provided"}`,
  ].join("\r\n");
  window.location.href = `mailto:tk@elevate.cc?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const status = document.querySelector<HTMLElement>("#contact-form-status");
  if (status) status.textContent = "Your email app should open with your draft. If it doesn't, email tk@elevate.cc directly. Your message stays here until you leave this page.";
});
