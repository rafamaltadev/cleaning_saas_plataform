import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getPublicBranding,
  getPublicProfile,
  getPublicServices,
  type PublicBranding,
  type PublicProfile,
  type PublicService,
} from '../../api/publicTenant';
import ServiceCard from '../../components/public/ServiceCard';
import ContactSection from '../../components/public/ContactSection';
import PublicNotFoundPage from './PublicNotFoundPage';

export default function TenantLandingPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const faviconInjectedRef = useRef(false);

  useEffect(() => {
    if (!tenantSlug) return;

    const slug = tenantSlug;

    Promise.all([
      getPublicBranding(slug).catch(() => null),
      getPublicProfile(slug).catch((e: { response?: { status?: number } }) => {
        if (e?.response?.status === 404) setNotFound(true);
        return null;
      }),
      getPublicServices(slug).catch(() => []),
    ]).then(([b, p, s]) => {
      setBranding(b);
      setProfile(p);
      setServices(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, [tenantSlug]);

  // Apply primary color as scoped CSS variable on this page's root element
  // and inject favicon dynamically — both scoped to avoid polluting global styles
  useEffect(() => {
    if (!branding) return;
    const color = branding.primary_color;
    if (color) {
      document.documentElement.style.setProperty('--color-primary-override', color);
    }
    // Inject favicon
    if (branding.favicon_url && !faviconInjectedRef.current) {
      faviconInjectedRef.current = true;
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = branding.favicon_url;
      link.id = 'tenant-favicon';
      document.head.appendChild(link);
    }
    return () => {
      // Clean up scoped color and favicon when leaving the page
      document.documentElement.style.removeProperty('--color-primary-override');
      const existing = document.getElementById('tenant-favicon');
      if (existing) existing.remove();
      faviconInjectedRef.current = false;
    };
  }, [branding]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Carregando…</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return <PublicNotFoundPage />;
  }

  const primaryColor = branding?.primary_color || '#4F46E5';

  return (
    <div
      className="tenant-landing min-h-screen bg-white"
      style={{ '--color-primary-override': primaryColor } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={`Logo ${profile.name}`}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <span className="font-semibold text-gray-900 text-lg">{profile.name}</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <h1
              className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
              style={{ color: primaryColor }}
            >
              {profile.name}
            </h1>
            {profile.description && (
              <p className="text-gray-600 text-base leading-relaxed max-w-xl">
                {profile.description}
              </p>
            )}
            <Link
              to={`/t/${tenantSlug}/orcamento`}
              className="mt-6 inline-flex items-center justify-center w-full md:w-auto px-6 h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: primaryColor }}
            >
              Solicitar Orçamento
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Nossos Serviços</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                to={`/t/${tenantSlug}/orcamento`}
                className="inline-flex items-center justify-center w-full md:w-auto px-8 h-12 rounded-lg text-white font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: primaryColor }}
              >
                Solicitar Orçamento
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <ContactSection profile={profile} />

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} {profile.name}. Todos os direitos reservados.
      </footer>
    </div>
  );
}
