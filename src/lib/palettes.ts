export const PALETTES = {
  rose: ["#FFB6D9", "#FF7AAC", "#E8649A"],
  sky: ["#A8D8FF", "#5FA8FD", "#3D7CC9"],
  mint: ["#9FE5BE", "#3DDABE", "#2DA88F"],
  peach: ["#FFD0B8", "#FF9570", "#E87550"],
  lilac: ["#D4BFF5", "#9E7AFF", "#7044D4"],
} as const;

export type PaletteName = keyof typeof PALETTES;

// Rotate through palettes by index
export function paletteForIndex(i: number): PaletteName {
  const names = Object.keys(PALETTES) as PaletteName[];
  return names[i % names.length];
}
