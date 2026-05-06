import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { getClient, updateClient } from '../../api/clients';

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
      navigate('/clients');
    } catch {
      setErrors({ general: 'Erro ao atualizar cliente. Tente novamente.' });
    } finally {
      setLoading(false);
    }
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
