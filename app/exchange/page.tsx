import type { Metadata } from "next";
import ExchangeGrid from "@/components/exchange/ExchangeGrid";
import { products } from "@/content/products";

export const metadata: Metadata = { title: "The Exchange" };

export default function ExchangePage() {
  return (
    <section className="wrap page" style={{ paddingBottom: "clamp(80px,9vw,150px)" }}>
      <header className="page__head">
        <h1 className="display h1">The Exchange</h1>
        <p className="lede muted">Physical objects from the HoS workshop. Every piece is made to order; ask for price and availability.</p>
      </header>
      <ExchangeGrid products={products} />
    </section>
  );
}
