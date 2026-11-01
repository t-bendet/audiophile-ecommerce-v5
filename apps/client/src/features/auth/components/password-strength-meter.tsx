import { cn } from "@/lib/cn";
import {
  MAX_PASSWORD_STRENGTH_SCORE,
  scorePassword,
  type PasswordStrengthScore,
} from "../utils/password-strength";

type PasswordStrengthMeterProps = {
  password: string;
  className?: string;
};

const FILLED_SEGMENT_CLASS: Record<PasswordStrengthScore, string> = {
  0: "bg-red-600",
  1: "bg-red-600",
  2: "bg-amber-600",
  3: "bg-lime-600",
  4: "bg-green-600",
};

const EMPTY_SEGMENT_CLASS = "bg-neutral-400";

const SEGMENT_INDEXES = Array.from(
  { length: MAX_PASSWORD_STRENGTH_SCORE },
  (_, index) => index,
);

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  if (password.length === 0) return null;

  const { score, label, hint } = scorePassword(password);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn("grid gap-1.5 text-xs text-neutral-500", className)}
    >
      <div className="flex items-center gap-3">
        <div
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={MAX_PASSWORD_STRENGTH_SCORE}
          aria-valuenow={score}
          aria-valuetext={label}
          className="flex flex-1 gap-1"
        >
          {SEGMENT_INDEXES.map((index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index < score
                  ? FILLED_SEGMENT_CLASS[score]
                  : EMPTY_SEGMENT_CLASS,
              )}
            />
          ))}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      {hint && <p>{hint}</p>}
    </div>
  );
}
