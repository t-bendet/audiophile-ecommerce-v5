export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;
export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrength = {
  score: PasswordStrengthScore;
  label: PasswordStrengthLabel;
  hint: string | null;
};

export const MAX_PASSWORD_STRENGTH_SCORE: PasswordStrengthScore = 4;

const FORCED_WEAK_SCORE: PasswordStrengthScore = 1;

type StrengthRule = {
  isMet: (password: string) => boolean;
  hint: string;
};

const STRENGTH_RULES: readonly StrengthRule[] = [
  {
    isMet: (password) => password.length >= 8,
    hint: "Use at least 8 characters",
  },
  {
    isMet: (password) => password.length >= 12,
    hint: "Use 12 or more characters",
  },
  {
    isMet: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
    hint: "Mix upper and lower case",
  },
  {
    isMet: (password) => /\d/.test(password),
    hint: "Add a number",
  },
  {
    isMet: (password) => /[^A-Za-z0-9]/.test(password),
    hint: "Add a symbol",
  },
];

const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  "password",
  "password1",
  "password123",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "abc123",
  "iloveyou",
  "admin",
  "welcome",
  "letmein",
  "monkey",
  "dragon",
  "football",
  "baseball",
  "sunshine",
  "princess",
]);

const COMMON_PASSWORD_HINT = "Avoid common passwords";
const REPEATED_CHARACTER_HINT = "Avoid repeating a single character";

const isCommonPassword = (password: string) =>
  COMMON_PASSWORDS.has(password.toLowerCase());

const isSingleRepeatedCharacter = (password: string) =>
  /^(.)\1*$/.test(password);

const labelForScore = (score: PasswordStrengthScore): PasswordStrengthLabel => {
  if (score >= 4) return "Strong";
  if (score === 3) return "Good";
  if (score === 2) return "Fair";
  return "Weak";
};

export function scorePassword(password: string): PasswordStrength {
  const forcedWeakHint = isCommonPassword(password)
    ? COMMON_PASSWORD_HINT
    : isSingleRepeatedCharacter(password)
      ? REPEATED_CHARACTER_HINT
      : null;

  const metCount = STRENGTH_RULES.filter((rule) => rule.isMet(password)).length;
  const rawScore = Math.min(
    metCount,
    MAX_PASSWORD_STRENGTH_SCORE,
  ) as PasswordStrengthScore;
  const score = forcedWeakHint
    ? (Math.min(rawScore, FORCED_WEAK_SCORE) as PasswordStrengthScore)
    : rawScore;
  const label = labelForScore(score);

  const firstUnmetRule = STRENGTH_RULES.find((rule) => !rule.isMet(password));
  const hint =
    forcedWeakHint ??
    (label === "Strong" ? null : (firstUnmetRule?.hint ?? null));

  return { score, label, hint };
}
