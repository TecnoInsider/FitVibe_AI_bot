import React from 'react';

interface ChartPoint {
  value: number;
  label: string;
}

interface BarChartProps {
  data: ChartPoint[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400">Нет данных</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div 
        className="w-full h-full grid"
        style={{ 
            gridTemplateColumns: `repeat(${data.length}, 1fr)`,
            gridTemplateRows: '1fr auto', // Строка для столбцов, строка для дат
            gap: '0 0.5rem' // Только горизонтальный отступ
        }}
    >
      {/* Рендерим столбцы и значения в первой строке */}
      {data.map((item, index) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
            <div 
                key={`bar-${index}`} 
                className="flex flex-col justify-end items-center"
                style={{ gridColumn: index + 1, gridRow: 1 }}
            >
                <div className="text-xs font-semibold text-slate-700 mb-1">
                    {Math.round(item.value)}
                </div>
                <div
                    className="w-full bg-emerald-400 rounded-t-md transition-all duration-300"
                    style={{ height: `${barHeight}%` }}
                ></div>
            </div>
        );
      })}

      {/* Рендерим даты во второй строке */}
      {data.map((item, index) => (
         <div 
            key={`label-${index}`} 
            className="text-center pt-2"
            style={{ gridColumn: index + 1, gridRow: 2 }}
        >
            <p className="text-xs text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
