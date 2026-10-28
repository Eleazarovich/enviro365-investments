/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)', foreground: '#ffffff' },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          foreground: '#234536',
        },
        accent: { DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)', foreground: '#254331' },
        muted: { DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)', foreground: '#69716c' },
        card: { DEFAULT: '#ffffff', foreground: 'rgb(var(--color-foreground) / <alpha-value>)' },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: '#d6dbd4',
        ring: 'rgb(var(--color-primary) / <alpha-value>)',
        success: { DEFAULT: 'rgb(var(--color-success) / <alpha-value>)', foreground: '#ffffff' },
        warning: { DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)', foreground: '#ffffff' },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
