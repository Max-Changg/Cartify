import { ShoppingCart } from 'lucide-react';

interface HeaderProps {
  cartItemCount: number;
  totalCost: number;
}

export function Header({ cartItemCount, totalCost }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center overflow-hidden relative shadow-lg shadow-emerald-500/30 button-shine-effect">
              <img 
                src="/cart-logo1.png" 
                alt="Cartify Logo" 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  console.error('Failed to load cart-logo1.png');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="font-bold text-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">
                Cartify
              </h1>
              <p className="text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                Speak. Shop. Done.
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
