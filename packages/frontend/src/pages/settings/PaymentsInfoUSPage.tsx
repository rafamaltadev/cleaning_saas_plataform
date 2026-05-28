import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PaymentsInfoUSPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors mb-4 flex items-center gap-1"
        >
          &larr; Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Payments with Stripe</h1>
        <p className="text-text-secondary mt-1">
          Connect your Stripe account to accept payments directly from your customers.
        </p>
      </div>

      <div className="space-y-4">
        <Card title="How it works">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Accept the terms</p>
                <p className="text-xs text-text-muted">Review and accept our payment service terms.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Create your Stripe account</p>
                <p className="text-xs text-text-muted">You'll be redirected to Stripe to create or connect your Express account.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Start receiving payments</p>
                <p className="text-xs text-text-muted">Your clients can pay by card or ACH directly from their bookings.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Transparent Fees">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Platform fee</span>
              <span className="text-sm font-semibold text-primary">1% per transaction</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Stripe — Credit card</span>
              <span className="text-sm font-semibold text-text-primary">2.9%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Stripe — ACH Transfer</span>
              <span className="text-sm font-semibold text-text-primary">0.8%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Example: $100 by card</span>
              <span className="text-sm font-semibold text-success">$96.10 net</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            * Fees are charged on the gross amount of each transaction. Payouts follow Stripe's payout schedule.
          </p>
        </Card>

        <Card title="Requirements">
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              Valid SSN or EIN
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              US bank account
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              Verified email address
            </li>
          </ul>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/settings?tab=payments')}
          >
            Set Up Payments
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => navigate('/settings')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
