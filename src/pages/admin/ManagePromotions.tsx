import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { togglePromotion, deletePromotion, addPromotion } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import type { Promotion } from '../../types';
import toast from 'react-hot-toast';

export function ManagePromotions() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';
  const promos = useAppSelector((s) => s.admin.promotions);

  const [showAdd, setShowAdd] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<Promotion>>({
    type: 'percentage',
    value: 10,
    applicableTo: 'all',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    isActive: true,
    usageCount: 0,
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
  });

  function handleAdd() {
    if (!newPromo.code || !newPromo.name?.en) { toast.error('Fill required fields'); return; }
    dispatch(addPromotion({
      id: `promo_${Date.now()}`,
      code: newPromo.code!.toUpperCase(),
      name: newPromo.name!,
      description: newPromo.description ?? { en: '', ar: '' },
      type: newPromo.type!,
      value: newPromo.value!,
      minBookingAmount: newPromo.minBookingAmount,
      maxDiscount: newPromo.maxDiscount,
      validFrom: newPromo.validFrom!,
      validTo: newPromo.validTo!,
      usageLimit: newPromo.usageLimit,
      usageCount: 0,
      applicableTo: newPromo.applicableTo!,
      isActive: true,
    } as Promotion));
    setShowAdd(false);
    toast.success('Promotion created');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus size={16} /> {t('admin.add_promo')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((promo) => (
          <Card key={promo.id} padding="md" className={!promo.isActive ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => { navigator.clipboard.writeText(promo.code); toast.success('Code copied!'); }}
                    className="font-mono font-bold text-gray-900 hover:text-gold-600 flex items-center gap-1"
                  >
                    {promo.code} <Copy size={12} />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{promo.name[lang]}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { dispatch(togglePromotion(promo.id)); toast.success('Updated'); }} className={promo.isActive ? 'text-green-600' : 'text-gray-400'}>
                  {promo.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => { dispatch(deletePromotion(promo.id)); toast.success('Deleted'); }} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="gold" size="sm">
                {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value} KWD`}
              </Badge>
              <Badge variant="gray" size="sm" className="capitalize">{promo.applicableTo}</Badge>
              <Badge variant={promo.isActive ? 'green' : 'red'} size="sm">{promo.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>

            <div className="text-xs text-gray-500 space-y-0.5">
              <p>Valid: {format(parseISO(promo.validFrom), 'dd MMM yy')} → {format(parseISO(promo.validTo), 'dd MMM yy')}</p>
              <p>Used: {promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''} times</p>
              {promo.minBookingAmount && <p>Min. booking: {promo.minBookingAmount.toLocaleString()} KWD</p>}
            </div>
          </Card>
        ))}
      </div>

      {/* Add promo modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Promotion" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Promo Code*" placeholder="SUMMER25" value={newPromo.code ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select
              value={newPromo.type}
              onChange={(e) => setNewPromo((p) => ({ ...p, type: e.target.value as Promotion['type'] }))}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (SAR)</option>
            </select>
          </div>
          <Input label="Name (English)*" value={newPromo.name?.en ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, name: { en: e.target.value, ar: p.name?.ar ?? '' } }))} />
          <Input label="Name (Arabic)" value={newPromo.name?.ar ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, name: { en: p.name?.en ?? '', ar: e.target.value } }))} />
          <Input label={`Value (${newPromo.type === 'percentage' ? '%' : 'SAR'})*`} type="number" value={newPromo.value ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, value: Number(e.target.value) }))} />
          <Input label="Min. Booking (SAR)" type="number" value={newPromo.minBookingAmount ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, minBookingAmount: Number(e.target.value) }))} />
          <Input label="Valid From" type="date" value={newPromo.validFrom ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, validFrom: e.target.value }))} />
          <Input label="Valid To" type="date" value={newPromo.validTo ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, validTo: e.target.value }))} />
          <Input label="Usage Limit" type="number" value={newPromo.usageLimit ?? ''} onChange={(e) => setNewPromo((p) => ({ ...p, usageLimit: Number(e.target.value) }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Applies To</label>
            <select
              value={String(newPromo.applicableTo ?? 'all')}
              onChange={(e) => setNewPromo((p) => ({ ...p, applicableTo: e.target.value as Promotion['applicableTo'] }))}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="all">All</option>
              <option value="normal">Normal</option>
              <option value="superior">Superior</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Button variant="ghost" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleAdd}>{t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
