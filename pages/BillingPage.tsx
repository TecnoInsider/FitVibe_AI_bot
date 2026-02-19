import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useTelegram } from '../contexts/TelegramContext';
import { createLavaPayment, getLavaPricing, getProfile, PaymentCurrency, PaymentMethod, PaymentPricingItem } from '../hooks/api';
import { UserProfile } from '../types';

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
  const { user, openLink } = useTelegram();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [pricing, setPricing] = React.useState<PaymentPricingItem[]>([]);
  const [isPricingLoading, setIsPricingLoading] = React.useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = React.useState(false);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(1);
  const [method, setMethod] = useState<Method>('ru');
  const [currency, setCurrency] = useState<Currency>('RUB');

  React.useEffect(() => {
    if (typeof user?.id !== 'number') return;
    const loadData = async () => {
      setIsPricingLoading(true);
      setPricingError(null);
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

  const methodOptions = useMemo(
    () => Array.from(new Set(pricing.map(item => item.method))),
    [pricing]
  );

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
        item =>
          item.method === method && item.currency === currency && item.period_months === period
      ) || null,
    [pricing, method, currency, period]
  );

  const amount = selectedPrice?.amount || 0;
  const monthly = useMemo(() => amount / period, [amount, period]);

  const handleCreatePayment = async () => {
    if (!user?.id || !selectedPrice || !profile?.email) return;
    setIsCreatingPayment(true);
    try {
      const uiMethod =
        method === 'ru' ? 'bank_ru' : 'bank_foreign';

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

  return (
    <div className="p-4 pb-28 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center"
          aria-label="Назад"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Оплата подписки</h1>
          <p className="text-sm text-slate-500">Откроем страницу оплаты LavaTop</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 mb-4">
        <p className="text-sm text-slate-500 mb-1">Email</p>
        <div className="w-full rounded-xl border border-slate-200 p-3 text-slate-700">
          {profile?.email || 'email не найден в профиле'}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 mb-4">
        <p className="text-lg font-semibold text-slate-900 mb-3">Период оплаты</p>
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
                className={`rounded-xl py-3 text-lg font-semibold border ${
                  active
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                } disabled:opacity-40`}
              >
                {value} мес
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 mb-4">
        <p className="text-lg font-semibold text-slate-900 mb-3">Способ оплаты</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMethod('ru')}
            disabled={!methodOptions.includes('ru') || isPricingLoading}
            className={`rounded-xl py-3 text-lg font-semibold border ${
              method === 'ru'
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            } disabled:opacity-40`}
          >
            Банк РФ
          </button>
          <button
            onClick={() => setMethod('foreign')}
            disabled={!methodOptions.includes('foreign') || isPricingLoading}
            className={`rounded-xl py-3 text-lg font-semibold border ${
              method === 'foreign'
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            } disabled:opacity-40`}
          >
            Иностранный банк
          </button>
        </div>
      </div>

      {method === 'foreign' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 mb-4">
          <p className="text-lg font-semibold text-slate-900 mb-3">Валюта</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrency('USD')}
              disabled={!currencyOptions.includes('USD') || isPricingLoading}
              className={`rounded-xl py-3 text-lg font-semibold border ${
                currency === 'USD'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              } disabled:opacity-40`}
            >
              USD $
            </button>
            <button
              onClick={() => setCurrency('EUR')}
              disabled={!currencyOptions.includes('EUR') || isPricingLoading}
              className={`rounded-xl py-3 text-lg font-semibold border ${
                currency === 'EUR'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              } disabled:opacity-40`}
            >
              EUR €
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200">
        <div className="flex items-end justify-between gap-4">
          <p className="text-xl text-slate-600">К оплате</p>
          <div className="text-right">
            <p className="text-4xl font-bold text-sky-500">{formatPrice(amount, currency)}</p>
            <p className="text-sm text-slate-500">{formatPrice(monthly, currency)} / мес</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreatePayment}
        className="w-full py-4 rounded-2xl bg-sky-500 text-white text-xl font-semibold flex items-center justify-center gap-3 hover:bg-sky-600 disabled:bg-slate-300"
        disabled={!profile?.email || !selectedPrice || isPricingLoading || isCreatingPayment}
      >
        <CreditCard size={22} />
        {isCreatingPayment ? 'Формируем ссылку...' : 'Оплатить'}
      </button>
      {pricingError && <p className="text-center text-xs text-red-500 mt-3">{pricingError}</p>}
      <p className="text-center text-xs text-slate-500 mt-3">
        На следующем шаге откроется безопасная страница оплаты.
      </p>
    </div>
  );
};

export default BillingPage;
