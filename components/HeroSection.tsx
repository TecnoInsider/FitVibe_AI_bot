import { Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="text-center space-y-4 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-2">
        <Sparkles className="w-8 h-8 text-orange-500" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
        <span className="block">Продолжи путь</span>
        <span className="block text-orange-500">к своей лучшей форме</span>
      </h1>

      <p className="text-slate-500 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
        <span className="block">Ответь на несколько вопросов, чтобы</span>
        <span className="block">
          <span className="font-semibold text-slate-900">FitVibe AI Bot</span>{" "}
          смог персонализировать
        </span>
        <span className="block">рекомендации именно для тебя</span>
      </p>

      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Безопасно</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Персонально</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>2 мин</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
