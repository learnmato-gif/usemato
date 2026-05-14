export default function TermsPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "80px clamp(24px,6vw,120px) 80px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{ fontSize: 13, color: "#D63B2A", textDecoration: "none", fontWeight: 500 }}>← Back to Mato</a>
        <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 780, letterSpacing: "-0.03em", color: "#0a0a0a", marginTop: 32, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 48 }}>Last updated: May 14, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using Mato (usemato.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.",
          },
          {
            title: "2. Description of Service",
            body: "Mato is an AI-powered platform designed to help users manage and automate tasks. Features and availability may change as we continue to develop the product. Access is currently limited to waitlist members.",
          },
          {
            title: "3. Waitlist",
            body: "Joining our waitlist does not guarantee access to Mato. We will invite users at our discretion. By joining the waitlist, you agree to receive emails from us about Mato. You may unsubscribe at any time.",
          },
          {
            title: "4. User Conduct",
            body: "You agree not to misuse the service. This includes attempting to reverse-engineer our software, scraping our platform, using Mato for unlawful purposes, or interfering with other users' access to the service.",
          },
          {
            title: "5. Intellectual Property",
            body: "All content, logos, and trademarks on Mato are the property of Mato, Inc. You may not reproduce, distribute, or create derivative works without our written permission.",
          },
          {
            title: "6. Disclaimer of Warranties",
            body: "Mato is provided 'as is' without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or meet your specific requirements.",
          },
          {
            title: "7. Limitation of Liability",
            body: "To the fullest extent permitted by law, Mato, Inc. will not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.",
          },
          {
            title: "8. Modifications",
            body: "We reserve the right to modify these Terms at any time. We will notify users of material changes via email or on-site notice. Continued use of Mato after changes constitutes acceptance.",
          },
          {
            title: "9. Governing Law",
            body: "These Terms are governed by the laws of India. Any disputes arising from these Terms will be subject to the exclusive jurisdiction of the courts located in India.",
          },
          {
            title: "10. Contact",
            body: "Questions about these Terms? Email us at legal@usemato.com.",
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 680, color: "#0a0a0a", marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: 15, color: "#444", lineHeight: 1.75 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
