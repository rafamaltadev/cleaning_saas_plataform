import type { PublicService } from '../../api/publicTenant';

interface ServiceSelectorProps {
  services: PublicService[];
  selectedId: string;
  onSelect: (id: string) => void;
  primaryColor: string;
}

function formatServiceRate(service: PublicService): string {
  const amount = (service.base_rate_cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currency = service.currency || 'BRL';
  const unit = service.unit === 'sqm' ? '/m²' : service.unit === 'hour' ? '/h' : '';
  return `${currency} ${amount}${unit}`;
}

export default function ServiceSelector({
  services,
  selectedId,
  onSelect,
  primaryColor,
}: ServiceSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {services.map((service) => {
        const isSelected = service.id === selectedId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            aria-pressed={isSelected}
            className={`text-left p-4 rounded-xl border-2 transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSelected ? 'shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
            style={
              isSelected
                ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                : undefined
            }
          >
            <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-2">
                {service.description}
              </p>
            )}
            <p className="text-xs font-semibold" style={{ color: primaryColor }}>
              {formatServiceRate(service)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
