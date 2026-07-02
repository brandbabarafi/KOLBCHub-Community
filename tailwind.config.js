/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warna utama community: Orange #f47c2a
        primary: {
          DEFAULT: '#f47c2a',       // Oranye utama
          hover: '#d66315',         // Hover (oranye lebih tua)
          light: '#fff0e6',         // Latar soft (oranye sangat muda)
        },
        secondary: '#F4B233',
        accent: '#2B2B2B',
        success: '#16A34A',
        info: '#2E90FA',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        // Geist untuk UI, Geist Mono untuk kode/angka (mis. kode voucher)
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.04)',
        card: '0 4px 12px rgba(16,24,40,.08)',
      },
    },
  },
  plugins: [],
};
