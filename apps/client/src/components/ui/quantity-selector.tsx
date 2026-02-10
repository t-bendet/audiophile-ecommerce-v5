import { cn } from "@/lib/cn";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    onChange(value + 1);
  };

  const isAtMin = value <= 1;

  return (
    <div
      className={cn(
        "flex h-12 w-30 items-center justify-around bg-neutral-200 text-xs font-bold",
        className,
      )}
    >
      <button
        className="cursor-pointer px-3 opacity-25 hover:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDecrease}
        disabled={disabled || isAtMin}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span aria-live="polite">{value}</span>
      <button
        className="cursor-pointer px-3 opacity-25 hover:opacity-50 disabled:cursor-not-allowed"
        onClick={handleIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
