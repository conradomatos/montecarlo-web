"use client";
import { useEffect, useRef } from "react";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const COLORS = [
  "#C9A84C", "#E8D48B", "#8B7332", "#D4AF37", "#FFD700",
  "#4ECDC4", "#45B7D1", "#96CEB4", "#88D8B0", "#6BCB77",
  "#FF6B6B", "#EE6B6B", "#D35D6E", "#C44569", "#E84393",
  "#A29BFE", "#6C5CE7", "#786FA6", "#574B90", "#303952",
  "#FDA085", "#F6D365", "#84FAB0", "#8FD3F4", "#A18CD1",
  "#FCCB90", "#D57EEB", "#E0C3FC", "#F093FB", "#C471F5",
];

export default function MonteCarloChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const steps = 200;
    const numPaths = 60;
    const padX = 60;
    const padY = 40;
    const padBottom = 50;
    const plotW = w - padX - 20;
    const plotH = h - padY - padBottom;

    // gerar trajetórias
    const paths: number[][] = [];
    for (let i = 0; i < numPaths; i++) {
      const rng = seededRandom(i * 137 + 42);
      const drift = 0.0008 + (rng() - 0.3) * 0.001;
      const vol = 0.015 + rng() * 0.025;
      const path = [1000];
      for (let s = 1; s <= steps; s++) {
        const prev = path[s - 1];
        const shock = (rng() + rng() + rng() - 1.5) * 2 * vol;
        path.push(prev * (1 + drift + shock));
      }
      paths.push(path);
    }

    const allVals = paths.flat();
    const minVal = Math.min(...allVals) * 0.95;
    const maxVal = Math.max(...allVals) * 1.05;

    const toX = (step: number) => padX + (step / steps) * plotW;
    const toY = (val: number) => padY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // fundo
    ctx.fillStyle = "var(--bg-deep, #0a0a0f)";
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "rgba(201,168,76,0.06)";
    ctx.lineWidth = 1;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = padY + (plotH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + plotW, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const x = padX + (plotW / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + plotH);
      ctx.stroke();
    }

    // eixos labels
    ctx.fillStyle = "rgba(201,168,76,0.4)";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= gridLines; i++) {
      const val = maxVal - ((maxVal - minVal) / gridLines) * i;
      const y = padY + (plotH / gridLines) * i;
      ctx.fillText(val.toFixed(0), padX - 8, y + 4);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const step = Math.round((steps / 5) * i);
      const x = padX + (plotW / 5) * i;
      ctx.fillText(`${step}`, x, padY + plotH + 20);
    }

    // label eixo Y
    ctx.save();
    ctx.translate(14, padY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(201,168,76,0.3)";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Equity (R$)", 0, 0);
    ctx.restore();

    // label eixo X
    ctx.fillStyle = "rgba(201,168,76,0.3)";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Iterações", padX + plotW / 2, h - 8);

    // título
    ctx.fillStyle = "rgba(201,168,76,0.5)";
    ctx.font = "13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Equity charts of all simulation runs", w / 2, 20);

    // trajetórias
    paths.forEach((path, i) => {
      ctx.beginPath();
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      path.forEach((val, s) => {
        const x = toX(s);
        const y = toY(val);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    ctx.globalAlpha = 1;

    // linha de referência no valor inicial
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(201,168,76,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const refY = toY(1000);
    ctx.moveTo(padX, refY);
    ctx.lineTo(padX + plotW, refY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  return (
    <div style={{
      width: "100%",
      maxWidth: 1000,
      margin: "0 auto",
      padding: "0 20px",
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: 450,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--bg-deep)",
        }}
      />
    </div>
  );
}
