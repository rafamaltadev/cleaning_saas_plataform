import { useState, useEffect, type FormEvent } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getTenant, updateTenant, getServices } from '../../api/tenants';
import type { Tenant, BusinessHours, Service } from '../../types';

type Tab = 'profile' | 'hours' | 'services' | 'payment';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Company Profile' },
  { id: 'hours', label: 'Business Hours' },
  { id: 'services', label: 'Services & Pricing' },
  { id: 'payment', label: 'Payment' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = (typeof DAYS)[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:w-48 shrink-0" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'hours' && <BusinessHoursSection />}
          {activeTab === 'services' && <ServicesSection />}
          {activeTab === 'payment' && <PaymentSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTenant()
      .then((t) => {
        setTenant(t);
        setName(t.name);
        setEmail(t.email);
        setTimezone(t.timezone);
        setCurrency(t.currency);
      })
      .catch(() => setError('Failed to load company profile.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setError('');
    try {
      await updateTenant({ name, email, timezone, currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Loading…</p>;

  return (
    <Card title="Company Profile">
      <form onSubmit={handleSave} className="space-y-3" aria-label="Company profile form">
        <Input
          label="Company Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="America/New_York"
        />
        <Input
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          placeholder="USD"
        />

        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        {saved && <p className="text-sm text-success">Changes saved!</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}

function BusinessHoursSection() {
  const [hours, setHours] = useState<BusinessHours>(
    Object.fromEntries(
      DAYS.map((d) => [d, { open: '09:00', close: '17:00', closed: false }])
    ) as BusinessHours
  );

  function updateDay(day: Day, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  return (
    <Card title="Business Hours">
      <div className="space-y-2">
        {DAYS.map((day) => {
          const dayHours = hours[day];
          return (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-border last:border-0">
              <span className="w-28 text-sm font-medium text-text-primary capitalize">{day}</span>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={dayHours?.closed ?? false}
                  onChange={(e) => updateDay(day, 'closed', e.target.checked)}
                  className="rounded border-border"
                />
                Closed
              </label>
              {!dayHours?.closed && (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={dayHours?.open ?? '09:00'}
                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                    className="h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-text-muted">–</span>
                  <input
                    type="time"
                    value={dayHours?.close ?? '17:00'}
                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                    className="h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <Button type="button">Save Hours</Button>
      </div>
    </Card>
  );
}

function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('Failed to load services.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted text-sm">Loading…</p>;
  if (error) return <p className="text-error text-sm">{error}</p>;

  return (
    <Card title="Services & Pricing">
      <p className="text-xs text-text-secondary mb-4">
        Services are managed in the Services module. This is a read-only view.
      </p>
      {services.length === 0 ? (
        <p className="text-text-muted text-sm">No services configured.</p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-text-secondary">{service.description}</p>
                )}
              </div>
              <Badge variant="neutral">${service.baseRate.toFixed(2)}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PaymentSection() {
  return (
    <Card title="Payment Integration">
      <div className="flex flex-col items-center justify-center py-10 text-center" aria-label="Stripe placeholder">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4">
          <span className="text-3xl">💳</span>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Stripe Integration</h3>
        <p className="text-text-secondary text-sm mb-6 max-w-sm">
          Connect your Stripe account to accept online payments from clients.
          This feature is coming soon.
        </p>
        <Button variant="secondary" disabled>
          Coming Soon
        </Button>
      </div>
    </Card>
  );
}
