// Monte Carlo Engine — TypeScript
// Distribuições: PERT, Triangular, Bernoulli

function betaRandom(a: number, b: number): number {
  let u: number, v: number, x: number, y: number;
  do {
    u = Math.random();
    v = Math.random();
    x = Math.pow(u, 1 / a);
    y = Math.pow(v, 1 / b);
  } while (x + y > 1);
  return x / (x + y);
}

export function pertSample(min: number, mode: number, max: number, lambda = 4): number {
  if (min >= max) return mode;
  const mu = (min + lambda * mode + max) / (lambda + 2);
  if (Math.abs(mu - min) < 1e-10 || Math.abs(mu - max) < 1e-10) return mode;
  const denom = (mode - mu) * (max - min);
  let a: number, b: number;
  if (Math.abs(denom) < 1e-10) { a = 4; b = 4; }
  else {
    a = ((mu - min) * (2 * mode - min - max)) / denom;
    if (a <= 0) a = 1;
    b = a * (max - mu) / (mu - min);
    if (b <= 0) b = 1;
  }
  return min + betaRandom(a, b) * (max - min);
}

export function triangularSample(min: number, mode: number, max: number): number {
  const u = Math.random();
  const f = (mode - min) / (max - min);
  if (u < f) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

export interface MCParams {
  emprestimo: number;
  concentracao: number;
  probPerda: number;
  margemEbitda: number;
  taxaJuros: number;
  argentina: boolean;
  tranches: boolean;
  // Params extras (aba 2)
  cambioMin?: number;
  custoGov?: number;
  garantiasBase?: number;
  maturacao?: number;
}

export interface MCResult {
  dscr: number[];
  pd: number;
  lgd: number;
  pe: number;
  ef: number;
  median: number;
  p10: number;
  p50: number;
  p90: number;
  corrs: Record<string, number>;
  custoInad: CustoInad;
}

export interface CustoInad {
  perdaLiq: number;
  custoOport: number;
  receitaPerdida: number;
  custoJuridico: number;
  custoRegulatorio: number;
  recuperacaoGarantias: number;
  recuperacaoNPL: number;
  recuperacaoTotal: number;
  custoTotal: number;
  custoEsperado: number;
}

const MESES_PAG = 42;

export function runMonteCarlo(params: MCParams, N = 10000): MCResult {
  const { emprestimo, concentracao, probPerda, margemEbitda, taxaJuros,
    argentina, tranches, cambioMin, custoGov, garantiasBase, maturacao } = params;
  const ef = tranches ? emprestimo / 2 : emprestimo;
  const dscrArr: number[] = [];
  let defaults = 0;
  const garArr: number[] = [];

  // Arrays pra correlacao
  const vRec: number[] = [], vPerde: number[] = [], vMarg: number[] = [];
  const vClima: number[] = [], vTaxa: number[] = [], vGov: number[] = [];
  const vArg: number[] = [];

  for (let i = 0; i < N; i++) {
    const rec = pertSample(38e6, 45e6, 55e6);
    const perde = Math.random() < probPerda ? 1 : 0;
    const ic = 1 - perde * concentracao;
    const mg = pertSample(Math.max(0.03, margemEbitda - 0.05), margemEbitda,
      Math.min(0.25, margemEbitda + 0.04));
    const cl = triangularSample(-0.12, -0.02, 0.05);
    const cMin = cambioMin ?? -0.20;
    const tx = custoGov !== undefined
      ? pertSample(Math.max(0.10, taxaJuros - 0.03), taxaJuros, Math.min(0.30, taxaJuros + 0.04))
      : taxaJuros;
    const gb = garantiasBase ?? 4e6;
    const gar = custoGov !== undefined
      ? pertSample(Math.max(500000, gb * 0.5), gb, gb * 1.5)
      : pertSample(2e6, 4e6, 6e6);
    const mat = maturacao ?? 0.25;

    const gov = custoGov !== undefined
      ? pertSample(Math.max(100000, custoGov * 0.5), custoGov, custoGov * 2)
      : 0;

    let arg = 0;
    if (argentina) {
      const argBase = pertSample(1e6, 7e6, 12e6) * mat;
      const cambio = triangularSample(cMin, cMin * 0.25, 0.03);
      arg = Math.max(0, argBase * (1 + cambio));
    }

    const rt = rec * ic * (1 + cl) + arg;
    const eb = rt * mg - gov;
    const sv = ef / (MESES_PAG / 12) + ef * 0.6 * tx;
    const dscr = eb / sv;

    dscrArr.push(dscr);
    garArr.push(gar);
    if (dscr < 1.0) defaults++;

    vRec.push(rec); vPerde.push(perde); vMarg.push(mg);
    vClima.push(cl); vTaxa.push(tx); vGov.push(gov); vArg.push(arg);
  }

  const pd = defaults / N;
  const sorted = [...dscrArr].sort((a, b) => a - b);
  const pctl = (p: number) => sorted[Math.floor(p / 100 * (N - 1))];

  // LGD
  let lgdSum = 0, lgdCount = 0;
  dscrArr.forEach((d, i) => {
    if (d < 1.0) {
      lgdSum += Math.max(0, ef - garArr[i]) / ef;
      lgdCount++;
    }
  });
  const lgd = lgdCount > 0 ? lgdSum / lgdCount : 0;
  const pe = pd * lgd * ef;

  // Correlacoes
  const corrWith = (arr: number[]) => pearson(arr, dscrArr);
  const corrs: Record<string, number> = {
    'Margem': corrWith(vMarg),
    'Perda cliente': corrWith(vPerde),
    'Receita': corrWith(vRec),
    'Clima': corrWith(vClima),
    'Taxa juros': corrWith(vTaxa),
  };
  if (custoGov !== undefined) corrs['Custo gov.'] = corrWith(vGov);
  if (argentina) corrs['Argentina'] = corrWith(vArg);

  // Ordenar por valor absoluto
  const sortedCorrs = Object.fromEntries(
    Object.entries(corrs).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))
  );

  // Custo inadimplencia
  const garMed = garArr.reduce((a, b) => a + b, 0) / N;
  const rg = Math.min(garMed, ef * 0.5);
  const rem = Math.max(0, ef - rg);
  const rnpl = rem * 0.30;
  const rtot = rg + rnpl;
  const pl = Math.max(0, ef - rtot);
  const cop = ef * 0.1475 * (24 / 12);
  const rp = ef * taxaJuros * (24 / 12);
  const cj = ef * 0.04;
  const cr = ef * 0.02;
  const cd = pl + cop + rp + cj + cr;
  const ce = pd * cd;

  return {
    dscr: dscrArr, pd, lgd, pe, ef,
    median: pctl(50), p10: pctl(10), p50: pctl(50), p90: pctl(90),
    corrs: sortedCorrs,
    custoInad: {
      perdaLiq: pl, custoOport: cop, receitaPerdida: rp,
      custoJuridico: cj, custoRegulatorio: cr,
      recuperacaoGarantias: rg, recuperacaoNPL: rnpl,
      recuperacaoTotal: rtot, custoTotal: cd, custoEsperado: ce
    }
  };
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i]; sy += y[i];
    sxx += x[i] * x[i]; syy += y[i] * y[i];
    sxy += x[i] * y[i];
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return den === 0 ? 0 : num / den;
}

export function buildHistogramBins(data: number[], nBins = 60) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / nBins;
  const bins = new Array(nBins).fill(0);
  data.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binWidth), nBins - 1);
    bins[idx]++;
  });
  return { bins, min, max, binWidth, maxCount: Math.max(...bins) };
}
