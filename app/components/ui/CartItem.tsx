import { Plus, Minus, X } from 'lucide-react';
import type { CartItem as CartItemType } from '../../App';
import { Switch } from '../Switch';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onToggle, onRemove }: CartItemProps) {
  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-300 animate-slide-in-up ${
        item.enabled
          ? 'bg-white border-gray-200'
          : 'bg-gray-50 border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className={`font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {item.name}
          </h4>
          {item.brand && (
            <p className={`text-xs ${item.enabled ? 'text-gray-500' : 'text-gray-400'}`}>
              {item.brand}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            disabled={!item.enabled}
          >
            <Minus className="w-3 h-3 text-gray-600" />
          </button>
          <span className={`w-8 text-center font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            disabled={!item.enabled}
          >
            <Plus className="w-3 h-3 text-gray-600" />
          </button>
        </div>

        {/* Price and Toggle */}
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${item.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            ${(item.price * item.quantity).toFixed(2)}
          </span>
          <Switch checked={item.enabled} onCheckedChange={() => onToggle(item.id)} />
        </div>
      </div>
    </div>
  );
}