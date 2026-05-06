import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import AddressForm from './AddressForm';
import { createClient, createAddress } from '../../api/clients';
import type { Address } from '../../types';
import type { AxiosError } from 'axios';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
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
    if (!name.trim()) next.name = 'Nome é obrigatório';
    if (!email.trim()) next.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Insira um e-mail válido';
    if (!phone.trim()) next.phone = 'Telefone é obrigatório';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const client = await createClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferred_language: 'pt-BR',
      });

      const hasAddress = !!(address.street || address.city || address.state || address.zipCode || address.country);
      if (hasAddress) {
        await createAddress({
          client_id: client.id,
          street: address.street ?? '',
          city: address.city ?? '',
          state: address.state ?? '',
          postal_code: address.zipCode ?? '',
          country: address.country ?? '',
        });
      }

      navigate('/clients');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosErr.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar cliente. Tente novamente.');
      setErrors({ general: detail });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Novo Cliente</h1>
        <p className="text-text-secondary text-sm mt-1">Adicione um novo cliente à sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Criar cliente">
        <Card title="Dados do Cliente">
          <div className="space-y-3">
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Maria Silva"
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="maria@exemplo.com"
              required
            />
            <Input
              label="Telefone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              placeholder="+55 11 99999-0000"
              required
            />
          </div>
        </Card>

        <Card title="Endereço">
          <AddressForm value={address} onChange={setAddress} />
        </Card>

        {errors.general && (
          <p className="text-sm text-error" role="alert">{errors.general}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Criar Cliente</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/clients')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
