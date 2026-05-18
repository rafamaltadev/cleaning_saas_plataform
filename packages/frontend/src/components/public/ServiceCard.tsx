import type { PublicService } from '../../api/publicTenant';

interface Props {
  service: PublicService;
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(cents / 100);
}

const UNIT_LABELS: Record<string, string> = {
  sqm: 'm²',
  hour: 'hora',
  flat: 'fixo',
};

export default function ServiceCard({ service }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      {service.category_name && (
        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
          {service.category_name}
        </span>
      )}
      <h3 className="text-base font-semibold text-gray-900 leading-snug">{service.name}</h3>
      {service.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
      )}
      <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">
          {formatCurrency(service.base_rate_cents, service.currency)}
        </span>
        <span className="text-xs text-gray-500">
          por {UNIT_LABELS[service.unit] ?? service.unit}
        </span>
      </div>
    </div>
  );
}
