import { useEffect, useRef, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { getTenant, updateTenant } from '../../../api/tenants';

export default function CompanyProfileSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const isSubmittingRef = useRef(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [publicAddress, setPublicAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    getTenant()
      .then((t) => {
        setName(t.name ?? '');
        setDescription((t as unknown as { description?: string }).description ?? '');
        setPhone((t as unknown as { phone?: string }).phone ?? '');
        setPublicAddress((t as unknown as { public_address?: string }).public_address ?? '');
        setGoogleMapsUrl((t as unknown as { google_maps_embed_url?: string }).google_maps_embed_url ?? '');
        const links = (t as unknown as { social_links?: { instagram?: string; facebook?: string; whatsapp?: string; website?: string } }).social_links;
        setInstagram(links?.instagram ?? '');
        setFacebook(links?.facebook ?? '');
        setWhatsapp(links?.whatsapp ?? '');
        setWebsite(links?.website ?? '');
      })
      .catch(() => setError('Erro ao carregar perfil da empresa.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (isSubmittingRef.current) return;

    if (!name.trim()) {
      setError('Nome da empresa é obrigatório.');
      return;
    }

    let normalizedMapsUrl = googleMapsUrl.trim();
    if (normalizedMapsUrl) {
      // If the user pasted the full <iframe ...> HTML, extract the src attribute value
      if (normalizedMapsUrl.includes('<iframe')) {
        const match = /src=["']([^"']+)["']/.exec(normalizedMapsUrl);
        normalizedMapsUrl = match ? match[1] : '';
      }
      // Truncate at first quote or whitespace in case of trailing HTML junk
      const junkMatch = /["'\s]/.exec(normalizedMapsUrl);
      if (junkMatch) normalizedMapsUrl = normalizedMapsUrl.slice(0, junkMatch.index);
    }

    if (normalizedMapsUrl && !/^https:\/\/(www\.)?google\.com\/maps\/embed/.test(normalizedMapsUrl)) {
      setError('URL do Google Maps deve começar com https://www.google.com/maps/embed');
      return;
    }

    isSubmittingRef.current = true;
    setError('');
    setSaved(false);

    try {
      const socialLinks = {
        ...(instagram ? { instagram } : {}),
        ...(facebook ? { facebook } : {}),
        ...(whatsapp ? { whatsapp } : {}),
        ...(website ? { website } : {}),
      };

      await updateTenant({
        name,
        ...(description !== undefined ? { description } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(publicAddress !== undefined ? { public_address: publicAddress } : {}),
        ...(normalizedMapsUrl !== undefined ? { google_maps_embed_url: normalizedMapsUrl || undefined } : {}),
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      } as Parameters<typeof updateTenant>[0]);

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

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;

  return (
    <div className="space-y-6">
      <Card title="Perfil da Empresa">
        <form aria-label="Perfil da empresa" className="space-y-4">
          {error && (
            <p className="text-sm text-error bg-error/10 px-3 py-2 rounded" role="alert">
              {error}
            </p>
          )}

          <Input
            label="Nome da Empresa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Descreva sua empresa para os clientes…"
              className="w-full px-3 py-2 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              aria-label="Descrição da empresa"
            />
            <p className="text-xs text-text-muted mt-1">{description.length}/2000 caracteres</p>
          </div>

          <Input
            label="Telefone público"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 11 99999-9999"
          />

          <Input
            label="Endereço público"
            type="text"
            value={publicAddress}
            onChange={(e) => setPublicAddress(e.target.value)}
            placeholder="Rua, número, cidade — exibido na página pública"
          />

          <div>
            <Input
              label="Incorporação do Google Maps"
              type="text"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-text-muted mt-1">
              Cole o código de incorporação do Google Maps (HTML do iframe ou apenas a URL src). No Google Maps: Compartilhar → Incorporar um mapa → Copiar HTML.
            </p>
          </div>

          {saved && <p className="text-sm text-success">Alterações salvas!</p>}

          <div className="pt-1">
            <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto min-h-[44px]">
              Salvar Perfil
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Redes Sociais">
        <form aria-label="Redes sociais" className="space-y-3">
          <Input
            label="Instagram"
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/suaempresa"
          />
          <Input
            label="Facebook"
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/suaempresa"
          />
          <Input
            label="WhatsApp"
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+55 11 99999-9999"
          />
          <Input
            label="Website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.suaempresa.com.br"
          />

          <div className="pt-1">
            <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto min-h-[44px]">
              Salvar Redes Sociais
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
