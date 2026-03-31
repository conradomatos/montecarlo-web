"use client";
import { useEffect, useRef, useCallback, useState } from "react";

// ============================================================
// SIMULAÇÃO MONTE CARLO — Distribuição Beta-PERT
// 12 etapas de custo cumulativo (R$ mil)
// ============================================================

interface Stage {
  name: string;
  min: number;
  ml: number;
  max: number;
}

const STAGES: Stage[] = [
  { name: "Mobilização", min: 18, ml: 25, max: 40 },
  { name: "Infraestrutura", min: 45, ml: 62, max: 95 },
  { name: "Eletrodutos", min: 30, ml: 42, max: 68 },
  { name: "Cabos BT", min: 55, ml: 78, max: 120 },
  { name: "Cabos MT", min: 40, ml: 58, max: 88 },
  { name: "Quadros/Painéis", min: 65, ml: 90, max: 140 },
  { name: "Instrumentação", min: 20, ml: 30, max: 50 },
  { name: "Iluminação", min: 25, ml: 35, max: 55 },
  { name: "SPDA/Aterramento", min: 15, ml: 22, max: 38 },
  { name: "Comissionamento", min: 30, ml: 45, max: 72 },
  { name: "Testes/Startup", min: 12, ml: 18, max: 32 },
  { name: "Desmobilização", min: 8, ml: 12, max: 20 },
];

const NUM_SIMULATIONS = 500;
const LAMBDA = 4;
const ANIM_DURATION = 2200;
const HIST_DURATION = 700;
const NUM_BINS = 30;

// ============================================================
// Amostragem Beta-PERT via Gamma (Marsaglia & Tsang)
// ============================================================

function randn(): number {
  let u: number, v: number, s: number;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);
  return u * Math.sqrt(-2 * Math.log(s) / s);
}

function gammaRandom(shape: number): number {
  if (shape < 1) {
    return gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = randn();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function betaRandom(alpha: number, beta: number): number {
  const x = gammaRandom(alpha);
  const y = gammaRandom(beta);
  return x / (x + y);
}

function betaPertSample(min: number, ml: number, max: number): number {
  const mu = (min + LAMBDA * ml + max) / (LAMBDA + 2);
  const a1 = ((mu - min) * (2 * ml - min - max)) / ((ml - mu) * (max - min));
  const a2 = (a1 * (max - mu)) / (mu - min);
  if (a1 <= 0 || a2 <= 0 || !isFinite(a1) || !isFinite(a2)) {
    const u = betaRandom(2.5, 2.5);
    return min + u * (max - min);
  }
  const u = betaRandom(a1, a2);
  return min + u * (max - min);
}

interface SimResult {
  paths: number[][];
  finals: number[];
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  stddev: number;
}

function runSimulations(): SimResult {
  const paths: number[][] = [];
  const finals: number[] = [];

  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    const path = [0];
    let cumulative = 0;
    for (let s = 0; s < STAGES.length; s++) {
      const st = STAGES[s];
      cumulative += betaPertSample(st.min, st.ml, st.max);
      path.push(cumulative);
    }
    paths.push(path);
    finals.push(cumulative);
  }

  const sorted = [...finals].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(NUM_SIMULATIONS * 0.1)];
  const p50 = sorted[Math.floor(NUM_SIMULATIONS * 0.5)];
  const p90 = sorted[Math.floor(NUM_SIMULATIONS * 0.9)];
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const stddev = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / sorted.length);

  return { paths, finals: sorted, p10, p50, p90, mean, stddev };
}

// ============================================================
// Color: verde (#81b29a) → ouro (#c9a84c) → vermelho (#e07a5f)
// ============================================================

function lerpColor(finalVal: number, p10: number, p90: number, alpha: number): string {
  const t = Math.max(0, Math.min(1, (finalVal - p10) / (p90 - p10)));
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const u = t * 2;
    r = 129 + (201 - 129) * u;
    g = 178 + (168 - 178) * u;
    b = 154 + (76 - 154) * u;
  } else {
    const u = (t - 0.5) * 2;
    r = 201 + (224 - 201) * u;
    g = 168 + (122 - 168) * u;
    b = 76 + (95 - 76) * u;
  }
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function MonteCarloHero() {
  const spaghettiRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimResult | null>(null);
  const offPathsRef = useRef<HTMLCanvasElement | null>(null);
  const offGridRef = useRef<HTMLCanvasElement | null>(null);
  const animIdRef = useRef<number>(0);
  const histAnimIdRef = useRef<number>(0);

  const [iterations, setIterations] = useState(0);
  const [mean, setMean] = useState<number | null>(null);
  const [cv, setCv] = useState<number | null>(null);

  // Gera simulação uma vez
  if (!simRef.current) {
    simRef.current = runSimulations();
  }
  const sim = simRef.current;

  // Ranges globais Y
  const posVals = sim.paths.flatMap(p => p.filter(v => v > 0));
  const dataMin = Math.min(...posVals);
  const dataMax = Math.max(...sim.paths.flatMap(p => p));
  const yPad = (dataMax - dataMin) * 0.08;
  const globalMin = Math.max(0, dataMin - yPad);
  const globalMax = dataMax + yPad;

  const yPos = useCallback((val: number, h: number) => {
    return h - ((val - globalMin) / (globalMax - globalMin)) * h;
  }, [globalMin, globalMax]);

  const xPos = useCallback((step: number, w: number) => {
    return (step / STAGES.length) * w;
  }, []);

  // Pré-renderiza grid em offscreen canvas
  const renderGrid = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= STAGES.length; i++) {
      const x = xPos(i, w);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    const ySteps = 8;
    for (let i = 0; i <= ySteps; i++) {
      const y = (i / ySteps) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    for (let i = 0; i <= ySteps; i++) {
      const val = globalMax - (i / ySteps) * (globalMax - globalMin);
      ctx.fillText(Math.round(val).toLocaleString("pt-BR"), 4, (i / ySteps) * h - 3);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= STAGES.length; i++) {
      ctx.fillText(i.toString(), xPos(i, w), h - 4);
    }
  }, [xPos, globalMin, globalMax]);

  // Constrói offscreen canvases (grid + 500 paths)
  const buildOffscreen = useCallback((w: number, h: number, dpr: number) => {
    const gridC = document.createElement("canvas");
    gridC.width = w * dpr;
    gridC.height = h * dpr;
    const gCtx = gridC.getContext("2d")!;
    gCtx.scale(dpr, dpr);
    renderGrid(gCtx, w, h);
    offGridRef.current = gridC;

    const pathsC = document.createElement("canvas");
    pathsC.width = w * dpr;
    pathsC.height = h * dpr;
    const oCtx = pathsC.getContext("2d")!;
    oCtx.scale(dpr, dpr);

    for (let i = 0; i < sim.paths.length; i++) {
      const path = sim.paths[i];
      oCtx.strokeStyle = lerpColor(path[path.length - 1], sim.p10, sim.p90, 0.35);
      oCtx.lineWidth = 1;
      oCtx.beginPath();
      for (let s = 0; s < path.length; s++) {
        const px = xPos(s, w);
        const py = yPos(path[s], h);
        s === 0 ? oCtx.moveTo(px, py) : oCtx.lineTo(px, py);
      }
      oCtx.stroke();
    }
    offPathsRef.current = pathsC;
  }, [sim, xPos, yPos, renderGrid]);

  // Desenha overlays de percentil (P10, P50, P90) com pill
  const drawPercentileOverlays = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const percentiles: Array<{ val: number; color: string; label: string }> = [
      { val: sim.p10, color: "#81b29a", label: "P10" },
      { val: sim.p50, color: "#c9a84c", label: "P50" },
      { val: sim.p90, color: "#e07a5f", label: "P90" },
    ];

    for (const { val, color, label } of percentiles) {
      const y = yPos(val, h);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 5]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const text = `${label}  R$ ${Math.round(val).toLocaleString("pt-BR")}k`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textW = ctx.measureText(text).width;
      const pillW = textW + 16;
      const pillH = 22;
      const pillX = w - pillW - 12;
      const pillY = y - pillH / 2;

      ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = color;
      ctx.textAlign = "right";
      ctx.fillText(text, w - 20, y + 4);
      ctx.restore();
    }
  }, [sim, yPos]);

  // Anima histograma lateral
  const animateHistogram = useCallback(() => {
    const canvas = histRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const minVal = sim.finals[0];
    const maxVal = sim.finals[sim.finals.length - 1];
    const binWidth = (maxVal - minVal) / NUM_BINS;
    const bins = new Array(NUM_BINS).fill(0) as number[];
    for (const v of sim.finals) {
      bins[Math.min(Math.floor((v - minVal) / binWidth), NUM_BINS - 1)]++;
    }
    const maxCount = Math.max(...bins);
    const barH = h / NUM_BINS;

    const binColors = bins.map((_, i) => {
      const midVal = minVal + (i + 0.5) * binWidth;
      return lerpColor(midVal, sim.p10, sim.p90, 0.6);
    });

    const start = performance.now();

    const tick = (ts: number) => {
      const t = Math.min(1, (ts - start) / HIST_DURATION);
      const e = 1 - Math.pow(1 - t, 2);
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < NUM_BINS; i++) {
        const bw = (bins[i] / maxCount) * (w - 40) * e;
        const y = h - (i + 1) * barH;
        ctx.fillStyle = binColors[i];
        ctx.fillRect(0, y + 1, bw, barH - 2);
      }

      // Labels Y do histograma
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = "right";
      for (let i = 0; i <= 5; i++) {
        const val = minVal + (i / 5) * (maxVal - minVal);
        ctx.fillText(`${Math.round(val)}`, w - 4, h - (i / 5) * h - 2);
      }

      // Linha P50
      if (t > 0.4) {
        const p50Y = h - ((sim.p50 - minVal) / (maxVal - minVal)) * h;
        ctx.save();
        ctx.strokeStyle = "#c9a84c";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.moveTo(0, p50Y); ctx.lineTo(w - 40, p50Y); ctx.stroke();
        ctx.restore();
      }

      // Título vertical
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = '10px "Inter", sans-serif';
      ctx.save();
      ctx.translate(w - 8, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("DISTRIBUIÇÃO DO CUSTO TOTAL", 0, 0);
      ctx.restore();

      if (t < 1) {
        histAnimIdRef.current = requestAnimationFrame(tick);
      }
    };
    histAnimIdRef.current = requestAnimationFrame(tick);
  }, [sim]);

  // Animação principal do spaghetti
  const startAnimation = useCallback(() => {
    const canvas = spaghettiRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    buildOffscreen(w, h, dpr);

    let animStart: number | null = null;

    const frame = (ts: number) => {
      if (!animStart) animStart = ts;
      const t = Math.min(1, (ts - animStart) / ANIM_DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      const clipX = eased * w;

      ctx.clearRect(0, 0, w, h);

      // Grid sempre visível
      ctx.drawImage(offGridRef.current!, 0, 0, w * dpr, h * dpr, 0, 0, w, h);

      // Paths revelados via clip
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, clipX, h);
      ctx.clip();
      ctx.drawImage(offPathsRef.current!, 0, 0, w * dpr, h * dpr, 0, 0, w, h);
      ctx.restore();

      // Percentile overlays fade-in após 60%
      if (eased > 0.6) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (eased - 0.6) / 0.3);
        drawPercentileOverlays(ctx, w, h);
        ctx.restore();
      }

      // Stats counter
      setIterations(Math.round(eased * NUM_SIMULATIONS));
      if (t >= 1) {
        setMean(Math.round(sim.mean));
        setCv(parseFloat(((sim.stddev / sim.mean) * 100).toFixed(1)));
      }

      if (t < 1) {
        animIdRef.current = requestAnimationFrame(frame);
      } else {
        animateHistogram();
      }
    };

    animIdRef.current = requestAnimationFrame(frame);
  }, [sim, buildOffscreen, drawPercentileOverlays, animateHistogram]);

  useEffect(() => {
    startAnimation();

    const handleResize = () => {
      cancelAnimationFrame(animIdRef.current);
      cancelAnimationFrame(histAnimIdRef.current);
      setIterations(0);
      setMean(null);
      setCv(null);
      startAnimation();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animIdRef.current);
      cancelAnimationFrame(histAnimIdRef.current);
    };
  }, [startAnimation]);

  return (
    <div style={{
      flex: 1,
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      gridTemplateColumns: "1fr 280px",
      padding: "24px 40px 20px",
      gap: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: [
          "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(201,168,76,0.03) 0%, transparent 70%)",
          "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(80,70,120,0.04) 0%, transparent 70%)",
        ].join(", "),
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Grain overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.3,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
        pointerEvents: "none",
        zIndex: 10,
        mixBlendMode: "overlay" as const,
      }} />

      {/* Header stats */}
      <div style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 3,
          color: "var(--gold, #c9a84c)",
          textTransform: "uppercase" as const,
          margin: 0,
        }}>
          Monte Carlo
        </h1>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: 14,
          color: "var(--text-muted, #6b6a72)",
          letterSpacing: 1,
        }}>
          Simulação de Risco
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 32, alignItems: "baseline" }}>
          <div style={{ textAlign: "right" as const }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 400,
              fontSize: 18,
              color: "var(--text-primary, #e8e6e1)",
            }}>
              {iterations.toLocaleString("pt-BR")}
            </div>
            <div style={{
              fontSize: 10,
              textTransform: "uppercase" as const,
              letterSpacing: 1.5,
              color: "var(--text-muted, #6b6a72)",
              marginTop: 2,
            }}>
              Iterações
            </div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 400,
              fontSize: 18,
              color: "var(--text-primary, #e8e6e1)",
            }}>
              {mean !== null ? mean.toLocaleString("pt-BR") : "—"}
            </div>
            <div style={{
              fontSize: 10,
              textTransform: "uppercase" as const,
              letterSpacing: 1.5,
              color: "var(--text-muted, #6b6a72)",
              marginTop: 2,
            }}>
              Média (R$ mil)
            </div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 400,
              fontSize: 18,
              color: "var(--text-primary, #e8e6e1)",
            }}>
              {cv !== null ? cv.toLocaleString("pt-BR") : "—"}
            </div>
            <div style={{
              fontSize: 10,
              textTransform: "uppercase" as const,
              letterSpacing: 1.5,
              color: "var(--text-muted, #6b6a72)",
              marginTop: 2,
            }}>
              CV%
            </div>
          </div>
        </div>
      </div>

      {/* Spaghetti chart */}
      <div style={{
        gridColumn: 1,
        gridRow: 2,
        position: "relative",
        overflow: "hidden",
        zIndex: 1,
      }}>
        <canvas ref={spaghettiRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Histogram */}
      <div style={{
        gridColumn: 2,
        gridRow: 2,
        position: "relative",
        paddingLeft: 20,
        borderLeft: "1px solid rgba(255,255,255,0.05)",
        zIndex: 1,
      }}>
        <canvas ref={histRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Footer legend */}
      <div style={{
        gridColumn: "1 / -1",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 10,
        marginTop: 8,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { color: "#81b29a", label: "P10 — Otimista" },
            { color: "#c9a84c", label: "P50 — Mais Provável" },
            { color: "#e07a5f", label: "P90 — Pessimista" },
          ].map(({ color, label }) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--text-muted, #6b6a72)",
              letterSpacing: 0.5,
            }}>
              <div style={{ width: 20, height: 3, borderRadius: 1, background: color }} />
              {label}
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--text-dim, #3a3944)",
          letterSpacing: 1,
        }}>
          BETA-PERT · 500 SIMULAÇÕES · 12 ETAPAS
        </div>
      </div>
    </div>
  );
}
