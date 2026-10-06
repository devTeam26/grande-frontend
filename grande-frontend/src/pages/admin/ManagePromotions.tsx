import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  fetchPromotions, createPromotionApi, updatePromotionApi, deletePromotionApi,
} from '../../store/slices/adminSlice';
import type { ApiPromotion, PromotionPayload } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const CHALET_TYPES = ['', 'Standard', 'Superior', 'VIP'];
const today = new Date().toISOString().split('T')[0];
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const EMPTY: PromotionPayload = {
  code: '', name: '', nameAr: '', description: '',
  discountType: 'Percentage', discountValue: 10,
  minBookingAmount: 0, maxDiscountAmount: 0, maxUses: 0,
  validFrom: today, validTo: nextMonth, applicableChaletType: '',
};

export function ManagePromotions() {
  const dispatch = useAppDispatch();
  const promos = useAppSelector((s) => s.admin.apiPromotions);
  const loading = useAppSelector((s) => s.admin.promotionsLoading);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPromotion | null>(null);
  const [form, setForm] = useState<PromotionPayload>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { (dispatch as any)(fetchPromotions()); }, [dispatch]);

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true); }
  function openEdit(p: ApiPromotion) {
    setEditing(p);
    setForm({
      code: p.code, name: p.name, nameAr: p.nameAr, description: p.description,
      discountType: p.discountType, discountValue: p.discountValue,
      minBookingAmount: p.minBookingAmount, maxDiscountAmount: p.maxDiscountAmount,
      maxUses: p.maxUses, validFrom: p.validFrom.split('T')[0], validTo: p.validTo.split('T')[0],
      applicableChaletType: p.applicableChaletType ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) { toast.error('Code and name are required'); return; }
    if (!form.discountValue) { toast.error('Discount value is required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
    };
    const result = editing ? await updatePromotionApi(editing.id, payload) : await createPromotionApi(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editing ? 'Promotion updated' : 'Promotion created');
      setModalOpen(false);
      (dispatch as any)(fetchPromotions());
    } else {
      toast.error(result.message || 'Failed');
    }
  }

  async function handleDelete(p: ApiPromotion) {
    if (!confirm(`Delete promotion "${p.code}"?`)) return;
    const result = await deletePromotionApi(p.id);
    if (result.success) { toast.success('Deleted'); (dispatch as any)(fetchPromotions()); }
    else toast.error(result.message || 'Failed');
  }

  function setField<K extends keyof PromotionPayload>(k: K, v: PromotionPayload[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Promotion</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : promos.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">No promotions yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <Card key={promo.id} padding="md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(promo.code); toast.success('Code copied!'); }}
                    className="font-mono font-bold text-gray-900 hover:text-gold-600 flex items-center gap-1 text-sm"
                  >
                    {promo.code} <Copy size={11} />
                  </button>
                  <p className="text-sm text-gray-700 mt-0.5">{promo.name}</p>
                  {promo.nameAr && <p className="text-xs text-gray-400">{promo.nameAr}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(promo)} className="p-1.5 rounded-lg hover:bg-gold-50 text-gray-400 hover:text-gold-600 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(promo)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
                  {promo.discountType === 'Percentage' ? `-${promo.discountValue}%` : `-${promo.discountValue} KWD`}
                </span>
                {promo.applicableChaletType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{promo.applicableChaletType}</span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Valid: {format(parseISO(promo.validFrom), 'dd MMM yy')} → {format(parseISO(promo.validTo), 'dd MMM yy')}</p>
                <p>Used: {promo.usageCount ?? 0}{promo.maxUses ? ` / ${promo.maxUses}` : ''}</p>
                {promo.minBookingAmount > 0 && <p>Min booking: {promo.minBookingAmount.toLocaleString()} KWD</p>}
                {promo.maxDiscountAmount > 0 && <p>Max discount: {promo.maxDiscountAmount.toLocaleString()} KWD</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Promotion' : 'New Promotion'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Promo Code *" placeholder="SUMMER25" value={form.code} onChange={(e) => setField('code', e.target.value.toUpperCase())} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Discount Type</label>
            <select value={form.discountType} onChange={(e) => setField('discountType', e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
              <option value="Percentage">Percentage (%)</option>
              <option value="Fixed">Fixed (KWD)</option>
            </select>
          </div>
          <Input label="Name (English) *" value={form.name} onChange={(e) => setField('name', e.target.value)} />
          <Input label="Name (Arabic)" value={form.nameAr} onChange={(e) => setField('nameAr', e.target.value)} />
          <Input label={`Discount Value (${form.discountType === 'Percentage' ? '%' : 'KWD'}) *`} type="number" min="0" value={form.discountValue} onChange={(e) => setField('discountValue', Number(e.target.value))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Applies To</label>
            <select value={form.applicableChaletType ?? ''} onChange={(e) => setField('applicableChaletType', e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
              {CHALET_TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
            </select>
          </div>
          <Input label="Valid From *" type="date" value={form.validFrom} onChange={(e) => setField('validFrom', e.target.value)} />
          <Input label="Valid To *" type="date" value={form.validTo} onChange={(e) => setField('validTo', e.target.value)} />
          <Input label="Min Booking (KWD)" type="number" min="0" value={form.minBookingAmount ?? 0} onChange={(e) => setField('minBookingAmount', Number(e.target.value))} />
          <Input label="Max Discount (KWD)" type="number" min="0" value={form.maxDiscountAmount ?? 0} onChange={(e) => setField('maxDiscountAmount', Number(e.target.value))} />
          <Input label="Max Uses" type="number" min="0" value={form.maxUses ?? 0} onChange={(e) => setField('maxUses', Number(e.target.value))} />
          <div className="col-span-2">
            <Input label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} isLoading={saving}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
}
