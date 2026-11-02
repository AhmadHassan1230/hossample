import type { Metadata } from "next";
import WorkIndex from "@/components/portfolio/WorkIndex";
import { cities, projects } from "@/content/projects";

export const metadata: Metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <section className="wrap page">
      <header className="page__head">
        <h1 className="display h1">Work</h1>
        <p className="lede muted">
          {projects.length} spaces across {cities.length} cities, designed in 2026 for Loop, Overdose and their joint venues.
        </p>
      </header>
      <WorkIndex projects={projects} />
    </section>
  );
}
