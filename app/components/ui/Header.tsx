import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  cartItemCount: number;
  totalCost: number;
}

export function Header({ cartItemCount, totalCost }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-lg overflow-hidden">
              <Image 
                src="/cart-logo.png" 
                alt="VoiceCart Logo" 
                width={206} 
                height={206}
                className="object-cover scale-200"
              />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-gray-900">VoiceCart</h1>
              <p className="text-sm text-gray-500">Speak. Shop. Done.</p>
            </div>
          </div>

          {/* Cart Info */}
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-base text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
            </div>
            
            <div className="relative">
              <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
              </button>
              {cartItemCount > 0 && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#10B981] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{cartItemCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
