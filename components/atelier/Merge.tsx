"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* Nothing in the studio moves, so once it has mounted, every plain mesh is baked
   into one mesh per material: hundreds of draw calls become a few dozen, which
   matters twice over because the floor renders the room again for its reflection. */

export default function Merge({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = group.current;
    if (!root) return;
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map<string, { material: THREE.Material; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[]; cast: boolean }>();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || (mesh as THREE.SkinnedMesh).isSkinnedMesh) return;
      if (Array.isArray(mesh.material) || mesh.userData.noMerge) return;
      const mat = mesh.material as THREE.Material & { transparent?: boolean };
      if (mat.transparent || (mat as unknown as { isShaderMaterial?: boolean }).isShaderMaterial) return;
      if (mat.type === "MeshReflectorMaterial" || mesh.geometry.morphAttributes.position) return;
      let g = mesh.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld));
      const key = mat.uuid;
      const b = buckets.get(key) ?? { material: mat, geos: [], meshes: [], cast: false };
      b.geos.push(g);
      b.meshes.push(mesh);
      b.cast ||= mesh.castShadow;
      buckets.set(key, b);
    });
    const merged: THREE.Mesh[] = [];
    buckets.forEach((b) => {
      if (b.geos.length < 2) return;
      const geo = mergeGeometries(b.geos, false);
      if (!geo) return;
      const m = new THREE.Mesh(geo, b.material);
      m.castShadow = b.cast;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      root.add(m);
      merged.push(m);
      b.meshes.forEach((x) => (x.visible = false));
      b.geos.forEach((g) => g.dispose());
    });
    return () => {
      merged.forEach((m) => {
        root.remove(m);
        m.geometry.dispose();
      });
    };
  }, []);
  return <group ref={group}>{children}</group>;
}
