type Variant = 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  variant?: Variant;
  children: string;
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  neutral: 'bg-surface-alt text-text-secondary',
};

export default function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
