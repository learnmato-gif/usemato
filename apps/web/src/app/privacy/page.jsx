export default function PrivacyPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "80px clamp(24px,6vw,120px) 80px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{ fontSize: 13, color: "#D63B2A", textDecoration: "none", fontWeight: 500 }}>← Back to Mato</a>
        <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 780, letterSpacing: "-0.03em", color: "#0a0a0a", marginTop: 32, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 48 }}>Last updated: May 14, 2026</p>

        {[
          {
            title: "1. Information We Collect",
            body: "When you join our waitlist, we collect your email address. If you use Mato, we may also collect usage data, preferences, and information you provide while using the platform. We do not sell your personal information to third parties.",
          },
          {
            title: "2. How We Use Your Information",
            body: "We use your email to send you updates about Mato, including product launches, feature announcements, and relevant news. You can unsubscribe at any time by clicking the unsubscribe link in any email we send.",
          },
          {
            title: "3. Data Storage",
            body: "Your data is stored securely using industry-standard encryption. We use third-party services (including database providers and email platforms) that are bound by their own privacy policies and data processing agreements.",
          },
          {
            title: "4. Cookies",
            body: "We may use cookies and similar technologies to improve your experience. These help us understand how the site is used and let us make it better. You can disable cookies in your browser settings.",
          },
          {
            title: "5. Third-Party Services",
            body: "Mato uses trusted third-party services such as Resend for email delivery and Neon for database hosting. These services may process your data as part of providing their services to us.",
          },
          {
            title: "6. Your Rights",
            body: "You have the right to access, update, or delete the personal information we hold about you. To make a request, email us at privacy@usemato.com and we will respond within 30 days.",
          },
          {
            title: "7. Children's Privacy",
            body: "Mato is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn we have done so, we will delete that information promptly.",
          },
          {
            title: "8. Changes to This Policy",
            body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our site. Continued use of Mato after changes constitutes acceptance of the updated policy.",
          },
          {
            title: "9. Contact",
            body: "Questions about this policy? Email us at privacy@usemato.com.",
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
