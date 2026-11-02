"use client";
import { create } from "zustand";

type AtelierState = {
  active: string | null;
  hover: string | null;
  ready: boolean;
  introDone: boolean;
  exploring: boolean;
  loadProgress: number;
  setLoadProgress: (p: number) => void;
  setActive: (id: string | null) => void;
  setHover: (id: string | null) => void;
  setReady: () => void;
  setIntroDone: () => void;
  setExploring: (v: boolean) => void;
};

export const useAtelier = create<AtelierState>((set) => ({
  active: null,
  hover: null,
  ready: false,
  introDone: false,
  exploring: false,
  loadProgress: 0,
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setActive: (active) => set({ active }),
  setHover: (hover) => set({ hover }),
  setReady: () => set({ ready: true }),
  setIntroDone: () => set({ introDone: true }),
  setExploring: (exploring) => set({ exploring }),
}));

/** DOM nodes the projector moves every frame (no React state per frame). */
export const hotspotNodes = new Map<string, HTMLElement>();
