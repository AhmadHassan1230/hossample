"use client";
import { create } from "zustand";

type Phase = "idle" | "covering" | "covered" | "revealing";
type State = { phase: Phase; href: string | null; go: (href: string) => void; set: (p: Phase) => void };

export const useTransitionStore = create<State>((set, get) => ({
  phase: "idle",
  href: null,
  go: (href) => {
    if (get().phase !== "idle") return;
    set({ phase: "covering", href });
  },
  set: (phase) => set({ phase }),
}));
