import { Download, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { CartItem as CartItemType } from '../types';
import { CartItem } from './ui/CartItem';

interface ShoppingCartPanelProps {
  cartItems: CartItemType[];
  totalCost: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onExportList: () => void;
  onQuickPurchase: () => void;
  isProcessing?: boolean;
}

export function ShoppingCartPanel({
  cartItems,
  totalCost,
  onUpdateQuantity,
  onToggleItem,
  onRemoveItem,
  onExportList,
  onQuickPurchase,
  isProcessing = false,
}: ShoppingCartPanelProps) {
  const [displayTotal, setDisplayTotal] = useState(0);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const prevTotalRef = useRef(totalCost);

  // Count-up animation for total
  useEffect(() => {
    if (totalCost !== prevTotalRef.current) {
      const start = prevTotalRef.current;
      const end = totalCost;
      const duration = 800;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOutCubic;
        
        setDisplayTotal(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayTotal(end);
        }
      };

      animate();
      prevTotalRef.current = totalCost;
    }
  }, [totalCost]);

  const handleRemove = (id: string) => {
    setRemovingItems(prev => new Set(prev).add(id));
    setTimeout(() => {
      onRemoveItem(id);
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold text-gray-900">Shopping Cart</h2>
          {isProcessing && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>Processing</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Shopping Cart List */}
      <div className="flex-1 min-h-0 mb-4 overflow-hidden flex flex-col">
        <div className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Your cart is empty</p>
              <p className="text-gray-400 text-xs mt-2">Add items through the voice assistant</p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onToggle={onToggleItem}
                onRemove={handleRemove}
                index={index}
                isRemoving={removingItems.has(item.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Subtotal */}
      <div className="border-t border-gray-200 pt-4 mb-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Subtotal:</span>
          <span
            className={`text-2xl font-bold text-gray-900 transition-all duration-300 ${
              totalCost !== prevTotalRef.current ? 'animate-pulse-glow' : ''
            }`}
          >
            ${displayTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 flex-shrink-0">
        <button 
          onClick={onQuickPurchase}
          disabled={isProcessing || cartItems.length === 0}
          className="w-full bg-[#14B8A6] hover:bg-[#10B981] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Quick Purchase via Weee!
        </button>
        <button 
          onClick={onExportList}
          disabled={isProcessing || cartItems.length === 0}
          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md"
        >
          <Download className="w-4 h-4" />
          Export List
        </button>
        <button className="w-full text-[#14B8A6] hover:text-[#10B981] font-medium py-2 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#14B8A6]/10 rounded-xl">
          <MapPin className="w-4 h-4" />
          Find Nearby Stores
        </button>
      </div>
    </div>
  );
}
