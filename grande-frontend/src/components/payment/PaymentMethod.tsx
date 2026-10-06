import { useTranslation } from 'react-i18next';
import { CreditCard, Layers, ShoppingCart, ShieldCheck } from 'lucide-react';
import type { PaymentMethod as PaymentMethodType } from '../../types';
import { cn } from '../../utils/cn';

interface PaymentMethodProps {
  selected: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  amount: number;
}

const methods = [
  {
    id: 'tap' as PaymentMethodType,
    icon: CreditCard,
    color: 'blue',
    installments: null,
  },
  {
    id: 'deema' as PaymentMethodType,
    icon: Layers,
    color: 'purple',
    installments: 4,
  },
  {
    id: 'taly' as PaymentMethodType,
    icon: ShoppingCart,
    color: 'green',
    installments: 3,
  },
];

export function PaymentMethodSelector({ selected, onSelect, amount }: PaymentMethodProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t('payment.choose_method')}</h3>

      <div className="grid gap-3">
        {methods.map(({ id, icon: Icon, color, installments }) => {
          const labelKey = `payment.${id}_label` as const;
          const descKey = `payment.${id}_desc` as const;

          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start w-full',
                selected === id
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                color === 'blue' && 'bg-blue-100 text-blue-600',
                color === 'purple' && 'bg-purple-100 text-purple-600',
                color === 'green' && 'bg-green-100 text-green-600',
              )}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{t(labelKey)}</p>
                <p className="text-xs text-gray-500">{t(descKey)}</p>
              </div>
              {installments && (
                <div className="text-end flex-shrink-0">
                  <p className="text-xs text-gray-500">{installments} × </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.ceil(amount / installments).toLocaleString()} KWD
                  </p>
                </div>
              )}
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex-shrink-0',
                selected === id ? 'border-gold-500 bg-gold-500' : 'border-gray-300',
              )}>
                {selected === id && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
        <ShieldCheck size={14} className="text-green-500 flex-shrink-0" />
        {t('payment.secure_payment')}
      </div>
    </div>
  );
}
