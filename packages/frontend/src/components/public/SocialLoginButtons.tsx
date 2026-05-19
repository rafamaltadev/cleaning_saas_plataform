interface SocialLoginButtonsProps {
  tenantSlug: string;
  /** Reserved for future branded button variant */
  primaryColor?: string;
  disabled?: boolean;
}

export default function SocialLoginButtons({ tenantSlug, disabled }: SocialLoginButtonsProps) {
  const handleGoogle = () => {
    const url = `/api/v1/public/${tenantSlug}/auth/google`;
    window.location.href = url;
  };

  const handleFacebook = () => {
    const url = `/api/v1/public/${tenantSlug}/auth/facebook`;
    window.location.href = url;
  };

  return (
    <div className="space-y-3" data-testid="social-login-buttons">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={disabled}
        className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="google-login-btn"
        style={{ minHeight: '44px' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Entrar com Google
      </button>

      <button
        type="button"
        onClick={handleFacebook}
        disabled={disabled}
        className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="facebook-login-btn"
        style={{ minHeight: '44px' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.01 1.793-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.093 24 18.099 24 12.073z" fill="#1877F2"/>
        </svg>
        Entrar com Facebook
      </button>
    </div>
  );
}

