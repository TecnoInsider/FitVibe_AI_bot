import { Helmet } from "react-helmet-async";
import HeroSection from "@/components/HeroSection";
import FitVibeForm from "@/components/FitVibeForm";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>FitVibe AI Bot — Персональный фитнес-помощник</title>
        <meta
          name="description"
          content="Заполни данные, чтобы FitVibe AI Bot смог персонализировать рекомендации по питанию и тренировкам именно для тебя"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-8 pb-16">
          {/* Hero Section */}
          <header className="mb-8">
            <HeroSection />
          </header>

          {/* Main Form */}
          <main>
            <FitVibeForm />
          </main>

          {/* Footer */}
          <footer className="mt-10 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 FitVibe AI Bot. Все права защищены.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
