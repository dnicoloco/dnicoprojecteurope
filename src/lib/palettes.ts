export const PALETTES = {
  lavender: ["#E8DFFF", "#C4B0F0", "#A78BDB"],
  sky: ["#D6ECFF", "#A8D4FF", "#7AB8F0"],
  mint: ["#D1F5E0", "#9FE5BE", "#6DCFA0"],
  blush: ["#FFE5E0", "#FFCDC6", "#F0AEA5"],
  periwinkle: ["#D4DEFF", "#A8BAFF", "#8099F0"],
} as const;

export type PaletteName = keyof typeof PALETTES;

export function paletteForIndex(i: number): PaletteName {
  const names = Object.keys(PALETTES) as PaletteName[];
  return names[i % names.length];
}

export const EMOTION_PALETTES = {
  positive: "mint" as PaletteName,
  neutral: "lavender" as PaletteName,
  negative: "blush" as PaletteName,
} as const;
