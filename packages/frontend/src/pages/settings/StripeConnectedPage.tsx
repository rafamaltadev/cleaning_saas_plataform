import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnectStatus } from '../../api/billingConnect';
import type { ConnectStatus } from '../../api/billingConnect';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function StripeConnectedPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getConnectStatus()
      .then(setStatus)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Error fetching status: ${msg}`);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Loading your Stripe status...</p>
      </div>
    );
  }

  const isActive = status?.stripe_connect_charges_enabled && status?.stripe_connect_payouts_enabled;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        {isActive ? (
          <>
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#10003;</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Stripe Connected!</h1>
            <p className="text-text-secondary mt-2">
              Your account is active and ready to accept payments.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-warning">!</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Setup In Progress</h1>
            <p className="text-text-secondary mt-2">
              Your Stripe account needs more information to be fully activated.
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded text-sm text-error mb-4" role="alert">
          {error}
        </div>
      )}

      {status && (
        <Card className="mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Account status</span>
              <Badge variant={status.stripe_connect_status === 'active' ? 'success' : 'warning'}>
                {status.stripe_connect_status ?? 'pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Charges enabled</span>
              <Badge variant={status.stripe_connect_charges_enabled ? 'success' : 'warning'}>
                {status.stripe_connect_charges_enabled ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Payouts enabled</span>
              <Badge variant={status.stripe_connect_payouts_enabled ? 'success' : 'warning'}>
                {status.stripe_connect_payouts_enabled ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => navigate('/settings?tab=payments')}
        >
          Go to Payment Settings
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => navigate('/settings')}
        >
          Back to Settings
        </Button>
      </div>
    </div>
  );
}
