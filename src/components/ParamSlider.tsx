"use client";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  desc?: string;
}

export default function ParamSlider({ label, value, onChange, min, max, step, unit, desc }: Props) {
  const dec = step < 1 ? 1 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
        {desc && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{desc}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(dec)))}
          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
            background: "rgba(231,76,60,0.06)", color: "var(--risk-red)", cursor: "pointer",
            fontWeight: "bold", fontSize: 14, display: "flex", alignItems: "center",
            justifyContent: "center" }}>−</button>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(+e.target.value)}
          style={{ flex: 1, height: 4, cursor: "pointer" }} />
        <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(dec)))}
          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
            background: "rgba(39,174,96,0.06)", color: "var(--risk-green)", cursor: "pointer",
            fontWeight: "bold", fontSize: 14, display: "flex", alignItems: "center",
            justifyContent: "center" }}>+</button>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(+e.target.value)}
          style={{ width: 70, textAlign: "center", fontWeight: 600, borderRadius: 6,
            border: "1px solid var(--border)", background: "var(--bg-surface)",
            color: "var(--gold)", fontSize: 14, padding: "4px 0",
            fontFamily: "'JetBrains Mono', monospace" }} />
        {unit && <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 24 }}>{unit}</span>}
      </div>
    </div>
  );
}
