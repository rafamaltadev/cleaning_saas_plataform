import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { getServices } from '../../api/tenants';
import { deleteService } from '../../api/services';
import type { Service } from '../../types';

function formatBaseRate(service: Service): string {
  const cents = service.base_rate_cents ?? Math.round(service.baseRate * 100);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100) + '/m²';
}

export default function ServiceListPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getServices();
      setServices(data);
    } catch {
      setError('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  async function handleDelete(service: Service) {
    if (!window.confirm(`Excluir o serviço "${service.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteService(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } catch {
      setError('Erro ao excluir serviço. Tente novamente.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Serviços</h1>
        <Button onClick={() => navigate('/services/new')}>+ Novo Serviço</Button>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full" aria-label="Tabela de serviços">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Valor base</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">Carregando…</td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum serviço cadastrado.</td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">{service.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{service.description ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-primary">{formatBaseRate(service)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDelete(service)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <p className="text-center text-text-muted text-sm py-8">Carregando…</p>
        ) : services.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Nenhum serviço cadastrado.</p>
        ) : (
          services.map((service) => (
            <div key={service.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="mb-2">
                <p className="text-sm font-medium text-text-primary">{service.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{service.description ?? '—'}</p>
                <p className="text-xs text-text-primary mt-1 font-medium">{formatBaseRate(service)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/services/${service.id}/edit`)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => void handleDelete(service)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
