import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MonteCarloChart from "@/components/MonteCarloChart";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1, display: "flex" }}>
        <MonteCarloChart />
      </main>
      <Footer />
    </div>
  );
}
