import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import AddressForm from './AddressForm';
import { getClient, updateClient, createAddress } from '../../api/clients';
import { apiClient } from '../../api/client';
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
  const [addressId, setAddressId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoadingData(true);
    getClient(id)
      .then(async (client) => {
        setName(client.name);
        setEmail(client.email);
        setPhone(client.phone ?? '');

        const existingAddressId = (client as unknown as { address_id?: string | null }).address_id;
        if (existingAddressId) {
          setAddressId(existingAddressId);
          try {
            const { data } = await apiClient.get<{ data: { id: string; street: string; city: string; state: string; postal_code: string; country: string } }>(
              `/addresses/${existingAddressId}`,
            );
            setAddress({
              id: data.data.id,
              street: data.data.street,
              city: data.data.city,
              state: data.data.state,
              zipCode: data.data.postal_code,
              country: data.data.country,
            });
          } catch {
            // address not found, start empty
          }
        }
      })
      .catch(() => setErrors({ general: 'Erro ao carregar cliente.' }))
      .finally(() => setLoadingData(false));
  }, [id]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Nome é obrigatório';
    if (!email.trim()) next.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Insira um e-mail válido';
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
      });
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao atualizar cliente. Tente novamente.');
      setErrors({ general: detail });
      setLoading(false);
      return;
    }

    const hasAddress = !!(address.street || address.city || address.state || address.zipCode || address.country);
    if (hasAddress) {
      const addrPayload = {
        street: address.street || undefined,
        city: address.city || undefined,
        state: address.state || undefined,
        postal_code: address.zipCode || undefined,
        country: address.country || undefined,
      };
      try {
        if (addressId) {
          await apiClient.put(`/addresses/${addressId}`, addrPayload);
        } else {
          await createAddress({ client_id: id, ...addrPayload });
        }
      } catch (err) {
        const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
        const raw = axiosErr.response?.data;
        const msg = raw?.error?.message ?? raw?.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Cliente atualizado, mas erro ao salvar endereço. Tente novamente.');
        setErrors({ general: detail });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate('/clients');
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Carregando dados do cliente…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Editar Cliente</h1>
        <p className="text-text-secondary text-sm mt-1">Atualize as informações do cliente</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Editar cliente">
        <Card title="Dados do Cliente">
          <div className="space-y-3">
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Telefone (opcional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/clients')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
