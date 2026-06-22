import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { togglePricingRule, deletePricingRule, addPricingRule } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import type { PricingRule } from '../../types';

export function ManagePricing() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const rules = useAppSelector((s) => s.admin.pricingRules);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({ type: 'seasonal', appliesTo: 'all', isActive: true, multiplier: 1.2 });

  const typeColors = { seasonal: 'gold', weekend: 'navy', demand: 'green', last_minute: 'red', early_bird: 'gray' } as const;

  function handleAdd() {
    if (!newRule.name || !newRule.multiplier) { toast.error('Fill all required fields'); return; }
    dispatch(addPricingRule({
      id: `pr_${Date.now()}`,
      name: newRule.name!,
      type: newRule.type ?? 'seasonal',
      multiplier: newRule.multiplier!,
      startDate: newRule.startDate,
      endDate: newRule.endDate,
      daysOfWeek: newRule.daysOfWeek,
      isActive: true,
      appliesTo: newRule.appliesTo ?? 'all',
    } as PricingRule));
    setShowAdd(false);
    setNewRule({ type: 'seasonal', appliesTo: 'all', isActive: true, multiplier: 1.2 });
    toast.success('Pricing rule added');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus size={16} /> {t('admin.add_rule')}
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Rule Name', 'Type', 'Multiplier', 'Period / Days', 'Applies To', 'Active', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={typeColors[rule.type] ?? 'gray'} size="sm">{rule.type.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${rule.multiplier > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {rule.multiplier > 1 ? '+' : ''}{Math.round((rule.multiplier - 1) * 100)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {rule.startDate && rule.endDate
                    ? `${rule.startDate} → ${rule.endDate}`
                    : rule.daysOfWeek
                      ? `Days: ${rule.daysOfWeek.join(', ')}`
                      : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs capitalize">
                  {Array.isArray(rule.appliesTo) ? rule.appliesTo.join(', ') : rule.appliesTo}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { dispatch(togglePricingRule(rule.id)); toast.success('Updated'); }}
                    className={rule.isActive ? 'text-green-600' : 'text-gray-400'}
                  >
                    {rule.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { dispatch(deletePricingRule(rule.id)); toast.success('Rule deleted'); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add rule modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t('admin.add_rule')} size="md">
        <div className="space-y-4">
          <Input label="Rule Name" value={newRule.name ?? ''} onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule((p) => ({ ...p, type: e.target.value as PricingRule['type'] }))}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                <option value="seasonal">Seasonal</option>
                <option value="weekend">Weekend</option>
                <option value="demand">Demand</option>
                <option value="last_minute">Last Minute</option>
                <option value="early_bird">Early Bird</option>
              </select>
            </div>
            <Input
              label="Multiplier (e.g. 1.3 = +30%)"
              type="number"
              step="0.05"
              min="0.5"
              max="3"
              value={newRule.multiplier ?? 1.2}
              onChange={(e) => setNewRule((p) => ({ ...p, multiplier: Number(e.target.value) }))}
            />
          </div>
          {newRule.type === 'seasonal' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={newRule.startDate ?? ''} onChange={(e) => setNewRule((p) => ({ ...p, startDate: e.target.value }))} />
              <Input label="End Date" type="date" value={newRule.endDate ?? ''} onChange={(e) => setNewRule((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Applies To</label>
            <select
              value={Array.isArray(newRule.appliesTo) ? newRule.appliesTo[0] : newRule.appliesTo ?? 'all'}
              onChange={(e) => setNewRule((p) => ({ ...p, appliesTo: e.target.value === 'all' ? 'all' : [e.target.value] as PricingRule['appliesTo'] }))}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="all">All Types</option>
              <option value="normal">Normal</option>
              <option value="superior">Superior</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAdd}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
