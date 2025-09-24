import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        adhd: {
          focus: '#10b981',
          distracted: '#f59e0b',
          blocked: '#ef4444',
          completed: '#8b5cf6',
        }
      },
      animation: {
        'focus-pulse': 'focus-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'focus-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)',
          },
          '50%': { 
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config