import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg p-4 ${className}`}
    >
      {title && (
        <h3 className="text-md font-semibold text-text-primary mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}
