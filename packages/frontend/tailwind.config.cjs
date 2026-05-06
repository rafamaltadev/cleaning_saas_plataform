/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', hover: '#4338CA' },
        secondary: { DEFAULT: '#0EA5E9', hover: '#0284C7' },
        background: '#0B0F19',
        surface: '#111827',
        'surface-alt': '#1F2937',
        border: '#2D3748',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        sidebar: '260px',
      },
      maxWidth: {
        container: '1200px',
      },
      width: {
        sidebar: '260px',
      },
      height: {
        header: '64px',
      },
    },
  },
  plugins: [],
};
