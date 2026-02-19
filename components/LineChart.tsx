
import React, { useState, useRef, useMemo, useCallback } from 'react';

interface ChartPoint {
  value: number;
  label: string;
}

interface LineChartProps {
  data: ChartPoint[];
  stroke?: string;
}

const createSplinePath = (points: {x: number, y: number}[]) => {
  if (points.length < 2) return '';
  const pathParts = [];
  pathParts.push(`M${points[0].x},${points[0].y}`);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 > points.length - 1 ? i + 1 : i + 2];

    const tension = 0.4;
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension * 2;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension * 2;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension * 2;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension * 2;

    pathParts.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }
  return pathParts.join(' ');
};

const LineChart: React.FC<LineChartProps> = ({ data, stroke = "#f97316" }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { points, linePath, areaPath, width, height, padding } = useMemo(() => {
    const w = 320; 
    const h = 160;
    const pad = 15;
    if (data.length === 0) return { points: [], linePath: '', areaPath: '', width: w, height: h, padding: pad };

    const values = data.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    
    const calculatedPoints = data.map((d, i) => {
      const x = (i / (data.length > 1 ? data.length - 1 : 1)) * (w - 2 * pad) + pad;
      const y = h - ((d.value - min) / range) * (h - 2 * pad) - pad;
      return { x, y, value: d.value, label: d.label };
    });

    const lPath = createSplinePath(calculatedPoints);
    const aPath = `${lPath} L${calculatedPoints[calculatedPoints.length - 1].x},${h - pad} L${calculatedPoints[0].x},${h - pad} Z`;

    return {
      points: calculatedPoints,
      linePath: lPath,
      areaPath: aPath,
      width: w,
      height: h,
      padding: pad,
    };
  }, [data]);
  
  const findClosestPoint = useCallback((clientX: number) => {
    if (!svgRef.current || points.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Normalize clientX to SVG's coordinate system, considering its actual rendered size
    const svgX = (clientX - rect.left) * (width / rect.width);
    
    let closestIndex = -1;
    let minDistance = Infinity;

    points.forEach((point, index) => {
        const distance = Math.abs(point.x - svgX);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });
    
    if (closestIndex !== -1) {
      setActiveIndex(closestIndex);
    }
  }, [points, width]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    findClosestPoint(event.clientX);
  }, [findClosestPoint]);
  
  const handleTouchMove = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    findClosestPoint(event.touches[0].clientX);
  }, [findClosestPoint]);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="relative w-full h-full cursor-crosshair select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
      >
        <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
            </linearGradient>
        </defs>

        <path
          d={areaPath}
          fill="url(#chartGradient)"
        />

        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={stroke} opacity={activeIndex === i ? 1 : 0} />
        ))}

        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1={height - padding}
              x2={activePoint.x}
              y2={activePoint.y}
              stroke={stroke}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="6" fill="white" stroke={stroke} strokeWidth="3" />
          </>
        )}
      </svg>
      {activePoint && (
          <div 
            className="absolute p-2 rounded-lg shadow-lg text-xs font-semibold whitespace-nowrap transition-transform duration-100 ease-out bg-white/90 backdrop-blur-sm border border-slate-200/50"
            style={{
                top: 0,
                left: `${(activePoint.x / width) * 100}%`,
                transform: `translate(-50%, -110%)`,
                pointerEvents: 'none'
            }}
          >
            <div className="text-slate-500 text-center">{activePoint.label}</div>
            <div className="text-slate-800 flex items-center mt-1 font-bold">
                <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{backgroundColor: stroke}}></span>
                {Math.round(activePoint.value)}
            </div>
          </div>
      )}
    </div>
  );
};

export default LineChart;
