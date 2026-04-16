"use client";

import * as React from "react";

function buildPath(values: number[], w: number, h: number) {
  if (!values || values.length < 2) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = w / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * xStep;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return [x, y] as const;
  });
  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const midX = (x1 + x2) / 2;
    line += ` C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  }
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return { line, area };
}

type Props = {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
};

export function SmoothSparkline({
  values,
  color = "#FF7AAC",
  width = 120,
  height = 40,
  className,
}: Props) {
  const id = React.useId().replace(/:/g, "");
  const { line, area } = React.useMemo(
    () => buildPath(values, width, height),
    [values, width, height],
  );
  const lineRef = React.useRef<SVGPathElement>(null);
  const areaRef = React.useRef<SVGPathElement>(null);

  React.useEffect(() => {
    const p = lineRef.current;
    const a = areaRef.current;
    if (!p || !a) return;
    const len = p.getTotalLength();
    p.style.transition = "none";
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = `${len}`;
    a.style.transition = "none";
    a.style.opacity = "0";
    p.getBoundingClientRect();
    p.style.transition = "stroke-dashoffset 0.9s ease-in-out";
    p.style.strokeDashoffset = "0";
    a.style.transition = "opacity 0.9s ease-in-out 0.2s";
    a.style.opacity = "1";
  }, [line]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path ref={areaRef} d={area} fill={`url(#grad-${id})`} />
      <path
        ref={lineRef}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
