import { Mic, Check, Loader2, Download, MapPin } from 'lucide-react';
import type { CartItem as CartItemType, MicrophoneState } from '../types';
import { CartItem } from './ui/CartItem';

interface VoicePanelProps {
  cartItems: CartItemType[];
  micState: MicrophoneState;
  transcription: string;
  timer: number;
  totalCost: number;
  onMicClick: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onExportList: () => void;
  onQuickPurchase: () => void;
  isProcessing?: boolean;
}

export function VoicePanel({
  cartItems,
  micState,
  transcription,
  timer,
  totalCost,
  onMicClick,
  onUpdateQuantity,
  onToggleItem,
  onRemoveItem,
  onExportList,
  onQuickPurchase,
  isProcessing = false,
}: VoicePanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 h-fit sticky top-24">
      {/* Microphone Button */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={onMicClick}
          disabled={micState === 'processing' || micState === 'success'}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            micState === 'idle'
              ? 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
              : micState === 'listening'
              ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] animate-pulse-scale cursor-pointer'
              : micState === 'processing'
              ? 'bg-gradient-to-br from-[#10B981] to-[#059669] cursor-not-allowed'
              : 'bg-[#10B981] cursor-not-allowed'
          }`}
        >
          {micState === 'idle' && <Mic className="w-10 h-10 text-gray-600" />}
          {micState === 'listening' && <Mic className="w-10 h-10 text-white" />}
          {micState === 'processing' && <Loader2 className="w-10 h-10 text-white animate-spin" />}
          {micState === 'success' && <Check className="w-10 h-10 text-white" />}
          
          {micState === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-[#14B8A6] opacity-30 animate-ping"></div>
          )}
        </button>
        
        <p className="mt-4 text-gray-500 text-sm">
          {micState === 'idle' && 'Speak to add items'}
          {micState === 'listening' && 'Listening... Click to stop'}
          {micState === 'processing' && 'Processing...'}
          {micState === 'success' && 'Items added!'}
        </p>
      </div>

      {/* Transcription Display */}
      {(micState === 'listening' || micState === 'processing' || (micState === 'success' && transcription)) && transcription && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Voice Input:</p>
          <p className="text-gray-900 italic">
            "{transcription}"
          </p>
        </div>
      )}

      {/* Timer */}
      <div className="mb-6 p-3 bg-[#F0FDF4] rounded-xl border border-[#10B981]/20">
        <p className="text-sm text-gray-600">Items added in: <span className="font-bold text-[#10B981]">{timer}s</span></p>
      </div>

      {/* Shopping Cart List */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Shopping Cart ({cartItems.length})</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Your cart is empty</p>
          ) : (
            cartItems.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onToggle={onToggleItem}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </div>
      </div>

      {/* Subtotal */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button 
          onClick={onQuickPurchase}
          disabled={isProcessing || cartItems.length === 0}
          className="w-full bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Quick Purchase via Weee!
        </button>
        <button 
          onClick={onExportList}
          disabled={isProcessing || cartItems.length === 0}
          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export List
        </button>
        <button className="w-full text-[#10B981] hover:text-[#059669] font-medium py-2 flex items-center justify-center gap-2 transition-colors">
          <MapPin className="w-4 h-4" />
          Find Nearby Stores
        </button>
      </div>
    </div>
  );
}
