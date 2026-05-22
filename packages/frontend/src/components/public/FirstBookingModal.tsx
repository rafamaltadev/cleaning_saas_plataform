import { useEffect } from 'react';

interface FirstBookingModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  primaryColor?: string;
}

export default function FirstBookingModal({
  onConfirm,
  onCancel,
  loading,
  primaryColor,
}: FirstBookingModalProps) {
  const primary = primaryColor ?? '#4F46E5';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-booking-modal-title"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="first-booking-modal"
      >
        <div className="mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primary}20` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: primary }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            id="first-booking-modal-title"
            className="text-lg font-bold text-gray-900 mb-2"
          >
            Aguardando confirmação
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Seu primeiro agendamento será analisado pela empresa antes de ser
            confirmado. Você receberá a confirmação por e-mail em breve.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{ backgroundColor: primary }}
            className="w-full min-h-[44px] rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
          >
            {loading ? 'Enviando…' : 'Entendi, enviar agendamento'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full min-h-[44px] rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
