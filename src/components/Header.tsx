"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, FileText } from "lucide-react";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/simulador", label: "Simulador", icon: BarChart3 },
  { href: "/resultados", label: "Resultados", icon: FileText },
];

export default function Header() {
  const path = usePathname();
  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-card)",
      position: "sticky", top: 0, zIndex: 50,
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        height: 56,
      }}>
        <Link href="/" style={{
          textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 700, color: "var(--gold)",
            letterSpacing: 1,
          }}>MONTE CARLO</span>
          <span style={{
            fontSize: 11, color: "var(--text-muted)",
            borderLeft: "1px solid var(--border)", paddingLeft: 10,
          }}>Simulação de Risco</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} style={{
                textDecoration: "none", padding: "6px 14px", borderRadius: 8,
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "var(--gold)" : "var(--text-secondary)",
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                transition: "all 0.2s",
              }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
