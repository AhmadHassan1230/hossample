import * as THREE from "three";

/* Browser-side edits to the baked room (no re-bake): take out what the new pieces replace,
   and turn the drawing board towards the visitor. Coordinates are three.js world space. */

type V3 = [number, number, number];

/** Whole clickable items to take out. */
export const HIDE_ITEMS = new Set([
  // centre table: the story is now a plan model + the HoS mark
  "site_model", "table_plan_0", "table_plan_1", "sample_board", "catalog",
  // right side: the new interiors vignette and showroom take this floor
  "lounge_chair", "swatch_table", "swatch_red_sandstone_wall", "swatch_marble_01", "swatch_oak_veneer_01", "swatch_wool_boucle", "swatch_rough_linen", "swatch_red_sandstone_pavement",
  // content hub: bigger screens replace the two monitors
  "monitor_0", "monitor_1",
  // architecture: a browser-built drafting table replaces the baked one and its sheets
  "drafting_table", "plan_0", "plan_1", "plan_2",
]);

/** Parts of a baked item to take out, by material (the rest stays). */
const HIDE_PARTS: Record<string, RegExp> = {
  masterplan: /model_card|basswood/,   // keep the trestle table, lose the old blocks
};

/** Parts of the merged static meshes to take out: by material, optionally only inside a box. */
const CUTS: { node: RegExp; mat: RegExp; box?: [V3, V3] }[] = [
  { node: /static_centre/, mat: /modern_ceiling/ },                                   // the three globe pendants…
  { node: /static_none/, mat: /black_steel/, box: [[-2.1, 3.1, -7.1], [2.1, 6.2, -6.5]] }, // …and their cords
  { node: /static_centre/, mat: /ceramic_vase_02|carved_wooden_plate/ },               // decor on the long table
  { node: /static_none/, mat: /^water/ },                                              // the courtyard pool surface
  { node: /gateway/, mat: /brass/, box: [[0.55, 1.88, -21.86], [0.7, 2.03, -21.7]] },     // a stray 7 cm cube floating in the gate
];

function cutGeometry(mesh: THREE.Mesh, box: THREE.Box3) {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const idx = g.index ? (g.index.array as ArrayLike<number>) : null;
  const n = idx ? idx.length : pos.count;
  const keep: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    const i0 = idx ? idx[i] : i, i1 = idx ? idx[i + 1] : i + 1, i2 = idx ? idx[i + 2] : i + 2;
    a.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld);
    if (!box.containsPoint(a.add(b).add(c).multiplyScalar(1 / 3))) keep.push(i0, i1, i2);
  }
  const ng = g.clone();
  ng.setIndex(keep);
  mesh.geometry = ng;
}

const nodeOf = (o: THREE.Object3D) => {
  let p: THREE.Object3D | null = o;
  while (p && !p.userData.atlas && !p.userData.item) p = p.parent;
  return p;
};

export function applyEdits(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  // 1. cut / hide parts of merged meshes
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const node = nodeOf(mesh);
    const mat = (mesh.material as THREE.Material).name;
    const item = node?.userData.item as string | undefined;
    if (item && HIDE_PARTS[item]?.test(mat)) mesh.visible = false;
    for (const cut of CUTS) {
      if (!node || !cut.node.test(node.name) || !cut.mat.test(mat)) continue;
      if (cut.box) cutGeometry(mesh, new THREE.Box3(new THREE.Vector3(...cut.box[0]), new THREE.Vector3(...cut.box[1])));
      else mesh.visible = false;
    }
  });
  scene.updateMatrixWorld(true);
}
