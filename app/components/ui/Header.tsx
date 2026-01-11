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
                alt="Cartify Logo" 
                width={206} 
                height={206}
                className="object-cover scale-200"
              />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-gray-900">Cartify</h1>
              <p className="text-sm text-gray-500">Speak. Shop. Done.</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
