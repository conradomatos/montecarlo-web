import { MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "24px 20px", textAlign: "center",
      background: "var(--bg-card)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          color: "var(--gold)", fontSize: 14, marginBottom: 8,
        }}>Desenvolvido por Conrado Matos</p>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 12 }}>
          Concept Engenharia | MBA FGV
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="https://wa.me/5543998023798" target="_blank" rel="noopener"
            style={{ color: "#25D366", textDecoration: "none", fontSize: 13,
              display: "flex", alignItems: "center", gap: 5 }}>
            <MessageCircle size={14} /> 43 99802-3798
          </a>
          <a href="https://linkedin.com/in/conradomatos" target="_blank" rel="noopener"
            style={{ color: "#0A66C2", textDecoration: "none", fontSize: 13,
              display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
