import { ShoppingCart, Mic } from 'lucide-react';

interface HeaderProps {
  cartItemCount: number;
  totalCost: number;
}

export function Header({ cartItemCount, totalCost }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">VoiceCart</h1>
              <p className="text-xs text-gray-500">Speak. Shop. Done.</p>
            </div>
          </div>

          {/* Cart Info */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
            </div>
            
            <div className="relative">
              <button className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
              </button>
              {cartItemCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{cartItemCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
