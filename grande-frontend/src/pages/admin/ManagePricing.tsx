import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  fetchPricingRules, createPricingRuleApi, updatePricingRuleApi, deletePricingRuleApi,
} from '../../store/slices/adminSlice';
import type { ApiPricingRule, PricingRulePayload } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const RULE_TYPES = ['Seasonal', 'Weekend', 'Demand', 'LastMinute', 'EarlyBird', 'OccupancyBased'];
const CHALET_TYPES = ['', 'Standard', 'Superior', 'VIP'];
const DAY_OPTIONS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TYPE_COLORS: Record<string, string> = {
  Seasonal: 'bg-gold-100 text-gold-700',
  Weekend: 'bg-navy-100 text-navy-700',
  Demand: 'bg-green-100 text-green-700',
  LastMinute: 'bg-red-100 text-red-700',
  EarlyBird: 'bg-blue-100 text-blue-700',
  OccupancyBased: 'bg-gray-100 text-gray-700',
};

const EMPTY: PricingRulePayload = {
  name: '', type: 'Seasonal', applicableChaletType: '',
  multiplier: 1.0, fixedAmount: 0, startDate: null, endDate: null,
  dayOfWeek: null, minNights: 0, occupancyThreshold: 0, priority: 0,
};

export function ManagePricing() {
  const dispatch = useAppDispatch();
  const rules = useAppSelector((s) => s.admin.apiPricingRules);
  const loading = useAppSelector((s) => s.admin.pricingRulesLoading);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPricingRule | null>(null);
  const [form, setForm] = useState<PricingRulePayload>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { (dispatch as any)(fetchPricingRules()); }, [dispatch]);

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true); }
  function openEdit(rule: ApiPricingRule) {
    setEditing(rule);
    setForm({
      name: rule.name, type: rule.type,
      applicableChaletType: rule.applicableChaletType ?? '',
      multiplier: rule.multiplier, fixedAmount: rule.fixedAmount,
      startDate: rule.startDate, endDate: rule.endDate,
      dayOfWeek: rule.dayOfWeek, minNights: rule.minNights,
      occupancyThreshold: rule.occupancyThreshold, priority: rule.priority,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const result = editing
      ? await updatePricingRuleApi(editing.id, form)
      : await createPricingRuleApi(form);
    setSaving(false);
    if (result.success) {
      toast.success(editing ? 'Rule updated' : 'Rule created');
      setModalOpen(false);
      (dispatch as any)(fetchPricingRules());
    } else {
      toast.error(result.message || 'Failed');
    }
  }

  async function handleDelete(rule: ApiPricingRule) {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    const result = await deletePricingRuleApi(rule.id);
    if (result.success) { toast.success('Rule deleted'); (dispatch as any)(fetchPricingRules()); }
    else toast.error(result.message || 'Failed to delete');
  }

  function setField<K extends keyof PricingRulePayload>(k: K, v: PricingRulePayload[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Rule</Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : rules.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No pricing rules yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Name', 'Type', 'Multiplier', 'Fixed Amt', 'Period / Day', 'Chalet Type', 'Priority', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((rule) => {
                  const badge = TYPE_COLORS[rule.type] ?? 'bg-gray-100 text-gray-700';
                  const period = rule.startDate && rule.endDate
                    ? `${rule.startDate.split('T')[0]} → ${rule.endDate.split('T')[0]}`
                    : rule.dayOfWeek ?? '—';
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>{rule.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${rule.multiplier > 1 ? 'text-red-600' : rule.multiplier < 1 ? 'text-green-600' : 'text-gray-500'}`}>
                          {rule.multiplier !== 1 ? `×${rule.multiplier.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{rule.fixedAmount ? `${rule.fixedAmount} KWD` : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{period}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{rule.applicableChaletType || 'All'}</td>
                      <td className="px-4 py-3 text-gray-600">{rule.priority}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(rule)} className="p-1.5 rounded-lg hover:bg-gold-50 text-gray-400 hover:text-gold-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(rule)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rule' : 'New Pricing Rule'} size="md">
        <div className="space-y-4">
          <Input label="Rule Name *" value={form.name} onChange={(e) => setField('name', e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select value={form.type} onChange={(e) => setField('type', e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Applies To</label>
              <select value={form.applicableChaletType ?? ''} onChange={(e) => setField('applicableChaletType', e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                {CHALET_TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Multiplier (e.g. 1.3 = +30%)" type="number" step="0.05" min="0" value={form.multiplier ?? 1} onChange={(e) => setField('multiplier', Number(e.target.value))} />
            <Input label="Fixed Amount (KWD)" type="number" min="0" value={form.fixedAmount ?? 0} onChange={(e) => setField('fixedAmount', Number(e.target.value))} />
          </div>

          {form.type === 'Seasonal' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={form.startDate?.split('T')[0] ?? ''} onChange={(e) => setField('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)} />
              <Input label="End Date" type="date" value={form.endDate?.split('T')[0] ?? ''} onChange={(e) => setField('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
          )}

          {form.type === 'Weekend' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Day of Week</label>
              <select value={form.dayOfWeek ?? ''} onChange={(e) => setField('dayOfWeek', e.target.value || null)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                <option value="">Select day</option>
                {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {form.type === 'OccupancyBased' && (
            <Input label="Occupancy Threshold (%)" type="number" min="0" max="100" value={form.occupancyThreshold ?? 0} onChange={(e) => setField('occupancyThreshold', Number(e.target.value))} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Nights" type="number" min="0" value={form.minNights ?? 0} onChange={(e) => setField('minNights', Number(e.target.value))} />
            <Input label="Priority" type="number" min="0" value={form.priority ?? 0} onChange={(e) => setField('priority', Number(e.target.value))} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
