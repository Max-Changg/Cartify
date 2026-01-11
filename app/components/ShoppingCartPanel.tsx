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
  onFindStores: () => void;
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
  onFindStores,
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
    <div className="bg-white rounded-2xl shadow-2xl shadow-emerald-500/5 border border-gray-100 p-6 h-[calc(100vh-120px)] flex flex-col relative overflow-hidden">
      {/* Decorative gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-gradient"></div>
      
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">
            Shopping Cart
          </h2>
          {isProcessing && (
            <div className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-semibold">
              <span>Processing</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-gray-600">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Shopping Cart List */}
      <div className="flex-1 min-h-0 mb-4 overflow-hidden flex flex-col">
        <div className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 animate-float">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold mb-2 text-lg">Your cart is empty</p>
              <p className="text-gray-500 text-sm">Add items through the voice assistant</p>
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
          <span className="text-gray-600 font-semibold">Subtotal:</span>
          <span
            className={`text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent transition-all duration-300 ${
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
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] button-shine-effect"
        >
          Quick Purchase via Weee!
        </button>
        <button 
          onClick={onExportList}
          disabled={isProcessing || cartItems.length === 0}
          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          Export List
        </button>
        <button 
          onClick={onFindStores}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 disabled:from-gray-50 disabled:to-gray-50 disabled:cursor-not-allowed text-emerald-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-emerald-200/50"
        >
          <MapPin className="w-4 h-4" />
          Find Nearby Stores
        </button>
      </div>
    </div>
  );
}
