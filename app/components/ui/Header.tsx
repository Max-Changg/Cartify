import { ShoppingCart } from 'lucide-react';

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
            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-xl flex items-center justify-center overflow-hidden relative">
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
              <h1 className="font-bold text-xl text-gray-900">Cartify</h1>
              <p className="text-xs text-gray-500">Speak. Shop. Done.</p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
