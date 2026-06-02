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

/* Word-by-word reveal across multiple lines (newline = new line). */
function Reveal({ text, visible, baseDelay = 0, style }) {
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
                  {w}{wi < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
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
const BLUE_PALETTE = {
  base1: "15,40,110",   base2: "8,18,55",
  far:   "60,130,220",
  near:  "90,170,255",
  bloom1:"150,210,255", bloom2:"60,140,255", bloom3:"20,80,180",
  ember1:"160,215,255", ember2:"80,160,230",
};

function BeamBackground({ palette = PINK_PALETTE, fixed = true }) {
  const p = palette;
  return (
    <div
      aria-hidden
      style={{
        position: fixed ? "fixed" : "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "#000", overflow: "hidden",
        transform: "translateZ(0)",        // GPU layer — kills iOS scroll jitter
        willChange: "transform",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
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

      {/* 2. Far beams — vw-based widths so they stay proportional on any screen */}
      <div className="beams-far" style={{
        position: "absolute", inset: "-25%",
        background:
          `repeating-linear-gradient(-58deg,` +
          ` transparent 0,` +
          ` transparent 9vw,` +
          ` rgba(${p.far},0.40) 12vw,` +
          ` rgba(${p.far},0.40) 17vw,` +
          ` transparent 20vw,` +
          ` transparent 30vw)`,
        filter: "blur(2.4vw)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 70% at 50% 23%, #000 0%, #000 26%, transparent 82%)",
        maskImage:
          "radial-gradient(ellipse 80% 70% at 50% 23%, #000 0%, #000 26%, transparent 82%)",
      }} />

      {/* 3. Near beams — tighter, sharper, vw-scaled */}
      <div className="beams-near" style={{
        position: "absolute", inset: "-15%",
        background:
          `repeating-linear-gradient(-52deg,` +
          ` transparent 0,` +
          ` transparent 5vw,` +
          ` rgba(${p.near},0.60) 7.5vw,` +
          ` rgba(${p.near},0.60) 10.5vw,` +
          ` transparent 13vw,` +
          ` transparent 19vw)`,
        filter: "blur(1.1vw)",
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

      <style>{`
        @media (max-width: 768px) {
          .beams-far { background-image:
            repeating-linear-gradient(-58deg,
              transparent 0, transparent 18vw,
              rgba(220,40,140,0.40) 24vw,
              rgba(220,40,140,0.40) 34vw,
              transparent 40vw, transparent 56vw) !important;
          }
          .beams-near { background-image:
            repeating-linear-gradient(-52deg,
              transparent 0, transparent 14vw,
              rgba(255,70,180,0.60) 19vw,
              rgba(255,70,180,0.60) 26vw,
              transparent 31vw, transparent 44vw) !important;
          }
        }
      `}</style>
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

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 220);
    return () => clearTimeout(t);
  }, []);

  // Detect if the fixed nav is currently over a white section
  const [onLight, setOnLight] = useState(false);
  useEffect(() => {
    function check() {
      const probeY = 36; // nav vertical center
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
      background: "#000",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      color: "#fff",
      overflowX: "hidden",
      minHeight: "100vh",
    }}>

      <ScrollProgress />

      {/* ─── NAV ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 4vw, 56px)",
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

      {/* ─── HERO ─── */}
      <section style={{
        position: "relative", zIndex: 1, minHeight: "100vh",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "120px clamp(24px, 5vw, 80px) clamp(60px, 8vw, 110px)",
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
          <Reveal text={"Built for\nthe AI-first\nweb."} visible={heroVisible} baseDelay={0.15} />
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
              }}
            >
              See the work <span style={{ fontSize: 14 }}>↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── MANIFESTO ─── */}
      <section ref={manifestoRef} style={{
        position: "relative", zIndex: 1, minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "clamp(80px, 14vw, 180px) clamp(24px, 5vw, 80px)",
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
          <Reveal text={"Most sites talk\nto humans.\nOurs talk\nto machines, too."} visible={manifestoIn} baseDelay={0.05} />
        </h2>
      </section>

      {/* ─── WHITE CONTRAST — WHO IT'S FOR ─── */}
      <section ref={whoRef} style={{
        position: "relative", zIndex: 2,
        background: "#fff", color: "#0a0a0a",
        padding: "clamp(100px, 14vw, 200px) clamp(24px, 5vw, 80px)",
      }}>
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
            <Reveal text={"Built for the people\nwho actually ship."} visible={whoIn} baseDelay={0.05} />
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
          <div aria-hidden style={{
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
          <div aria-hidden style={{
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
        padding: "clamp(100px, 14vw, 200px) clamp(24px, 5vw, 80px)",
      }}>
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
            <Reveal text={"Ship in weeks.\nNot quarters."} visible={approachIn} baseDelay={0.05} />
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
          <Reveal text={"Let's build."} visible={ctaIn} baseDelay={0.15} />
        </div>

        <div style={{
          opacity: ctaIn ? 1 : 0,
          transform: `translateY(${ctaIn ? 0 : 20}px)`,
          transition: "opacity 0.9s ease 0.9s, transform 0.9s cubic-bezier(0.2,0.9,0.2,1) 0.9s",
        }}>
          <ContactForm />
        </div>
      </section>

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
