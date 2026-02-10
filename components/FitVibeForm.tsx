import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Phone,
  Scale,
  Ruler,
  Calendar,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Progress } from "./ui/progress";
import { useAppContext } from "../contexts/AppContext";
import { useTelegram } from "../contexts/TelegramContext";
import { createProfile, getProfile } from "../hooks/api";
import { getDebugConfig } from "../lib/debug";
import { UserProfile } from "../types";

const STORAGE_KEY = "fitvibe_form_data";

const formSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(50),
  email: z.string().email("Введите корректный email"),
  phone: z.string().optional(),
  currentWeight: z.coerce
    .number()
    .min(30, "Минимум 30 кг")
    .max(300, "Максимум 300 кг"),
  targetWeight: z.coerce
    .number()
    .min(30, "Минимум 30 кг")
    .max(300, "Максимум 300 кг"),
  height: z.coerce
    .number()
    .min(100, "Минимум 100 см")
    .max(250, "Максимум 250 см"),
  age: z.coerce.number().min(14, "Минимум 14 лет").max(120, "Максимум 120 лет"),
  goal: z.string().min(1, "Выберите цель"),
  activityLevel: z.string().min(1, "Выберите уровень активности"),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Личные данные", icon: User },
  { id: 2, title: "Параметры тела", icon: Scale },
  { id: 3, title: "Цель и активность", icon: Target },
];

interface FitVibeFormProps {
  onComplete: (profile: UserProfile) => void;
}

const hasCompletedProfile = (profile: UserProfile | null): profile is UserProfile => {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  const candidate = profile as Partial<UserProfile>;
  const hasTgId = typeof candidate.tg_id === "number" && Number.isFinite(candidate.tg_id);
  const hasName = typeof candidate.name === "string" && candidate.name.trim().length > 0;
  const hasGoal = typeof candidate.goal === "string" && candidate.goal.trim().length > 0;
  const hasActivity =
    typeof candidate.activity_level === "string" && candidate.activity_level.trim().length > 0;

  return hasTgId && hasName && hasGoal && hasActivity;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const FitVibeForm = ({ onComplete }: FitVibeFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAppContext();
  const { user } = useTelegram();
  const debugConfig = getDebugConfig();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      goal: "",
      activityLevel: "",
    },
  });

  const formValues = watch();
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode =
    urlParams.get("debug_telegram") === "1" || urlParams.get("debug") === "1";

  const buildStorageKey = (id?: number | null) =>
    id ? `${STORAGE_KEY}_${id}` : STORAGE_KEY;

  useEffect(() => {
    const storageKey = buildStorageKey(user?.id || null);
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.entries(parsed).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            setValue(key as keyof FormData, value as any);
          }
        });
      } catch (e) {
        console.error("Failed to parse saved form data");
      }
    }
  }, [setValue, user?.id]);

  useEffect(() => {
    const storageKey = buildStorageKey(user?.id || null);
    const dataToSave = { ...formValues };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [formValues, user?.id]);

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(["name", "email"]);
      case 2:
        return await trigger([
          "currentWeight",
          "targetWeight",
          "height",
          "age",
        ]);
      case 3:
        return await trigger(["goal", "activityLevel"]);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resolveTelegramUser = () => {
    const tg = (window as any).Telegram?.WebApp;
    const tgUserFromInit = tg?.initDataUnsafe?.user;
    const params = new URLSearchParams(window.location.search);

    const hash = window.location.hash ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);
    let tgUserFromHash: any = undefined;
    if (hashParams.has("tgWebAppData")) {
      try {
        const inner = new URLSearchParams(hashParams.get("tgWebAppData") || "");
        const userStr = inner.get("user");
        if (userStr) {
          try {
            tgUserFromHash = JSON.parse(decodeURIComponent(userStr));
          } catch (e) {
            try {
              tgUserFromHash = JSON.parse(userStr);
            } catch (err) {
              // ignore
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    const tgUser = tgUserFromInit ?? tgUserFromHash ?? user;
    const telegramId =
      tgUser?.id?.toString() ||
      params.get("telegram_id") ||
      params.get("tg_id") ||
      params.get("chat_id") ||
      debugConfig.telegramId ||
      "";

    const telegramUsername =
      tgUser?.username || params.get("username") || debugConfig.telegramUsername || "";

    return { telegramId, telegramUsername, tgUser };
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const { telegramId, telegramUsername, tgUser } = resolveTelegramUser();
      if (!telegramId) {
        showToast("Не удалось определить Telegram ID. Откройте в Telegram или добавьте telegram_id в URL.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        chat_id: telegramId,
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        user_name: data.name,
        email: data.email,
        phone: data.phone || "",
        user_weight: data.currentWeight,
        user_weight_wanted: data.targetWeight,
        user_height: data.height,
        user_age: data.age,
        user_activity: data.activityLevel,
        user_goal: data.goal,
      };

      const tgIdNumber = Number(telegramId);
      if (Number.isNaN(tgIdNumber)) {
        throw new Error("Invalid Telegram ID");
      }

      const responseProfile = await createProfile(payload);
      let resolvedProfile: UserProfile | null = responseProfile;

      if (!hasCompletedProfile(resolvedProfile)) {
        // n8n write webhook may return partial/empty object; confirm saved profile via read webhook.
        for (let attempt = 0; attempt < 4; attempt++) {
          resolvedProfile = await getProfile(tgIdNumber);
          if (hasCompletedProfile(resolvedProfile)) {
            break;
          }
          if (attempt < 3) {
            await delay(500 * (attempt + 1));
          }
        }
      }

      if (!hasCompletedProfile(resolvedProfile)) {
        throw new Error("Empty profile response");
      }

      const storageKey = buildStorageKey(user?.id || tgUser?.id || null);
      localStorage.removeItem(storageKey);
      showToast("Твои данные сохранены. Персональный режим активирован!");
      onComplete(resolvedProfile);
    } catch (error) {
      console.error("Failed to save onboarding data", error);
      showToast("Не удалось сохранить данные. Попробуй еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {debugMode && (
        <div className="rounded-md p-3 bg-yellow-50 border border-yellow-200 text-sm text-slate-700">
          <div className="font-medium mb-2">Telegram WebApp debug</div>
          <div>window.Telegram: {typeof (window as any).Telegram !== "undefined" ? "present" : "absent"}</div>
          <div>Telegram.WebApp: {(window as any).Telegram?.WebApp ? "present" : "absent"}</div>
          <div>initDataUnsafe: {(window as any).Telegram?.WebApp?.initDataUnsafe ? "present" : "absent"}</div>
          <div>user in initDataUnsafe: {(window as any).Telegram?.WebApp?.initDataUnsafe?.user ? "present" : "absent"}</div>
          <div>user.id: {(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ?? "null"}</div>
          <div className="mt-2 text-xs text-slate-500">
            Добавьте <code>?debug=1&amp;telegram_id=...</code> в URL.
          </div>
        </div>
      )}

      <div className="space-y-3 animate-fade-in">
        <div className="flex justify-between items-center px-1">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-sky-500 text-white"
                      : isCompleted
                      ? "bg-sky-100 text-sky-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-sm hidden sm:block transition-colors ${
                    isActive ? "text-slate-900 font-medium" : "text-slate-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {currentStep === 1 && (
        <div className="form-card rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <User className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Личные данные</h3>
              <p className="text-sm text-slate-500">Расскажи немного о себе</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Как тебя зовут?"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("name")}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("email")}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("phone")}
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="form-card rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Параметры тела</h3>
              <p className="text-sm text-slate-500">Для точного расчета рекомендаций</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentWeight">Текущий вес (кг) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="currentWeight"
                  type="number"
                  placeholder="75"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("currentWeight")}
                />
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.currentWeight && (
                <p className="text-sm text-red-500">{errors.currentWeight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetWeight">Желаемый вес (кг) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="targetWeight"
                  type="number"
                  placeholder="70"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("targetWeight")}
                />
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.targetWeight && (
                <p className="text-sm text-red-500">{errors.targetWeight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Рост (см) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("height")}
                />
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.height && (
                <p className="text-sm text-red-500">{errors.height.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Возраст (лет) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("age")}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="form-card rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Цель и активность</h3>
              <p className="text-sm text-slate-500">Последний шаг!</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Цель <span className="text-red-500">*</span></Label>
              <Select
                value={formValues.goal}
                onValueChange={(value) => setValue("goal", value)}
              >
                <SelectTrigger className="h-12 input-focus-ring">
                  <SelectValue placeholder="Выбери свою цель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Снижение веса">Снижение веса</SelectItem>
                  <SelectItem value="Поддержание веса">Поддержание веса</SelectItem>
                  <SelectItem value="Набор мышечной массы">Набор мышечной массы</SelectItem>
                </SelectContent>
              </Select>
              {errors.goal && (
                <p className="text-sm text-red-500">{errors.goal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Уровень физической активности <span className="text-red-500">*</span></Label>
              <Select
                value={formValues.activityLevel}
                onValueChange={(value) => setValue("activityLevel", value)}
              >
                <SelectTrigger className="h-12 input-focus-ring">
                  <SelectValue placeholder="Выбери уровень активности" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Сидячий">Сидячий</SelectItem>
                  <SelectItem value="Легкая активность">Легкая активность</SelectItem>
                  <SelectItem value="Умеренная активность">Умеренная активность</SelectItem>
                  <SelectItem value="Высокая активность">Высокая активность</SelectItem>
                </SelectContent>
              </Select>
              {errors.activityLevel && (
                <p className="text-sm text-red-500">{errors.activityLevel.message}</p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-6">
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              💡 Эти данные помогут боту точнее рассчитать рекомендации, питание и темп движения к твоей цели. {" "}
              <span className="text-slate-900 font-medium">Мы не используем данные для спама.</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 animate-fade-in">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="w-full sm:flex-1 h-12 text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        )}

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="w-full sm:flex-1 h-12 text-base font-semibold btn-primary-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 h-14 text-base font-semibold btn-primary-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Сохраняем...
              </span>
            ) : (
              "Активировать персональный режим"
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default FitVibeForm;
