import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MonteCarloHero from "@/components/MonteCarloHero";

export default function HomePage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header />
      <MonteCarloHero />
      <Footer />
    </div>
  );
}
