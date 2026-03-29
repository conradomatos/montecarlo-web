"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const VARS = [
  { name: "X₁ — Receita base", desc: "Receita bruta doméstica. PERT(38mi, 45mi, 55mi). O exercício dá R$45mi como ponto; o modelo sorteia entre R$38mi (cenário ruim) e R$55mi (expansão deu certo)." },
  { name: "X₂ — Perda do cliente", desc: "Evento binário (Bernoulli, p=12%). O maior cliente representa 38% da receita. Se sai, a receita cai 38% de uma vez. 12% é a probabilidade arbitrada de perder esse cliente no período." },
  { name: "X₃ — Margem EBITDA", desc: "PERT(8%, 13%, 17%). O exercício dá margem líquida de 7,8%. EBITDA é maior que LL (inclui juros, impostos, depreciação). 13% é típico de indústria brasileira." },
  { name: "X₄ — Impacto climático", desc: "Triangular(-12%, -2%, +5%). A Agrotech vende para o agro, sensível a safra. La Niña forte pode derrubar 12% da receita. Viés negativo." },
  { name: "X₅ — Receita Argentina", desc: "PERT(0, 3mi, 8mi) × fator de maturação. No ano 1, só 25% se materializa (9 meses de instalação). É upside se a expansão funcionar." },
];

const VARS_EXTRA = [
  { name: "X₆ — Taxa de juros", desc: "PERT(15%, 18.25%, 22%). Na aba 1 é fixa em 18.25% (CDI 14.75% + spread 3.5%). Na aba 2 varia com projeção de Selic." },
  { name: "X₇ — Câmbio Argentina", desc: "Triangular(-20%, -5%, +3%). Impacto cambial sobre a receita Argentina. Peso argentino historicamente volátil, viés negativo." },
  { name: "X₈ — Custo governança", desc: "PERT(300k, 600k, 1.2mi). Custo da consultoria de reestruturação + implantação de controles. Subtrai do EBITDA." },
  { name: "X₉ — Valor das garantias", desc: "PERT(2mi, 4mi, 6mi). Máquinas alienadas valem 30-60% do valor contábil em liquidação forçada. Afeta diretamente o LGD." },
];

const FORMULAS = [
  { name: "Receita ajustada", formula: "R_aj = X₁ × (1 - X₂ × c) × (1 + X₄) + X₅", desc: "c = 0.38 (concentração)" },
  { name: "EBITDA", formula: "EBITDA = R_aj × X₃ - X₈", desc: "Aba 1 não subtrai X₈" },
  { name: "Serviço da dívida", formula: "S = E_ef / (42/12) + E_ef × 0.6 × τ", desc: "τ = taxa fixa (aba 1) ou X₆ (aba 2)" },
  { name: "DSCR", formula: "DSCR = EBITDA / S", desc: "< 1.0 = default" },
  { name: "PD", formula: "PD = |{DSCR < 1.0}| / N", desc: "N = 10.000 simulações" },
  { name: "LGD", formula: "LGD = média(max(0, E - X₉) / E)", desc: "Só rodadas de default" },
  { name: "PE", formula: "PE = PD × LGD × EAD", desc: "Perda Esperada" },
  { name: "Custo calote", formula: "C = P_liq + C_oport + R_perd + C_jur + C_reg", desc: "Em 24 meses" },
  { name: "Custo esperado", formula: "CE = PD × C", desc: "Ponderado pela probabilidade" },
  { name: "Resultado", formula: "Lucro = (Spread - CE) × 3.5 anos", desc: "Se > 0 → rentável" },
];

export default function ResultadosPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-deep)" }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 900, margin: "0 auto", width: "100%", padding: "32px 20px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "var(--gold)", marginBottom: 8 }}>
          Resultados e Memorial de Cálculo
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
          Definição formal de cada variável, fórmulas e explicações.
        </p>

        {/* Variaveis do caso (Aba 1) */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--gold)",
          marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          Variáveis — Dados do exercício (Aba 1)
        </h2>
        {VARS.map(v => (
          <div key={v.name} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16,
            marginBottom: 12, padding: 14, background: "var(--bg-card)", borderRadius: 8,
            border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>
              {v.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{v.desc}</div>
          </div>
        ))}

        {/* Variaveis extras (Aba 2) */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--gold)",
          marginBottom: 16, marginTop: 32, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          Variáveis adicionais — Análise completa (Aba 2)
        </h2>
        {VARS_EXTRA.map(v => (
          <div key={v.name} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16,
            marginBottom: 12, padding: 14, background: "var(--bg-card)", borderRadius: 8,
            border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>
              {v.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{v.desc}</div>
          </div>
        ))}

        {/* Formulas */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--gold)",
          marginBottom: 16, marginTop: 32, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          Memorial de cálculo — Fórmulas
        </h2>
        {FORMULAS.map(f => (
          <div key={f.name} style={{ display: "grid", gridTemplateColumns: "140px 1fr 200px", gap: 12,
            marginBottom: 8, padding: 12, background: "var(--bg-card)", borderRadius: 8,
            border: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{f.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--gold)" }}>
              {f.formula}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.desc}</div>
          </div>
        ))}

        {/* Comparativo */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--gold)",
          marginBottom: 16, marginTop: 32, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          Comparativo — Por que os dados do exercício são insuficientes
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--gold)" }}>
              {["Métrica", "Aba 1 (5 vars)", "Aba 2 (9 vars)", "Delta"].map(h => (
                <th key={h} style={{ padding: "10px 8px", textAlign: "left", color: "var(--gold)",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["DSCR P50", "1.87x", "1.59x", "-15%"],
              ["PD", "1.3%", "7.0%", "5.4x maior"],
              ["PE", "R$ 51k", "R$ 280k", "5.5x maior"],
              ["Custo esperado", "R$ 111k", "R$ 559k", "5x maior"],
              ["Resultado líq./ano", "R$ 765k", "R$ 315k", "-59%"],
              ["Rentável?", "SIM", "SIM", "Ambos, mas margem cai"],
            ].map(([m, v1, v2, d]) => (
              <tr key={m} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px", color: "var(--text-primary)" }}>{m}</td>
                <td style={{ padding: "8px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>{v1}</td>
                <td style={{ padding: "8px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>{v2}</td>
                <td style={{ padding: "8px", fontFamily: "'JetBrains Mono', monospace", color: "var(--risk-red)", fontWeight: 600 }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Conclusao */}
        <div style={{ marginTop: 32, padding: 24, background: "var(--bg-card)",
          borderRadius: 10, border: "1px solid var(--gold)", borderLeftWidth: 3 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--gold)", marginBottom: 8 }}>
            Conclusão
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            A decisão de crédito não muda — ambos os modelos dizem &ldquo;aprova&rdquo;. Mas a <strong style={{ color: "var(--text-primary)" }}>confiança
            nessa decisão cai drasticamente</strong>. Com dados do exercício, o banco acha que arrisca R$ 51 mil.
            Na realidade, arrisca R$ 280 mil. Um comitê que aprova sem saber disso está tomando
            decisão às cegas. Monte Carlo quantifica essa cegueira.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
