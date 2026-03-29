import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight, BarChart3, Shield, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{
          padding: "80px 20px", textAlign: "center",
          background: "linear-gradient(180deg, var(--bg-card) 0%, var(--bg-deep) 100%)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <p style={{ color: "var(--gold)", fontSize: 13, letterSpacing: 3,
              textTransform: "uppercase", marginBottom: 16,
              fontFamily: "'JetBrains Mono', monospace" }}>
              Simulação de risco de crédito
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 48, fontWeight: 700, color: "var(--text-primary)",
              lineHeight: 1.2, marginBottom: 20,
            }}>
              Método <span style={{ color: "var(--gold)" }}>Monte Carlo</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
              Transforme análise de crédito estática em probabilística.
              10.000 cenários simulados em tempo real. Quantifique risco,
              meça o efeito de covenants, encontre o ponto ótimo.
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
        </section>

        {/* O que é */}
        <section style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28,
            color: "var(--gold)", marginBottom: 24, textAlign: "center",
          }}>O que é Monte Carlo?</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 20 }}>
            Em vez de calcular um resultado único, o Monte Carlo <strong style={{ color: "var(--text-primary)" }}>sorteia
            valores de cada variável</strong> dentro de distribuições de probabilidade e roda o cálculo
            milhares de vezes. Cada rodada é um cenário possível. O resultado não é
            &ldquo;o projeto custa X&rdquo; mas sim <strong style={{ color: "var(--gold)" }}>&ldquo;há Y% de chance de o custo
            ficar abaixo de X&rdquo;</strong>.
          </p>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            O método nasceu nos anos 1940 em Los Alamos, usado por von Neumann e Ulam para simular
            colisões de nêutrons. Hoje é padrão em Basileia III para cálculo de capital regulatório
            em bancos, em engenharia de custos (AACE), e em gestão de riscos de projetos.
          </p>
        </section>

        {/* Cards */}
        <section style={{
          padding: "40px 20px 60px", maxWidth: 1000, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
        }}>
          {[
            { icon: BarChart3, title: "10.000 cenários", desc: "Cada simulação sorteia valores de receita, margem, taxa de juros e mais — gerando uma distribuição completa de resultados possíveis." },
            { icon: Shield, title: "Risco quantificado", desc: "PD (Probabilidade de Default), LGD, Perda Esperada — as mesmas métricas que bancos reais usam para precificar crédito." },
            { icon: TrendingUp, title: "Decisão com dados", desc: "Compare cenários, meça o efeito de covenants, encontre o empréstimo máximo com risco aceitável. Sem achismo." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 12, padding: 24,
            }}>
              <Icon size={24} color="var(--gold)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18,
                color: "var(--text-primary)", marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </section>

        {/* Caso */}
        <section style={{
          padding: "60px 20px", borderTop: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28,
              color: "var(--gold)", marginBottom: 16 }}>O caso</h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 24 }}>
              A <strong style={{ color: "var(--text-primary)" }}>Agrotech Brasil</strong> solicita
              R$ 8 milhões ao <strong style={{ color: "var(--text-primary)" }}>Banco JogoDuro</strong> para
              ampliação de capacidade produtiva. Empresa familiar com 17 anos, em troca de geração,
              receita de R$ 45 milhões, score 825. Os indicadores financeiros apontam aprovação.
              Mas os riscos qualitativos — concentração de 38% em um cliente, governança informal,
              expansão para Argentina — contam outra história.
            </p>
            <Link href="/simulador" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 8,
              border: "1px solid var(--gold)", color: "var(--gold)",
              fontWeight: 500, fontSize: 14, textDecoration: "none",
            }}>
              Simular agora <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
