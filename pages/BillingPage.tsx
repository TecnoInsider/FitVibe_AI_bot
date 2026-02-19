import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Ban, CreditCard } from 'lucide-react';
import { useTelegram } from '../contexts/TelegramContext';
import {
  cancelLavaSubscription,
  createLavaPayment,
  getLavaPricing,
  getProfile,
  PaymentCurrency,
  PaymentMethod,
  PaymentPricingItem,
} from '../hooks/api';
import { UserProfile } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { formatDateTimeForUser, resolveTimezone } from '../lib/datetime';

type Period = 1 | 3 | 6 | 12;
type Method = PaymentMethod;
type Currency = PaymentCurrency;

const formatPrice = (amount: number, currency: Currency): string => {
  const locale = currency === 'RUB' ? 'ru-RU' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'RUB' ? 0 : 2,
  }).format(amount);
};

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, openLink } = useTelegram();
  const { showToast } = useAppContext();

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [pricing, setPricing] = React.useState<PaymentPricingItem[]>([]);
  const [isPricingLoading, setIsPricingLoading] = React.useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageMessage, setManageMessage] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>(1);
  const [method, setMethod] = useState<Method>('ru');
  const [currency, setCurrency] = useState<Currency>('RUB');
  const [showPaymentOptions, setShowPaymentOptions] = useState(searchParams.get('mode') !== 'manage');

  React.useEffect(() => {
    if (typeof user?.id !== 'number') return;
    const loadData = async () => {
      setIsPricingLoading(true);
      setPricingError(null);
      setManageError(null);
      setManageMessage(null);
      try {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
        const pricingData = await getLavaPricing(user.id, profileData?.email);
        setPricing(pricingData);
        if (!pricingData.length) {
          setPricingError('Не удалось загрузить цены из LavaTop');
        }
      } catch (error) {
        console.error('Failed to load billing data', error);
        setPricingError('Ошибка загрузки тарифов');
      } finally {
        setIsPricingLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const isPaid = profile?.access_status === 'paid';
  const userTimezone = resolveTimezone(profile?.timezone);
  const accessUntilText = formatDateTimeForUser(profile?.access_until || profile?.demo_ends_at, userTimezone);
  const timezoneLabel = userTimezone ? ` (${userTimezone})` : '';
  const isManageMode = searchParams.get('mode') === 'manage' || isPaid;

  React.useEffect(() => {
    if (!isManageMode) {
      setShowPaymentOptions(true);
      return;
    }
    setShowPaymentOptions(false);
  }, [isManageMode]);

  const methodOptions = useMemo(() => Array.from(new Set(pricing.map(item => item.method))), [pricing]);

  const currencyOptions = useMemo(
    () => Array.from(new Set(pricing.filter(item => item.method === method).map(item => item.currency))),
    [pricing, method]
  );

  const periodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          pricing
            .filter(item => item.method === method && item.currency === currency)
            .map(item => item.period_months)
        )
      ).sort((a, b) => a - b),
    [pricing, method, currency]
  );

  React.useEffect(() => {
    if (!methodOptions.length) return;
    if (!methodOptions.includes(method)) setMethod(methodOptions[0]);
  }, [methodOptions, method]);

  React.useEffect(() => {
    if (!currencyOptions.length) return;
    if (!currencyOptions.includes(currency)) setCurrency(currencyOptions[0]);
  }, [currencyOptions, currency]);

  React.useEffect(() => {
    if (!periodOptions.length) return;
    if (!periodOptions.includes(period)) setPeriod(periodOptions[0] as Period);
  }, [periodOptions, period]);

  const selectedPrice = useMemo(
    () =>
      pricing.find(
        item => item.method === method && item.currency === currency && item.period_months === period
      ) || null,
    [pricing, method, currency, period]
  );

  const amount = selectedPrice?.amount || 0;
  const monthly = useMemo(() => amount / period, [amount, period]);

  const handleCreatePayment = async () => {
    if (!user?.id || !selectedPrice || !profile?.email) return;
    setIsCreatingPayment(true);
    try {
      const uiMethod = method === 'ru' ? 'bank_ru' : 'bank_foreign';

      const paymentUrl = await createLavaPayment({
        telegram_id: user.id,
        internal_id: profile?.internal_id,
        email: profile.email,
        plan_months: period,
        currency,
        ui_method: uiMethod,
      });

      if (!paymentUrl) {
        setPricingError('Ссылка на оплату не получена');
        return;
      }

      openLink(paymentUrl);
      if (!(window as any).Telegram?.WebApp?.openLink) {
        window.location.href = paymentUrl;
      }
    } catch (error) {
      console.error('Failed to create payment link', error);
      setPricingError('Ошибка создания платежа');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;

    const contractId = profile?.subscription_contract_id || profile?.contract_id || undefined;
    if (!profile?.email && !contractId) {
      setManageError('Не удалось определить подписку: нет email/contract_id.');
      return;
    }

    setManageError(null);
    setManageMessage(null);
    setIsCancelling(true);

    try {
      const success = await cancelLavaSubscription({
        tg_id: user.id,
        email: profile?.email,
        contract_id: contractId,
      });

      if (!success) {
        setManageError('Не удалось отключить автопродление. Попробуйте позже.');
        return;
      }

      setProfile(prev => (prev ? { ...prev, auto_renew: false } : prev));
      setManageMessage(`Автопродление отключено. Доступ сохранится до ${formatDateTimeForUser(profile?.access_until, userTimezone)}.`);
      showToast('Автопродление отключено');
    } catch (error) {
      console.error('Failed to cancel subscription', error);
      setManageError('Ошибка при отмене подписки.');
    } finally {
      setIsCancelling(false);
      setIsCancelConfirmOpen(false);
    }
  };

  const autoRenewEnabled = profile?.auto_renew !== false;

  return (
    <div className="p-3 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isManageMode ? 'Управление подпиской' : 'Оплата подписки'}
          </h1>
          <p className="text-xs text-slate-500">
            {isManageMode ? 'Проверьте статус и автопродление' : 'Откроем страницу оплаты LavaTop'}
          </p>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 mb-3">
        <p className="text-xs text-slate-500 mb-1">Email</p>
        <div className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 text-sm">
          {profile?.email || 'email не найден в профиле'}
        </div>
      </div>

      {isManageMode && (
        <section className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 mb-3">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Текущая подписка</h2>
          <p className="text-sm text-slate-700 mb-1">
            Статус: <span className="font-semibold">{isPaid ? 'Активна' : 'Не активна'}</span>
          </p>
          <p className="text-sm text-slate-700 mb-1">
            Доступ до{timezoneLabel}: <span className="font-semibold">{accessUntilText}</span>
          </p>
          {profile?.next_charge_at && (
            <p className="text-sm text-slate-700 mb-1">
              Следующее списание: <span className="font-semibold">{formatDateTime(profile.next_charge_at)}</span>
            </p>
          )}
          <p className="text-sm text-slate-700 mb-3">
            Автопродление: <span className="font-semibold">{autoRenewEnabled ? 'включено' : 'отключено'}</span>
          </p>

          <button
            type="button"
            onClick={() => setIsCancelConfirmOpen(true)}
            disabled={!isPaid || !autoRenewEnabled || isCancelling}
            className="w-full py-2.5 rounded-lg bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-rose-600 disabled:bg-slate-300"
          >
            <Ban size={16} />
            {isCancelling ? 'Отключаем...' : 'Отключить автопродление'}
          </button>

          {manageError && <p className="text-xs text-red-500 mt-2">{manageError}</p>}
          {manageMessage && <p className="text-xs text-emerald-600 mt-2">{manageMessage}</p>}

          <button
            type="button"
            onClick={() => setShowPaymentOptions(prev => !prev)}
            className="w-full mt-2 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            {showPaymentOptions ? 'Скрыть варианты оплаты' : 'Показать варианты оплаты'}
          </button>
        </section>
      )}

      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">Подтвердите отмену автопродления</h3>
            <p className="text-sm text-slate-700 mb-1">
              Подписка будет активна до{timezoneLabel}: <span className="font-semibold">{accessUntilText}</span>
            </p>
            <p className="text-sm text-slate-700 mb-4">
              Новых списаний после этой даты не будет.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
              >
                Оставить как есть
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="py-2.5 rounded-lg bg-rose-500 text-white font-semibold disabled:bg-slate-300"
              >
                {isCancelling ? 'Отключаем...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentOptions && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 mb-3">
            <p className="text-base font-semibold text-slate-900 mb-2">Период оплаты</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 12].map((item) => {
                const value = item as Period;
                const allowed = periodOptions.includes(value);
                const active = period === value;
                return (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    disabled={!allowed || isPricingLoading}
                    className={`rounded-lg py-1.5 text-base font-semibold border min-h-[35px] ${
                      active
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    } disabled:opacity-40`}
                  >
                    {value} мес
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 mb-3">
            <p className="text-base font-semibold text-slate-900 mb-2">Способ оплаты</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod('ru')}
                disabled={!methodOptions.includes('ru') || isPricingLoading}
                className={`rounded-lg py-1 px-2 text-base leading-tight font-semibold border min-h-[35px] ${
                  method === 'ru'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                } disabled:opacity-40`}
              >
                Банк РФ
              </button>
              <button
                onClick={() => setMethod('foreign')}
                disabled={!methodOptions.includes('foreign') || isPricingLoading}
                className={`rounded-lg py-1 px-2 text-base leading-tight font-semibold border min-h-[35px] ${
                  method === 'foreign'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                } disabled:opacity-40`}
              >
                Иностранный банк
              </button>
            </div>
          </div>

          {method === 'foreign' && (
            <div className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 mb-3">
              <p className="text-base font-semibold text-slate-900 mb-2">Валюта</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrency('USD')}
                  disabled={!currencyOptions.includes('USD') || isPricingLoading}
                  className={`rounded-lg py-1 text-base font-semibold border min-h-[35px] ${
                    currency === 'USD'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  } disabled:opacity-40`}
                >
                  USD $
                </button>
                <button
                  onClick={() => setCurrency('EUR')}
                  disabled={!currencyOptions.includes('EUR') || isPricingLoading}
                  className={`rounded-lg py-1 text-base font-semibold border min-h-[35px] ${
                    currency === 'EUR'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  } disabled:opacity-40`}
                >
                  EUR €
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-200">
            <div className="flex items-end justify-between gap-3">
              <p className="text-base text-slate-600">К оплате</p>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-500">{formatPrice(amount, currency)}</p>
                <p className="text-xs text-slate-500">{formatPrice(monthly, currency)} / мес</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreatePayment}
            className="w-full py-3 rounded-xl bg-orange-500 text-white text-base font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:bg-slate-300"
            disabled={!profile?.email || !selectedPrice || isPricingLoading || isCreatingPayment}
          >
            <CreditCard size={18} />
            {isCreatingPayment ? 'Формируем ссылку...' : 'Перейти к оплате'}
          </button>
          {pricingError && <p className="text-center text-xs text-red-500 mt-2">{pricingError}</p>}
          <p className="text-center text-xs text-slate-500 mt-2">
            На следующем шаге откроется безопасная страница оплаты.
          </p>
        </>
      )}
    </div>
  );
};

export default BillingPage;
