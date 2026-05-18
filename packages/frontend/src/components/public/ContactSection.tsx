import { Globe, MessageCircle } from 'lucide-react';
import type { PublicProfile } from '../../api/publicTenant';

interface Props {
  profile: PublicProfile;
}

const iconStyle = { color: 'var(--color-primary-override, #4F46E5)' };
const iconClass = 'w-5 h-5 shrink-0';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} style={iconStyle} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} style={iconStyle} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function ContactSection({ profile }: Props) {
  const { phone, social_links, google_maps_embed_url, public_address } = profile;
  const hasSocials = social_links && Object.values(social_links).some(Boolean);
  const hasContact = phone || public_address || hasSocials || google_maps_embed_url;

  if (!hasContact) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Contato</h2>
          <p className="text-gray-500 text-sm">Entre em contato pelo orçamento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Contato</h2>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: contact info */}
          <div className="flex-1 space-y-4">
            {phone && (
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📞</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <a
                    href={`tel:${phone}`}
                    className="text-indigo-600 hover:underline text-sm min-h-[44px] flex items-center"
                  >
                    {phone}
                  </a>
                </div>
              </div>
            )}
            {public_address && (
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📍</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Endereço</p>
                  <p className="text-sm text-gray-600">{public_address}</p>
                </div>
              </div>
            )}
            {hasSocials && (
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">🔗</span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Redes sociais</p>
                  {social_links?.instagram && (
                    <a
                      href={social_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:underline min-h-[44px]"
                    >
                      <InstagramIcon />
                      Instagram
                    </a>
                  )}
                  {social_links?.facebook && (
                    <a
                      href={social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:underline min-h-[44px]"
                    >
                      <FacebookIcon />
                      Facebook
                    </a>
                  )}
                  {social_links?.whatsapp && (
                    <a
                      href={`https://wa.me/${social_links.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:underline min-h-[44px]"
                    >
                      <MessageCircle className={iconClass} style={iconStyle} />
                      WhatsApp
                    </a>
                  )}
                  {social_links?.website && (
                    <a
                      href={social_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:underline min-h-[44px]"
                    >
                      <Globe className={iconClass} style={iconStyle} />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Google Maps embed */}
          {google_maps_embed_url && (
            <div className="flex-1">
              <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={google_maps_embed_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização no mapa"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
