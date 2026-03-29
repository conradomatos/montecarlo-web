import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MonteCarloChart from "@/components/MonteCarloChart";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 20px",
        gap: 48,
      }}>
        <div style={{ textAlign: "center", maxWidth: 600 }}>
          <p style={{
            color: "var(--gold)", fontSize: 13, letterSpacing: 3,
            textTransform: "uppercase", marginBottom: 16,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Simulação de risco de crédito
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 48, fontWeight: 700, color: "var(--text-primary)",
            lineHeight: 1.2, marginBottom: 20,
          }}>
            Método <span style={{ color: "var(--gold)" }}>Monte Carlo</span>
          </h1>
          <p style={{
            fontSize: 17, color: "var(--text-secondary)",
            lineHeight: 1.6, marginBottom: 32,
          }}>
            10.000 cenários simulados em tempo real para quantificar risco de crédito.
          </p>
          <Link href="/simulador" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", borderRadius: 8,
            background: "var(--gold)", color: "var(--bg-deep)",
            fontWeight: 600, fontSize: 15, textDecoration: "none",
            transition: "opacity 0.2s",
          }}>
            Testar o simulador <ArrowRight size={18} />
          </Link>
        </div>

        <MonteCarloChart />
      </main>
      <Footer />
    </div>
  );
}
