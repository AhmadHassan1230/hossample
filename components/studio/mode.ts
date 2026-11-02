"use client";
import { create } from "zustand";

/** Day or blue-hour night for the studio. Sticky: the right side turns it to night, the
    architecture side brings the day back, and the navbar toggle flips it at any time. */
export const useStudioMode = create<{ night: boolean; setNight: (night: boolean) => void }>((set) => ({
  night: false,
  setNight: (night) => set({ night }),
}));
