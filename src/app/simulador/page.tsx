"use client";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ParamSlider from "@/components/ParamSlider";
import { runMonteCarlo, buildHistogramBins, type MCParams, type MCResult } from "@/lib/monte-carlo";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  BarChart as BChart } from "recharts";

const FMT = (n: number) => n >= 1e6 ? `R$${(n/1e6).toFixed(1)}mi` : `R$${(n/1e3).toFixed(0)}k`;

export default function SimuladorPage() {
  const [tab, setTab] = useState(0);
  // Aba 1 params
  const [a1, setA1] = useState({ emp: 8, conc: 38, prob: 12, marg: 13, taxa: 18.2, arg: true });
  // Aba 2 params
  const [a2, setA2] = useState({ emp: 8, conc: 38, prob: 12, marg: 13, taxa: 18.2,
    arg: true, tranches: false, cambio: -20, gov: 600, gar: 4, mat: 25 });

  const params1: MCParams = useMemo(() => ({
    emprestimo: a1.emp * 1e6, concentracao: a1.conc / 100, probPerda: a1.prob / 100,
    margemEbitda: a1.marg / 100, taxaJuros: a1.taxa / 100, argentina: a1.arg, tranches: false,
  }), [a1]);

  const params2: MCParams = useMemo(() => ({
    emprestimo: a2.emp * 1e6, concentracao: a2.conc / 100, probPerda: a2.prob / 100,
    margemEbitda: a2.marg / 100, taxaJuros: a2.taxa / 100, argentina: a2.arg,
    tranches: a2.tranches, cambioMin: a2.cambio / 100, custoGov: a2.gov * 1000,
    garantiasBase: a2.gar * 1e6, maturacao: a2.mat / 100,
  }), [a2]);

  const sim1 = useMemo(() => runMonteCarlo(params1), [params1]);
  const sim2 = useMemo(() => runMonteCarlo(params2), [params2]);
  const sim = tab === 0 ? sim1 : sim2;

  // Histogram data
  const histData = useMemo(() => {
    const { bins, min, binWidth, maxCount } = buildHistogramBins(sim.dscr, 50);
    return bins.map((count, i) => ({
      x: +(min + i * binWidth + binWidth / 2).toFixed(2),
      count,
      isDefault: (min + i * binWidth) < 1.0,
    }));
  }, [sim]);

  // Tornado data
  const tornadoData = useMemo(() =>
    Object.entries(sim.corrs).map(([name, val]) => ({
      name, value: +val.toFixed(3), fill: val >= 0 ? "#27ae60" : "#e74c3c",
    })), [sim]);

  // Cost breakdown data
  const costData = useMemo(() => [
    { name: "Perda líq.", value: +(sim.custoInad.perdaLiq / 1e6).toFixed(1), fill: "#e74c3c" },
    { name: "Custo oport.", value: +(sim.custoInad.custoOport / 1e6).toFixed(1), fill: "#e67e22" },
    { name: "Receita perd.", value: +(sim.custoInad.receitaPerdida / 1e6).toFixed(1), fill: "#f39c12" },
    { name: "Jurídico", value: +(sim.custoInad.custoJuridico / 1e6).toFixed(1), fill: "#9c9a92" },
    { name: "Regulat.", value: +(sim.custoInad.custoRegulatorio / 1e6).toFixed(1), fill: "#5c5a52" },
  ], [sim]);

  const ci = sim.custoInad;
  const spread = sim.ef * (tab === 0 ? a1.taxa : a2.taxa) / 100 * 0.6;
  const lucroAno = spread - ci.custoEsperado;
  const totalPeriodo = lucroAno * (42 / 12);
  const rentavel = spread > ci.custoEsperado;

  const pdColor = sim.pd > 0.05 ? "#e74c3c" : sim.pd > 0.01 ? "#f39c12" : "#27ae60";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-deep)" }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 1300, margin: "0 auto", width: "100%", padding: "16px 20px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--border)" }}>
          {["1. Dados do exercício (5 vars)", "2. Análise completa (9 vars)"].map((label, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "10px 20px", border: "none", cursor: "pointer",
              borderBottom: tab === i ? "2px solid var(--gold)" : "2px solid transparent",
              background: "transparent", fontSize: 13,
              color: tab === i ? "var(--gold)" : "var(--text-secondary)",
              fontWeight: tab === i ? 600 : 400,
              fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>

        {/* 6-panel grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Histogram */}
          <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Distribuição DSCR — {FMT(sim.ef)}</div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 4, left: 4, background: "var(--bg-surface)",
                border: `1px solid ${pdColor}`, borderRadius: 6, padding: "4px 10px",
                fontSize: 14, fontWeight: 700, color: pdColor, zIndex: 2,
                fontFamily: "'JetBrains Mono', monospace" }}>PD: {(sim.pd * 100).toFixed(1)}%</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={histData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis dataKey="x" tick={{ fontSize: 9, fill: "#9c9a92" }} tickCount={6} />
                  <YAxis tick={{ fontSize: 9, fill: "#9c9a92" }} />
                  <Bar dataKey="count" radius={[1, 1, 0, 0]}>
                    {histData.map((d, i) => (
                      <Cell key={i} fill={d.isDefault ? "#e74c3c" : "#C9A84C"} opacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tornado */}
          <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Sensibilidade</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tornadoData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 70 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: "#9c9a92" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9c9a92" }} width={65} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {tornadoData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Metricas */}
          <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Métricas</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-primary)", lineHeight: 1.8 }}>
              <div>DSCR P10: <span style={{ color: "var(--gold)" }}>{sim.p10.toFixed(2)}x</span></div>
              <div>DSCR P50: <span style={{ color: "var(--gold)" }}>{sim.p50.toFixed(2)}x</span></div>
              <div>DSCR P90: <span style={{ color: "var(--gold)" }}>{sim.p90.toFixed(2)}x</span></div>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
                PD: <span style={{ color: pdColor, fontWeight: 700 }}>{(sim.pd * 100).toFixed(1)}%</span>
              </div>
              <div>LGD: {(sim.lgd * 100).toFixed(1)}%</div>
              <div>PE: {FMT(sim.pe)}</div>
              <div>EAD: {FMT(sim.ef)}</div>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
                Spread: {((tab === 0 ? a1.taxa : a2.taxa) - 13.5).toFixed(1)}% a.a.
              </div>
              <div>Receita: {FMT(spread)}/ano</div>
              {spread > 0 && <div>PE/Rec: {(sim.pe / spread * 100).toFixed(1)}%</div>}
            </div>
          </div>

          {/* Custo calote */}
          <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Custo calote (24m) — Total: {FMT(ci.custoTotal)}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={costData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 70 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: "#9c9a92" }}
                  tickFormatter={(v: number) => `R$${v}mi`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9c9a92" }} width={70} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resultado */}
          <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16,
            border: `1px solid ${rentavel ? "var(--risk-green)" : "var(--risk-red)"}` }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Resultado da operação</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <div>Se der calote:</div>
              <div>&nbsp; Garantias: {FMT(ci.recuperacaoGarantias)}</div>
              <div>&nbsp; Venda NPL: {FMT(ci.recuperacaoNPL)}</div>
              <div>&nbsp; Recupera: {FMT(ci.recuperacaoTotal)}</div>
              <div>&nbsp; Perde: <span style={{ color: "var(--risk-red)" }}>{FMT(ci.perdaLiq)}</span></div>
              <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0", paddingTop: 6 }}>
                Custo total: {FMT(ci.custoTotal)}
              </div>
              <div>Custo esperado: {FMT(ci.custoEsperado)}/ano</div>
              <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0", paddingTop: 6 }}>
                Spread: +{FMT(spread)}/ano
              </div>
              <div>Risco: -{FMT(ci.custoEsperado)}/ano</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: rentavel ? "var(--risk-green)" : "var(--risk-red)",
                borderTop: "1px solid var(--border)", margin: "6px 0", paddingTop: 6 }}>
                Líquido: {FMT(lucroAno)}/ano
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: rentavel ? "var(--risk-green)" : "var(--risk-red)", marginTop: 4 }}>
                TOTAL 3.5a: {FMT(totalPeriodo)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6,
                color: rentavel ? "var(--risk-green)" : "var(--risk-red)" }}>
                {rentavel ? "✓ RENTÁVEL" : "✗ NÃO RENTÁVEL"}
              </div>
            </div>
          </div>

          {/* Placeholder para equilibrio - sera implementado */}
          <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Curva de equilíbrio (PD vs Empréstimo) — carregando...
          </div>
        </div>

        {/* Controls */}
        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: tab === 0 ? "1fr 1fr" : "1fr 1fr 1fr", gap: "0 24px" }}>
            {/* Sempre visivel */}
            <ParamSlider label="Valor do empréstimo (R$ milhões)" value={tab===0?a1.emp:a2.emp}
              onChange={v => tab===0 ? setA1({...a1, emp:v}) : setA2({...a2, emp:v})} min={2} max={20} step={1} />
            <ParamSlider label="Concentração no maior cliente (%)" value={tab===0?a1.conc:a2.conc}
              onChange={v => tab===0 ? setA1({...a1, conc:v}) : setA2({...a2, conc:v})} min={10} max={70} step={5} />
            <ParamSlider label="Prob. de perder o cliente (%)" value={tab===0?a1.prob:a2.prob}
              onChange={v => tab===0 ? setA1({...a1, prob:v}) : setA2({...a2, prob:v})} min={0} max={40} step={2} />
            <ParamSlider label="Margem EBITDA (%)" value={tab===0?a1.marg:a2.marg}
              onChange={v => tab===0 ? setA1({...a1, marg:v}) : setA2({...a2, marg:v})} min={5} max={22} step={0.5} />
            <ParamSlider label="Taxa de juros efetiva (% a.a.)" value={tab===0?a1.taxa:a2.taxa}
              onChange={v => tab===0 ? setA1({...a1, taxa:v}) : setA2({...a2, taxa:v})} min={12} max={28} step={0.5} />

            {/* Aba 2 extras */}
            {tab === 1 && <>
              <ParamSlider label="Impacto câmbio Argentina mín (%)" value={a2.cambio}
                onChange={v => setA2({...a2, cambio:v})} min={-40} max={0} step={5} />
              <ParamSlider label="Custo governança (R$ mil)" value={a2.gov}
                onChange={v => setA2({...a2, gov:v})} min={100} max={2000} step={100} />
              <ParamSlider label="Valor liquidação garantias (R$ mi)" value={a2.gar}
                onChange={v => setA2({...a2, gar:v})} min={1} max={8} step={0.5} />
              <ParamSlider label="Maturação expansão ano 1 (%)" value={a2.mat}
                onChange={v => setA2({...a2, mat:v})} min={10} max={100} step={5} />
            </>}
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: 20, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13,
              color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" checked={tab===0?a1.arg:a2.arg}
                onChange={e => tab===0 ? setA1({...a1, arg:e.target.checked}) : setA2({...a2, arg:e.target.checked})} />
              Expansão Argentina
            </label>
            {tab === 1 && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                color: "var(--text-secondary)", cursor: "pointer" }}>
                <input type="checkbox" checked={a2.tranches}
                  onChange={e => setA2({...a2, tranches:e.target.checked})} />
                2 Tranches (R$4mi + R$4mi)
              </label>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
