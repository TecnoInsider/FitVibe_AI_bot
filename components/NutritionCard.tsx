import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NutritionCardProps {
  title: string;
  value: number;
  goal: number;
  unit: string;
  isActive: boolean;
  onClick: () => void;
  isChartVisible: boolean;
}

const NutritionCard: React.FC<NutritionCardProps> = ({ title, value, goal, unit, isActive, onClick, isChartVisible }) => {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  
  const baseClasses = "relative p-4 rounded-2xl shadow-sm text-left cursor-pointer transition-all duration-300 flex flex-col justify-between h-32";
  const activeClasses = "bg-sky-500 text-white";
  const inactiveClasses = "bg-white text-slate-800 hover:bg-slate-50";
  
  const activeTextClasses = {
      title: "text-sky-100",
      value: "text-white",
      unit: "text-sky-200",
      goal: "text-sky-200"
  };
  
  const inactiveTextClasses = {
      title: "text-slate-500",
      value: "text-slate-800",
      unit: "text-slate-400",
      goal: "text-slate-500"
  };

  const textClasses = isActive ? activeTextClasses : inactiveTextClasses;

  return (
    <div 
        onClick={onClick}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {isActive && (
        <div className="absolute top-2.5 right-2.5 text-sky-200 transition-opacity">
            {isChartVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      )}
      <div>
        <p className={`text-sm font-medium mb-1 ${textClasses.title}`}>{title}</p>
        <p className={`text-2xl font-bold ${textClasses.value}`}>
          {value} <span className={`text-lg font-medium ${textClasses.unit}`}>{unit}</span>
        </p>
      </div>
      <div>
        <div className={`w-full rounded-full h-1.5 mb-1.5 ${isActive ? 'bg-sky-400/50' : 'bg-slate-200'}`}>
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-white' : 'bg-sky-500'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {goal > 0 && (
          <p className={`text-xs text-right font-medium ${textClasses.goal}`}>
            из {goal} {unit}
          </p>
        )}
      </div>
    </div>
  );
};

export default NutritionCard;