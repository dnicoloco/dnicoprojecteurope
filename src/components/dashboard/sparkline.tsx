"use client";

import * as React from "react";

type Props = {
  values: number[];
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
  className?: string;
};

export function Sparkline({
  values,
  stroke = "#FF7AAC",
  fill = "rgba(255,122,172,0.14)",
  width = 120,
  height = 36,
  className,
}: Props) {
  if (values.length < 2) {
    return <svg width={width} height={height} className={className} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const d = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(" ");
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === points.length - 1 ? 3 : 2}
          fill={i === points.length - 1 ? stroke : "white"}
          stroke={stroke}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
