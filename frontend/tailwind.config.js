/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:           '#08080a',
        'bg-raised':  '#0c0c10',
        surface:      '#111116',
        'surface-2':  '#16161c',
        card:         '#1a1a22',
        'card-hover': '#1e1e28',
        border:       '#262630',
        'border-light':'#32323e',
        accent:       '#00E676',
        'accent-dim': '#00b85d',
        'accent-glow':'rgba(0,230,118,0.15)',
        secondary:    '#7c4dff',
        warning:      '#FFB300',
        danger:       '#FF3D3D',
        info:         '#60a5fa',
        'text-primary':   '#f0f0f5',
        'text-secondary': '#b0b0bc',
        'text-muted':     '#6b6b7b',
        'text-dim':       '#44444f',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '16px',
        input: '10px',
        pill:  '100px',
      },
      boxShadow: {
        'card':   '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05) inset',
        'card-lg':'0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.05) inset',
        'glow':   '0 0 24px rgba(0,230,118,0.15)',
        'glow-lg':'0 0 48px rgba(0,230,118,0.2)',
      },
    },
  },
  plugins: [],
};
