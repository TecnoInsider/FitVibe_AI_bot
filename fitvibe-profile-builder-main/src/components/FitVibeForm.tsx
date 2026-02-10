import { useState, useEffect } from "react";
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
  Activity,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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

const FitVibeForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  // Basic Telegram/WebApp detection for debugging
  const _hasTelegram = typeof (window as any).Telegram !== "undefined";
  const _webApp = _hasTelegram ? (window as any).Telegram?.WebApp : undefined;
  const _hasInitDataUnsafe = !!_webApp?.initDataUnsafe;
  const _hasUser = !!_webApp?.initDataUnsafe?.user;
  const _userId = _webApp?.initDataUnsafe?.user?.id ?? null;

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
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
  }, [setValue]);

  // Save data to localStorage on change
  useEffect(() => {
    const dataToSave = { ...formValues };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formValues]);

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    // Get Telegram data from WebApp or URL params
    const tg = (window as any).Telegram?.WebApp;

    // Ensure WebApp is ready
    if (tg) {
      tg.ready?.();
    }

    const tgUserFromInit = tg?.initDataUnsafe?.user;
    const urlParams = new URLSearchParams(window.location.search);

    // Some Telegram clients (or WebApp entry modes) put WebApp data into the URL hash
    // as `#tgWebAppData=...`. Parse that as a fallback.
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
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    // Prefer initDataUnsafe user, then hash user fallback
    let tgUser = tgUserFromInit ?? tgUserFromHash;

    // Get telegram_id: first from WebApp, then from URL params
    const telegramId =
      tgUser?.id?.toString() ||
      urlParams.get("telegram_id") ||
      urlParams.get("chat_id") ||
      "";
    const telegramUsername =
      tgUser?.username || urlParams.get("username") || "";

    // Note: `initDataUnsafe` comes from the Telegram WebApp and is NOT verified on the client.
    // For production safety, consider sending signed `initData` to your server and verify
    // its signature using your bot token before trusting the Telegram user id.

    // If WebApp exists but user data is missing, wait briefly and retry (race condition on some clients).
    if (tg && !tgUser) {
      try {
        tg.ready?.();
      } catch (e) {}
      await new Promise((res) => setTimeout(res, 500));
      tgUser = tg?.initDataUnsafe?.user;
    }

    // Если не удалось получить telegram_id — прерываем отправку и информируем пользователя.
    if (!telegramId) {
      const hasTelegram = !!(window as any).Telegram;
      const hasWebApp = !!tg;
      const hasInitUnsafe = !!tg?.initDataUnsafe;
      const hasUser = !!tgUser;

      let reason = "Не найдены данные.";
      if (!hasTelegram) {
        reason = "Страница, возможно, не открыта внутри Telegram Web App.";
      } else if (!hasWebApp) {
        reason = "Объект Telegram.WebApp недоступен в текущем окружении.";
      } else if (!hasInitUnsafe) {
        reason =
          "initDataUnsafe отсутствует в Telegram WebApp (WebApp не передал данные).";
      } else if (!hasUser) {
        reason = "В initDataUnsafe отсутствуют данные пользователя.";
      } else {
        reason = "Telegram ID не найден в WebApp и в URL-параметрах.";
      }

      toast({
        title: "Ошибка",
        description: `Не удалось определить Telegram ID. ${reason}`,
        variant: "destructive",
      });
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

    try {
      const res = await fetch(
        "https://n8n.techno-insider.com/webhook/user_profile_write",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error(`Сервер вернул ошибку: ${res.status}`);
      }

      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: "Отлично! 🎉",
        description: "Твои данные сохранены. Персональный режим активирован!",
      });

      // Close Telegram WebApp after successful submission
      if (tg) {
        setTimeout(() => {
          tg.close();
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить данные. Попробуй ещё раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {debugMode && (
        <div className="rounded-md p-3 bg-yellow-50 border border-yellow-200 text-sm text-foreground">
          <div className="font-medium mb-2">Telegram WebApp debug</div>
          <div>window.Telegram: {_hasTelegram ? "present" : "absent"}</div>
          <div>Telegram.WebApp: {_webApp ? "present" : "absent"}</div>
          <div>initDataUnsafe: {_hasInitDataUnsafe ? "present" : "absent"}</div>
          <div>user in initDataUnsafe: {_hasUser ? "present" : "absent"}</div>
          <div>user.id: {_userId ?? "null"}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Откройте эту страницу в Telegram и обновите, или добавьте{" "}
            <code>?debug_telegram=1</code> в URL.
          </div>
        </div>
      )}
      {/* Progress Bar */}
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
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
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
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
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

      {/* Step 1: Personal Info */}
      {currentStep === 1 && (
        <div className="form-card rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                Личные данные
              </h3>
              <p className="text-sm text-muted-foreground">
                Расскажи немного о себе
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Имя <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Как тебя зовут?"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("name")}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("email")}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-foreground"
              >
                Номер телефона
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("phone")}
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Body Parameters */}
      {currentStep === 2 && (
        <div className="form-card rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                Параметры тела
              </h3>
              <p className="text-sm text-muted-foreground">
                Для точного расчёта рекомендаций
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="currentWeight"
                className="text-sm font-medium text-foreground"
              >
                Текущий вес (кг) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentWeight"
                  type="number"
                  placeholder="75"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("currentWeight")}
                />
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.currentWeight && (
                <p className="text-sm text-destructive">
                  {errors.currentWeight.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="targetWeight"
                className="text-sm font-medium text-foreground"
              >
                Желаемый вес (кг) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="targetWeight"
                  type="number"
                  placeholder="70"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("targetWeight")}
                />
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.targetWeight && (
                <p className="text-sm text-destructive">
                  {errors.targetWeight.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="height"
                className="text-sm font-medium text-foreground"
              >
                Рост (см) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("height")}
                />
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.height && (
                <p className="text-sm text-destructive">
                  {errors.height.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="age"
                className="text-sm font-medium text-foreground"
              >
                Возраст (лет) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  className="pl-10 h-12 input-focus-ring"
                  {...register("age")}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Goals & Activity */}
      {currentStep === 3 && (
        <div className="form-card rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                Цель и активность
              </h3>
              <p className="text-sm text-muted-foreground">Последний шаг!</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Цель <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formValues.goal}
                onValueChange={(value) => setValue("goal", value)}
              >
                <SelectTrigger className="h-12 input-focus-ring">
                  <SelectValue placeholder="Выбери свою цель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Снижение веса">Снижение веса</SelectItem>
                  <SelectItem value="Поддержание веса">
                    Поддержание веса
                  </SelectItem>
                  <SelectItem value="Набор мышечной массы">
                    Набор мышечной массы
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.goal && (
                <p className="text-sm text-destructive">
                  {errors.goal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Уровень физической активности{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formValues.activityLevel}
                onValueChange={(value) => setValue("activityLevel", value)}
              >
                <SelectTrigger className="h-12 input-focus-ring">
                  <SelectValue placeholder="Выбери уровень активности" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Сидячий">Сидячий</SelectItem>
                  <SelectItem value="Лёгкая активность">
                    Лёгкая активность
                  </SelectItem>
                  <SelectItem value="Умеренная активность">
                    Умеренная активность
                  </SelectItem>
                  <SelectItem value="Высокая активность">
                    Высокая активность
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.activityLevel && (
                <p className="text-sm text-destructive">
                  {errors.activityLevel.message}
                </p>
              )}
            </div>
          </div>

          {/* Motivation Block - only on last step */}
          <div className="bg-secondary/50 rounded-lg p-4 border border-primary/10 mt-6">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              💡 Эти данные помогут боту точнее рассчитать рекомендации, питание
              и темп движения к твоей цели.{" "}
              <span className="text-foreground font-medium">
                Мы не используем данные для спама.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
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
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
