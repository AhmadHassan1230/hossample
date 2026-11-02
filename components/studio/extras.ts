import * as THREE from "three";
import type { ItemBox } from "./Room";
import { HERO_BOX } from "./HeroModel";
import { BOARD_BOX } from "./DrawingBoard";
import { LIVING_BOX, PORTAL_BOX, SHOWROOM_BOX } from "./Showroom";
import { SCREENS_BOX, TV_BOX } from "./Hub";

/* What can be clicked. Architecture keeps exactly three things (selected work, the drawing board,
   the model); the browser-built pieces add their own boxes. */

const GROUPS: { id: string; zone: string; match: RegExp }[] = [
  { id: "selected_work", zone: "left", match: /^work_/ },
];
const LEFT_DROP = /^(plan_chest|model_frame|model_courtyard|model_jaali|masterplan|roll_basket|drafting_table|plan_\d)$/;

const fixed = (id: string, zone: string, b: { center: readonly number[]; size: readonly number[] }): ItemBox => {
  const center = new THREE.Vector3(...(b.center as [number, number, number]));
  const size = new THREE.Vector3(...(b.size as [number, number, number]));
  return { id, zone, center, size, box: new THREE.Box3().setFromCenterAndSize(center, size) };
};

export function buildClickables(items: ItemBox[]): ItemBox[] {
  const out: ItemBox[] = [];
  for (const g of GROUPS) {
    const parts = items.filter((i) => g.match.test(i.id));
    if (!parts.length) continue;
    const box = parts.reduce((b, p) => b.union(p.box), new THREE.Box3());
    out.push({ id: g.id, zone: g.zone, atlas: "left", box, center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) });
  }
  const seen = new Map<string, ItemBox>();
  for (const i of items) {
    if (GROUPS.some((g) => g.match.test(i.id)) || LEFT_DROP.test(i.id)) continue;
    const prev = seen.get(i.id);
    if (prev) {
      prev.box = prev.box.clone().union(i.box);
      prev.center = prev.box.getCenter(new THREE.Vector3());
      prev.size = prev.box.getSize(new THREE.Vector3());
      continue;
    }
    const copy = { ...i };
    seen.set(i.id, copy);
    out.push(copy);
  }
  out.push(
    fixed("hero_model", "left", HERO_BOX),
    fixed("drawing_board", "left", BOARD_BOX),
    fixed("showroom", "right", SHOWROOM_BOX),
    fixed("living", "right", LIVING_BOX),
    fixed("marketplace", "right", PORTAL_BOX),
    fixed("screens", "content", SCREENS_BOX),
    fixed("tv", "content", TV_BOX),
  );
  return out;
}
