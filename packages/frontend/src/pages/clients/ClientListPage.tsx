import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { getClients } from '../../api/clients';
import type { Client } from '../../types';

const PAGE_SIZE = 10;

export default function ClientListPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getClients({ page, limit: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined });
      setClients(result.data);
      setTotal(result.total);
    } catch {
      setError('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
        <Button onClick={() => navigate('/clients/new')}>+ Novo Cliente</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="sm:max-w-xs"
          aria-label="Search clients"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by status"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full" aria-label="Clients table">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">E-mail</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Carregando…</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum cliente encontrado.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{client.email}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{client.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={client.status === 'active' ? 'success' : 'neutral'}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/clients/${client.id}/edit`)}
                    >
                      Editar
                    </Button>
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
        ) : clients.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Nenhum cliente encontrado.</p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{client.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{client.email}</p>
                  {client.phone && <p className="text-xs text-text-secondary">{client.phone}</p>}
                </div>
                <Badge variant={client.status === 'active' ? 'success' : 'neutral'}>
                  {client.status}
                </Badge>
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                  Editar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-secondary">
            Página {page} de {totalPages} — {total} no total
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Página anterior"
            >
              ← Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Próxima página"
            >
              Próximo →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
