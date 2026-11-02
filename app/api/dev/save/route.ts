import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/* Dev-only: receives the studio export from the browser for the Blender lightmap bake. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("disabled", { status: 404 });
  const name = new URL(req.url).searchParams.get("name") ?? "export.bin";
  if (!/^[\w.-]+$/.test(name)) return new Response("bad name", { status: 400 });
  const dir = path.join(process.cwd(), "_source/bake");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await req.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return Response.json({ ok: true, bytes: buf.length });
}
