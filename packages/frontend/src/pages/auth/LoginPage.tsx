import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { login } from '../../api/auth';
import { setCredentials } from '../../store/slices/authSlice';
import { REFRESH_TOKEN_KEY } from '../../api/client';
import type { User, UserRole } from '../../types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { accessToken, refreshToken } = await login(email, password);
      const [, payloadB64] = accessToken.split('.');
      const payload = JSON.parse(atob(payloadB64)) as { sub: string; tenantId: string; roles: string[] };
      const user: User = {
        id: payload.sub,
        email,
        name: '',
        role: (payload.roles?.[0] ?? 'staff') as UserRole,
        tenantId: payload.tenantId,
      };
      dispatch(setCredentials({ user, accessToken }));
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      navigate('/kanban', { replace: true });
    } catch {
      setError('E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">CleanSaaS</h1>
          <p className="text-text-secondary text-sm mt-1">Entre na sua conta</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
