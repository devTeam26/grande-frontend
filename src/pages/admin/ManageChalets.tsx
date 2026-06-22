import { useState } from 'react';
import { Star, Users, Maximize2, ToggleLeft, ToggleRight, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { toggleChaletAvailability, updateChaletBasePrice } from '../../store/slices/chaletsSlice';
import { ChaletTypeBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export function ManageChalets() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const chalets = useAppSelector((s) => s.chalets.chalets);
  const [editChalet, setEditChalet] = useState<{ id: string; price: number } | null>(null);

  function handleToggle(id: string) {
    dispatch(toggleChaletAvailability(id));
    toast.success('Availability updated');
  }

  function handlePriceSave() {
    if (!editChalet) return;
    dispatch(updateChaletBasePrice({ id: editChalet.id, price: editChalet.price }));
    setEditChalet(null);
    toast.success('Base price updated');
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chalets.map((chalet) => (
          <Card key={chalet.id} padding="none" className="overflow-hidden">
            <div className="relative">
              <img src={chalet.images[0]} alt={chalet.name[lang]} className="w-full h-40 object-cover" />
              <div className="absolute top-2 start-2 flex gap-1">
                <ChaletTypeBadge type={chalet.type} />
              </div>
              <div className={`absolute top-2 end-2 px-2 py-0.5 rounded-full text-xs font-medium ${chalet.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {chalet.isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">{chalet.name[lang]}</h3>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><Star size={11} className="fill-gold-500 text-gold-500" /> {chalet.rating}</span>
                <span className="flex items-center gap-1"><Users size={11} /> max {chalet.maxGuests}</span>
                <span className="flex items-center gap-1"><Maximize2 size={11} /> {chalet.size} m²</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Base price / night</p>
                  <p className="text-lg font-bold text-gold-600">{chalet.basePrice.toLocaleString()} KWD</p>
                </div>
                <button
                  onClick={() => setEditChalet({ id: chalet.id, price: chalet.basePrice })}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Availability</span>
                <button
                  onClick={() => handleToggle(chalet.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${chalet.isAvailable ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {chalet.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {chalet.isAvailable ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit price modal */}
      <Modal
        isOpen={!!editChalet}
        onClose={() => setEditChalet(null)}
        title="Update Base Price"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Base Price (SAR / night)"
            type="number"
            value={editChalet?.price ?? ''}
            onChange={(e) => setEditChalet((p) => p ? { ...p, price: Number(e.target.value) } : null)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditChalet(null)}>{t('common.cancel')}</Button>
            <Button onClick={handlePriceSave}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
