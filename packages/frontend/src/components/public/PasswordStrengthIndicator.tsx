interface PasswordStrengthIndicatorProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-zA-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Razoável', color: 'bg-yellow-400' };
  if (score === 3) return { score, label: 'Boa', color: 'bg-blue-400' };
  return { score, label: 'Forte', color: 'bg-green-500' };
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-1" aria-live="polite" data-testid="password-strength">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= score ? color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
