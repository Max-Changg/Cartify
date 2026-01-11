import { useState } from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange }: SwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onCheckedChange(!checked);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
        checked ? 'bg-[#14B8A6]' : 'bg-gray-300'
      } ${isAnimating ? 'scale-95' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        } ${isAnimating ? 'scale-110' : ''}`}
      />
    </button>
  );
}
