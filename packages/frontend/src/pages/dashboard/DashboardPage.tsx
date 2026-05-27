import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Globe } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listBookings } from '../../api/bookings';
import { listQuotes } from '../../api/quotes';
import { getNotifications } from '../../api/notifications';
import { getTenant } from '../../api/tenants';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import type { RootState } from '../../store';
import type { ApiNotification, Tenant } from '../../types';

interface KpiData {
  confirmedBookings: number;
  openQuotes: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const flags = useFeatureFlags();

  const [kpi, setKpi] = useState<KpiData>({ confirmedBookings: 0, openQuotes: 0 });
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingNotif, setLoadingNotif] = useState(true);

  useEffect(() => {
    Promise.all([
      listBookings({ page: 1, limit: 1, status: 'confirmed' }),
      listQuotes({ page: 1, limit: 1, status: 'draft' }),
      listQuotes({ page: 1, limit: 1, status: 'sent' }),
      getTenant().catch(() => null),
    ])
      .then(([confirmedRes, draftRes, sentRes, tenantRes]) => {
        setKpi({
          confirmedBookings: confirmedRes.meta.total,
          openQuotes: draftRes.meta.total + sentRes.meta.total,
        });
        if (tenantRes) setTenant(tenantRes);
      })
      .finally(() => setLoadingKpi(false));
  }, []);

  useEffect(() => {
    getNotifications({ limit: 5 })
      .then(setNotifications)
      .finally(() => setLoadingNotif(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Painel</h1>
        {user && (
          <p className="text-text-secondary text-sm mt-1">
            Bem-vindo(a) de volta, <span className="text-text-primary font-medium">{user.name}</span>
          </p>
        )}
      </div>

      {/* Public page banner */}
      {tenant?.tenant_slug && (
        <div className="flex items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Sua página pública está no ar</p>
              <p className="text-xs text-text-muted truncate">/t/{tenant.tenant_slug}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(`/t/${tenant.tenant_slug}`, '_blank')}
          >
            Ver página pública
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Agendamentos Confirmados</span>
            {loadingKpi ? (
              <span className="text-text-muted text-sm">Carregando…</span>
            ) : (
              <span className="text-3xl font-bold text-success" data-testid="kpi-confirmed-bookings">
                {kpi.confirmedBookings}
              </span>
            )}
            <Button variant="ghost" size="sm" className="self-start mt-1 -ml-2" onClick={() => navigate('/bookings')}>
              Ver agendamentos →
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Orçamentos em Aberto</span>
            {loadingKpi ? (
              <span className="text-text-muted text-sm">Carregando…</span>
            ) : (
              <span className="text-3xl font-bold text-warning" data-testid="kpi-open-quotes">
                {kpi.openQuotes}
              </span>
            )}
            <Button variant="ghost" size="sm" className="self-start mt-1 -ml-2" onClick={() => navigate('/quotes')}>
              Ver orçamentos →
            </Button>
          </div>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Ações Rápidas</span>
            <div className="flex flex-col gap-2 mt-2">
              <Button size="sm" onClick={() => navigate('/quotes/new')}>Novo Orçamento</Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/bookings/new')}>Novo Agendamento</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications widget — feature-gated */}
      {flags['notifications_enabled'] && (
        <div data-testid="notifications-widget">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Notificações Recentes</h2>
          {loadingNotif ? (
            <p className="text-text-muted text-sm">Carregando…</p>
          ) : notifications.length === 0 ? (
            <p className="text-text-muted text-sm">Nenhuma notificação ainda.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card key={n.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={n.status === 'sent' ? 'success' : n.status === 'failed' ? 'error' : 'neutral'}>
                        {n.status}
                      </Badge>
                      <span className="text-xs text-text-muted">{n.type}</span>
                    </div>
                    <p className="text-sm text-text-primary">{n.template}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
