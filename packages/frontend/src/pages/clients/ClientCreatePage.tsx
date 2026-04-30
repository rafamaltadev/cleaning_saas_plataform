import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import AddressForm from './AddressForm';
import { createClient } from '../../api/clients';
import type { Address } from '../../types';

interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
}

export default function ClientCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<Partial<Address>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await createClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        address: address.street ? {
          street: address.street,
          city: address.city ?? '',
          state: address.state ?? '',
          zipCode: address.zipCode ?? '',
          country: address.country ?? '',
        } : undefined,
      });
      navigate('/clients');
    } catch {
      setErrors({ general: 'Failed to create client. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">New Client</h1>
        <p className="text-text-secondary text-sm mt-1">Add a new client to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Create client form">
        <Card title="Client Details">
          <div className="space-y-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Jane Doe"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="jane@example.com"
              required
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>
        </Card>

        <Card>
          <AddressForm value={address} onChange={setAddress} />
        </Card>

        {errors.general && (
          <p className="text-sm text-error" role="alert">{errors.general}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Client</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/clients')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
