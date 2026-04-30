import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import AddressForm from './AddressForm';
import { getClient, updateClient } from '../../api/clients';
import type { Address } from '../../types';

interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
}

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<Partial<Address>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoadingData(true);
    getClient(id)
      .then((client) => {
        setName(client.name);
        setEmail(client.email);
        setPhone(client.phone ?? '');
        if (client.addresses?.[0]) {
          setAddress(client.addresses[0]);
        }
      })
      .catch(() => setErrors({ general: 'Failed to load client.' }))
      .finally(() => setLoadingData(false));
  }, [id]);

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
    if (!validate() || !id) return;

    setLoading(true);
    try {
      await updateClient(id, {
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
      setErrors({ general: 'Failed to update client. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Loading client data…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Edit Client</h1>
        <p className="text-text-secondary text-sm mt-1">Update client information</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Edit client form">
        <Card title="Client Details">
          <div className="space-y-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
          <Button type="submit" loading={loading}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/clients')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
