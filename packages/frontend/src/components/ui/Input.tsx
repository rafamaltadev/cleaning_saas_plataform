import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  // 'public': light theme for public-facing pages (bg-white, text-gray-900)
  // 'default': dark theme for dashboard (bg-surface-alt, text-text-primary)
  // Dark theme future spec: bg-gray-800 max, text-gray-200 min, border-gray-600
  variant?: 'default' | 'public';
}

export default function Input({ label, error, className = '', id, variant = 'default', ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const isPublic = variant === 'public';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          h-10 px-3 rounded border text-sm
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          ${isPublic
            ? 'bg-white text-gray-900 placeholder:text-gray-500'
            : 'bg-surface-alt text-text-primary placeholder:text-text-muted'
          }
          ${error ? 'border-error' : isPublic ? 'border-gray-300' : 'border-border'}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
