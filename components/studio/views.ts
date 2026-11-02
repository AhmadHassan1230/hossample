/* Camera views of the baked studio, in three.js coordinates (Blender x, y, z → three x, z, −y).
   Lens is a 36 mm-wide sensor focal length, matching the Cycles review renders. */
export type ViewId = "overview" | "left" | "centre" | "right" | "content" | "court";

/** ev: exposure in stops [day, night], the same values the Cycles review renders used. */
type V3 = [number, number, number];
/** path: points the camera flies through on the way in; sway: how far the view follows the pointer. */
export type View = { pos: V3; target: V3; lens: number; ev: [number, number]; label: string; path?: V3[]; sway?: number; dur?: number };

export const VIEWS: Record<ViewId, View> = {
  overview: { ev: [1.4, 0.92], pos: [0, 2.05, -0.6], target: [0, 2.25, -13], lens: 16, label: "The studio" },
  left: { ev: [1.4, 0.92], pos: [-4.6, 1.72, -0.9], target: [-8.2, 1.45, -9.6], lens: 22, label: "Architecture" },
  // the story: half a turn round the long table (front → side → far end), then down over the runner,
  // read from the courtyard end (just under the pendants)
  centre: {
    ev: [1.4, 0.92], pos: [-0.1, 3.0, -6.85], target: [-0.1, 0.82, -6.82], lens: 14, sway: 0.04, dur: 4.2, label: "The story",
    path: [[-3.4, 1.9, -6.6], [-1.7, 2.35, -9.4]],
  },
  // raised over the furniture floor so the showroom, the living room and the portal all read
  right: { ev: [1.4, 0.92], pos: [4.05, 2.3, -0.2], target: [7.5, 0.55, -6.2], lens: 18, label: "Furniture & interiors" },
  content: { ev: [1.4, 0.38], pos: [5.3, 1.8, -7.4], target: [9.1, 1.55, -11.6], lens: 22, label: "Content & filming" },
  court: { ev: [0.8, 1.3], pos: [0, 1.6, -14.35], target: [0, 1.9, -25.5], lens: 26, label: "The courtyard" },
};

/** Which view a click lands in, from the clicked object's atlas / item and the hit point. */
export function zoneFor(atlas: string | undefined, item: string | undefined, x: number, z: number): ViewId {
  const CONTENT = ["neon", "monitor_0", "monitor_1", "content_desk", "sweep", "set_chair", "camera", "softbox", "reflector"];
  if (item && CONTENT.includes(item)) return "content";
  if (item === "gateway" || atlas === "court" || z < -13.3 || x < -10) return "court";
  if (atlas === "left" || atlas === "centre" || atlas === "right") return atlas;
  return x < -3.25 ? "left" : x > 3.25 ? "right" : "centre";
}
