"use client";
import { useEffect, useState, useRef } from "react";

export const meta = () => [
  { title: "MatoPilot — Autonomous Outbound & Lead Intelligence" },
  { name: "description", content: "MatoPilot finds leads, researches every company, and sends personalized outreach automatically. Discover verified leads in any niche, any country. Your entire outbound stack in one tool." },
  { name: "keywords", content: "lead generation, cold email automation, outbound sales, B2B prospecting, AI outreach, lead intelligence, sales automation, email personalization" },
  { property: "og:title", content: "MatoPilot — Your Outbound on Autopilot" },
  { property: "og:description", content: "Find leads, research companies, send personalized outreach — all automated. Stop prospecting. Start closing." },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "MatoPilot — Autonomous Outbound & Lead Intelligence" },
  { name: "twitter:description", content: "Find leads, research companies, send personalized outreach — all automated." },
];

const RED = "#D63B2A";
const LOGO = "https://dtvoeevhaseb5.cloudfront.net/user-uploads/1bc5e906-d5f4-4b9f-93e2-2074589dee93.png";

/* ═══════════════════════════════════════════
   ORGANIC BLOB — SVG paint-splatter shapes
   ═══════════════════════════════════════════ */
const BLOB_PATHS = [
  "M45 5C55 2 68 8 75 18C82 28 88 22 93 30C98 38 96 48 90 55C84 62 92 68 88 78C84 88 72 92 62 90C52 88 56 95 46 93C36 91 28 86 22 78C16 70 8 72 5 62C2 52 6 42 12 34C18 26 10 18 18 12C26 6 35 8 45 5Z",
  "M50 3C62 1 72 10 78 20C84 30 95 28 96 40C97 52 88 56 85 65C82 74 90 82 80 88C70 94 58 90 48 92C38 94 28 88 20 80C12 72 4 68 3 56C2 44 8 36 15 28C22 20 18 10 28 5C38 0 42 5 50 3Z",
  "M48 2C60 0 70 6 78 15C86 24 94 20 96 32C98 44 92 52 86 60C80 68 86 78 78 85C70 92 58 96 46 94C34 92 24 88 16 78C8 68 2 58 3 46C4 34 10 26 18 18C26 10 36 4 48 2Z",
  "M50 5C65 2 80 15 85 30C90 45 82 65 70 78C58 91 38 88 25 75C12 62 8 40 15 25C22 10 35 8 50 5Z",
];

function Blob({ path = 0, color, size = 300, top, left, right, bottom, rotate = 0, animated = false, animDelay = "0s" }) {
  return (
    <svg viewBox="0 0 100 100" style={{
      position: "absolute", width: size, height: size,
      top, left, right, bottom,
      transform: `rotate(${rotate}deg)`,
      pointerEvents: "none", zIndex: 0,
      ...(animated ? { animation: `blob-float 20s ease-in-out infinite`, animationDelay: animDelay } : {}),
    }}>
      <path d={BLOB_PATHS[path % BLOB_PATHS.length]} fill={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function MatoLanding() {
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [introFade, setIntroFade] = useState(1);
  const [heroVisible, setHeroVisible] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [logoHover, setLogoHover] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const blackRef = useRef(null);

  const handleWaitlist = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setFormError("");
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setEmail("");
        setTimeout(() => setSubmitted(false), 6000);
      } else {
        setFormError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const steps = [];
    for (const c of "Finding leads") steps.push({ type: "add", char: c, delay: 65 });
    for (const c of "...") steps.push({ type: "add", char: c, delay: 400 });
    steps.push({ type: "pause", delay: 800 });
    for (let i = 0; i < 3; i++) steps.push({ type: "delete", delay: 80 });
    steps.push({ type: "pause", delay: 300 });
    for (const c of ". We found them first.") steps.push({ type: "add", char: c, delay: 45 });
    let idx = 0, built = "", timer;
    const run = () => {
      if (idx >= steps.length) { setTimeout(() => setShowCursor(false), 2000); return; }
      const s = steps[idx];
      if (s.type === "add") built += s.char;
      else if (s.type === "delete") built = built.slice(0, -1);
      setTypedText(built);
      timer = setTimeout(run, s.delay);
      idx++;
    };
    timer = setTimeout(run, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setIntroFade(Math.max(0, 1 - (window.scrollY / window.innerHeight) * 1.8));
      if (window.scrollY > 20) setShowScrollHint(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (window.scrollY < 20) setShowScrollHint(true); }, 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHeroVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const px = scrollY * 0.35;

  return (
    <div style={{ background: "#fff", fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: "#1a1a1a", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", inset: "0 0 auto 0", zIndex: 300, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", transition: "color 0.3s" }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 0, textDecoration: "none", fontSize: 28, fontWeight: 720, letterSpacing: "-0.04em", color: scrollY > (typeof window !== "undefined" ? window.innerHeight * 1.8 : 9999) ? "#fff" : "#0a0a0a", lineHeight: 1, transition: "color 0.3s" }}
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
        >
          <span>mat</span>
          <span style={{ position: "relative", display: "inline-flex", alignItems: "baseline", width: logoHover ? 24 : undefined, marginLeft: logoHover ? -5 : 0, transition: "width 0.2s, margin 0.2s" }}>
            <span style={{ opacity: logoHover ? 0 : 1, transition: "opacity 0.2s" }}>o</span>
            <img src={LOGO} alt="" style={{
              position: "absolute", left: 0, bottom: -1, transform: "none",
              width: 26, height: 26, objectFit: "contain",
              opacity: logoHover ? 1 : 0, transition: "opacity 0.2s",
            }} />
          </span>
        </a>
      </nav>

      {/* INTRO — TYPING */}
      <section style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 clamp(20px,5vw,64px)" }}>
        <div style={{ opacity: introFade, transform: `translateY(${(1 - introFade) * -40}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.8vw, 48px)", fontWeight: 650, color: `rgba(10,10,10,${0.85 * introFade})`, letterSpacing: "-0.035em", textAlign: "center", lineHeight: 1.25, margin: 0, minHeight: "1.3em", whiteSpace: "nowrap" }}>
            {typedText}
            {showCursor && <span style={{ display: "inline-block", width: 3, height: "0.8em", background: `rgba(214,59,42,${0.9 * introFade})`, marginLeft: 3, verticalAlign: "baseline", borderRadius: 1, animation: "blink-cursor 0.8s step-end infinite" }} />}
          </h2>
          <img src={LOGO} alt="" style={{ marginTop: 40, width: "clamp(24px, 3vw, 36px)", height: "clamp(24px, 3vw, 36px)", objectFit: "contain", opacity: showScrollHint ? 0.6 : 0, transition: "opacity 1s ease", animation: showScrollHint ? "tomato-bob 2s ease-in-out infinite" : "none" }} />
        </div>
      </section>

      {/* PARALLAX BLOB LAYER — hero area only */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "250vh", pointerEvents: "none", zIndex: 0, overflow: "hidden", transform: `translateY(${-px}px)`, willChange: "transform" }}>
        <Blob path={0} color={RED} size="clamp(300px, 40vw, 580px)" top="90vh" left="-12%" rotate={-15} animated animDelay="0s" />
        <Blob path={1} color="#FF8A65" size="clamp(240px, 32vw, 450px)" top="105vh" right="-10%" rotate={25} animated animDelay="-5s" />
        <Blob path={3} color="#20c997" size="clamp(100px, 14vw, 180px)" top="155vh" left="12%" rotate={50} animated animDelay="-9s" />
        <Blob path={2} color="#FFC107" size="clamp(220px, 28vw, 400px)" top="170vh" right="5%" rotate={40} animated animDelay="-3s" />
        <Blob path={0} color="#6366f1" size="clamp(140px, 18vw, 260px)" top="140vh" left="60%" rotate={-30} animated animDelay="-7s" />
      </div>

      {/* HERO */}
      <div ref={heroRef} style={{ minHeight: "90vh", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px clamp(20px,5vw,64px) 140px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 700 }}>
          <h1 style={{
            fontSize: "clamp(48px, 9vw, 96px)", fontWeight: 800, letterSpacing: "-0.05em",
            lineHeight: 0.95, color: "#0a0a0a", margin: "0 0 32px",
            opacity: heroVisible ? 1 : 0, transform: `translateY(${heroVisible ? 0 : 20}px)`,
            transition: "all 0.8s cubic-bezier(0.4,0,0.2,1) 0.1s",
          }}>
            Your outbound<br />on autopilot
          </h1>

          <p style={{
            fontSize: "clamp(16px, 1.8vw, 20px)", lineHeight: 1.6, color: "#888",
            maxWidth: 440, margin: "0 0 44px", fontWeight: 400,
            opacity: heroVisible ? 1 : 0, transform: `translateY(${heroVisible ? 0 : 14}px)`,
            transition: "all 0.8s cubic-bezier(0.4,0,0.2,1) 0.25s",
          }}>
            MatoPilot finds leads, researches every company, and sends personalized outreach — so you just take the meetings.
          </p>

          <div style={{
            display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
            opacity: heroVisible ? 1 : 0, transform: `translateY(${heroVisible ? 0 : 10}px)`,
            transition: "all 0.8s cubic-bezier(0.4,0,0.2,1) 0.4s",
          }}>
            <button onClick={() => ctaRef.current?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "#0a0a0a", border: "none", borderRadius: 50, padding: "16px 36px", cursor: "pointer" }}>
              Get early access
            </button>
            <button onClick={() => blackRef.current?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 15, fontWeight: 500, color: "#666", background: "transparent", border: "1px solid #ddd", borderRadius: 50, padding: "16px 36px", cursor: "pointer" }}>
              See how it works
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ BLACK SECTION — impact messaging ═══════ */}
      <div ref={blackRef} style={{ background: "#0a0a0a", position: "relative", zIndex: 3 }}>

        {/* Statement 1 — big bold opener */}
        <div style={{ padding: "clamp(100px,14vw,180px) clamp(24px,6vw,80px)", maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 800, letterSpacing: "-0.045em", color: "#fff", lineHeight: 1.0, margin: 0 }}>
            Find thousands of verified leads in any niche. Anywhere.
          </h2>
          <p style={{ fontSize: "clamp(16px, 1.6vw, 20px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "32px 0 0", maxWidth: 520, fontWeight: 400 }}>
            Search by industry, city, country, or keyword. MatoPilot pulls verified emails, phone numbers, websites, and business data from public sources — globally, continuously.
          </p>
        </div>

        {/* Divider line */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 clamp(24px,6vw,80px)" }} />

        {/* Statement 2 */}
        <div style={{ padding: "clamp(100px,14vw,180px) clamp(24px,6vw,80px)", maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 800, letterSpacing: "-0.045em", color: "#fff", lineHeight: 1.0, margin: 0 }}>
            Every email is researched.<br />Not templated.
          </h2>
          <p style={{ fontSize: "clamp(16px, 1.6vw, 20px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "32px 0 0", maxWidth: 520, fontWeight: 400 }}>
            MatoPilot visits every prospect&apos;s website, reads their positioning, understands their services — then writes outreach that sounds like you spent 20 minutes on it. For every single lead.
          </p>
        </div>

        {/* Divider line */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 clamp(24px,6vw,80px)" }} />

        {/* Statement 3 */}
        <div style={{ padding: "clamp(100px,14vw,180px) clamp(24px,6vw,80px)", maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 800, letterSpacing: "-0.045em", color: "#fff", lineHeight: 1.0, margin: 0 }}>
            From stranger to inbox.<br />One workflow.
          </h2>
          <p style={{ fontSize: "clamp(16px, 1.6vw, 20px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "32px 0 0", maxWidth: 520, fontWeight: 400 }}>
            Discovery, enrichment, research, personalization, multi-step sequences, and send scheduling — all automated. Stop stitching five tools together. This is your entire outbound stack.
          </p>
        </div>

        {/* How it works — minimal on black */}
        <div style={{ padding: "0 clamp(24px,6vw,80px) clamp(100px,14vw,180px)", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "clamp(40px, 6vw, 80px)", flexWrap: "wrap" }}>
            {[
              { n: "01", label: "Pick your niche and location" },
              { n: "02", label: "MatoPilot finds, researches, and writes" },
              { n: "03", label: "You get meetings in your inbox" },
            ].map((s, i) => (
              <div key={i} style={{ flex: "1 1 200px" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>{s.n}</span>
                <span style={{ fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 650, color: "#fff", letterSpacing: "-0.02em" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ RED SECTION — full CTA ═══════ */}
      <div ref={ctaRef} style={{ background: RED, position: "relative", zIndex: 3, padding: "clamp(80px,12vw,160px) clamp(24px,6vw,80px)", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", margin: "0 0 16px", lineHeight: 1.05 }}>
            Stop prospecting.<br />Start closing.
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 40px" }}>
            Get early access to MatoPilot v1 — limited spots.
          </p>

          {submitted ? (
            <div style={{ padding: "20px 32px", borderRadius: 16, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
              🍅 You&apos;re on the list! Check your inbox.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFormError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleWaitlist()}
                  disabled={loading}
                  style={{ fontSize: 15, padding: "16px 24px", borderRadius: 50, border: `2px solid ${formError ? "rgba(255,200,200,0.6)" : "rgba(255,255,255,0.3)"}`, background: "rgba(255,255,255,0.1)", color: "#fff", outline: "none", width: "clamp(220px, 40vw, 300px)", backdropFilter: "blur(8px)", opacity: loading ? 0.7 : 1 }}
                />
                <button
                  onClick={handleWaitlist}
                  disabled={loading}
                  style={{ fontSize: 15, fontWeight: 650, color: RED, background: "#fff", border: "none", borderRadius: 50, padding: "16px 32px", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "-0.01em", opacity: loading ? 0.8 : 1, minWidth: 140 }}
                >
                  {loading ? <img src={LOGO} alt="" style={{ width: 20, height: 20, animation: "tomato-spin 0.8s linear infinite" }} /> : "Join waitlist"}
                </button>
              </div>
              {formError && (
                <p style={{ fontSize: 13, color: "rgba(255,220,220,0.9)", marginTop: 12, marginBottom: 0 }}>{formError}</p>
              )}
            </>
          )}

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 18 }}>No spam. Early access only.</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#fff", padding: "40px clamp(24px,6vw,80px) 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <img src={LOGO} style={{ width: 18, height: 18 }} alt="Mato" />
          <span style={{ fontSize: 13, fontWeight: 720, letterSpacing: "-0.04em", color: "#0a0a0a" }}>mato</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
            { label: "Instagram", href: "https://www.instagram.com/use.mato/" },
            { label: "LinkedIn", href: "https://www.linkedin.com/company/mato-linkedin/" },
          ].map(item => (
            <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ fontSize: 12, color: "#bbb", textDecoration: "none", transition: "color 0.2s", fontWeight: 450 }}
              onMouseEnter={e => e.currentTarget.style.color = "#666"}
              onMouseLeave={e => e.currentTarget.style.color = "#bbb"}
            >{item.label}</a>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "#ddd" }}>&copy; 2026 Mato, Inc.</span>
      </footer>

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        @keyframes blink-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes tomato-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes tomato-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes blob-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(12px, -8px) scale(1.02); }
          66% { transform: translate(-8px, 10px) scale(0.98); }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        ::selection { background: rgba(214,59,42,0.2); color: #1a1a1a; }
        input::placeholder { color: #bbb; }
        input:focus { border-color: rgba(255,255,255,0.7) !important; }
        input:disabled { cursor: not-allowed; }
        button { transition: opacity 0.2s, transform 0.15s; }
        button:hover { opacity: 0.8; transform: translateY(-1px); }
        button:active { transform: translateY(0); opacity: 1; }
        @media (max-width: 700px) {
          div[style*="flex-direction: row"], div[style*="flex-direction: row-reverse"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
