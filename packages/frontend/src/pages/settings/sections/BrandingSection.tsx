import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Globe } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { getTenant, updateTenant, uploadLogo, uploadFavicon } from '../../../api/tenants';
import type { Tenant } from '../../../types';

const ALLOWED_MIMES = ['image/png', 'image/jpeg'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function BrandingSection() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const isSubmittingRef = useRef(false);

  // Primary color — initialized as empty string (never undefined) to keep input controlled
  const primaryColorRef = useRef('');
  const [primaryColor, setPrimaryColor] = useState('');

  // File preview state — null means no preview; always a string or null, never undefined
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState('');

  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [faviconMessage, setFaviconMessage] = useState('');

  useEffect(() => {
    getTenant()
      .then((t) => {
        setTenant(t);

        // Populate all form fields from the API response on mount
        const color = t.primary_color ?? '';
        setPrimaryColor(color);
        primaryColorRef.current = color;

        // Always set previews from backend (null if not present)
        setLogoPreview(t.logo_url ?? null);
        setFaviconPreview(t.favicon_url ?? null);
      })
      .catch(() => setError('Erro ao carregar dados da empresa.'))
      .finally(() => setLoading(false));
  }, []);

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIMES.includes(file.type)) return 'Apenas imagens PNG e JPEG são permitidas.';
    if (file.size > MAX_SIZE) return 'O arquivo deve ter no máximo 2MB.';
    return null;
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setLogoMessage(err); return; }
    setLogoFile(file);
    setLogoMessage('');
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFaviconChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFaviconMessage(err); return; }
    setFaviconFile(file);
    setFaviconMessage('');
    const reader = new FileReader();
    reader.onload = (ev) => setFaviconPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUploadLogo() {
    if (!logoFile || logoUploading) return;
    setLogoUploading(true);
    setLogoMessage('');
    try {
      const result = await uploadLogo(logoFile);
      // Update preview with the server URL so reload shows the same image
      setLogoPreview(result.logo_url);
      setTenant((prev) => prev ? { ...prev, logo_url: result.logo_url } : prev);
      setLogoMessage('Logo enviado com sucesso!');
    } catch {
      setLogoMessage('Erro ao enviar logo. Tente novamente.');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleUploadFavicon() {
    if (!faviconFile || faviconUploading) return;
    setFaviconUploading(true);
    setFaviconMessage('');
    try {
      const result = await uploadFavicon(faviconFile);
      // Update preview with the server URL so reload shows the same image
      setFaviconPreview(result.favicon_url);
      setTenant((prev) => prev ? { ...prev, favicon_url: result.favicon_url } : prev);
      setFaviconMessage('Favicon enviado com sucesso!');
    } catch {
      setFaviconMessage('Erro ao enviar favicon. Tente novamente.');
    } finally {
      setFaviconUploading(false);
    }
  }

  function handleColorChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    primaryColorRef.current = val;
    setPrimaryColor(val);
  }

  function handleHexInput(e: ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    if (val && !val.startsWith('#')) val = '#' + val;
    primaryColorRef.current = val;
    setPrimaryColor(val);
  }

  async function handleSubmit() {
    if (isSubmittingRef.current) return;
    const color = primaryColorRef.current || primaryColor;
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      setError('Cor primária deve estar no formato #RRGGBB.');
      return;
    }
    isSubmittingRef.current = true;
    setError('');
    setSaved(false);
    try {
      const updated = await updateTenant({ primary_color: color || undefined });
      // Sync form state with what the server confirmed, so reload shows the saved value
      const savedColor = updated.primary_color ?? '';
      setPrimaryColor(savedColor);
      primaryColorRef.current = savedColor;
      setTenant((prev) => prev ? { ...prev, ...updated } : updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro genérico. Tente novamente.');
      setError(detail);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function handleCopySlug() {
    if (tenant?.tenant_slug) {
      await navigator.clipboard.writeText(tenant.tenant_slug);
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;

  const previewColor = primaryColorRef.current || primaryColor || '#4F46E5';
  const validPreviewColor = /^#[0-9a-fA-F]{6}$/.test(previewColor) ? previewColor : '#4F46E5';
  const hasSocialLinks = tenant?.social_links
    ? Object.values(tenant.social_links).some(Boolean)
    : false;
  const hasContact = !!(tenant?.phone || tenant?.public_address || hasSocialLinks);

  return (
    <div className="space-y-6">
      {tenant?.tenant_slug && (
        <div className="flex items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3 min-w-0">
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Página pública da empresa</p>
              <p className="text-xs text-text-muted truncate">/t/{tenant.tenant_slug}</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => window.open(`/t/${tenant.tenant_slug}`, '_blank')}
          >
            Ver página pública
          </Button>
        </div>
      )}

      <Card title="Identidade da empresa">
        <form aria-label="Identidade Visual" className="space-y-5">
          {error && (
            <p className="text-sm text-error bg-error/10 px-3 py-2 rounded" role="alert">
              {error}
            </p>
          )}

          {/* Tenant slug — read-only */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Slug da empresa</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={tenant?.tenant_slug ?? ''}
                className="flex-1 h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-secondary text-sm focus:outline-none"
                aria-label="Tenant slug"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={handleCopySlug}
                aria-label="Copiar slug"
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-1">URL pública da sua empresa</p>
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Logo</label>
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="mb-2 h-16 w-auto rounded object-contain bg-surface-alt border border-border p-1"
              />
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1">
                <span className="sr-only">Selecionar logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-text-secondary file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-surface-alt file:text-text-primary hover:file:bg-border cursor-pointer min-h-[44px]"
                  aria-label="Selecionar arquivo de logo"
                />
              </label>
              {logoFile && (
                <Button
                  type="button"
                  loading={logoUploading}
                  onClick={handleUploadLogo}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Enviar logo
                </Button>
              )}
            </div>
            {logoMessage && (
              <p className={`text-xs mt-1 ${logoMessage.includes('sucesso') ? 'text-success' : 'text-error'}`}>
                {logoMessage}
              </p>
            )}
          </div>

          {/* Favicon upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Favicon</label>
            {faviconPreview && (
              <img
                src={faviconPreview}
                alt="Favicon preview"
                className="mb-2 h-8 w-8 rounded object-contain bg-surface-alt border border-border p-1"
              />
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1">
                <span className="sr-only">Selecionar favicon</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFaviconChange}
                  className="block w-full text-sm text-text-secondary file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-surface-alt file:text-text-primary hover:file:bg-border cursor-pointer min-h-[44px]"
                  aria-label="Selecionar arquivo de favicon"
                />
              </label>
              {faviconFile && (
                <Button
                  type="button"
                  loading={faviconUploading}
                  onClick={handleUploadFavicon}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Enviar favicon
                </Button>
              )}
            </div>
            {faviconMessage && (
              <p className={`text-xs mt-1 ${faviconMessage.includes('sucesso') ? 'text-success' : 'text-error'}`}>
                {faviconMessage}
              </p>
            )}
          </div>

          {/* Primary color */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Cor primária</label>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="color"
                value={primaryColor || '#4F46E5'}
                onChange={handleColorChange}
                className="h-10 w-16 rounded border border-border bg-surface-alt cursor-pointer min-h-[44px]"
                aria-label="Seletor de cor primária"
              />
              <Input
                label=""
                type="text"
                value={primaryColor ?? ''}
                onChange={handleHexInput}
                placeholder="#4F46E5"
                aria-label="Código hex da cor primária"
              />
            </div>
            <p className="text-xs text-text-muted mt-1">Formato: #RRGGBB</p>
          </div>

          {saved && <p className="text-sm text-success">Alterações salvas!</p>}

          <div className="pt-1">
            <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto min-h-[44px]">
              Salvar Identidade Visual
            </Button>
          </div>
        </form>
      </Card>

      {/* Preview card */}
      <Card title="Pré-visualização">
        <div className="overflow-hidden rounded-lg border border-border" style={{ height: '340px' }}>
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%', pointerEvents: 'none', userSelect: 'none' }}>

            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {logoPreview ? (
                <img src={logoPreview} alt="" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: validPreviewColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 }}>
                  {tenant?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <span style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>{tenant?.name ?? 'Nome da empresa'}</span>
            </div>

            {/* Hero */}
            <div style={{ background: '#f9fafb', padding: '36px 20px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: validPreviewColor, marginBottom: '12px', lineHeight: 1.2 }}>
                {tenant?.name ?? 'Nome da empresa'}
              </h1>
              {tenant?.description && (
                <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px', maxWidth: '500px', lineHeight: 1.6 }}>
                  {tenant.description}
                </p>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', height: '44px', padding: '0 24px', borderRadius: '8px', background: validPreviewColor, color: 'white', fontWeight: 600, fontSize: '14px' }}>
                Solicitar Orçamento
              </div>
            </div>

            {/* Services placeholder */}
            <div style={{ padding: '28px 20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>Nossos Serviços</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', background: 'white' }}>
                    <div style={{ width: '65%', height: '12px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '45%', height: '10px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '30%', height: '10px', background: '#e5e7eb', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div style={{ padding: '28px 20px', background: '#f9fafb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>Contato</h2>
              {hasContact ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tenant?.phone && (
                    <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📞</span>{tenant.phone}
                    </span>
                  )}
                  {tenant?.public_address && (
                    <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📍</span>{tenant.public_address}
                    </span>
                  )}
                  {tenant?.social_links?.instagram && (
                    <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📸</span>Instagram
                    </span>
                  )}
                  {tenant?.social_links?.whatsapp && (
                    <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💬</span>WhatsApp
                    </span>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>Informações de contato não configuradas</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', textAlign: 'center', borderTop: '1px solid #e5e7eb', background: 'white' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                © {new Date().getFullYear()} {tenant?.name ?? 'Nome da empresa'}. Todos os direitos reservados.
              </span>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
}
