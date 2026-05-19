import type { QuoteEstimateResponse } from '../../api/publicQuote';
import type { PublicService } from '../../api/publicTenant';

interface QuoteSummaryPanelProps {
  service: PublicService | null;
  estimate: QuoteEstimateResponse | null;
  loading: boolean;
  primaryColor: string;
  onContinue: () => void;
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function QuoteSummaryPanel({
  service,
  estimate,
  loading,
  primaryColor,
  onContinue,
}: QuoteSummaryPanelProps) {
  const currency = estimate?.currency || 'BRL';

  return (
    <>
      {/* Desktop sticky panel — renders inside the grid second column */}
      <div className="hidden lg:block lg:sticky lg:top-4 self-start">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-base mb-4">Resumo do Orçamento</h3>

          {!service ? (
            <p className="text-gray-400 text-sm">Selecione um serviço para ver o resumo.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm gap-2">
                <span className="text-gray-500 shrink-0">Serviço</span>
                <span className="font-medium text-gray-900 text-right">{service.name}</span>
              </div>

              {loading && !estimate && (
                <p className="text-gray-400 text-xs">Calculando...</p>
              )}

              {estimate && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">
                      {formatCents(estimate.subtotal_cents, currency)}
                    </span>
                  </div>

                  {estimate.addon_total_cents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Adicionais</span>
                      <span className="text-gray-900">
                        {formatCents(estimate.addon_total_cents, currency)}
                      </span>
                    </div>
                  )}

                  {estimate.discount_amount_cents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Desconto</span>
                      <span className="text-green-600">
                        -{formatCents(estimate.discount_amount_cents, currency)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900 text-sm">Total estimado</span>
                    <span
                      className="font-bold text-lg"
                      data-testid="desktop-total"
                      style={{ color: primaryColor }}
                    >
                      {loading ? '…' : formatCents(estimate.estimated_total_cents, currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onContinue}
            className="mt-5 w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: primaryColor }}
          >
            Continuar para cadastro
          </button>
        </div>
      </div>

      {/* Mobile bottom fixed action bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20 flex items-center gap-3"
        data-testid="mobile-action-bar"
      >
        <div className="flex-1 min-w-0">
          {estimate ? (
            <div>
              <p className="text-xs text-gray-500 leading-none mb-0.5">Total estimado</p>
              <p
                className="font-bold text-base leading-none"
                data-testid="mobile-total"
                style={{ color: primaryColor }}
              >
                {loading ? '…' : formatCents(estimate.estimated_total_cents, currency)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 truncate">
              {service ? 'Calculando...' : 'Selecione um serviço'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="shrink-0 px-5 h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2"
          style={{ backgroundColor: primaryColor }}
        >
          Continuar
        </button>
      </div>
    </>
  );
}
