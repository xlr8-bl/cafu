import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        container: {
            center: true,
            padding: '1.25rem',
            screens: { '2xl': '1280px' },
        },
        extend: {
            colors: {
                border:     'hsl(var(--border) / <alpha-value>)',
                input:      'hsl(var(--input) / <alpha-value>)',
                ring:       'hsl(var(--ring) / <alpha-value>)',
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
                },
                card: {
                    DEFAULT: 'hsl(var(--card) / <alpha-value>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
                },
            },
            fontFamily: {
                sans:    ['Geist',      'ui-sans-serif', 'system-ui'],
                display: ['Geist',      'ui-sans-serif', 'system-ui'],
                serif:   ['Fraunces',   'ui-serif', 'Georgia'],
                mono:    ['Geist Mono', 'ui-monospace', 'SFMono-Regular'],
            },
            fontSize: {
                'display-2xl': ['clamp(3rem, 8vw, 7rem)',   { lineHeight: '0.95', letterSpacing: '-0.04em' }],
                'display-xl':  ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1',    letterSpacing: '-0.035em' }],
                'display-lg':  ['clamp(1.75rem, 3.5vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 4px)',
                sm: 'calc(var(--radius) - 8px)',
            },
            keyframes: {
                'marquee':       { from: { transform: 'translateX(0)' },     to: { transform: 'translateX(-50%)' } },
                'fade-up':       { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                'pulse-ring':    { '0%':   { boxShadow: '0 0 0 0 hsl(var(--accent) / 0.6)' },
                                   '70%':  { boxShadow: '0 0 0 10px hsl(var(--accent) / 0)' },
                                   '100%': { boxShadow: '0 0 0 0 hsl(var(--accent) / 0)' } },
                'shimmer':       { '100%': { backgroundPosition: '-200% 0' } },
            },
            animation: {
                marquee:       'marquee 50s linear infinite',
                'fade-up':     'fade-up 600ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
                'pulse-ring':  'pulse-ring 2.4s ease-out infinite',
                shimmer:       'shimmer 1.6s linear infinite',
            },
            backgroundImage: {
                'grid-fade': 'radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--accent) / 0.18), transparent 70%)',
            },
        },
    },
    plugins: [animate],
};

export default config;
