import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monte Carlo — Simulação de Risco de Crédito",
  description: "Simulação Monte Carlo aplicada à análise de crédito. Caso Agrotech Brasil — Banco JogoDuro. MBA FGV.",
  openGraph: {
    title: "Monte Carlo — Simulação de Risco de Crédito",
    description: "Transforme análise de crédito estática em probabilística. 10.000 cenários simulados em tempo real.",
    url: "https://montecarlo.conradomatos.dev",
    siteName: "Monte Carlo Simulator",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
