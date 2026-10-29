import { cn } from "@/lib/cn";
import { Eye, EyeOff } from "lucide-react";

type PasswordVisibilityToggleProps = {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
  iconSize?: number;
};

export function PasswordVisibilityToggle({
  isVisible,
  onToggle,
  className,
  iconSize = 14,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      className={cn(
        "absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1 text-neutral-500/70 hover:text-neutral-700 focus-visible:outline-none",
        className,
      )}
      onClick={onToggle}
      aria-pressed={isVisible}
      aria-label={isVisible ? "Hide password" : "Show password"}
    >
      {isVisible ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
    </button>
  );
}
