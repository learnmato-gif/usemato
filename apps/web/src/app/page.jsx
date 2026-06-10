"use client";
import { useEffect, useState, useRef } from "react";

export const meta = () => [
  { title: "Mato — Built for the AI-first web" },
  { name: "description", content: "Mato is a studio building websites and automation workflows for the AI-first web. Discovered by AI. Run on autopilot." },
  { property: "og:title", content: "Mato — Built for the AI-first web" },
  { property: "og:description", content: "Studio building websites and automation workflows for the AI-first web." },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "Mato — Built for the AI-first web" },
  { name: "twitter:description", content: "Studio building websites and automation workflows for the AI-first web." },
];

const LOGO = "https://dtvoeevhaseb5.cloudfront.net/user-uploads/1bc5e906-d5f4-4b9f-93e2-2074589dee93.png";

/* ─────────────────────────────────────────────
   Noise-morphing dot field (from the webapp),
   dialed down so it reads as ambient texture,
   not a centerpiece. No pointer interaction —
   the field morphs on its own, same on phone.
   ───────────────────────────────────────────── */
function InteractiveDotField({ dotColor = "255,255,255", fixed = true, aurora = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0;
    let cells = [];
    let raf = 0;
    const start = performance.now();

    const SPACING = 22;
    const DOT = 2;
    const MAX_ALPHA = aurora ? 0.55 : 0.32;
    const THRESHOLD = 0.10;
    const EDGE_FADE = 0.06;

    function build() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = [];
      for (let y = 8; y < h; y += SPACING) {
        for (let x = 8; x < w; x += SPACING) {
          cells.push({ x, y, alpha: 0 });
        }
      }
    }

    function field(x, y, t) {
      const a = Math.sin(x * 0.0125 + t * 0.00045) * Math.cos(y * 0.0140 - t * 0.00038);
      const b = Math.sin((x + y) * 0.0082 + t * 0.00033) * 0.65;
      const c = Math.cos(x * 0.0070 - y * 0.0095 + t * 0.00052) * 0.55;
      const d = Math.sin(x * 0.0055 + y * 0.0048 - t * 0.00028) * 0.45;
      return (a + b + c + d) * 0.45;
    }

    // Slow secondary field drives aurora hue/lightness drift
    function colorField(x, y, t) {
      const a = Math.sin(x * 0.0055 + t * 0.00018) * Math.cos(y * 0.0048 - t * 0.00014);
      const b = Math.sin((x - y) * 0.0038 + t * 0.00022) * 0.7;
      return (a + b) * 0.5; // -1 … 1
    }

    function step() {
      const t = performance.now() - start;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const v = field(c.x, c.y, t);
        const shape = Math.max(0, Math.min(1, (v - THRESHOLD) / EDGE_FADE));
        const target = shape * MAX_ALPHA;
        c.alpha += (target - c.alpha) * 0.06;
        if (c.alpha > 0.01) {
          if (aurora) {
            // hue: 195 (sky-cyan) → 255 (deep indigo), driven by slow noise
            const cv = colorField(c.x, c.y, t); // -1…1
            const hue = 205 + cv * 30;           // 175…235
            const lit = 48 + cv * 14;            // 34…62 %
            ctx.fillStyle = `hsla(${hue},90%,${lit}%,${c.alpha})`;
          } else {
            ctx.fillStyle = `rgba(${dotColor},${c.alpha})`;
          }
          ctx.fillRect(c.x, c.y, DOT, DOT);
        }
      }
      raf = requestAnimationFrame(step);
    }

    function onResize() { dpr = window.devicePixelRatio || 1; build(); }

    build();
    raf = requestAnimationFrame(step);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [dotColor, aurora]);

  return (
    <canvas
      ref={ref}
      style={
        fixed
          ? { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, width: "100%", height: "100%", display: "block" }
          : { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, width: "100%", height: "100%", display: "block" }
      }
      aria-hidden
    />
  );
}

/* Magnetic — element drifts toward cursor when nearby. */
function useMagnetic(strength = 0.3, radius = 140) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = 0, y = 0, tx = 0, ty = 0;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        const f = (1 - dist / radius) * strength;
        tx = dx * f;
        ty = dy * f;
      } else {
        tx = 0; ty = 0;
      }
    }
    function loop() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength, radius]);
  return ref;
}

/* In-view trigger — fires once. */
function useInView(rootMargin = "0px 0px -20% 0px") {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setV(true); obs.disconnect(); }
    }, { threshold: 0, rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return [ref, v];
}

/* Editorial serif accent — *word* tokens render in Instrument Serif italic. */
const SERIF_FONT = "'Instrument Serif', Georgia, 'Times New Roman', serif";

const ACCENT_DARK = {
  fontFamily: SERIF_FONT,
  fontStyle: "italic",
  fontWeight: 400,
  letterSpacing: "-0.01em",
  paddingRight: "0.08em",
};

const ACCENT_LIGHT = {
  fontFamily: SERIF_FONT,
  fontStyle: "italic",
  fontWeight: 400,
  letterSpacing: "-0.01em",
  paddingRight: "0.08em",
};

function splitAccent(raw) {
  const m = raw.match(/^\*([^*]+)\*(.*)$/);
  return m ? { word: m[1], suffix: m[2], accent: true } : { word: raw, suffix: "", accent: false };
}

/* Word-by-word reveal across multiple lines (newline = new line). */
function Reveal({ text, visible, baseDelay = 0, style, accentStyle = ACCENT_DARK }) {
  const lines = String(text).split("\n");
  let wordIdx = 0;
  return (
    <span style={style}>
      {lines.map((line, li) => {
        const words = line.split(" ");
        return (
          <span key={li} style={{ display: "block", overflow: "hidden", paddingBottom: "0.04em" }}>
            {words.map((w, wi) => {
              const delay = baseDelay + wordIdx * 0.045;
              wordIdx++;
              const { word, suffix, accent } = splitAccent(w);
              return (
                <span
                  key={wi}
                  style={{
                    display: "inline-block",
                    transform: visible ? "translateY(0)" : "translateY(108%)",
                    opacity: visible ? 1 : 0,
                    transition: `transform 0.95s cubic-bezier(0.2,0.9,0.2,1) ${delay}s, opacity 0.5s ease ${delay}s`,
                    willChange: "transform, opacity",
                  }}
                >
                  <span style={accent ? accentStyle : undefined}>{word}</span>{suffix}{wi < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

/* Scroll-scrubbed text — words light up as you scroll through the section. */
function ScrubText({ text, accentStyle = ACCENT_DARK }) {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    function update() {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh * 0.88 - r.top) / (vh * 0.55 + r.height * 0.55);
      setP(Math.max(0, Math.min(1, raw)));
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const lines = String(text).split("\n");
  const total = lines.reduce((n, l) => n + l.split(" ").length, 0);
  let idx = 0;
  return (
    <span ref={ref}>
      {lines.map((line, li) => {
        const words = line.split(" ");
        return (
          <span key={li} style={{ display: "block" }}>
            {words.map((raw, wi) => {
              const { word, suffix, accent } = splitAccent(raw);
              const local = Math.max(0, Math.min(1, p * (total + 3) - idx));
              idx++;
              return (
                <span key={wi} style={{ opacity: 0.13 + 0.87 * local, transition: "opacity 0.2s linear" }}>
                  <span style={accent ? accentStyle : undefined}>{word}</span>
                  {suffix}{wi < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

/* Parallax — element drifts vertically against scroll. */
function useParallax(speed = 0.1) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    function update() {
      const r = el.getBoundingClientRect();
      const off = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translateY(${off}px)`;
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return ref;
}

/* Minimal product window — quiet proof of craft. */
function BrowserMock({ visible }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const w = wrapRef.current, c = cardRef.current, g = glareRef.current;
    if (!w || !c) return;
    function onMove(e) {
      const r = w.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      c.style.transition = "transform 0.1s ease-out";
      c.style.transform = `rotateY(${px * 5}deg) rotateX(${-py * 5}deg)`;
      if (g) g.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.09) 0%, transparent 55%)`;
    }
    function onLeave() {
      c.style.transition = "transform 0.7s cubic-bezier(0.2,0.9,0.2,1)";
      c.style.transform = "rotateY(0deg) rotateX(0deg)";
      if (g) g.style.background = "transparent";
    }
    w.addEventListener("mousemove", onMove);
    w.addEventListener("mouseleave", onLeave);
    return () => {
      w.removeEventListener("mousemove", onMove);
      w.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const dot = { width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "inline-block" };

  return (
    <div
      ref={wrapRef}
      style={{
        perspective: 1200,
        marginBottom: "clamp(30px, 3.5vw, 46px)",
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 22}px)`,
        transition: "opacity 1s ease 0.35s, transform 1s cubic-bezier(0.2,0.9,0.2,1) 0.35s",
      }}
    >
      <div ref={cardRef} style={{
        position: "relative",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.09)",
        background: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(16px) saturate(1.3)",
        WebkitBackdropFilter: "blur(16px) saturate(1.3)",
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 -4px 22px rgba(255,255,255,0.10)",
        transformStyle: "preserve-3d",
        willChange: "transform",
        maxWidth: 600,
      }}>
        {/* window chrome */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{ display: "inline-flex", gap: 7 }}>
            <span style={dot} /><span style={dot} /><span style={dot} />
          </span>
          <span style={{
            flex: 1, textAlign: "center",
            fontFamily: MONO_FONT, fontSize: 11, letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.38)",
          }}>
            yourstudio.com
          </span>
          <span style={{ width: 38 }} />
        </div>
        {/* page body — lots of air, one idea */}
        <div style={{ padding: "clamp(36px, 4.5vw, 56px) clamp(28px, 3.5vw, 44px)", textAlign: "center" }}>
          <div style={{
            fontSize: "clamp(24px, 2.7vw, 34px)", fontWeight: 600,
            letterSpacing: "-0.035em", lineHeight: 1.08, color: "#fff",
            marginBottom: 14,
          }}>
            Designed to be found.
          </div>
          <div style={{
            fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.45)",
            maxWidth: 320, margin: "0 auto 26px",
          }}>
            Fast, structured, and readable by the engines that matter — human and machine.
          </div>
          <ChartLine active={visible} />
        </div>
        {/* quiet metrics line */}
        <div style={{
          padding: "13px 20px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          textAlign: "center",
          fontFamily: MONO_FONT, fontSize: 10.5, letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
        }}>
          LCP 0.4s&nbsp;&nbsp;·&nbsp;&nbsp;Lighthouse 100&nbsp;&nbsp;·&nbsp;&nbsp;AI-readable
        </div>
        <div ref={glareRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <BorderBeam radius={18} size={260} />
      </div>
    </div>
  );
}

/* Ticking local-time readout for the footer. */
function LocalTime() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    f();
    const i = setInterval(f, 1000);
    return () => clearInterval(i);
  }, []);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{t}</span>;
}

/* Letter-by-letter reveal — chars rise with blur + rotateX, 19ms stagger. */
function LetterReveal({ text, visible, baseDelay = 0, accentStyle = ACCENT_DARK }) {
  const lines = String(text).split("\n");
  let ch = 0;
  return (
    <span className={visible ? "lr-in" : undefined} style={{ display: "block", perspective: 800 }}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {line.split(" ").map((raw, wi) => {
            const { word, suffix, accent } = splitAccent(raw);
            return (
              <span key={wi}>
                <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                  <span style={accent ? accentStyle : undefined}>
                    {[...word].map((c, ci) => (
                      <span key={ci} className="lr-ch" style={{ "--d": baseDelay * 1000 + ch++ * 19 }}>{c}</span>
                    ))}
                  </span>
                  {[...suffix].map((c, ci) => (
                    <span key={"s" + ci} className="lr-ch" style={{ "--d": baseDelay * 1000 + ch++ * 19 }}>{c}</span>
                  ))}
                </span>
                {wi < line.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/* Light orb that travels an element's border. Parent needs position:relative. */
function BorderBeam({ radius = 999, size = 90, ring = 1 }) {
  return (
    <span
      className="bb-wrap"
      aria-hidden
      style={{ "--bb-radius": `${radius}px`, "--bb-size": `${size}px`, "--bb-ring": `${ring}px` }}
    >
      <span className="bb-beam" />
      <span className="bb-beam bb-beam-2" />
    </span>
  );
}

/* Hero recede — content fades, lifts and shrinks as the page scrolls over it. */
function useRecede() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    function update() {
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, window.scrollY / (vh * 0.85)));
      el.style.opacity = String(Math.max(0, 1 - p * 1.05));
      el.style.transform = `translateY(${-p * 7}vh) scale(${1 - p * 0.06})`;
      el.style.pointerEvents = p > 0.8 ? "none" : "";
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/* Self-drawing line chart with traveling dot — quiet proof of growth. */
function ChartLine({ active }) {
  const pathRef = useRef(null);
  const dotRef = useRef(null);
  const badgeRef = useRef(null);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    const path = pathRef.current, dot = dotRef.current, badge = badgeRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      const pt = path.getPointAtLength(len);
      if (dot) { dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); dot.style.opacity = "1"; }
      if (badge) badge.style.opacity = "1";
      return;
    }
    let raf = 0;
    const timer = setTimeout(() => {
      const dur = 1700, start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        path.style.strokeDashoffset = String(len * (1 - e));
        const pt = path.getPointAtLength(len * e);
        if (dot) { dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); dot.style.opacity = "1"; }
        if (badge && e > 0.55) badge.style.opacity = String(Math.min(1, (e - 0.55) / 0.25));
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, 800);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [active]);

  return (
    <div style={{ position: "relative", margin: "30px auto 4px", maxWidth: 380 }}>
      <svg viewBox="0 0 320 92" style={{ width: "100%", display: "block", overflow: "visible" }} aria-hidden>
        <path
          ref={pathRef}
          d="M4,80 C46,76 70,70 102,57 C138,42 158,45 192,32 C226,20 272,13 316,7"
          fill="none"
          stroke="rgba(160,200,255,0.9)"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
        />
        <circle ref={dotRef} r="3.2" fill="#cfe4ff" style={{ opacity: 0 }} />
      </svg>
      <span ref={badgeRef} style={{
        position: "absolute", right: -4, top: -14,
        fontFamily: MONO_FONT, fontSize: 10, letterSpacing: "0.08em",
        color: "rgba(190,220,255,0.95)",
        border: "1px solid rgba(140,190,255,0.30)",
        background: "rgba(120,175,255,0.08)",
        borderRadius: 999, padding: "3px 9px",
        opacity: 0, transition: "opacity 0.3s ease",
      }}>+212%</span>
    </div>
  );
}

/* Thin vertical scroll progress indicator. */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      setP(Math.min(1, Math.max(0, ratio)));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div
      className="scroll-prog"
      style={{
        position: "fixed", left: "max(18px, 2.4vw)", top: "50%",
        transform: "translateY(-50%)", height: 140, width: 1,
        background: "rgba(255,255,255,0.18)", zIndex: 200, pointerEvents: "none",
        mixBlendMode: "difference",
      }}
      aria-hidden
    >
      <div style={{
        position: "absolute", left: 0, top: 0, width: 1,
        height: `${p * 100}%`, background: "#fff",
        transition: "height 0.18s ease",
      }} />
    </div>
  );
}

const MONO_FONT = "ui-monospace, 'SF Mono', Menlo, 'Roboto Mono', monospace";

/* ─── Beam background — layered, living, cinematic. Reusable with palette. ─── */
const PINK_PALETTE = {
  base1: "110,15,70",   base2: "55,8,35",
  far:   "220,40,140",
  near:  "255,70,180",
  bloom1:"255,130,210", bloom2:"255,60,170", bloom3:"170,20,110",
  ember1:"255,150,220", ember2:"220,80,180",
};
/* Moonlit steel — cool, desaturated, premium. */
const STEEL_PALETTE = {
  base1: "28,42,75",    base2: "12,18,34",
  far:   "95,130,185",
  near:  "150,180,225",
  bloom1:"190,210,240", bloom2:"100,135,195", bloom3:"35,60,115",
  ember1:"200,220,248", ember2:"120,155,210",
};
const BLUE_PALETTE = {
  base1: "15,40,110",   base2: "8,18,55",
  far:   "60,130,220",
  near:  "90,170,255",
  bloom1:"150,210,255", bloom2:"60,140,255", bloom3:"20,80,180",
  ember1:"160,215,255", ember2:"80,160,230",
};

/* ─── Background — fluted-glass light (public/bg.png), grounded to black ─── */
function AuroraBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "#000", overflow: "hidden",
      }}
    >
      <img
        src="/bg.png"
        alt=""
        className="bg-photo"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          transformOrigin: "65% 50%",
          willChange: "transform",
        }}
      />
      {/* legibility — settle the left side where the copy lives */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(105deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.22) 38%, rgba(0,0,0,0) 62%)",
      }} />
      {/* ground — top eases, bottom falls to black for the section hand-off */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.80) 100%)",
      }} />
    </div>
  );
}

/* Dashed vertical grid lines — quiet structure on light sections. */
function GridLines({ dark = false }) {
  const c = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.10)";
  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      display: "flex", justifyContent: "space-between",
      maxWidth: 1400, margin: "0 auto",
      padding: "0 clamp(24px, 5vw, 80px)",
    }}>
      {[0, 1, 2, 3].map(i => (
        <span key={i} style={{
          width: 1,
          background: `repeating-linear-gradient(180deg, ${c} 0 4px, transparent 4px 8px)`,
        }} />
      ))}
    </div>
  );
}

function BeamBackground({ palette = PINK_PALETTE, fixed = true }) {
  const p = palette;
  return (
    <div
      aria-hidden
      style={{
        position: fixed ? "fixed" : "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "#000", overflow: "hidden",
      }}
    >
      {/* 1. Deep atmospheric base tint */}
      <div style={{
        position: "absolute", inset: "-20%",
        background:
          `radial-gradient(ellipse 95% 70% at 50% 22%,` +
          ` rgba(${p.base1},0.55) 0%,` +
          ` rgba(${p.base2},0.28) 35%,` +
          ` transparent 72%)`,
        filter: "blur(80px)",
      }} />

      {/* 2. Far beams */}
      <div className="beams-far" style={{
        position: "absolute", inset: "-25%",
        background:
          `repeating-linear-gradient(-58deg,` +
          ` transparent 0px,` +
          ` transparent 130px,` +
          ` rgba(${p.far},0.40) 175px,` +
          ` rgba(${p.far},0.40) 250px,` +
          ` transparent 300px,` +
          ` transparent 430px)`,
        filter: "blur(34px)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 70% at 50% 23%, #000 0%, #000 26%, transparent 82%)",
        maskImage:
          "radial-gradient(ellipse 80% 70% at 50% 23%, #000 0%, #000 26%, transparent 82%)",
      }} />

      {/* 3. Near beams */}
      <div className="beams-near" style={{
        position: "absolute", inset: "-15%",
        background:
          `repeating-linear-gradient(-52deg,` +
          ` transparent 0px,` +
          ` transparent 75px,` +
          ` rgba(${p.near},0.60) 105px,` +
          ` rgba(${p.near},0.60) 150px,` +
          ` transparent 185px,` +
          ` transparent 270px)`,
        filter: "blur(16px)",
        WebkitMaskImage:
          "radial-gradient(ellipse 72% 60% at 50% 22%, #000 0%, #000 32%, transparent 80%)",
        maskImage:
          "radial-gradient(ellipse 72% 60% at 50% 22%, #000 0%, #000 32%, transparent 80%)",
      }} />

      {/* 4. Hot core bloom */}
      <div className="bloom" style={{
        position: "absolute",
        top: "-12%", left: "50%", transform: "translateX(-50%)",
        width: "130vw", height: "80vh",
        background:
          `radial-gradient(ellipse at 50% 35%,` +
          ` rgba(${p.bloom1},0.55) 0%,` +
          ` rgba(${p.bloom2},0.32) 22%,` +
          ` rgba(${p.bloom3},0.16) 48%,` +
          ` transparent 70%)`,
        filter: "blur(70px)",
        mixBlendMode: "screen",
      }} />

      {/* 5. Off-center accent glow */}
      <div className="ember" style={{
        position: "absolute",
        top: "5%", left: "42%",
        width: "32vw", height: "32vw",
        background:
          `radial-gradient(circle, rgba(${p.ember1},0.34) 0%, rgba(${p.ember2},0.16) 35%, transparent 60%)`,
        filter: "blur(55px)",
        mixBlendMode: "screen",
      }} />

      {/* 6. Vignette — deepens corners, draws the eye up (soft falloff, no visible ring) */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          "radial-gradient(ellipse 130% 110% at 50% 30%," +
          " transparent 0%," +
          " transparent 45%," +
          " rgba(0,0,0,0.40) 80%," +
          " rgba(0,0,0,0.85) 100%)",
      }} />

    </div>
  );
}

/* ─── Light-mode beam background — blue beams on white ─── */
function LightBeamBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* 1. Subtle base wash — very pale sky tint near top */}
      <div style={{
        position: "absolute", inset: "-20%",
        background:
          "radial-gradient(ellipse 95% 70% at 50% 22%," +
          " rgba(180,210,255,0.55) 0%," +
          " rgba(220,235,255,0.30) 35%," +
          " transparent 72%)",
        filter: "blur(80px)",
      }} />

      {/* 2. Far beams — deeper saturated blue, multiply so they tint the white */}
      <div className="beams-far" style={{
        position: "absolute", inset: "-25%",
        background:
          "repeating-linear-gradient(-58deg," +
          " transparent 0px," +
          " transparent 130px," +
          " rgba(35,90,210,0.32) 175px," +
          " rgba(35,90,210,0.32) 250px," +
          " transparent 300px," +
          " transparent 430px)",
        filter: "blur(34px)",
        mixBlendMode: "multiply",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 70% at 50% 23%, #000 0%, #000 26%, transparent 82%)",
        maskImage:
          "radial-gradient(ellipse 80% 70% at 50% 23%, #000 0%, #000 26%, transparent 82%)",
      }} />

      {/* 3. Near beams — tighter, brighter electric blue */}
      <div className="beams-near" style={{
        position: "absolute", inset: "-15%",
        background:
          "repeating-linear-gradient(-52deg," +
          " transparent 0px," +
          " transparent 75px," +
          " rgba(20,60,180,0.42) 105px," +
          " rgba(20,60,180,0.42) 150px," +
          " transparent 185px," +
          " transparent 270px)",
        filter: "blur(16px)",
        mixBlendMode: "multiply",
        WebkitMaskImage:
          "radial-gradient(ellipse 72% 60% at 50% 22%, #000 0%, #000 32%, transparent 80%)",
        maskImage:
          "radial-gradient(ellipse 72% 60% at 50% 22%, #000 0%, #000 32%, transparent 80%)",
      }} />

      {/* 4. Soft bloom — sky-blue centre, multiply for tint */}
      <div className="bloom" style={{
        position: "absolute",
        top: "-12%", left: "50%", transform: "translateX(-50%)",
        width: "130vw", height: "80vh",
        background:
          "radial-gradient(ellipse at 50% 35%," +
          " rgba(80,140,240,0.30) 0%," +
          " rgba(40,90,200,0.20) 30%," +
          " transparent 70%)",
        filter: "blur(70px)",
        mixBlendMode: "multiply",
      }} />

      {/* 5. Off-center cyan accent */}
      <div className="ember" style={{
        position: "absolute",
        top: "5%", left: "42%",
        width: "32vw", height: "32vw",
        background:
          "radial-gradient(circle, rgba(90,180,255,0.28) 0%, rgba(60,140,230,0.14) 35%, transparent 60%)",
        filter: "blur(55px)",
        mixBlendMode: "multiply",
      }} />

      {/* 6. White vignette — fades back to pure white at edges so the section feels framed */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          "radial-gradient(ellipse 130% 110% at 50% 30%," +
          " transparent 0%," +
          " transparent 45%," +
          " rgba(255,255,255,0.35) 80%," +
          " rgba(255,255,255,0.85) 100%)",
      }} />
    </div>
  );
}

/* ─── Contact form ─── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Something went wrong."); setStatus("error"); return; }
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        maxWidth: 520, margin: "0 auto",
        padding: "48px 0", textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
        <p style={{ fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>
          We'll be in touch.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: MONO_FONT }}>
          Check your inbox — confirmation sent.
        </p>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "#fff",
    fontSize: 15, padding: "14px 18px",
    outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text" placeholder="Your name" required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <input
          type="email" placeholder="Your email" required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <textarea
          placeholder="What are you building? (optional)"
          rows={3}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
          onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        {errorMsg && (
          <p style={{ fontSize: 13, color: "#ff6b6b", margin: 0, fontFamily: MONO_FONT }}>{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary"
          style={{
            background: "#fff", color: "#000",
            border: "none", borderRadius: 999,
            fontSize: 15, fontWeight: 600,
            padding: "15px 32px", cursor: status === "loading" ? "wait" : "pointer",
            letterSpacing: "-0.01em",
            opacity: status === "loading" ? 0.7 : 1,
            transition: "opacity 0.2s",
            alignSelf: "flex-start",
          }}
        >
          {status === "loading" ? "Sending…" : "Send it ↗"}
        </button>
      </div>
    </form>
  );
}

export default function MatoLanding() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [logoHover, setLogoHover] = useState(false);

  const [manifestoRef, manifestoIn] = useInView();
  const [whoRef, whoIn]             = useInView();
  const [websitesRef, websitesIn]   = useInView();
  const [workflowsRef, workflowsIn] = useInView();
  const [approachRef, approachIn]   = useInView();
  const [processRef, processIn]     = useInView();
  const [ctaRef, ctaIn]             = useInView();

  const heroBookRef = useMagnetic(0.32, 150);
  const navBookRef  = useMagnetic(0.22, 90);
  const ctaBookRef  = useMagnetic(0.12, 240);

  const num01Ref = useParallax(0.10);
  const num02Ref = useParallax(0.10);
  const heroRecedeRef = useRecede();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 220);
    return () => clearTimeout(t);
  }, []);

  // Detect if the fixed nav is currently over a white section
  const [onLight, setOnLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function check() {
      setScrolled(window.scrollY > 60);
      const probeY = 48; // nav pill vertical center
      const refs = [whoRef.current, approachRef.current].filter(Boolean);
      let light = false;
      for (const el of refs) {
        const r = el.getBoundingClientRect();
        if (r.top <= probeY && r.bottom >= probeY) { light = true; break; }
      }
      setOnLight(light);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div style={{
      background: "transparent",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      color: "#fff",
      overflowX: "hidden",
      minHeight: "100vh",
    }}>

      <AuroraBackground />
      <ScrollProgress />

      {/* ─── NAV ─── */}
      <nav style={{
        position: "fixed", top: "clamp(14px, 2vw, 22px)", left: "50%",
        transform: "translateX(-50%)", zIndex: 300,
        height: "clamp(52px, 4.2vw, 60px)",
        width: "min(980px, calc(100vw - 28px))",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(8px, 1vw, 10px) 0 clamp(16px, 2vw, 22px)",
        borderRadius: 16,
        background: onLight ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.28)",
        border: onLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: onLight
          ? "inset 0 -4px 22px rgba(255,255,255,0.5), 0 10px 36px rgba(0,0,0,0.10)"
          : "inset 0 -4px 22px rgba(255,255,255,0.14)",
        backdropFilter: "blur(18px) saturate(1.4)",
        WebkitBackdropFilter: "blur(18px) saturate(1.4)",
        transition: "background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease",
      }}>
        <a
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none",
            fontSize: 13, fontWeight: 500, letterSpacing: "0.18em",
            color: onLight ? "#0a0a0a" : "#fff",
            textTransform: "uppercase", fontFamily: MONO_FONT,
            transition: "color 0.3s ease",
          }}
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
        >
          <img
            src={onLight ? "/Logo.for.whitebg.png" : "/Logo.for.blackbg.png?v=2"}
            alt=""
            style={{
              width: "clamp(22px, 2.2vw, 34px)",
              height: "clamp(22px, 2.2vw, 34px)",
              display: "inline-block", objectFit: "contain",
              transform: logoHover ? "rotate(120deg)" : "rotate(0deg)",
              transition: "transform 0.6s cubic-bezier(0.2,0.9,0.2,1)",
            }}
          />
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontStyle: "normal",
            fontWeight: 800,
            fontSize: "clamp(16px, 1.5vw, 21px)",
            letterSpacing: "-0.01em",
            textTransform: "none",
          }}>mato</span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span className="nav-meta" style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.16em",
            color: onLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.38)",
            textTransform: "uppercase",
            fontFamily: MONO_FONT,
            transition: "color 0.3s ease",
          }}>
            Studio / 2026
          </span>
          <a
            ref={navBookRef}
            href="#contact"
            className="btn-primary"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 500,
              color: onLight ? "#fff" : "#000",
              background: onLight ? "#0a0a0a" : "#fff",
              borderRadius: 999, padding: "9px 18px", textDecoration: "none",
              letterSpacing: "-0.01em",
              transform: "translate(var(--mx, 0), var(--my, 0))",
              willChange: "transform",
              transition: "color 0.3s ease, background 0.3s ease",
            }}
          >
            Book a call <span style={{ fontSize: 13, lineHeight: 1 }}>↗</span>
          </a>
        </div>
      </nav>

      {/* ─── HERO — pinned curtain; recedes as the page scrolls over it ─── */}
      <div style={{ height: "168vh", position: "relative", zIndex: 0 }}>
      <section ref={heroRecedeRef} style={{
        position: "sticky", top: 0, zIndex: 0, minHeight: "100vh",
        willChange: "transform, opacity",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "120px clamp(24px, 5vw, 80px) clamp(80px, 10vw, 140px)",
      }}>
        <div style={{
          position: "absolute",
          top: "clamp(110px, 14vw, 160px)", left: "clamp(24px, 5vw, 80px)",
          fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.42)",
          fontFamily: MONO_FONT,
          opacity: heroVisible ? 1 : 0, transition: "opacity 1s ease 0.05s",
        }}>
          [ Studio ] — for the AI-first web
        </div>

        <h1 style={{
          fontSize: "clamp(56px, 13.2vw, 240px)",
          fontWeight: 700, letterSpacing: "-0.052em",
          lineHeight: 0.86, color: "#fff",
          margin: 0,
        }}>
          <LetterReveal text={"Built for\nthe *AI-first*\nweb."} visible={heroVisible} baseDelay={0.1} />
        </h1>

        <div className="hero-foot" style={{
          marginTop: "clamp(36px, 5vw, 60px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(20px, 4vw, 60px)",
          alignItems: "end",
        }}>
          <p style={{
            fontSize: "clamp(15px, 1.4vw, 19px)", lineHeight: 1.55,
            color: "rgba(255,255,255,0.55)",
            maxWidth: 440, margin: 0, fontWeight: 400,
            opacity: heroVisible ? 1 : 0,
            transform: `translateY(${heroVisible ? 0 : 12}px)`,
            transition: "opacity 0.9s ease 0.7s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.7s",
          }}>
            Mato is a studio building <em style={{ fontStyle: "normal", color: "#fff" }}>websites</em> that get discovered by AI and <em style={{ fontStyle: "normal", color: "#fff" }}>workflows</em> that run your business without you.
          </p>

          <div className="hero-ctas" style={{
            display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap",
            opacity: heroVisible ? 1 : 0,
            transform: `translateY(${heroVisible ? 0 : 12}px)`,
            transition: "opacity 0.9s ease 0.85s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.85s",
          }}>
            <a
              ref={heroBookRef}
              href="#contact"
              className="btn-primary"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontSize: 15, fontWeight: 500, color: "#000", background: "#fff",
                borderRadius: 999, padding: "15px 28px", textDecoration: "none",
                letterSpacing: "-0.01em",
                transform: "translate(var(--mx, 0), var(--my, 0))",
                willChange: "transform",
              }}
            >
              Book a discovery call <span style={{ fontSize: 15, lineHeight: 1 }}>↗</span>
            </a>
            <a
              href="#work"
              className="ghost-btn"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.16)", background: "transparent",
                borderRadius: 999, padding: "15px 28px", textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.2s, border-color 0.2s",
                position: "relative", isolation: "isolate",
              }}
            >
              <BorderBeam size={70} />
              See the work <span style={{ fontSize: 14 }}>↓</span>
            </a>
          </div>
        </div>
      </section>
      </div>

      {/* ─── MANIFESTO ─── */}
      <section ref={manifestoRef} style={{
        position: "relative", zIndex: 1, minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "clamp(120px, 16vw, 220px) clamp(24px, 5vw, 80px)",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)", marginBottom: 44,
          fontFamily: MONO_FONT,
          opacity: manifestoIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
        }}>
          ◆ Manifesto
        </div>
        <h2 style={{
          fontSize: "clamp(36px, 7.4vw, 116px)",
          fontWeight: 600, letterSpacing: "-0.04em",
          lineHeight: 0.95, color: "#fff",
          margin: 0, maxWidth: 1400,
        }}>
          <ScrubText text={"Most sites talk\nto humans.\nOurs talk\nto *machines*, too."} />
        </h2>
      </section>

      {/* ─── WHITE CONTRAST — WHO IT'S FOR ─── */}
      <section ref={whoRef} style={{
        position: "relative", zIndex: 2,
        background: "#fff", color: "#0a0a0a",
        padding: "clamp(110px, 15vw, 210px) clamp(24px, 5vw, 80px)",
        borderRadius: "clamp(20px, 3vw, 36px) clamp(20px, 3vw, 36px) 0 0",
        boxShadow: "0 -24px 70px rgba(0,0,0,0.45)",
        overflow: "hidden",
      }}>
        <GridLines />
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(0,0,0,0.45)", marginBottom: 48,
            fontFamily: MONO_FONT,
            opacity: whoIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
          }}>
            ● Who it's for
          </div>
          <h2 style={{
            fontSize: "clamp(40px, 7.4vw, 116px)",
            fontWeight: 600, letterSpacing: "-0.04em",
            lineHeight: 0.95, color: "#0a0a0a",
            margin: "0 0 clamp(20px, 2.5vw, 36px)", maxWidth: 1300,
          }}>
            <Reveal text={"Built for the people\nwho actually ship."} visible={whoIn} baseDelay={0.05} accentStyle={ACCENT_LIGHT} />
          </h2>
          <p style={{
            fontSize: "clamp(16px, 1.6vw, 21px)", lineHeight: 1.55,
            color: "rgba(0,0,0,0.55)", margin: 0, maxWidth: 640, fontWeight: 400,
            opacity: whoIn ? 1 : 0,
            transform: `translateY(${whoIn ? 0 : 12}px)`,
            transition: "opacity 0.9s ease 0.55s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.55s",
          }}>
            Founders. Operators. Growth teams shipping in weeks, not quarters. If your roadmap takes nine months to change a button — we're probably not your studio.
          </p>
          <div style={{
            marginTop: "clamp(40px, 5vw, 64px)",
            display: "flex", flexWrap: "wrap", gap: "10px 8px",
            opacity: whoIn ? 1 : 0,
            transform: `translateY(${whoIn ? 0 : 12}px)`,
            transition: "opacity 0.9s ease 0.75s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.75s",
          }}>
            {["Founders", "Operators", "Growth teams", "AI-first companies"].map(tag => (
              <span key={tag} style={{
                display: "inline-block",
                padding: "8px 14px",
                border: "1px solid rgba(0,0,0,0.14)",
                borderRadius: 999,
                fontSize: 12, color: "rgba(0,0,0,0.6)",
                fontFamily: MONO_FONT, letterSpacing: "0.02em",
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WORK / SERVICES ─── */}
      <section id="work" style={{ position: "relative", zIndex: 2 }}>

        {/* 01 — WEBSITES */}
        <div ref={websitesRef} className="service-grid" style={{
          position: "relative",
          minHeight: "92vh",
          padding: "clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)",
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          alignItems: "center",
          gap: "clamp(40px, 6vw, 100px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div aria-hidden ref={num01Ref} style={{
            position: "absolute", top: "clamp(30px, 4vw, 60px)", right: "-3vw",
            fontSize: "clamp(220px, 40vw, 600px)",
            fontWeight: 700, letterSpacing: "-0.06em",
            color: "rgba(255,255,255,0.025)",
            lineHeight: 0.82, pointerEvents: "none",
            fontFamily: "'Inter', sans-serif",
          }}>01</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)", marginBottom: 26,
              fontFamily: MONO_FONT,
              opacity: websitesIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
            }}>
              01 / Websites
            </div>
            <h3 style={{
              fontSize: "clamp(40px, 6vw, 92px)",
              fontWeight: 600, letterSpacing: "-0.04em",
              lineHeight: 0.96, color: "#fff",
              margin: 0,
            }}>
              <Reveal text={"Sites that ship.\nSites that sell."} visible={websitesIn} baseDelay={0.1} />
            </h3>
          </div>

          <div style={{
            position: "relative", zIndex: 1,
            opacity: websitesIn ? 1 : 0,
            transform: `translateY(${websitesIn ? 0 : 14}px)`,
            transition: "opacity 0.9s ease 0.55s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.55s",
          }}>
            <BrowserMock visible={websitesIn} />
            <p style={{
              fontSize: "clamp(17px, 1.6vw, 21px)", lineHeight: 1.55,
              color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: 520, fontWeight: 400,
            }}>
              Engineered for performance. Structured so AI agents can read them. Designed to turn traffic into revenue.
              <br /><br />
              Your website should be your best salesperson — not a brochure.
            </p>
            <div style={{
              marginTop: "clamp(32px, 4vw, 48px)",
              display: "flex", flexWrap: "wrap", gap: "8px 6px",
            }}>
              {["Brand sites", "SEO + GEO", "Landing pages", "Next.js / Webflow", "AI-discoverable"].map(tag => (
                <span key={tag} style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 999,
                  fontSize: 12, color: "rgba(255,255,255,0.55)",
                  fontFamily: MONO_FONT, letterSpacing: "0.02em",
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 02 — WORKFLOWS */}
        <div ref={workflowsRef} className="service-grid service-grid--rev" style={{
          position: "relative",
          minHeight: "92vh",
          padding: "clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)",
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          alignItems: "center",
          gap: "clamp(40px, 6vw, 100px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div aria-hidden ref={num02Ref} style={{
            position: "absolute", top: "clamp(30px, 4vw, 60px)", left: "-3vw",
            fontSize: "clamp(220px, 40vw, 600px)",
            fontWeight: 700, letterSpacing: "-0.06em",
            color: "rgba(255,255,255,0.025)",
            lineHeight: 0.82, pointerEvents: "none",
            fontFamily: "'Inter', sans-serif",
          }}>02</div>

          <div className="service-copy" style={{
            position: "relative", zIndex: 1,
            opacity: workflowsIn ? 1 : 0,
            transform: `translateY(${workflowsIn ? 0 : 14}px)`,
            transition: "opacity 0.9s ease 0.55s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.55s",
          }}>
            <p style={{
              fontSize: "clamp(17px, 1.6vw, 21px)", lineHeight: 1.55,
              color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: 520, fontWeight: 400,
            }}>
              We rebuild your manual processes — lead capture, follow-up, onboarding, reporting — as AI-powered workflows.
              <br /><br />
              Less work. More output. While you sleep.
            </p>
            <div style={{
              marginTop: "clamp(32px, 4vw, 48px)",
              display: "flex", flexWrap: "wrap", gap: "8px 6px",
            }}>
              {["Lead routing", "AI outreach", "Onboarding", "Reporting", "Integrations"].map(tag => (
                <span key={tag} style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 999,
                  fontSize: 12, color: "rgba(255,255,255,0.55)",
                  fontFamily: MONO_FONT, letterSpacing: "0.02em",
                }}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="service-head" style={{ position: "relative", zIndex: 1, textAlign: "right" }}>
            <div style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)", marginBottom: 26,
              fontFamily: MONO_FONT,
              opacity: workflowsIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
            }}>
              02 / Workflows
            </div>
            <h3 style={{
              fontSize: "clamp(40px, 6vw, 92px)",
              fontWeight: 600, letterSpacing: "-0.04em",
              lineHeight: 0.96, color: "#fff",
              margin: 0,
            }}>
              <Reveal text={"Your ops.\nOn autopilot."} visible={workflowsIn} baseDelay={0.1} />
            </h3>
          </div>
        </div>
      </section>

      {/* ─── WHITE CONTRAST — APPROACH ─── */}
      <section ref={approachRef} style={{
        position: "relative", zIndex: 2,
        background: "#fff", color: "#0a0a0a",
        padding: "clamp(110px, 15vw, 210px) clamp(24px, 5vw, 80px)",
        borderRadius: "clamp(20px, 3vw, 36px) clamp(20px, 3vw, 36px) 0 0",
        boxShadow: "0 -24px 70px rgba(0,0,0,0.45)",
        overflow: "hidden",
      }}>
        <GridLines />
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(0,0,0,0.45)", marginBottom: 56,
            fontFamily: MONO_FONT,
            opacity: approachIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
          }}>
            ◇ Approach
          </div>
          <h2 style={{
            fontSize: "clamp(40px, 7.4vw, 116px)",
            fontWeight: 600, letterSpacing: "-0.04em",
            lineHeight: 0.95, color: "#0a0a0a",
            margin: "0 0 clamp(8px, 1.2vw, 16px)", maxWidth: 1300,
          }}>
            <Reveal text={"Ship in weeks.\nNot quarters."} visible={approachIn} baseDelay={0.05} accentStyle={ACCENT_LIGHT} />
          </h2>
          <p style={{
            fontSize: "clamp(16px, 1.6vw, 21px)", lineHeight: 1.55,
            color: "rgba(0,0,0,0.55)", margin: 0, maxWidth: 620, fontWeight: 400,
            opacity: approachIn ? 1 : 0,
            transform: `translateY(${approachIn ? 0 : 12}px)`,
            transition: "opacity 0.9s ease 0.55s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.55s",
          }}>
            Two-week sprints. Fixed scope. Fixed price. No retainer treadmill — just deliverables and dates.
          </p>

          <div className="approach-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(32px, 4vw, 64px)",
            marginTop: "clamp(56px, 7vw, 96px)",
            borderTop: "1px solid rgba(0,0,0,0.10)",
            paddingTop: "clamp(40px, 5vw, 64px)",
          }}>
            {[
              { k: "2 wk", v: "Standard sprint", b: "Most engagements ship in one or two two-week cycles. Faster than most agencies can write a brief." },
              { k: "Fixed", v: "Scope & price", b: "We quote, you approve, we ship. No hourly billing, no scope creep, no surprise invoices." },
              { k: "Senior", v: "Hands on keys", b: "The same people who scope the work build it. No junior hand-offs, no agency middlemen." },
            ].map((s, i) => (
              <div key={i} style={{
                opacity: approachIn ? 1 : 0,
                transform: `translateY(${approachIn ? 0 : 18}px)`,
                transition: `opacity 0.9s ease ${0.65 + i * 0.1}s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) ${0.65 + i * 0.1}s`,
              }}>
                <div style={{
                  fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 700,
                  letterSpacing: "-0.04em", lineHeight: 1.0, color: "#0a0a0a",
                  marginBottom: 14,
                }}>{s.k}</div>
                <div style={{
                  fontSize: 11, fontWeight: 500,
                  letterSpacing: "0.16em", color: "rgba(0,0,0,0.45)",
                  fontFamily: MONO_FONT, textTransform: "uppercase",
                  marginBottom: 20,
                }}>{s.v}</div>
                <p style={{
                  fontSize: "clamp(14px, 1.15vw, 16px)", lineHeight: 1.55,
                  color: "rgba(0,0,0,0.6)", margin: 0, maxWidth: 340,
                }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESS ─── */}
      <section ref={processRef} style={{
        position: "relative", zIndex: 2,
        padding: "clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)", marginBottom: 56,
            fontFamily: MONO_FONT,
            opacity: processIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
          }}>
            ◇ Process
          </div>
          <div className="process-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(40px, 5vw, 80px)",
          }}>
            {[
              { n: "→ 01", t: "Discovery", b: "We talk. You explain. We listen for what's really broken — and what could be automated." },
              { n: "→ 02", t: "Design + Build", b: "We design, build, and ship — fast. Iteratively. With your input every step of the way." },
              { n: "→ 03", t: "Live + Iterate", b: "We hand it over. Then we keep refining. Better numbers. Smarter workflows. Compounding output." },
            ].map((step, i) => (
              <div key={i} style={{
                opacity: processIn ? 1 : 0,
                transform: `translateY(${processIn ? 0 : 18}px)`,
                transition: `opacity 0.9s ease ${0.2 + i * 0.12}s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) ${0.2 + i * 0.12}s`,
                background: "rgba(0,0,0,0.22)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "clamp(28px, 3vw, 40px)",
                boxShadow: "inset 0 -4px 22px rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}>
                <span style={{
                  display: "block", fontSize: 12, fontWeight: 500,
                  letterSpacing: "0.16em", color: "rgba(255,255,255,0.42)",
                  fontFamily: MONO_FONT,
                  marginBottom: 26, textTransform: "uppercase",
                }}>{step.n}</span>
                <h4 style={{
                  fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 600,
                  letterSpacing: "-0.03em", color: "#fff", margin: "0 0 18px",
                  lineHeight: 1.05,
                }}>{step.t}</h4>
                <p style={{
                  fontSize: "clamp(14px, 1.15vw, 16px)", lineHeight: 1.6,
                  color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 360,
                }}>{step.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GIANT CTA ─── */}
      <section id="contact" ref={ctaRef} style={{
        position: "relative", zIndex: 2,
        padding: "clamp(100px, 16vw, 220px) clamp(24px, 5vw, 80px) clamp(80px, 12vw, 160px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        textAlign: "center",
        overflow: "hidden",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.42)", marginBottom: 52,
          fontFamily: MONO_FONT,
          opacity: ctaIn ? 1 : 0, transition: "opacity 0.8s ease 0.05s",
        }}>
          ● Discovery call — 30 min · free · no pitch
        </div>

        <div
          ref={ctaBookRef}
          className="cta-mega"
          style={{
            display: "inline-block",
            fontSize: "clamp(64px, 15vw, 240px)",
            fontWeight: 700, letterSpacing: "-0.055em", color: "#fff",
            lineHeight: 0.88,
            margin: "0 0 64px",
            transform: "translate(var(--mx, 0), var(--my, 0))",
            willChange: "transform",
          }}
        >
          <LetterReveal text={"Let's *build*."} visible={ctaIn} baseDelay={0.1} />
        </div>

        <div style={{
          opacity: ctaIn ? 1 : 0,
          transform: `translateY(${ctaIn ? 0 : 20}px)`,
          transition: "opacity 0.9s ease 0.9s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.9s",
        }}>
          <div style={{
            maxWidth: 620, margin: "0 auto",
            position: "relative", isolation: "isolate",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "rgba(0,0,0,0.25)",
            boxShadow: "inset 0 -4px 22px rgba(255,255,255,0.10)",
            backdropFilter: "blur(16px) saturate(1.3)",
            WebkitBackdropFilter: "blur(16px) saturate(1.3)",
            padding: "clamp(28px, 4vw, 48px)",
          }}>
            <BorderBeam radius={24} size={200} />
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ─── GIANT WORDMARK ─── */}
      <div aria-hidden style={{
        position: "relative", zIndex: 2, overflow: "hidden",
        textAlign: "center", lineHeight: 0.76, userSelect: "none",
        padding: "clamp(30px, 5vw, 60px) 0 0",
      }}>
        <div style={{
          fontFamily: "'Poppins', sans-serif", fontWeight: 800,
          fontSize: "clamp(120px, 27vw, 460px)", letterSpacing: "-0.04em",
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(255,255,255,0.15)",
          transform: "translateY(0.16em)",
          WebkitMaskImage: "linear-gradient(#000 20%, transparent 96%)",
          maskImage: "linear-gradient(#000 20%, transparent 96%)",
        }}>mato</div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{
        position: "relative", zIndex: 2,
        padding: "30px clamp(24px, 5vw, 56px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 20, flexWrap: "wrap",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          fontSize: 11, fontWeight: 500, letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
          fontFamily: MONO_FONT,
        }}>
          <img
            src="/Logo.for.blackbg.png?v=2"
            alt=""
            style={{ width: 14, height: 14, objectFit: "contain", opacity: 0.7 }}
          />
          Mato © 2026
          <span style={{ opacity: 0.5 }}>·</span>
          Local time <LocalTime />
        </div>
        <div style={{ display: "flex", gap: "clamp(16px, 2.5vw, 28px)", flexWrap: "wrap" }}>
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Instagram", href: "https://www.instagram.com/use.mato/" },
            { label: "LinkedIn", href: "https://www.linkedin.com/company/mato-linkedin/" },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="foot-link"
              style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
                textDecoration: "none", fontFamily: MONO_FONT,
                transition: "color 0.2s",
              }}
            >{item.label}</a>
          ))}
        </div>
      </footer>

      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; background: #000; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: #000; }
        ::selection { background: rgba(255,255,255,0.18); color: #fff; }
        a, button { font-family: inherit; }
        a { -webkit-tap-highlight-color: transparent; }

        .ghost-btn:hover { color: #fff !important; border-color: rgba(255,255,255,0.42) !important; }
        .foot-link:hover { color: #fff !important; }
        .cta-mega:hover .cta-arrow { transform: translate(0.12em, -0.14em); }

        .btn-primary { transition: box-shadow 0.35s ease !important; }
        .btn-primary:hover { box-shadow: 0 0 0 3px rgba(255,255,255,0.18), 0 6px 30px rgba(255,255,255,0.16); }

        @media (max-width: 880px) {
          .service-grid {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          .service-grid--rev .service-copy { order: 2 !important; }
          .service-grid--rev .service-head { order: 1 !important; text-align: left !important; }
          .hero-foot { grid-template-columns: 1fr !important; }
          .hero-ctas { justify-content: flex-start !important; }
          .process-grid { grid-template-columns: 1fr !important; }
          .approach-grid { grid-template-columns: 1fr !important; }
          .nav-meta { display: none !important; }
          .scroll-prog { display: none !important; }
        }
      `}</style>
    </div>
  );
}
