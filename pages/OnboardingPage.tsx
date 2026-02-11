import HeroSection from "../components/HeroSection";
import FitVibeForm from "../components/FitVibeForm";
import { UserProfile } from "../types";

interface OnboardingPageProps {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container max-w-lg mx-auto px-4 py-8 pb-16">
        <header className="mb-8">
          <HeroSection />
        </header>

        <main>
          <FitVibeForm onComplete={onComplete} />
        </main>

        <footer className="mt-10 text-center">
          <p className="text-xs text-slate-400">© 2026 FitVibe AI Bot. Все права защищены.</p>
        </footer>
      </div>
    </div>
  );
};

export default OnboardingPage;
