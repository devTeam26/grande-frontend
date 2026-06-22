import { useTranslation } from 'react-i18next';
import type { PricingBreakdown } from '../../types';
import { cn } from '../../utils/cn';

interface PricingSummaryProps {
  pricing: PricingBreakdown;
  paymentPlan: 'full' | 'partial';
  chaletName: string;
  checkIn: string;
  checkOut: string;
  className?: string;
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-1.5 text-sm', bold && 'font-semibold', highlight && 'text-gold-700')}>
      <span className={cn('text-gray-600', bold && 'text-gray-900')}>{label}</span>
      <span className={cn('text-gray-900', highlight && 'text-gold-700')}>{value}</span>
    </div>
  );
}

export function PricingSummary({ pricing, paymentPlan, chaletName, checkIn, checkOut, className }: PricingSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 p-5', className)}>
      <h3 className="font-semibold text-gray-900 mb-4">{t('booking.summary')}</h3>

      <div className="text-sm mb-4">
        <p className="font-medium text-gray-900">{chaletName}</p>
        <p className="text-gray-500 text-xs mt-1">
          {checkIn} → {checkOut} · {pricing.nights} {t('booking.nights')}
        </p>
      </div>

      <div className="space-y-0.5 border-t border-gray-100 pt-3">
        <Row
          label={`${t('booking.base_price')} × ${pricing.nights} ${t('booking.nights')}`}
          value={`${pricing.subtotal.toLocaleString()} ${t('common.sar')}`}
        />
        {pricing.weekendSurcharge > 0 && (
          <Row
            label={t('booking.weekend_surcharge')}
            value={`+${pricing.weekendSurcharge.toLocaleString()} ${t('common.sar')}`}
          />
        )}
        {pricing.seasonalSurcharge > 0 && (
          <Row
            label={t('booking.seasonal_surcharge')}
            value={`+${pricing.seasonalSurcharge.toLocaleString()} ${t('common.sar')}`}
          />
        )}
        {pricing.discount > 0 && (
          <Row
            label={t('booking.discount')}
            value={`-${pricing.discount.toLocaleString()} ${t('common.sar')}`}
            highlight
          />
        )}
        {pricing.loyaltyDiscount > 0 && (
          <Row
            label={t('booking.loyalty_discount')}
            value={`-${pricing.loyaltyDiscount.toLocaleString()} ${t('common.sar')}`}
            highlight
          />
        )}
        <Row
          label={t('booking.tax')}
          value={`${pricing.tax.toLocaleString()} ${t('common.sar')}`}
        />
        <div className="border-t border-gray-200 mt-2 pt-2">
          <Row
            label={t('booking.total')}
            value={`${pricing.total.toLocaleString()} ${t('common.sar')}`}
            bold
          />
        </div>
      </div>

      {paymentPlan === 'partial' && (
        <div className="mt-4 p-3 bg-gold-50 rounded-xl space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{t('booking.deposit')} (30%)</span>
            <span className="font-semibold text-gold-700">{pricing.deposit.toLocaleString()} {t('common.sar')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('booking.remaining')}</span>
            <span className="text-gray-600">{pricing.remaining.toLocaleString()} {t('common.sar')}</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-xs text-gray-400">
        ≈ {pricing.perNightAverage.toLocaleString()} {t('common.sar')} {t('common.per_night')} avg.
      </div>
    </div>
  );
}
