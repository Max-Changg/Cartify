import { Plus, Minus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { CartItem as CartItemType } from '../../types';
import { Switch } from '../Switch';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  index?: number;
  isRemoving?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onToggle, onRemove, index = 0, isRemoving = false }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (item.quantity !== quantity) {
      setIsFlipping(true);
      setTimeout(() => {
        setQuantity(item.quantity);
        setIsFlipping(false);
      }, 150);
    }
  }, [item.quantity, quantity]);


  if (isRemoving) {
    return (
      <div className="animate-slide-out-right">
        <div className="p-3 rounded-xl border bg-white border-gray-200 opacity-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-300 ${
        item.enabled
          ? 'bg-white border-gray-200 hover:shadow-md'
          : 'bg-gray-50 border-gray-100 opacity-50 blur-[0.5px]'
      }`}
      style={{
        animationName: 'slide-in-left',
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        animationFillMode: 'forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
      }}
    >
      {/* Divider line (except for first item) */}
      {index > 0 && (
        <div className="absolute -top-1 left-0 right-0 h-px bg-gray-200 opacity-50" />
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className={`font-medium transition-colors duration-300 ${item.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {item.name}
          </h4>
          {item.brand && (
            <p className={`text-xs transition-colors duration-300 ${item.enabled ? 'text-gray-500' : 'text-gray-400'}`}>
              {item.brand}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors duration-300 p-1 rounded-lg hover:bg-red-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="ripple-effect w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            disabled={!item.enabled}
          >
            <Minus className="w-3 h-3 text-gray-600" />
          </button>
          <span
            className={`w-8 text-center font-medium transition-all duration-300 ${
              item.enabled ? 'text-gray-900' : 'text-gray-400'
            } ${isFlipping ? 'animate-number-flip' : ''}`}
          >
            {quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="ripple-effect w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            disabled={!item.enabled}
          >
            <Plus className="w-3 h-3 text-gray-600" />
          </button>
        </div>

        {/* Price and Toggle */}
        <div className="flex items-center gap-3">
          <span className={`font-semibold transition-colors duration-300 ${item.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            ${(item.price * item.quantity).toFixed(2)}
          </span>
          <Switch checked={item.enabled} onCheckedChange={() => onToggle(item.id)} />
        </div>
      </div>
    </div>
  );
}
