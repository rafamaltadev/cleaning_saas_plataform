import { useState, useRef } from 'react';
import type { ConnectStatus } from '../../api/billingConnect';
import { getConnectDashboardLink, disconnectStripeAccount } from '../../api/billingConnect';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface StripeConnectStatusCardProps {
  status: ConnectStatus;
  onDisconnected: () => void;
  isBR?: boolean;
}

function getStatusBadgeVariant(status: string | null): 'success' | 'warning' | 'error' | 'neutral' {
  if (!status) return 'neutral';
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  return 'error';
}

function getStatusLabel(status: string | null, isBR: boolean): string {
  if (!status) return isBR ? 'Não configurado' : 'Not configured';
  if (status === 'active') return isBR ? 'Ativo' : 'Active';
  if (status === 'pending') return isBR ? 'Pendente' : 'Pending';
  return status;
}

export default function StripeConnectStatusCard({ status, onDisconnected, isBR = false }: StripeConnectStatusCardProps) {
  const [dashboardError, setDashboardError] = useState('');
  const [disconnectError, setDisconnectError] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const dashboardRef = useRef(false);
  const disconnectRef = useRef(false);

  async function handleOpenDashboard() {
    if (dashboardRef.current) return;
    dashboardRef.current = true;
    setLoadingDashboard(true);
    setDashboardError('');

    try {
      const { url } = await getConnectDashboardLink();
      // Securely open in new tab — never store in localStorage
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDashboardError(isBR ? `Erro ao abrir painel: ${msg}` : `Error opening dashboard: ${msg}`);
    } finally {
      setLoadingDashboard(false);
      dashboardRef.current = false;
    }
  }

  async function handleDisconnect() {
    if (disconnectRef.current) return;
    const confirmed = window.confirm(
      isBR
        ? 'Tem certeza que deseja desconectar sua conta Stripe? Esta ação não pode ser desfeita.'
        : 'Are you sure you want to disconnect your Stripe account? This cannot be undone.',
    );
    if (!confirmed) return;

    disconnectRef.current = true;
    setLoadingDisconnect(true);
    setDisconnectError('');

    try {
      await disconnectStripeAccount();
      onDisconnected();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDisconnectError(isBR ? `Erro ao desconectar: ${msg}` : `Error disconnecting: ${msg}`);
    } finally {
      setLoadingDisconnect(false);
      disconnectRef.current = false;
    }
  }

  return (
    <Card title={isBR ? 'Status da Conta Stripe Connect' : 'Stripe Connect Account Status'}>
      {(dashboardError || disconnectError) && (
        <div className="p-3 bg-error/10 border border-error/20 rounded text-sm text-error mb-4" role="alert">
          {dashboardError || disconnectError}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {isBR ? 'Status' : 'Status'}
          </span>
          <Badge variant={getStatusBadgeVariant(status.stripe_connect_status)}>
            {getStatusLabel(status.stripe_connect_status, isBR)}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {isBR ? 'Aceita cobranças' : 'Charges enabled'}
          </span>
          <Badge variant={status.stripe_connect_charges_enabled ? 'success' : 'warning'}>
            {status.stripe_connect_charges_enabled
              ? (isBR ? 'Sim' : 'Yes')
              : (isBR ? 'Não' : 'No')}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {isBR ? 'Repasses habilitados' : 'Payouts enabled'}
          </span>
          <Badge variant={status.stripe_connect_payouts_enabled ? 'success' : 'warning'}>
            {status.stripe_connect_payouts_enabled
              ? (isBR ? 'Sim' : 'Yes')
              : (isBR ? 'Não' : 'No')}
          </Badge>
        </div>

        {status.stripe_connect_status === 'pending' && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded">
            <p className="text-xs text-warning">
              {isBR
                ? 'Sua conta está pendente. Complete o onboarding no painel Stripe.'
                : 'Your account is pending. Complete onboarding in the Stripe dashboard.'}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleOpenDashboard}
          loading={loadingDashboard}
        >
          {isBR ? 'Abrir Painel Stripe' : 'Open Stripe Dashboard'}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDisconnect}
          loading={loadingDisconnect}
        >
          {isBR ? 'Desconectar Conta' : 'Disconnect Account'}
        </Button>
      </div>
    </Card>
  );
}
