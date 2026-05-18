import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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

  // Form fields
  const primaryColorRef = useRef('');
  const [primaryColor, setPrimaryColor] = useState('');

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState('');

  // Favicon upload state
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [faviconMessage, setFaviconMessage] = useState('');

  useEffect(() => {
    getTenant()
      .then((t) => {
        setTenant(t);
        const color = t.primary_color ?? '#4F46E5';
        setPrimaryColor(color);
        primaryColorRef.current = color;
        if (t.logo_url) setLogoPreview(t.logo_url);
        if (t.favicon_url) setFaviconPreview(t.favicon_url);
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

  return (
    <div className="space-y-6">
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
                value={primaryColor}
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
        <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo da empresa"
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted text-2xl font-bold">
              {tenant?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <p
            className="text-xl font-semibold"
            style={{ color: /^#[0-9a-fA-F]{6}$/.test(previewColor) ? previewColor : '#4F46E5' }}
          >
            {tenant?.name ?? 'Nome da empresa'}
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-white text-sm font-medium min-h-[44px] transition-opacity hover:opacity-90"
            style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(previewColor) ? previewColor : '#4F46E5' }}
          >
            Solicitar orçamento
          </button>
        </div>
      </Card>
    </div>
  );
}
