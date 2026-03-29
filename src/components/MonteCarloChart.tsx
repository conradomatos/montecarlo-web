"use client";
import { useEffect, useRef, useCallback } from "react";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const COLORS = [
  "#C9A84C", "#E8D48B", "#D4AF37", "#FFD700", "#B8960C",
  "#4ECDC4", "#45B7D1", "#96CEB4", "#88D8B0", "#6BCB77",
  "#FF6B6B", "#EE6B6B", "#D35D6E", "#C44569", "#E84393",
  "#A29BFE", "#6C5CE7", "#786FA6", "#574B90", "#7C4DFF",
  "#FDA085", "#F6D365", "#84FAB0", "#8FD3F4", "#A18CD1",
  "#FCCB90", "#D57EEB", "#E0C3FC", "#F093FB", "#C471F5",
  "#00E5FF", "#69F0AE", "#FFAB40", "#FF5252", "#B388FF",
  "#80DEEA", "#AED581", "#FFD54F", "#FF8A80", "#EA80FC",
];

export default function MonteCarloChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const steps = 300;
    const numPaths = 120;
    const padL = 55;
    const padR = 15;
    const padT = 15;
    const padB = 35;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // gerar trajetórias com dispersão variada
    const paths: number[][] = [];
    for (let i = 0; i < numPaths; i++) {
      const rng = seededRandom(i * 137 + 42);
      const drift = 0.0005 + (rng() - 0.4) * 0.0012;
      const vol = 0.012 + rng() * 0.03;
      const path = [1000];
      for (let s = 1; s <= steps; s++) {
        const prev = path[s - 1];
        const shock = (rng() + rng() + rng() - 1.5) * 2 * vol;
        path.push(Math.max(prev * (1 + drift + shock), 0));
      }
      paths.push(path);
    }

    const allVals = paths.flat();
    const minVal = Math.min(...allVals) * 0.95;
    const maxVal = Math.max(...allVals) * 1.05;

    const toX = (step: number) => padL + (step / steps) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // fundo
    ctx.fillStyle = "#08080d";
    ctx.fillRect(0, 0, w, h);

    // grid sutil
    ctx.strokeStyle = "rgba(201,168,76,0.05)";
    ctx.lineWidth = 1;
    const gridY = 8;
    for (let i = 0; i <= gridY; i++) {
      const y = padT + (plotH / gridY) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }
    const gridX = 10;
    for (let i = 0; i <= gridX; i++) {
      const x = padL + (plotW / gridX) * i;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }

    // labels eixo Y
    ctx.fillStyle = "rgba(201,168,76,0.35)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= gridY; i++) {
      const val = maxVal - ((maxVal - minVal) / gridY) * i;
      const y = padT + (plotH / gridY) * i;
      ctx.fillText(val.toFixed(0), padL - 8, y + 3);
    }

    // labels eixo X
    ctx.textAlign = "center";
    for (let i = 0; i <= gridX; i++) {
      const step = Math.round((steps / gridX) * i);
      const x = padL + (plotW / gridX) * i;
      ctx.fillText(`${step}`, x, padT + plotH + 18);
    }

    // trajetórias
    paths.forEach((path, i) => {
      ctx.beginPath();
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 0.8;
      path.forEach((val, s) => {
        const x = toX(s);
        const y = toY(val);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    ctx.globalAlpha = 1;

    // linha base 1000
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(201,168,76,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const refY = toY(1000);
    ctx.moveTo(padL, refY);
    ctx.lineTo(padL + plotW, refY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
