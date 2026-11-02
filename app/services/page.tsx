import type { Metadata } from "next";
import ServicesList from "@/components/home/ServicesList";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <section className="wrap page" style={{ paddingBottom: "clamp(80px,9vw,150px)" }}>
      <header className="page__head">
        <h1 className="display h1">Services</h1>
        <p className="lede muted">Seven disciplines under one roof, from the first drawing to the finished room and the content that launches it.</p>
      </header>
      <ServicesList />
    </section>
  );
}
