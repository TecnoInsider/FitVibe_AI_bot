import { Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="text-center space-y-4 animate-fade-in">
      {/* Logo/Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Main Heading */}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
        <span className="block">Продолжи путь</span>
        <span className="block text-primary">к своей лучшей форме</span>
      </h1>

      {/* Subheading */}
      <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
        <span className="block">Ответь на несколько вопросов, чтобы</span>
        <span className="block">
          <span className="font-semibold text-foreground">FitVibe AI Bot</span>{" "}
          смог персонализировать
        </span>
        <span className="block">рекомендации именно для тебя</span>
      </p>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Безопасно</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Персонально</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>2 мин</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
